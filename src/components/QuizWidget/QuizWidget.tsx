import { ErrorBoundary, Suspense } from '@suspensive/react';
import { Fragment, lazy, use, useEffect, useState } from 'react';

import { chapterQuizPromise } from '../../services/content';
import {
  advanceQueue,
  isBlankCorrect,
  splitSentence,
  type QuizQuestion,
} from '../../services/quiz';
import {
  markNotified,
  notifyQuizSuccess,
  wasNotified,
  type NotifyResult,
} from '../../services/discord';
import { Button } from '../Button';
import { LottieCharacter } from '../LottieCharacter';
import * as styles from './QuizWidget.css';

/*
 * 결과 연출은 Rive라 런타임(gzip 44KB)이 따라온다 — 문제를 푸는 동안에는 필요 없으니
 * 다 풀고 결과로 넘어갈 때 받는다.
 */
const RiveScene = lazy(() =>
  import('../RiveScene').then(({ RiveScene: Component }) => ({ default: Component })),
);

/** 목숨 — 이만큼 틀리면 그 자리에서 끝난다 */
export const MAX_LIVES = 3;

/**
 * 문제마다 다른 친구가 나오도록 돌려 쓴다.
 * 진도 화면에서 쓰는 캐릭터 로티를 그대로 재사용한다 (public/lottie/path-character-*.json).
 */
const CHARACTERS = [
  'path-character-1',
  'path-character-9',
  'path-character-12',
  'path-character-4',
  'path-character-15',
  'path-character-10',
  'path-character-17',
  'path-character-13',
] as const;

function characterFor(index: number): string {
  return CHARACTERS[index % CHARACTERS.length];
}

/*
 * 결과 연출 — fire.riv의 애니메이션을 이름으로 곧바로 재생한다.
 * 여기는 변신 같은 순서가 없고 결과 한 장면만 세워두면 되므로 상태 머신이 필요 없다
 * (순서가 있는 축하 연출은 CelebrationOverlay처럼 상태 머신을 써야 한다).
 */
const RESULT_ARTBOARD = 'IDLE';

type Outcome = 'perfect' | 'survived' | 'failed';

/**
 * 불이 꺼진 불꽃 — 목숨을 다 썼을 때.
 *
 * 이름의 DARK/LIGHT는 화면 모드가 아니라 **불꽃 자체의 색**이다. 흰 배경에는 짙은 쪽을,
 * 먹 배경에는 옅은 쪽을 써야 보인다 — 반대로 고르면 배경에 묻혀 아무것도 안 보인다.
 *
 * 모듈에서 한 번만 정한다. 렌더마다 새 값을 넘기면 RiveScene이 인스턴스를 다시 만든다.
 */
const EXTINGUISHED = window.matchMedia('(prefers-color-scheme: dark)').matches
  ? 'FLAME_LIGHT_START'
  : 'FLAME_DARK_START';

/*
 * 결과 연출 — fire.riv의 애니메이션을 이름으로 곧바로 재생한다.
 * 여기는 변신 같은 순서가 없고 결과 한 장면만 세워두면 되므로 상태 머신이 필요 없다
 * (순서가 있는 축하 연출은 CelebrationOverlay처럼 상태 머신을 써야 한다).
 *
 * EMBERS-*·Empty·FLAME_EMPTY는 혼자 재생되지 않아 기본 애니메이션(날개 편 불새)으로 흘러버린다 —
 * 실패에 불새가 나와 "왜 불사조가 나오냐"는 지적을 받았다. 꺼진 불꽃은 FLAME_*_START뿐이다.
 */
const RESULT_SCENE: Record<Outcome, string> = {
  /** 만점 통과 */
  perfect: 'PERFECT_LIGHT',
  /** 목숨을 깎였지만 끝까지 통과 */
  survived: 'FROZEN',
  /** 목숨이 다 닳아 중단 */
  failed: EXTINGUISHED,
};

interface QuizWidgetProps {
  member: string;
  chapterId: number;
  chapterTitle: string;
  /**
   * 진행률(0~1)과 남은 목숨 — 화면 위 진행 바·하트를 그리는 쪽에 올려준다.
   * 렌더 중이 아니라 문제를 넘기는 순간에만 부른다 (둘 다 사용자의 행동으로만 바뀐다).
   */
  onStatus?: (status: { ratio: number; lives: number }) => void;
}

/**
 * 노트를 읽고 푸는 이해도 체크 — 듀오링고 레슨처럼 한 문제씩 풀고 즉시 채점한다.
 * 목숨 3개를 다 잃으면 그 자리에서 끝나고, 끝까지 통과하면 Discord로 성공을 알린다.
 *
 * 퀴즈는 보조 콘텐츠다: 파일이 없으면 아무것도 그리지 않고,
 * 로드 실패도 화면을 막지 않도록 ChapterNote와 같은 경계로 감싼다.
 */
export function QuizWidget({ member, chapterId, chapterTitle, onStatus }: QuizWidgetProps) {
  const promise = chapterQuizPromise(chapterId);
  if (promise === null) return null;

  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <Lesson
          promise={promise}
          member={member}
          chapterId={chapterId}
          chapterTitle={chapterTitle}
          onStatus={onStatus}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

type ChoiceVariant = keyof typeof styles.choice;

/** 아직 답을 못 낸 상태에서 무엇을 해야 하는지 — 유형마다 다르다 */
function emptyPrompt(question: QuizQuestion): string {
  return question.type === 'choice' ? '답을 골라주세요' : '빈칸을 채워주세요';
}

/** 오답일 때 정답을 알려주는 문구 — 유형마다 가리키는 것이 다르다 */
function rightAnswerLabel(question: QuizQuestion): string {
  return question.type === 'choice'
    ? `정답은 ${question.answer + 1}번`
    : `정답은 ${question.blanks.join(', ')}`;
}

function slotVariant(checked: boolean, right: boolean): keyof typeof styles.slot {
  if (!checked) return 'open';
  return right ? 'right' : 'wrong';
}

function choiceVariant(checked: boolean, isSelected: boolean, isAnswer: boolean): ChoiceVariant {
  if (!checked) return isSelected ? 'selected' : 'idle';
  if (isAnswer) return 'correct';
  if (isSelected) return 'wrong';
  return 'dimmed';
}

/* Discord 알림은 보조 기능 — 결과 화면 아래 한 줄로만 알린다.
   'skipped'(웹훅 미설정)는 독자가 할 수 있는 일이 없으므로 아무것도 띄우지 않는다. */
const NOTIFY_MESSAGE: Record<NotifyResult | 'already', string | null> = {
  sent: 'Discord에 성공 알림을 보냈어요 📣',
  failed: 'Discord 알림 전송에 실패했어요 — 통과한 건 변하지 않아요',
  skipped: null,
  already: '이 챕터는 이미 성공 알림을 보냈어요',
};

const RESULT_TITLE: Record<Outcome, string> = {
  perfect: '🎉 만점 통과! 성공하였습니다.',
  survived: '통과했어요! 아슬아슬했네요',
  failed: '목숨을 다 썼어요',
};

/**
 * 빈칸이 뚫린 문장. 조각과 빈칸을 번갈아 이어 그린다 (조각 수 = 빈칸 수 + 1).
 * 채운 칸은 눌러서 도로 빼낼 수 있다 — 되돌릴 방법이 없으면 잘못 넣고 갇힌다.
 */
function BlankSentence({
  sentence,
  filled,
  blanks,
  checked,
  onTake,
}: {
  sentence: string;
  filled: readonly (string | null)[];
  blanks: readonly string[];
  checked: boolean;
  onTake: (slot: number) => void;
}) {
  const parts = splitSentence(sentence);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 &&
            (() => {
              const word = filled[i] ?? null;
              const right = checked && word === blanks[i];
              return (
                <button
                  type="button"
                  className={styles.slot[slotVariant(checked, right)]}
                  disabled={checked || word === null}
                  aria-label={word === null ? `${i + 1}번째 빈칸` : `${i + 1}번째 빈칸: ${word}`}
                  onClick={() => onTake(i)}
                >
                  {word ?? ' '}
                </button>
              );
            })()}
        </Fragment>
      ))}
    </>
  );
}

function Lesson({
  promise,
  member,
  chapterId,
  chapterTitle,
  onStatus,
}: QuizWidgetProps & { promise: Promise<QuizQuestion[]> }) {
  const questions = use(promise);

  /*
   * 남은 문제 순서. 맨 앞이 지금 푸는 문제다.
   * 틀리면 그 문제가 맨 뒤로 돌아가 다시 나온다 — 큐가 비어야 레슨이 끝난다.
   */
  const [queue, setQueue] = useState<readonly number[]>(() => questions.map((_, i) => i));
  /** 객관식에서 고른 보기 */
  const [selected, setSelected] = useState<number | null>(null);
  /** 빈칸 문제에서 각 칸에 넣은 단어 (앞 칸부터) */
  const [filled, setFilled] = useState<readonly (string | null)[]>([]);
  const [checked, setChecked] = useState(false);
  const [lives, setLives] = useState(MAX_LIVES);
  const [wrongCount, setWrongCount] = useState(0);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [notify, setNotify] = useState<NotifyResult | 'already' | null>(null);

  const index = queue[0];
  const question = index === undefined ? undefined : questions[index];
  /** 맞혀서 큐에서 빠진 문제 수 — 진행 바는 이 값으로 찬다 */
  const solvedCount = questions.length - queue.length;

  /** 지금 답을 낼 수 있는 상태인지 — 유형마다 "다 골랐다"의 뜻이 다르다 */
  const isAnswered = (): boolean => {
    if (question === undefined) return false;
    if (question.type === 'choice') return selected !== null;
    return filled.length === question.blanks.length && filled.every((word) => word !== null);
  };
  const answered = isAnswered();

  /** 지금 낸 답이 맞는지 — 채점 전에는 의미가 없다 */
  const gradeNow = (): boolean => {
    if (question === undefined) return false;
    if (question.type === 'choice') return selected === question.answer;
    return isBlankCorrect(filled, question.blanks);
  };
  const isCorrect = checked && gradeNow();

  const report = (solved: number, remaining: number) =>
    onStatus?.({ ratio: solved / questions.length, lives: remaining });

  const check = () => {
    if (!answered || checked || question === undefined) return;
    setChecked(true);

    const correct = gradeNow();
    const remaining = correct ? lives : lives - 1;
    if (!correct) {
      setLives(remaining);
      setWrongCount((prev) => prev + 1);
    }
    /* 틀린 문제는 아직 큐에 남아 있다 — 진행 바도 그만큼 차지 않는다 */
    report(correct ? solvedCount + 1 : solvedCount, remaining);
  };

  /*
   * 결과는 다 푼 뒤가 아니라 목숨이 떨어지는 순간에도 정해진다.
   * 알림은 통과했을 때만, 그리고 딱 한 번 나간다.
   */
  const finish = (result: Outcome) => {
    setOutcome(result);
    if (result === 'failed') return;

    if (wasNotified(member, chapterId)) {
      setNotify('already');
      return;
    }
    void notifyQuizSuccess(member, chapterTitle, result === 'perfect').then((sent) => {
      if (sent === 'sent') markNotified(member, chapterId);
      setNotify(sent);
    });
  };

  const next = () => {
    if (!checked) return;
    if (lives === 0) {
      finish('failed');
      return;
    }

    const rest = advanceQueue(queue, isCorrect);
    if (rest.length === 0) {
      // 한 번도 틀리지 않았을 때만 만점이다 — 다시 나온 문제를 맞힌 건 만점이 아니다
      finish(wrongCount === 0 ? 'perfect' : 'survived');
      return;
    }
    setQueue(rest);
    setSelected(null);
    setFilled([]);
    setChecked(false);
  };

  const restart = () => {
    setQueue(questions.map((_, i) => i));
    setSelected(null);
    setFilled([]);
    setChecked(false);
    setLives(MAX_LIVES);
    setWrongCount(0);
    setOutcome(null);
    setNotify(null);
    report(0, MAX_LIVES);
  };

  /** 앞에서부터 빈 칸을 찾아 단어를 넣는다. 이미 다 찼으면 아무 일도 없다 */
  const putWord = (word: string) => {
    if (checked || question === undefined || question.type !== 'blank') return;
    setFilled((prev) => {
      const slots = question.blanks.map((_, i) => prev[i] ?? null);
      const empty = slots.indexOf(null);
      if (empty === -1) return slots;
      slots[empty] = word;
      return slots;
    });
  };

  /** 채운 칸을 눌러 도로 빼낸다 — 잘못 넣고 되돌릴 방법이 없으면 갇힌다 */
  const takeWord = (slot: number) => {
    if (checked) return;
    setFilled((prev) => prev.map((word, i) => (i === slot ? null : word)));
  };

  /* 듀오링고처럼 숫자 키로 고르고 Enter로 넘어간다 — 마우스를 오가지 않아도 풀린다 */
  useEffect(() => {
    if (outcome !== null) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) return;

      if (event.key === 'Enter') {
        if (checked) next();
        else check();
        return;
      }
      if (checked || question === undefined) return;
      /* 숫자 키가 가리키는 대상이 유형마다 다르다 — 객관식은 보기, 빈칸은 단어 타일이다 */
      const tiles = question.type === 'choice' ? question.choices : question.bank;
      const picked = Number(event.key);
      if (!Number.isInteger(picked) || picked < 1 || picked > tiles.length) return;

      if (question.type === 'choice') setSelected(picked - 1);
      else putWord(tiles[picked - 1]);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (outcome !== null) {
    const notifyMessage = notify === null ? null : NOTIFY_MESSAGE[notify];
    return (
      <section className={styles.card} aria-label="이해도 체크 결과">
        <div className={styles.result}>
          <div className={styles.resultScene}>
            {/* 런타임을 받는 동안은 비워둔다 — 잠깐이라 로딩 표시가 오히려 튄다 */}
            <Suspense fallback={null}>
              <RiveScene name="fire" artboard={RESULT_ARTBOARD} animation={RESULT_SCENE[outcome]} />
            </Suspense>
          </div>
          <p className={styles.resultTitle} role="status">
            {RESULT_TITLE[outcome]}
          </p>
          <p className={styles.resultScore}>
            {outcome === 'failed'
              ? `${questions.length}문제 중 ${solvedCount}문제까지 맞혔어요`
              : `${questions.length}문제 모두 맞혔어요${wrongCount > 0 ? ` (${wrongCount}번 틀리고 다시 풀었어요)` : ''}`}
          </p>
          {outcome !== 'failed' && notifyMessage !== null && (
            <p className={styles.notifyStatus}>{notifyMessage}</p>
          )}
        </div>
        <div className={styles.footer}>
          <Button variant={outcome === 'failed' ? 'fill' : 'weak'} onClick={restart}>
            다시 풀기
          </Button>
        </div>
      </section>
    );
  }

  if (question === undefined) return null;

  const outOfLives = checked && lives === 0;
  /* 지금 맞히면 큐가 비어 레슨이 끝난다 — 틀리면 이 문제가 다시 돌아오므로 끝이 아니다 */
  const isLastLeft = queue.length === 1 && isCorrect;

  return (
    <section className={styles.card} aria-label="이해도 체크">
      <div className={styles.prompt}>
        {/* 문제마다 다른 친구가 나온다 — 같은 얼굴이 세 번 나오면 화면이 멈춘 것처럼 보인다 */}
        <div className={styles.character}>
          <LottieCharacter key={index} name={characterFor(index)} />
        </div>
        <p className={styles.bubble}>
          {question.type === 'choice' ? (
            question.question
          ) : (
            <BlankSentence
              sentence={question.sentence}
              filled={filled}
              blanks={question.blanks}
              checked={checked}
              onTake={takeWord}
            />
          )}
        </p>
      </div>

      {question.type === 'choice' ? (
        <div className={styles.choiceList} role="group" aria-label="보기">
          {question.choices.map((label, choiceIndex) => (
            <button
              key={label}
              type="button"
              className={
                styles.choice[
                  choiceVariant(checked, selected === choiceIndex, choiceIndex === question.answer)
                ]
              }
              aria-pressed={selected === choiceIndex}
              disabled={checked}
              onClick={() => setSelected(choiceIndex)}
            >
              <span className={styles.badge} aria-hidden>
                {choiceIndex + 1}
              </span>
              {label}
            </button>
          ))}
        </div>
      ) : (
        <div className={styles.bank} role="group" aria-label="단어 타일">
          {question.bank.map((word) => (
            <button
              key={word}
              type="button"
              className={styles.tile}
              /* 이미 넣은 단어는 문장 쪽에 있으니 타일에서는 흐려 두고 다시 누르지 못하게 한다 */
              disabled={checked || filled.includes(word)}
              onClick={() => putWord(word)}
            >
              {word}
            </button>
          ))}
        </div>
      )}

      {checked && (
        <div className={isCorrect ? styles.feedback.correct : styles.feedback.wrong} role="status">
          <p className={styles.feedbackTitle}>
            {isCorrect ? '정답이에요! 멋져요 🎉' : `아쉬워요 — ${rightAnswerLabel(question)}`}
          </p>
          <p className={styles.feedbackBody}>💡 {question.explanation}</p>
          {/* 틀린 문제는 사라지지 않는다 — 다시 나온다는 걸 미리 알려야 갑자기 나와도 놀라지 않는다 */}
          {!isCorrect && lives > 0 && (
            <p className={styles.feedbackBody}>이 문제는 뒤에서 다시 나와요.</p>
          )}
        </div>
      )}

      <div className={styles.footer}>
        {checked ? (
          <Button onClick={next}>{outOfLives || isLastLeft ? '결과 보기' : '계속하기'}</Button>
        ) : (
          <Button disabled={!answered} onClick={check}>
            {answered ? '확인' : emptyPrompt(question)}
          </Button>
        )}
        <p className={styles.hint}>숫자 키로 고르고 Enter로 넘어갈 수 있어요</p>
      </div>

      <span className={styles.srOnly} aria-live="polite">
        {questions.length}문제 중 {solvedCount}문제 완료, 남은 문제 {queue.length}개, 남은 목숨{' '}
        {lives}개
      </span>
    </section>
  );
}

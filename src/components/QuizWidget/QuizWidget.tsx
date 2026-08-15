import { ErrorBoundary, Suspense } from '@suspensive/react';
import { use, useEffect, useState } from 'react';

import { chapterQuizPromise } from '../../services/content';
import { isAllCorrect, type QuizQuestion } from '../../services/quiz';
import {
  markNotified,
  notifyQuizSuccess,
  wasNotified,
  type NotifyResult,
} from '../../services/discord';
import { Button } from '../Button';
import { LottieCharacter } from '../LottieCharacter';
import * as styles from './QuizWidget.css';

interface QuizWidgetProps {
  member: string;
  chapterId: number;
  chapterTitle: string;
  /**
   * 0~1 진행률 — 화면 위 진행 바를 그리는 쪽에 올려준다.
   * 렌더 중이 아니라 문제를 넘기는 순간에만 부른다 (진행은 사용자의 행동으로만 바뀐다).
   */
  onProgress?: (ratio: number) => void;
}

/**
 * 노트 아래 이해도 체크 — 듀오링고 레슨처럼 한 번에 한 문제씩 풀고 즉시 채점한다.
 * 전 문제를 맞히면 Discord로 성공을 알린다.
 *
 * 퀴즈는 보조 콘텐츠다: 파일이 없으면 아무것도 그리지 않고,
 * 로드 실패도 노트 화면을 막지 않도록 ChapterNote와 같은 경계로 감싼다.
 */
export function QuizWidget({ member, chapterId, chapterTitle, onProgress }: QuizWidgetProps) {
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
          onProgress={onProgress}
        />
      </Suspense>
    </ErrorBoundary>
  );
}

type ChoiceVariant = keyof typeof styles.choice;

function choiceVariant(checked: boolean, isSelected: boolean, isAnswer: boolean): ChoiceVariant {
  if (!checked) return isSelected ? 'selected' : 'idle';
  if (isAnswer) return 'correct';
  if (isSelected) return 'wrong';
  return 'dimmed';
}

/* Discord 알림은 보조 기능 — 결과는 성공 화면 아래 한 줄로만 알린다.
   'skipped'(웹훅 미설정)는 독자가 할 수 있는 일이 없으므로 아무것도 띄우지 않는다. */
const NOTIFY_MESSAGE: Record<NotifyResult | 'already', string | null> = {
  sent: 'Discord에 성공 알림을 보냈어요 📣',
  failed: 'Discord 알림 전송에 실패했어요 — 정답인 건 변하지 않아요',
  skipped: null,
  already: '이 챕터는 이미 성공 알림을 보냈어요',
};

function Lesson({
  promise,
  member,
  chapterId,
  chapterTitle,
  onProgress,
}: QuizWidgetProps & { promise: Promise<QuizQuestion[]> }) {
  const questions = use(promise);

  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [answers, setAnswers] = useState<readonly (number | null)[]>(() =>
    questions.map(() => null),
  );
  const [finished, setFinished] = useState(false);
  const [notify, setNotify] = useState<NotifyResult | 'already' | null>(null);

  const question = questions[index];
  const isLast = index === questions.length - 1;
  const isCorrect = checked && selected === question?.answer;
  const solved = isAllCorrect(questions, answers);
  const correctCount = questions.filter((q, i) => answers[i] === q.answer).length;

  /* 채점 전에는 지금 문제를 "푸는 중"으로 보고 이전까지만 채운다 */
  const report = (solvedCount: number) => onProgress?.(solvedCount / questions.length);

  const check = () => {
    if (selected === null || checked) return;
    setChecked(true);
    setAnswers((prev) => prev.map((answer, i) => (i === index ? selected : answer)));
    report(index + 1);
  };

  /*
   * 알림은 마지막 문제를 넘겨 결과를 볼 때 딱 한 번 나간다.
   * 이 시점의 answers에는 방금 채점한 답까지 들어 있다(check가 먼저 기록한다).
   */
  const finish = () => {
    setFinished(true);
    if (!isAllCorrect(questions, answers)) return;

    if (wasNotified(member, chapterId)) {
      setNotify('already');
      return;
    }
    void notifyQuizSuccess(member, chapterTitle).then((result) => {
      if (result === 'sent') markNotified(member, chapterId);
      setNotify(result);
    });
  };

  const next = () => {
    if (!checked) return;
    if (isLast) {
      finish();
      return;
    }
    setIndex((prev) => prev + 1);
    setSelected(null);
    setChecked(false);
  };

  const restart = () => {
    setIndex(0);
    setSelected(null);
    setChecked(false);
    setAnswers(questions.map(() => null));
    setFinished(false);
    setNotify(null);
    report(0);
  };

  /* 듀오링고처럼 1~4로 고르고 Enter로 넘어간다 — 마우스를 오가지 않아도 풀린다 */
  useEffect(() => {
    if (finished) return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      if (target instanceof HTMLElement && target.isContentEditable) return;

      if (event.key === 'Enter') {
        if (checked) next();
        else check();
        return;
      }
      const picked = Number(event.key);
      if (!Number.isInteger(picked) || picked < 1 || picked > (question?.choices.length ?? 0)) {
        return;
      }
      if (!checked) setSelected(picked - 1);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  if (finished) {
    const notifyMessage = notify === null ? null : NOTIFY_MESSAGE[notify];
    return (
      <section className={styles.card} aria-label="이해도 체크 결과">
        <div className={styles.result}>
          <div className={styles.resultDuo}>
            <LottieCharacter name="intro-duo" />
          </div>
          <p className={styles.resultTitle} role="status">
            {solved ? '🎉 전부 정답! 성공하였습니다.' : '조금만 더! 해설을 보고 다시 도전해요'}
          </p>
          <p className={styles.resultScore}>
            {questions.length}문제 중 {correctCount}문제 정답
          </p>
          {solved && notifyMessage !== null && (
            <p className={styles.notifyStatus}>{notifyMessage}</p>
          )}
        </div>
        <div className={styles.footer}>
          <Button variant={solved ? 'weak' : 'fill'} onClick={restart}>
            다시 풀기
          </Button>
        </div>
      </section>
    );
  }

  if (question === undefined) return null;

  return (
    <section className={styles.card} aria-label="이해도 체크">
      <strong className={styles.progressLabel}>
        🧠 이해도 체크 · {index + 1} / {questions.length}
      </strong>

      <div className={styles.prompt}>
        <div className={styles.duo}>
          <LottieCharacter name="intro-duo" />
        </div>
        <p className={styles.bubble}>{question.question}</p>
      </div>

      <div className={styles.choiceList} role="group" aria-label={`${index + 1}번 문제 보기`}>
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

      {checked && (
        <div className={isCorrect ? styles.feedback.correct : styles.feedback.wrong} role="status">
          <p className={styles.feedbackTitle}>
            {isCorrect ? '정답이에요! 멋져요 🎉' : `아쉬워요 — 정답은 ${question.answer + 1}번`}
          </p>
          <p className={styles.feedbackBody}>💡 {question.explanation}</p>
        </div>
      )}

      <div className={styles.footer}>
        {checked ? (
          <Button onClick={next}>{isLast ? '결과 보기' : '계속하기'}</Button>
        ) : (
          <Button disabled={selected === null} onClick={check}>
            {selected === null ? '답을 골라주세요' : '확인'}
          </Button>
        )}
        <p className={styles.hint}>숫자 키로 고르고 Enter로 넘어갈 수 있어요</p>
      </div>

      <span className={styles.srOnly} aria-live="polite">
        {questions.length}문제 중 {index + 1}번째 문제
      </span>
    </section>
  );
}

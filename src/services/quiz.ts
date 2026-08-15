/**
 * 퀴즈 데이터의 검증과 채점 — 순수 로직만 둔다. 파일 로드는 content.ts가 맡는다.
 *
 * 퀴즈 JSON은 사람이(또는 생성기가) 만드는 파일이라 형식 오류를 전제로 다룬다.
 * 잘못된 파일은 여기서 무엇이 어떻게 틀렸는지 담아 실패해, 배포된 화면이 아니라
 * 테스트(quiz.test.ts가 저장소의 모든 퀴즈 파일을 검증한다)에서 드러난다.
 */

/** 보기 중 하나를 고르는 문제 */
interface ChoiceQuestion {
  type: 'choice';
  question: string;
  choices: readonly string[];
  /** choices의 0부터 시작하는 정답 인덱스 */
  answer: number;
  explanation: string;
}

/** 문장의 빈칸을 단어 타일로 채우는 문제 */
interface BlankQuestion {
  type: 'blank';
  /** 빈칸을 BLANK 표시로 남겨둔 문장 */
  sentence: string;
  /** 빈칸에 들어갈 정답 단어 — 문장에 나오는 순서대로 */
  blanks: readonly string[];
  /** 화면에 늘어놓을 단어 타일 (정답 + 오답) */
  bank: readonly string[];
  explanation: string;
}

export type QuizQuestion = ChoiceQuestion | BlankQuestion;

/** 문장에서 빈칸 자리를 나타내는 표시 */
const BLANK = '___';

/** 보기 수를 고정해 화면 밀도와 출제 난이도를 일정하게 유지한다 */
const CHOICE_COUNT = 4;
const BANK_MIN = 4;
const BANK_MAX = 6;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

/**
 * 문장을 빈칸 기준으로 쪼갠다 — 조각 수는 늘 빈칸 수 + 1이다.
 * 화면은 [조각, 빈칸, 조각, ...] 순으로 이어 그린다.
 */
export function splitSentence(sentence: string): string[] {
  return sentence.split(BLANK);
}

/** 문장에 남겨둔 빈칸 개수 */
export function blankCount(sentence: string): number {
  return splitSentence(sentence).length - 1;
}

function parseChoice(
  item: Record<string, unknown>,
  fail: (reason: string) => never,
): ChoiceQuestion {
  const { question, choices, answer, explanation } = item;

  if (!isNonEmptyString(question)) fail('question은 비어 있지 않은 문자열이어야 합니다');
  if (!isStringList(choices) || choices.length !== CHOICE_COUNT)
    fail(`choices는 비어 있지 않은 문자열 ${CHOICE_COUNT}개여야 합니다`);
  if (
    typeof answer !== 'number' ||
    !Number.isInteger(answer) ||
    answer < 0 ||
    answer >= CHOICE_COUNT
  )
    fail(`answer는 0~${CHOICE_COUNT - 1} 사이 정수여야 합니다`);
  if (!isNonEmptyString(explanation)) fail('explanation은 비어 있지 않은 문자열이어야 합니다');

  return {
    type: 'choice',
    question: question as string,
    choices: choices as string[],
    answer: answer as number,
    explanation: explanation as string,
  };
}

function parseBlank(item: Record<string, unknown>, fail: (reason: string) => never): BlankQuestion {
  const { sentence, blanks, bank, explanation } = item;

  if (!isNonEmptyString(sentence)) fail('sentence는 비어 있지 않은 문자열이어야 합니다');
  if (!isStringList(blanks)) fail('blanks는 비어 있지 않은 문자열 배열이어야 합니다');
  /* 빈칸 수와 정답 수가 어긋나면 화면에 채울 곳이 없거나 남는다 — 절대 맞힐 수 없는 문제가 된다 */
  if (blankCount(sentence as string) !== (blanks as string[]).length)
    fail(
      `sentence의 ${BLANK} 개수(${blankCount(sentence as string)})와 blanks 길이(${(blanks as string[]).length})가 달라요`,
    );
  if (!isStringList(bank) || bank.length < BANK_MIN || bank.length > BANK_MAX)
    fail(`bank는 비어 있지 않은 문자열 ${BANK_MIN}~${BANK_MAX}개여야 합니다`);
  if (new Set(bank as string[]).size !== (bank as string[]).length)
    fail('bank에 같은 단어가 두 번 들어 있습니다');
  /* 정답 단어가 타일에 없으면 고를 방법이 없다 */
  const missing = (blanks as string[]).filter((word) => !(bank as string[]).includes(word));
  if (missing.length > 0) fail(`bank에 정답 단어가 없습니다: ${missing.join(', ')}`);
  if (!isNonEmptyString(explanation)) fail('explanation은 비어 있지 않은 문자열이어야 합니다');

  return {
    type: 'blank',
    sentence: sentence as string,
    blanks: blanks as string[],
    bank: bank as string[],
    explanation: explanation as string,
  };
}

function parseQuestion(item: unknown, index: number): QuizQuestion {
  const fail = (reason: string): never => {
    throw new Error(`퀴즈 ${index + 1}번 문제가 잘못됐습니다 — ${reason}: ${JSON.stringify(item)}`);
  };

  if (typeof item !== 'object' || item === null) fail('객체가 아닙니다');
  const record = item as Record<string, unknown>;

  /* type이 없으면 객관식이다 — 빈칸 문제가 생기기 전에 쓴 파일들이 그대로 돈다 */
  const type = record.type ?? 'choice';
  if (type === 'choice') return parseChoice(record, fail);
  if (type === 'blank') return parseBlank(record, fail);
  return fail(`모르는 type입니다 (choice 또는 blank): ${JSON.stringify(type)}`);
}

/** 퀴즈 파일(JSON)의 최상위 구조: { questions: [...] } */
export function parseQuiz(data: unknown): QuizQuestion[] {
  if (typeof data !== 'object' || data === null || !('questions' in data)) {
    throw new Error(`퀴즈 파일은 { questions: [...] } 형태여야 합니다: ${JSON.stringify(data)}`);
  }
  const { questions } = data as { questions: unknown };
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error(`questions는 비어 있지 않은 배열이어야 합니다: ${JSON.stringify(questions)}`);
  }
  return questions.map(parseQuestion);
}

/**
 * 다음에 낼 문제 순서.
 *
 * 틀린 문제는 버리지 않고 맨 뒤로 돌린다 — 맞힐 때까지 레슨이 끝나지 않아야
 * "틀린 채로 통과"가 생기지 않는다. 맞히면 큐에서 빠지고, 큐가 비면 레슨이 끝난다.
 */
export function advanceQueue(queue: readonly number[], correct: boolean): number[] {
  const [current, ...rest] = queue;
  if (current === undefined) return [];
  return correct ? rest : [...rest, current];
}

/**
 * 빈칸을 다 채웠고 순서까지 맞는지.
 * 덜 채운 상태를 정답으로 흘리면 아무것도 안 하고 통과된다 — 길이부터 본다.
 */
export function isBlankCorrect(
  filled: readonly (string | null)[],
  blanks: readonly string[],
): boolean {
  return filled.length === blanks.length && blanks.every((word, i) => filled[i] === word);
}

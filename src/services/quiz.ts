/**
 * 퀴즈 데이터의 검증과 채점 — 순수 로직만 둔다. 파일 로드는 content.ts가 맡는다.
 *
 * 퀴즈 JSON은 사람이(또는 생성기가) 만드는 파일이라 형식 오류를 전제로 다룬다.
 * 잘못된 파일은 여기서 무엇이 어떻게 틀렸는지 담아 실패해, 배포된 화면이 아니라
 * 테스트(quiz.test.ts가 저장소의 모든 퀴즈 파일을 검증한다)에서 드러난다.
 */

export interface QuizQuestion {
  question: string;
  choices: readonly string[];
  /** choices의 0부터 시작하는 정답 인덱스 */
  answer: number;
  explanation: string;
}

/** 보기 수를 고정해 화면 밀도와 출제 난이도를 일정하게 유지한다 */
const CHOICE_COUNT = 4;

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function parseQuestion(item: unknown, index: number): QuizQuestion {
  const fail = (reason: string): never => {
    throw new Error(`퀴즈 ${index + 1}번 문제가 잘못됐습니다 — ${reason}: ${JSON.stringify(item)}`);
  };

  if (typeof item !== 'object' || item === null) fail('객체가 아닙니다');
  const { question, choices, answer, explanation } = item as Record<string, unknown>;

  if (!isNonEmptyString(question)) fail('question은 비어 있지 않은 문자열이어야 합니다');
  if (
    !Array.isArray(choices) ||
    choices.length !== CHOICE_COUNT ||
    !choices.every(isNonEmptyString)
  )
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
    question: question as string,
    choices: choices as string[],
    answer: answer as number,
    explanation: explanation as string,
  };
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

/** 안 푼 문제(null)가 하나라도 있으면 전부 정답이 아니다 */
export function isAllCorrect(
  questions: readonly QuizQuestion[],
  answers: readonly (number | null)[],
): boolean {
  return (
    questions.length === answers.length &&
    questions.every((question, i) => answers[i] === question.answer)
  );
}

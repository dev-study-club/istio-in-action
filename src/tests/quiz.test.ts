import { describe, expect, test } from 'vitest';

import { advanceQueue, isAllCorrect, parseQuiz, type QuizQuestion } from '../services/quiz';

function question(overrides: Partial<QuizQuestion> = {}): QuizQuestion {
  return {
    question: '엔보이의 리스너는 무엇인가?',
    choices: ['포트를 여는 지점', '업스트림 묶음', '라우팅 규칙', '사이드카 주입기'],
    answer: 0,
    explanation: '리스너는 엔보이가 요청을 받기 위해 여는 포트다.',
    ...overrides,
  };
}

describe('parseQuiz', () => {
  test('정상 파일은 문제 목록을 그대로 돌려준다', () => {
    // Arrange
    const data = { questions: [question(), question({ answer: 3 })] };

    // Act
    const parsed = parseQuiz(data);

    // Assert
    expect(parsed).toHaveLength(2);
    expect(parsed[1].answer).toBe(3);
  });

  /*
   * 아래는 전부 "조용히 이상한 퀴즈가 배포되는" 경로다.
   * 예컨대 answer가 범위를 넘으면 화면에는 문제가 멀쩡히 뜨지만 정답이 아무 보기에도 없어
   * 아무리 풀어도 성공할 수 없다 — 파싱에서 막아야 배포가 아니라 테스트에서 드러난다.
   */
  test.each([
    ['최상위가 배열', [question()]],
    ['questions 키 없음', { items: [question()] }],
    ['questions가 빈 배열', { questions: [] }],
    ['보기가 3개', { questions: [question({ choices: ['가', '나', '다'] })] }],
    ['보기가 빈 문자열', { questions: [question({ choices: ['가', '', '다', '라'] })] }],
    ['answer가 범위 밖', { questions: [question({ answer: 4 })] }],
    ['answer가 음수', { questions: [question({ answer: -1 })] }],
    ['answer가 정수가 아님', { questions: [question({ answer: 1.5 })] }],
    ['question이 빈 문자열', { questions: [question({ question: '  ' })] }],
    ['explanation 누락', { questions: [{ ...question(), explanation: undefined }] }],
  ])('%s이면 던진다', (_label, data) => {
    expect(() => parseQuiz(data)).toThrow();
  });
});

describe('advanceQueue', () => {
  test('맞히면 그 문제는 큐에서 빠진다', () => {
    expect(advanceQueue([0, 1, 2], true)).toEqual([1, 2]);
  });

  /* 틀린 문제를 버리면 "틀린 채로 통과"가 생긴다 — 맞힐 때까지 다시 나와야 한다 */
  test('틀리면 맨 뒤로 돌아가 다시 나온다', () => {
    expect(advanceQueue([0, 1, 2], false)).toEqual([1, 2, 0]);
  });

  test('마지막 한 문제를 틀리면 그 문제만 남아 곧바로 다시 나온다', () => {
    expect(advanceQueue([5], false)).toEqual([5]);
  });

  test('마지막 한 문제를 맞히면 큐가 빈다 — 레슨이 끝나는 신호다', () => {
    expect(advanceQueue([5], true)).toEqual([]);
  });

  test('빈 큐는 그대로 빈 큐다', () => {
    expect(advanceQueue([], true)).toEqual([]);
  });

  test('원본 큐를 건드리지 않는다', () => {
    // Arrange
    const queue = [0, 1, 2];

    // Act
    advanceQueue(queue, false);

    // Assert
    expect(queue, `원본이 바뀌었다: ${queue.join(',')}`).toEqual([0, 1, 2]);
  });
});

describe('isAllCorrect', () => {
  const questions = [question({ answer: 0 }), question({ answer: 2 })];

  test('모두 정답이면 true', () => {
    expect(isAllCorrect(questions, [0, 2])).toBe(true);
  });

  test('하나라도 오답이면 false', () => {
    expect(isAllCorrect(questions, [0, 1])).toBe(false);
  });

  /* 안 푼 문제를 0번 보기로 착각해 "정답"으로 새면 풀지 않고도 Discord 알림이 나간다 */
  test('안 푼 문제(null)가 있으면 false', () => {
    expect(isAllCorrect(questions, [null, 2])).toBe(false);
  });

  test('답 개수가 문제 수와 다르면 false', () => {
    expect(isAllCorrect(questions, [0])).toBe(false);
  });
});

/**
 * 저장소에 실제로 들어 있는 퀴즈 파일을 전부 파싱한다.
 * 퀴즈는 사람이 손으로 늘리는 콘텐츠라, 오타 난 파일이 화면에서 조용히 사라지는(위젯이
 * ErrorBoundary로 감춘다) 대신 CI에서 어느 파일이 왜 틀렸는지 드러나야 한다.
 */
describe('저장소의 퀴즈 파일', () => {
  /* content.ts와 같은 방식으로 읽는다 — 앱이 실제로 집어 가는 경로 패턴을 그대로 검증한다 */
  const files = Object.entries(
    import.meta.glob<unknown>('/content/*/quiz/[0-9]*.json', { import: 'default', eager: true }),
  );

  test('퀴즈 파일이 최소 한 개는 있다', () => {
    expect(
      files.length,
      `glob이 찾은 파일: ${files.map(([path]) => path).join(', ')}`,
    ).toBeGreaterThan(0);
  });

  test.each(files)('%s은 유효한 퀴즈다', (path, data) => {
    const parsed = parseQuiz(data);
    expect(parsed.length, `${path}의 문제 수`).toBeGreaterThan(0);
  });
});

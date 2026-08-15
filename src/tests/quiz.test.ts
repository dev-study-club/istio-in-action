import { describe, expect, test } from 'vitest';

import {
  advanceQueue,
  blankCount,
  isBlankCorrect,
  parseQuiz,
  splitSentence,
} from '../services/quiz';

function question(overrides: Record<string, unknown> = {}) {
  return {
    question: '엔보이의 리스너는 무엇인가?',
    choices: ['포트를 여는 지점', '업스트림 묶음', '라우팅 규칙', '사이드카 주입기'],
    answer: 0,
    explanation: '리스너는 엔보이가 요청을 받기 위해 여는 포트다.',
    ...overrides,
  };
}

function blank(overrides: Record<string, unknown> = {}) {
  return {
    type: 'blank',
    sentence: '___는 요청을 받으려고 여는 포트다.',
    blanks: ['리스너'],
    bank: ['리스너', '클러스터', '라우트', '필터'],
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
    expect(parsed[1]).toMatchObject({ type: 'choice', answer: 3 });
  });

  /* type이 없던 시절 파일이 그대로 돌아야 한다 — 빈칸 문제를 넣으며 깨뜨리면 안 된다 */
  test('type이 없으면 객관식으로 읽는다', () => {
    expect(parseQuiz({ questions: [question()] })[0].type).toBe('choice');
  });

  test('빈칸 문제도 읽는다', () => {
    // Act
    const parsed = parseQuiz({ questions: [question(), blank()] });

    // Assert
    expect(parsed[1]).toMatchObject({ type: 'blank', blanks: ['리스너'] });
  });

  /*
   * 아래는 전부 "조용히 이상한 퀴즈가 배포되는" 경로다.
   * 예컨대 빈칸 수와 정답 수가 어긋나면 화면에는 문제가 멀쩡히 뜨지만 채울 곳이 없거나 남아
   * 아무리 풀어도 통과할 수 없다 — 파싱에서 막아야 배포가 아니라 테스트에서 드러난다.
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
    ['모르는 type', { questions: [question({ type: 'listening' })] }],
    ['빈칸보다 정답이 많음', { questions: [blank({ blanks: ['리스너', '클러스터'] })] }],
    [
      '정답보다 빈칸이 많음',
      { questions: [blank({ sentence: '___와 ___는 다르다.', blanks: ['리스너'] })] },
    ],
    ['정답 단어가 bank에 없음', { questions: [blank({ blanks: ['엔보이'] })] }],
    ['bank가 3개', { questions: [blank({ bank: ['리스너', '클러스터', '라우트'] })] }],
    ['bank에 중복 단어', { questions: [blank({ bank: ['리스너', '리스너', '라우트', '필터'] })] }],
    ['blanks가 빈 배열', { questions: [blank({ blanks: [] })] }],
  ])('%s이면 던진다', (_label, data) => {
    expect(() => parseQuiz(data)).toThrow();
  });
});

describe('splitSentence / blankCount', () => {
  test('빈칸 기준으로 쪼개면 조각은 늘 빈칸 수 + 1이다', () => {
    // Act
    const parts = splitSentence('___와 ___는 다르다.');

    // Assert
    expect(parts).toEqual(['', '와 ', '는 다르다.']);
    expect(blankCount('___와 ___는 다르다.')).toBe(2);
  });

  test('빈칸이 없으면 0이다', () => {
    expect(blankCount('빈칸이 없는 문장')).toBe(0);
  });
});

describe('isBlankCorrect', () => {
  test('순서까지 같아야 정답이다', () => {
    expect(isBlankCorrect(['리스너', '클러스터'], ['리스너', '클러스터'])).toBe(true);
    expect(isBlankCorrect(['클러스터', '리스너'], ['리스너', '클러스터'])).toBe(false);
  });

  /* 덜 채운 걸 정답으로 흘리면 아무것도 안 하고 통과된다 */
  test('덜 채웠으면 오답이다', () => {
    expect(isBlankCorrect(['리스너', null], ['리스너', '클러스터'])).toBe(false);
    expect(isBlankCorrect(['리스너'], ['리스너', '클러스터'])).toBe(false);
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

// @vitest-environment jsdom
// localStorage를 쓰는 유일한 테스트다 — 나머지는 순수 로직이라 node 환경이 더 빠르다
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { newlyCompleted, readSeenChapters, writeSeenChapters } from '../services/celebration';

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('newlyCompleted', () => {
  test('지난번에 본 뒤 새로 채워진 칸만 고른다', () => {
    // Arrange
    const seen = [1, 2, 3];
    const completed = [1, 2, 3, 4];

    // Act
    const fresh = newlyCompleted(seen, completed);

    // Assert
    expect(fresh).toEqual([4]);
  });

  /*
   * 첫 방문은 "채워지는 순간"을 본 게 아니라 이미 채워진 걸 처음 본 것이다.
   * 여기서 전부 축하하면 진도를 쌓아둔 사람은 들어오자마자 불꽃이 화면 가득 터진다 —
   * 노드마다 불이 붙어 있던 첫 구현이 딱 그 모습이었다.
   */
  test('기록이 없는 첫 방문은 아무것도 축하하지 않는다', () => {
    // Act
    const fresh = newlyCompleted(null, [1, 2, 3, 4, 5, 6]);

    // Assert
    expect(fresh, `첫 방문에 ${fresh.length}칸이 축하 대상으로 잡혔다`).toEqual([]);
  });

  test('완료 기록이 비어 있던 사람이 한 칸 끝내면 그 칸을 축하한다', () => {
    expect(newlyCompleted([], [1])).toEqual([1]);
  });

  test('달라진 게 없으면 축하하지 않는다', () => {
    expect(newlyCompleted([1, 2], [1, 2])).toEqual([]);
  });

  test('기록에만 있고 지금은 없는 칸은 무시한다 (노트 파일이 지워진 경우)', () => {
    expect(newlyCompleted([1, 2, 3], [1, 3])).toEqual([]);
  });
});

describe('readSeenChapters / writeSeenChapters', () => {
  test('기록이 없으면 null이다 — 빈 배열(완료 0개였음)과 구분한다', () => {
    expect(readSeenChapters('성수')).toBeNull();
    writeSeenChapters('성수', []);
    expect(readSeenChapters('성수')).toEqual([]);
  });

  test('쓴 그대로 읽힌다', () => {
    // Act
    writeSeenChapters('성수', [1, 2, 5]);

    // Assert
    expect(readSeenChapters('성수')).toEqual([1, 2, 5]);
  });

  test('멤버마다 따로 기록한다', () => {
    // Arrange
    writeSeenChapters('성수', [1, 2, 3]);

    // Act & Assert
    expect(readSeenChapters('지민')).toBeNull();
  });

  test('망가진 값은 기록 없음으로 본다', () => {
    // Arrange — 이전 버전이 남긴 값이나 손상된 값
    localStorage.setItem('istio-seen-chapters:v1:성수', '{oops');

    // Act & Assert
    expect(readSeenChapters('성수')).toBeNull();
  });
});

describe('저장소를 쓸 수 없을 때', () => {
  /*
   * 사파리 시크릿 모드나 쿠키 차단 환경에서는 localStorage 접근 자체가 던진다.
   * 축하 연출은 보조 요소라, 기록이 안 될 뿐 화면은 그대로 동작해야 한다.
   */
  test('읽기가 던지면 기록 없음으로 본다', () => {
    // Arrange
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('denied');
    });

    // Act & Assert
    expect(readSeenChapters('성수')).toBeNull();
  });

  test('쓰기가 던져도 예외가 새어 나가지 않는다', () => {
    // Arrange
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded');
    });

    // Act & Assert
    expect(() => writeSeenChapters('성수', [1])).not.toThrow();
  });
});

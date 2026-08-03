import { describe, expect, test } from 'vitest';

import { chapterStats, overallStats } from '../services/stats';
import type { Progress } from '../services/types';

function buildProgress(doneFlagsByChapter: boolean[][]): Progress {
  return {
    title: '테스트 진도',
    chapters: doneFlagsByChapter.map((flags, chapterIndex) => ({
      id: chapterIndex + 1,
      title: `${chapterIndex + 1}장`,
      sections: flags.map((done, sectionIndex) => ({
        id: `${chapterIndex + 1}-${sectionIndex}`,
        title: `${chapterIndex + 1}.${sectionIndex + 1} 절`,
        done,
      })),
    })),
  };
}

describe('chapterStats', () => {
  test('완료 개수와 반올림된 퍼센트를 계산한다', () => {
    // Arrange
    const progress = buildProgress([[true, true, false]]);

    // Act
    const stats = chapterStats(progress.chapters[0]);

    // Assert
    expect(stats).toEqual({ done: 2, total: 3, percent: 67 });
  });

  test('절이 없는 챕터는 0%다 (0으로 나누기 방지)', () => {
    const stats = chapterStats({ id: 1, title: '빈 챕터', sections: [] });
    expect(stats).toEqual({ done: 0, total: 0, percent: 0 });
  });
});

describe('overallStats', () => {
  test('모든 챕터를 합산한다', () => {
    // Arrange
    const progress = buildProgress([
      [true, false],
      [true, true],
    ]);

    // Act
    const stats = overallStats(progress);

    // Assert
    expect(stats).toEqual({ done: 3, total: 4, percent: 75 });
  });
});

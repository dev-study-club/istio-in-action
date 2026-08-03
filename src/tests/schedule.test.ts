import { describe, expect, test } from 'vitest';

import { getStudyQuest, parseStudySchedule } from '../services/schedule';

const schedule = parseStudySchedule(`
| 2026-07-13 ~ 2026-07-19 | 1, 2 | 서비스 메시와 Istio 시작 |
| 2026-07-20 ~ 2026-07-30 | 3, 4 | 데이터 플레인과 게이트웨이 |
| 2026-07-30 ~ 2026-08-04 | 5, 6 | 트래픽 제어와 복원력 |
| 2026-08-05 ~ 2026-08-11 | 7, 8 | 관찰 가능성 |
| 2026-08-12 ~ 2026-08-18 | 9, 10 | 보안과 트러블슈팅 |
| 2026-08-19 ~ 2026-08-25 | 11, 12 | 성능과 멀티 클러스터 |
| 2026-08-26 ~ 2026-09-01 | 13, 14 | VM 통합과 Istio 확장 |
`);

describe('getStudyQuest', () => {
  test('겹치는 7월 30일에는 새로 시작한 5·6장을 선택한다', () => {
    expect(getStudyQuest(schedule, new Date(2026, 6, 30)).chapterIds).toEqual([5, 6]);
  });

  test('8월 3일 목표는 5·6장이다', () => {
    expect(getStudyQuest(schedule, new Date(2026, 7, 3)).chapterIds).toEqual([5, 6]);
    expect(getStudyQuest(schedule, new Date(2026, 7, 3)).topic).toBe('트래픽 제어와 복원력');
  });

  test('마지막 일정은 13·14장이다', () => {
    expect(getStudyQuest(schedule, new Date(2026, 7, 27)).chapterIds).toEqual([13, 14]);
  });
});

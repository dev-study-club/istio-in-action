import { describe, expect, it } from 'vitest';

import {
  chaptersMarkdown,
  completedChapterIds,
  members,
  scheduleMarkdown,
} from '../services/content';
import { parseProgress } from '../services/progress';
import { parseStudySchedule } from '../services/schedule';

/**
 * 이 파일은 파싱이 아니라 "glob이 실제 파일에 닿는가"를 검증한다.
 * 빌드타임 glob의 실패는 예외가 아니라 빈 결과로 나타나기 때문에,
 * 파서 단위 테스트만으로는 배선이 끊긴 것을 잡지 못한다.
 */
describe('content glob 배선', () => {
  it('목차를 찾아 챕터와 절로 파싱한다', () => {
    // Act
    const { chapters } = parseProgress(chaptersMarkdown());

    // Assert — "찾았다"에 그치지 않고 실제 항목까지 확인해
    // 빈 문자열이 조용히 통과하는 경로를 막는다
    const sectionCount = chapters.reduce((total, { sections }) => total + sections.length, 0);
    expect(chapters.length, `chapters: ${chapters.length}`).toBeGreaterThan(0);
    expect(sectionCount, `sections: ${sectionCount}`).toBeGreaterThan(0);
  });

  it('members.json을 읽어 이름과 아바타를 준다', () => {
    // Act
    const list = members();

    // Assert
    expect(list.length, `members: ${list.length}`).toBeGreaterThan(0);
    for (const member of list) {
      expect(member.name, `name was: ${member.name}`).not.toBe('');
      expect(member.avatar, `avatar was: ${member.avatar}`).toMatch(/\.(png|jpg|jpeg|webp)$/);
    }
  });

  it('schedule.md를 찾아 일정 표로 파싱한다', () => {
    // Act
    const schedule = parseStudySchedule(scheduleMarkdown());

    // Assert
    expect(schedule.length, `schedule rows: ${schedule.length}`).toBeGreaterThan(0);
    expect(schedule[0].chapterIds).toHaveLength(2);
  });

  it.each(members().map(({ name }) => name))(
    '%s의 완료 챕터 집합은 호출마다 같은 참조를 준다 — useMemo가 매 렌더 재파싱하지 않도록',
    (member) => {
      // Act
      const first = completedChapterIds(member);
      const second = completedChapterIds(member);

      // Assert
      expect(second).toBe(first);
    },
  );

  it('노트가 없는 멤버도 빈 집합을 받아 진도 화면이 막히지 않는다', () => {
    // Assert — 노트는 보조 데이터라 없음이 정상이다
    expect(completedChapterIds('없는사람').size).toBe(0);
  });
});

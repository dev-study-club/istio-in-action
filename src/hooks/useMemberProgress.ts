import { useMemo } from 'react';

import { parseProgress } from '../services/progress';
import { completedChapterIds, chaptersMarkdown } from '../services/content';

/**
 * 선택한 멤버의 진도 원문과 파싱된 모델.
 * 노트 파일이 있는 챕터는 완료한 것으로 간주해 절을 모두 체크 상태로 덮어쓴다.
 * 진도 파일 누락·형식 오류는 여기서 throw되어 App의 ErrorBoundary가 받는다.
 */
export function useMemberProgress(member: string) {
  const markdown = chaptersMarkdown();
  const completedChapters = completedChapterIds(member);
  const progress = useMemo(() => {
    const parsed = parseProgress(markdown);
    return {
      ...parsed,
      chapters: parsed.chapters.map((chapter) =>
        completedChapters.has(chapter.id)
          ? {
              ...chapter,
              sections: chapter.sections.map((section) => ({ ...section, done: true })),
            }
          : chapter,
      ),
    };
  }, [completedChapters, markdown]);
  return { markdown, progress, completedChapters };
}

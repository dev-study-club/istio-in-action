import type { Chapter, Progress } from './types';

const DOCUMENT_TITLE_PATTERN = /^#\s+(.+)$/;
const CHAPTER_PATTERN = /^##\s+(.+)$/;
const SECTION_PATTERN = /^- \[([ xX])\]\s+(.+)$/;

/**
 * chapters.md 원문을 학습 진도 모델로 변환한다.
 * 체크 항목이 하나도 없으면 throw한다 — 일시적 fetch 오류나 빈 파일이
 * "진도 0%"라는 그럴싸한 거짓 화면으로 이어지는 것을 막는다.
 */
export function parseProgress(markdown: string): Progress {
  let title = 'Progress';
  const chapters: Chapter[] = [];

  for (const line of markdown.split('\n')) {
    const titleMatch = line.match(DOCUMENT_TITLE_PATTERN);
    if (titleMatch && chapters.length === 0) {
      title = titleMatch[1].trim();
      continue;
    }

    const chapterMatch = line.match(CHAPTER_PATTERN);
    if (chapterMatch) {
      chapters.push({ id: chapters.length + 1, title: chapterMatch[1].trim(), sections: [] });
      continue;
    }

    const sectionMatch = line.match(SECTION_PATTERN);
    const currentChapter = chapters.at(-1);
    if (sectionMatch && currentChapter) {
      currentChapter.sections.push({
        id: `${currentChapter.id}-${currentChapter.sections.length}`,
        title: sectionMatch[2].trim(),
        done: sectionMatch[1].toLowerCase() === 'x',
      });
    }
  }

  const hasNoSection = chapters.every((chapter) => chapter.sections.length === 0);
  if (hasNoSection) {
    throw new Error(
      'chapters.md에서 체크 항목을 찾지 못했습니다. "## 챕터 제목" 아래 "- [ ] 절 제목" 형식이 필요합니다 (예: "- [ ] 1.1 서비스 메시란").',
    );
  }

  return { title, chapters };
}

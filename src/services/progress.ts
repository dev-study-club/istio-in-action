import type { Chapter, Progress } from './types';

const DOCUMENT_TITLE_PATTERN = /^#\s+(.+)$/;
const CHAPTER_PATTERN = /^##\s+(.+)$/;
const SECTION_PATTERN = /^- \[([ xX])\]\s+(.+)$/;

/**
 * progress.md 원문을 학습 진도 모델로 변환한다.
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
      'progress.md에서 체크 항목을 찾지 못했습니다. "## 챕터 제목" 아래 "- [ ] 절 제목" 형식이 필요합니다 (예: "- [ ] 1.1 서비스 메시란").',
    );
  }

  return { title, chapters };
}

/**
 * 원문 마크다운에서 특정 챕터의 체크 상태만 갱신한 새 문자열을 반환한다.
 * 다른 챕터·제목·본문 줄은 그대로 보존한다 (정본 파일을 최소 침습으로 수정).
 */
export function applyCheckState(
  markdown: string,
  chapterId: number,
  doneSectionIds: readonly string[],
): string {
  const doneSet = new Set(doneSectionIds);
  let chapterIndex = 0;
  let sectionIndex = 0;

  const updatedLines = markdown.split('\n').map((line) => {
    if (CHAPTER_PATTERN.test(line)) {
      chapterIndex += 1;
      sectionIndex = 0;
      return line;
    }

    const sectionMatch = line.match(SECTION_PATTERN);
    if (!sectionMatch) return line;

    const sectionId = `${chapterIndex}-${sectionIndex}`;
    sectionIndex += 1;
    if (chapterIndex !== chapterId) return line;

    const shouldBeDone = doneSet.has(sectionId);
    const isAlreadyDone = sectionMatch[1].toLowerCase() === 'x';
    // 상태가 같으면 줄을 그대로 둔다 — 대소문자 표기까지 보존해 diff를 최소화
    if (shouldBeDone === isAlreadyDone) return line;

    return line.replace(/^- \[[ xX]\]/, `- [${shouldBeDone ? 'x' : ' '}]`);
  });

  return updatedLines.join('\n');
}

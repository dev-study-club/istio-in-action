import { ErrorBoundary, Suspense } from '@suspensive/react';
import { use, useMemo } from 'react';

import { renderMarkdown } from '../../services/markdown';
import { chapterNotePromise } from '../../services/content';
import { MarkdownNote } from '../MarkdownNote';

function LoadedNote({ promise }: { promise: Promise<string> }) {
  const markdown = use(promise);
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  return <MarkdownNote html={html} />;
}

/**
 * 노트는 보조 콘텐츠라 로딩·실패가 절 체크 화면을 막으면 안 된다 —
 * 자체 Suspense/ErrorBoundary로 감싸 실패 시 조용히 아무것도 그리지 않는다.
 * 본문은 lazy 청크라 이 경계 안에서만 기다린다.
 */
export function ChapterNote({ member, chapterId }: { member: string; chapterId: number }) {
  const promise = chapterNotePromise(member, chapterId);
  if (promise === null) return null;

  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={null}>
        <LoadedNote promise={promise} />
      </Suspense>
    </ErrorBoundary>
  );
}

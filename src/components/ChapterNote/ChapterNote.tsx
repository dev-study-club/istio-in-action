import { ErrorBoundary, Suspense } from '@suspensive/react';
import { use, useMemo } from 'react';

import { renderMarkdown } from '../../services/markdown';
import { chapterNotePromise } from '../../services/content';
import { MarkdownNote } from '../MarkdownNote';
import { NoteSkeleton } from '../ScreenStates';

function LoadedNote({ promise }: { promise: Promise<string> }) {
  const markdown = use(promise);
  const html = useMemo(() => renderMarkdown(markdown), [markdown]);
  return <MarkdownNote html={html} />;
}

/**
 * 노트는 보조 콘텐츠라 로딩·실패가 절 체크 화면을 막으면 안 된다 —
 * 자체 Suspense/ErrorBoundary로 감싸 실패 시 조용히 아무것도 그리지 않는다.
 * 본문은 lazy 청크라 이 경계 안에서만 기다린다.
 *
 * 기다리는 동안은 스켈레톤을 세운다. fallback이 null이면 제목만 뜨고 본문 자리가
 * 완전히 비어 느린 회선에서 "글이 없는 페이지"로 보인다 — 앱에서 실제로 서스펜드하는
 * 유일한 지점이라 로딩 표시가 걸릴 곳도 여기뿐이다.
 */
export function ChapterNote({ member, chapterId }: { member: string; chapterId: number }) {
  const promise = chapterNotePromise(member, chapterId);
  if (promise === null) return null;

  return (
    <ErrorBoundary fallback={null}>
      <Suspense fallback={<NoteSkeleton />}>
        <LoadedNote promise={promise} />
      </Suspense>
    </ErrorBoundary>
  );
}

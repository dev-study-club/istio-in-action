import { useEffect, useRef } from 'react';

import { markdownNote } from './MarkdownNote.css';

interface MarkdownNoteProps {
  html: string;
}

/**
 * 렌더 전 sanitize된 HTML을 신뢰하고 그대로 그리는 표시 전용 컴포넌트.
 * html은 항상 entities/notes/renderMarkdown(DOMPurify 통과)을 거친 값이어야 한다.
 */
export function MarkdownNote({ html }: MarkdownNoteProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  /*
   * 이미지는 자리를 미리 잡아둬도(width/height) 다 받아지는 순간 빈 칸에 툭 나타난다 —
   * 받아진 것부터 부드럽게 띄운다.
   * 페이드는 이 효과가 실제로 도는 동안에만 켠다(data-fade). 스크립트가 죽으면 그냥 보인다.
   */
  useEffect(() => {
    const root = rootRef.current;
    if (root === null) return;

    const markSettled = (image: HTMLImageElement) => {
      image.dataset.settled = 'true';
    };

    const images = [...root.querySelectorAll('img')];
    const cleanups = images.flatMap((image) => {
      if (image.complete) {
        markSettled(image);
        return [];
      }
      const onSettle = () => markSettled(image);
      // 실패한 이미지도 대체 텍스트는 보여야 한다 — 투명한 채로 남기지 않는다
      image.addEventListener('load', onSettle, { once: true });
      image.addEventListener('error', onSettle, { once: true });
      return [
        () => {
          image.removeEventListener('load', onSettle);
          image.removeEventListener('error', onSettle);
        },
      ];
    });

    root.dataset.fade = 'on';

    return () => {
      delete root.dataset.fade;
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [html]);

  return <div ref={rootRef} className={markdownNote} dangerouslySetInnerHTML={{ __html: html }} />;
}

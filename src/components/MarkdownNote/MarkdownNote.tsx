import { markdownNote } from './MarkdownNote.css';
interface MarkdownNoteProps {
  html: string;
}

/**
 * 렌더 전 sanitize된 HTML을 신뢰하고 그대로 그리는 표시 전용 컴포넌트.
 * html은 항상 entities/notes/renderMarkdown(DOMPurify 통과)을 거친 값이어야 한다.
 */
export function MarkdownNote({ html }: MarkdownNoteProps) {
  return <div className={markdownNote} dangerouslySetInnerHTML={{ __html: html }} />;
}

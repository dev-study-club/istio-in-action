import DOMPurify from 'dompurify';
import { Marked } from 'marked';

const ABSOLUTE_URL_PATTERN = /^(?:[a-z][a-z\d+\-.]*:|\/\/)/i;

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}

/**
 * 노트는 저장소 기준 상대경로로 이미지를 가리킨다 (예: images/notes/<책>/1-1.png).
 * 브라우저는 상대 src를 문서 URL 기준으로 푸는데, 이 앱은 퍼널 상태가 쿼리스트링에 실리는
 * SPA라 문서 URL이 화면마다 달라진다. GitHub Pages 하위 경로 배포(base './')까지 겹치면
 * 같은 노트가 화면에 따라 깨진다 — 그래서 BASE_URL을 명시적으로 붙인다.
 */
const marked = new Marked({
  renderer: {
    image({ href, title, text }) {
      const src = ABSOLUTE_URL_PATTERN.test(href)
        ? href
        : `${import.meta.env.BASE_URL}${href.replace(/^\.?\//, '')}`;
      const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : '';
      // 노트 이미지는 스크롤해야 보이는 위치가 대부분이라 lazy가 기본이다
      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(text)}"${titleAttribute} loading="lazy" decoding="async">`;
    },
  },
});

/**
 * 챕터 노트 마크다운 → 안전한 HTML 문자열.
 * 노트는 저장소 소유자가 직접 작성하는 1차 콘텐츠지만, dangerouslySetInnerHTML로
 * 렌더하므로 DOMPurify로 한 번 더 걸러 XSS 표면을 남기지 않는다.
 */
export function renderMarkdown(markdown: string): string {
  const html = marked.parse(markdown, { async: false });
  // loading·decoding은 DOMPurify 기본 허용 목록에 없어 명시하지 않으면 지워진다
  return DOMPurify.sanitize(html, { ADD_ATTR: ['loading', 'decoding'] });
}

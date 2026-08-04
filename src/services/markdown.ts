import DOMPurify from 'dompurify';
import { Marked } from 'marked';
import noteImageSizes from 'virtual:note-image-sizes';

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
      const isAbsolute = ABSOLUTE_URL_PATTERN.test(href);
      const publicPath = href.replace(/^\.?\//, '');
      const src = isAbsolute ? href : `${import.meta.env.BASE_URL}${publicPath}`;
      const titleAttribute = title ? ` title="${escapeAttribute(title)}"` : '';

      /*
       * 원본 크기를 적어두면 브라우저가 로드 전에 자리를 잡아 본문이 밀리지 않는다.
       * CSS의 max-width/height:auto와 함께 쓰면 비율만 유지한 채 폭에 맞춰 줄어든다.
       * 크기를 모르는 이미지(외부 URL 등)는 속성 없이 지금까지처럼 그린다.
       */
      const size = isAbsolute ? undefined : noteImageSizes[publicPath];
      const sizeAttributes = size ? ` width="${size[0]}" height="${size[1]}"` : '';

      // 노트 이미지는 스크롤해야 보이는 위치가 대부분이라 lazy가 기본이다
      return `<img src="${escapeAttribute(src)}" alt="${escapeAttribute(text)}"${titleAttribute}${sizeAttributes} loading="lazy" decoding="async">`;
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

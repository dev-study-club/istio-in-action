// @vitest-environment jsdom
// DOMPurify는 브라우저 DOM이 필요해 이 파일만 jsdom 환경으로 돌린다 (나머지는 node로 충분히 빠르다)
import { describe, expect, test } from 'vitest';

import { renderMarkdown } from '../services/markdown';

describe('renderMarkdown', () => {
  test('제목·목록·링크 등 기본 마크다운 문법을 HTML로 변환한다', () => {
    // Act
    const html = renderMarkdown('## 핵심 개념\n\n- 사이드카 패턴\n- [공식 문서](https://istio.io)');

    // Assert
    expect(html).toContain('<h2>핵심 개념</h2>');
    expect(html).toContain('<li>사이드카 패턴</li>');
    expect(html).toContain('href="https://istio.io"');
  });

  test('script 태그 등 위험한 마크업은 제거한다', () => {
    // Act
    const html = renderMarkdown('안전한 텍스트<script>alert(1)</script>');

    // Assert
    expect(html, `html was: ${html}`).not.toContain('<script>');
    expect(html).toContain('안전한 텍스트');
  });

  test('상대 경로 이미지에는 BASE_URL을 붙여 화면마다 깨지지 않게 한다', () => {
    // Act
    const html = renderMarkdown('![개념도](images/notes/istio-in-action/1-1.png)');

    // Assert — BASE_URL이 붙어야 SPA 쿼리스트링·하위 경로 배포에서도 같은 곳을 가리킨다
    expect(html, `html was: ${html}`).toContain(
      `src="${import.meta.env.BASE_URL}images/notes/istio-in-action/1-1.png"`,
    );
    expect(html).toContain('alt="개념도"');
    expect(html, `html was: ${html}`).toContain('loading="lazy"');
  });

  test('절대 URL 이미지는 손대지 않는다', () => {
    // Act
    const html = renderMarkdown('![외부](https://example.com/a.png)');

    // Assert
    expect(html, `html was: ${html}`).toContain('src="https://example.com/a.png"');
  });

  test('GFM 표와 코드 블록을 변환한다 — 노트에 실제로 쓰이는 문법', () => {
    // Act
    const html = renderMarkdown(
      '| 패턴 | 설명 |\n| --- | --- |\n| 타임아웃 | 제한 |\n\n```yaml\nkind: IstioOperator\n```',
    );

    // Assert
    expect(html, `html was: ${html}`).toContain('<table>');
    expect(html).toContain('<td>타임아웃</td>');
    expect(html, `html was: ${html}`).toContain('language-yaml');
  });
});

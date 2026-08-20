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

  test('저장소 안 이미지에는 원본 크기를 적어 본문이 밀리지 않게 한다', () => {
    // Act — 실제로 저장소에 있는 이미지여야 빌드가 크기를 찾을 수 있다
    const html = renderMarkdown('![개념도](images/notes/istio-in-action/1-1.avif)');

    // Assert — 값 자체보다 "크기가 붙는가"가 중요하다 (이미지가 교체돼도 테스트가 살아남는다)
    expect(html, `html was: ${html}`).toMatch(/width="\d+"/);
    expect(html, `html was: ${html}`).toMatch(/height="\d+"/);
  });

  test('크기를 알 수 없는 이미지는 속성 없이 그대로 그린다', () => {
    // Act
    const html = renderMarkdown('![없는것](images/notes/istio-in-action/없는파일.avif)');

    // Assert — 억지로 0을 넣으면 이미지가 사라진다
    expect(html, `html was: ${html}`).not.toMatch(/width="/);
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

/**
 * 저장소의 노트를 실제로 렌더해 강조가 살아 있는지 본다.
 *
 * 마크다운은 **강조**가 문장부호로 끝나고 곧바로 한글 조사가 붙으면(`**(RPS)**과`) 강조로 읽지
 * 않고 별표를 그대로 뱉는다. 화면에는 에러 없이 `**...**`가 노출될 뿐이라 눈으로 보기 전에는
 * 모른다 — 실제로 8장 노트에서 14곳이 그렇게 새어나갔다. 조사를 강조 안쪽에 넣으면 해결된다.
 */
describe('저장소의 노트', () => {
  const notes = Object.entries(
    import.meta.glob<string>('/content/*/*/[0-9]*.md', {
      query: '?raw',
      import: 'default',
      eager: true,
    }),
  );

  test('노트 파일이 최소 한 개는 있다', () => {
    expect(notes.length, '글롭이 노트를 하나도 못 찾았다').toBeGreaterThan(0);
  });

  test.each(notes)('%s의 강조가 별표로 새어나오지 않는다', (path, markdown) => {
    /* 코드 블록·인라인 코드 안의 별표는 원문 그대로가 정상이라 빼고 본다 */
    const rendered = renderMarkdown(markdown)
      .replace(/<pre[\s\S]*?<\/pre>/g, '')
      .replace(/<code[\s\S]*?<\/code>/g, '');
    const leaked = rendered.match(/.{0,40}\*\*.{0,40}/)?.[0].replace(/\n/g, ' ');

    expect(leaked, `${path}에서 강조가 안 걸린 곳: ${leaked}`).toBeUndefined();
  });
});

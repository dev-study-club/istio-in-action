import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/*
 * 노트는 카드가 아니라 '글'이다 — 배경으로 감싸지 않고 캔버스 위에 그대로 흐르게 둔다.
 * 회색 면은 코드 블록처럼 본문과 성격이 다른 덩어리에만 쓴다.
 * 위계는 배경색이 아니라 크기 대비와 여백 리듬으로 만든다.
 *
 * 본문은 marked가 만든 HTML이라 클래스를 붙일 수 없다 — 하위 요소는 globalStyle로 다룬다.
 */
export const markdownNote = style({
  marginTop: 8,
  color: vars.text.neutral,
  fontSize: 16,
  lineHeight: 1.75,
  // 한국어는 단어 중간에서 끊기면 읽기 흐름이 깨진다
  wordBreak: 'keep-all',
});

const scope = `.${markdownNote}`;

globalStyle(`${scope} > :first-child`, { marginTop: 0 });
globalStyle(`${scope} > :last-child`, { marginBottom: 0 });

/* 섹션 사이 여백이 위계를 만든다 — 제목 위 간격이 아래보다 훨씬 크다 */
globalStyle(`${scope} h1, ${scope} h2, ${scope} h3`, {
  color: vars.text['neutral-strong'],
  fontWeight: 700,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
});

globalStyle(`${scope} h1`, { margin: '48px 0 14px', fontSize: 24 });
globalStyle(`${scope} h2`, { margin: '44px 0 12px', fontSize: 21 });
globalStyle(`${scope} h3`, { margin: '30px 0 8px', fontSize: 17 });

/*
 * h4 아래로는 본문과 크기가 같아진다 — 굵기와 여백으로만 구분한다.
 * 스타일을 안 주면 브라우저 기본값이 나와 h3보다 작고 여백도 제각각이라 위계가 무너진다.
 */
globalStyle(`${scope} h4, ${scope} h5, ${scope} h6`, {
  margin: '24px 0 6px',
  color: vars.text['neutral-strong'],
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.5,
});

globalStyle(`${scope} p`, { margin: '16px 0' });

globalStyle(`${scope} ul, ${scope} ol`, {
  margin: '16px 0',
  paddingLeft: 22,
  listStyle: 'revert',
});

globalStyle(`${scope} li`, { margin: '8px 0' });

/* 중첩 목록은 부모와 붙여 한 덩어리로 읽히게 한다 */
globalStyle(`${scope} li > ul, ${scope} li > ol`, { margin: '8px 0' });

globalStyle(`${scope} strong`, {
  color: vars.text['neutral-strong'],
  fontWeight: 600,
});

globalStyle(`${scope} em`, {
  fontStyle: 'normal',
  color: vars.text['neutral-strong'],
});

globalStyle(`${scope} del`, {
  color: vars.text['neutral-weak'],
  textDecorationThickness: 1,
});

globalStyle(`${scope} a`, {
  color: vars.text.brand,
  textDecoration: 'underline',
  textUnderlineOffset: 2,
});

/*
 * 노트는 --- 로 장을 나눈다. 기본 hr은 두꺼운 홈이 파인 선이라 글 흐름에 튄다 —
 * 얇은 선 하나로 바꾸고 위아래 여백을 넉넉히 준다.
 */
globalStyle(`${scope} hr`, {
  margin: '40px 0',
  border: 'none',
  borderTop: `1px solid ${vars.border.neutral}`,
});

/*
 * 노션에서 가져온 다이어그램은 원본이 1800px를 넘기도 한다 — 폭에 맞춰 줄인다.
 * 렌더러가 width/height를 적어주므로 브라우저가 비율을 알고 자리를 먼저 잡는다.
 * 빈 자리가 흰 구멍으로 보이지 않게 옅은 면을 깔아둔다.
 */
globalStyle(`${scope} img`, {
  display: 'block',
  maxWidth: '100%',
  height: 'auto',
  margin: '28px 0',
  borderRadius: 12,
  background: vars.fill.neutral,
});

/* 페이드는 MarkdownNote의 효과가 도는 동안에만 — 스크립트가 죽으면 이 규칙 자체가 안 걸린다 */
globalStyle(`${scope}[data-fade='on'] img`, {
  opacity: 0,
  transition: 'opacity 0.4s ease-out',
  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

globalStyle(`${scope}[data-fade='on'] img[data-settled='true']`, {
  opacity: 1,
});

globalStyle(`${scope} code`, {
  padding: '2px 6px',
  borderRadius: 5,
  background: vars.fill.neutral,
  color: vars.text['neutral-strong'],
  fontSize: '0.88em',
  fontFamily: 'ui-monospace, monospace',
});

globalStyle(`${scope} pre`, {
  margin: '24px 0',
  padding: 16,
  borderRadius: 12,
  background: vars.fill.neutral,
  overflowX: 'auto',
  fontSize: 13,
  lineHeight: 1.6,
});

globalStyle(`${scope} pre code`, {
  padding: 0,
  background: 'none',
  fontSize: 'inherit',
});

/* 인용은 흐린 글씨가 아니라 강조다 — 색을 죽이지 않고 왼쪽 선으로 표시한다 */
globalStyle(`${scope} blockquote`, {
  margin: '24px 0',
  padding: '2px 0 2px 16px',
  borderLeft: `3px solid ${vars.fill.brand}`,
});

/* 표는 좁은 화면에서 본문을 밀어내지 않도록 자기 안에서만 가로 스크롤한다 */
globalStyle(`${scope} table`, {
  display: 'block',
  width: '100%',
  overflowX: 'auto',
  borderCollapse: 'collapse',
  margin: '24px 0',
  fontSize: 14,
});

globalStyle(`${scope} th, ${scope} td`, {
  borderBottom: `1px solid ${vars.border.neutral}`,
  padding: '10px 12px',
  textAlign: 'left',
  whiteSpace: 'nowrap',
});

globalStyle(`${scope} th`, {
  color: vars.text['neutral-strong'],
  fontWeight: 600,
});

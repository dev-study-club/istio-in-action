import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const grid = style({
  marginTop: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
});

export const card = style({
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  border: `1px solid ${vars.border.neutral}`,
  borderRadius: 20,
  background: vars.fill.canvas,
  textAlign: 'left',
  selectors: {
    '&:active': { background: vars.fill['neutral-weak'] },
  },
});

/**
 * 카드 폭(=화면 폭) 전체를 채우도록 padding-top 트릭으로 16:9 비율을 만든다.
 * 원본 세션 일러스트가 정확히 16:9라 크롭 없이 장면 전체가 그대로 보인다.
 * width:100% + aspect-ratio를 img에 직접 걸면 HTML width/height 속성과 충돌해
 * 비율이 깨지는 브라우저 버그가 있어, wrapper에서 비율을 만들고 img는 absolute로 채운다.
 */
export const avatarFrame = style({
  // span은 기본 inline이라 width/padding-top(%)이 무시된다 — block으로 강제한다
  display: 'block',
  position: 'relative',
  width: '100%',
  paddingTop: '56.25%', // 16 / 9
  background: vars.fill['brand-weak'],
});

export const avatar = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  objectPosition: 'center top',
});

export const name = style({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '14px 18px',
  fontSize: 17,
  fontWeight: 600,
  selectors: {
    '&::after': {
      content: '""',
      width: 8,
      height: 8,
      borderTop: `2px solid ${vars.text['neutral-weak']}`,
      borderRight: `2px solid ${vars.text['neutral-weak']}`,
      transform: 'rotate(45deg)',
    },
  },
});

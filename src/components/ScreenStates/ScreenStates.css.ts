import { keyframes, style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

const pulse = keyframes({
  '0%, 100%': { opacity: 1 },
  '50%': { opacity: 0.55 },
});

export const skeleton = style({
  borderRadius: 12,
  background: vars.fill.neutral,
  animation: `${pulse} 1.2s ease-in-out infinite`,
  // 자리를 잡아주는 게 본래 역할이라, 깜빡임만 걷고 회색 블록은 그대로 남긴다
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

/** 노트 본문이 오는 자리 — 제목만 덩그러니 남지 않게 글줄 모양으로 채운다 */
export const noteSkeleton = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  marginTop: 24,
});

export const errorScreen = style({
  paddingTop: 80,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 16,
  textAlign: 'center',
});

/** APNG이라 브라우저가 자체 재생한다 — 재생 제어가 없어 reduced-motion에서는 감춘다 */
export const errorSpot = style({
  width: 140,
  height: 140,
  '@media': {
    '(prefers-reduced-motion: reduce)': { display: 'none' },
  },
});

export const errorMessage = style({
  fontSize: 15,
  color: vars.text.neutral,
  wordBreak: 'keep-all',
});

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

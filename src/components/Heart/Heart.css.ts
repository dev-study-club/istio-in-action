import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

const base = style({
  width: 22,
  height: 22,
  display: 'block',
  /* 목숨이 닳는 순간이 보여야 한다 — 색만 바뀌고 끝나면 알아채지 못한다 */
  transition: 'color 200ms ease, transform 200ms ease',
});

export const heart = styleVariants({
  alive: [base, style({ color: vars.text.danger })],
  spent: [base, style({ color: vars.border.neutral, transform: 'scale(0.82)' })],
});

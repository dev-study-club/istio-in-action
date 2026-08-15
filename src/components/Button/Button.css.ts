import { style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/** TDS xlarge 버튼 */
const base = style({
  width: '100%',
  height: 56,
  borderRadius: 16,
  fontSize: 17,
  fontWeight: 600,
  transition: 'background-color 120ms ease, transform 120ms ease',
  selectors: {
    '&:active': { transform: 'scale(0.98)' },
    '&:disabled': { opacity: 0.4, cursor: 'default' },
  },
});

export const button = styleVariants({
  fill: [
    base,
    style({
      background: vars.fill.brand,
      color: vars.text['on-brand'],
      selectors: { '&:active': { background: vars.fill['brand-strong'] } },
    }),
  ],
  weak: [base, style({ background: vars.fill['brand-weak'], color: vars.text.brand })],
  ghost: [base, style({ height: 44, color: vars.text['neutral-weak'], fontSize: 15 })],
  /* 상단 내비게이션에 들어가는 작은 버튼 — 폭을 글자에 맞춰 줄인다 */
  pill: [
    base,
    style({
      width: 'auto',
      height: 36,
      padding: '0 14px',
      borderRadius: 12,
      background: vars.fill.brand,
      color: vars.text['on-brand'],
      fontSize: 14,
      whiteSpace: 'nowrap',
      selectors: { '&:active': { background: vars.fill['brand-strong'] } },
    }),
  ],
});

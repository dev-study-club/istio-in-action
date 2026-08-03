import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const list = style({
  marginTop: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
});

export const card = style({
  width: '100%',
  minHeight: 116,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 16,
  padding: 18,
  border: `1px solid ${vars.border.neutral}`,
  borderRadius: 18,
  background: vars.fill.canvas,
  textAlign: 'left',
  selectors: {
    '&:active:not(:disabled)': { background: vars.fill['neutral-weak'] },
    '&:disabled': { cursor: 'default', opacity: 0.55 },
  },
});

export const cover = style({
  flexShrink: 0,
  width: 64,
  height: 84,
  borderRadius: 6,
  objectFit: 'cover',
  boxShadow: `0 3px 10px ${vars.shadow.neutral}`,
});

export const content = style({
  flex: 1,
  minWidth: 0,
});

export const cardTitle = style({
  display: 'block',
  fontSize: 17,
  fontWeight: 700,
});

export const description = style({
  display: 'block',
  marginTop: 4,
  color: vars.text['neutral-weak'],
  fontSize: 14,
});

export const status = style({
  flexShrink: 0,
  padding: '4px 8px',
  borderRadius: 6,
  background: vars.fill.neutral,
  color: vars.text['neutral-weak'],
  fontSize: 12,
  fontWeight: 600,
});

/** 테두리 두 변만 남기고 45도 돌려 만든 꺾쇠 */
export const arrow = style({
  flexShrink: 0,
  width: 9,
  height: 9,
  marginRight: 3,
  borderTop: `2px solid ${vars.text['neutral-weak']}`,
  borderRight: `2px solid ${vars.text['neutral-weak']}`,
  transform: 'rotate(45deg)',
});

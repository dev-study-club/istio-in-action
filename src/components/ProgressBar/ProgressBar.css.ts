import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const track = style({
  height: 8,
  borderRadius: 4,
  background: vars.fill.neutral,
  overflow: 'hidden',
});

export const fill = style({
  height: '100%',
  borderRadius: 4,
  background: vars.fill.brand,
});

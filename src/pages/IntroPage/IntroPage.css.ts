import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const intro = style({
  paddingTop: 12,
});

export const media = style({
  overflow: 'hidden',
  borderRadius: 20,
  background: vars.fill.media,
});

export const video = style({
  display: 'block',
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
});

export const introTitle = style({
  marginTop: 28,
  fontSize: 30,
});

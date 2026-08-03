import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const emptyNote = style({
  marginTop: 24,
  padding: '32px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 8,
  borderRadius: 18,
  background: vars.fill.neutral,
  color: vars.text['neutral-weak'],
  textAlign: 'center',
});

export const emptyNoteIcon = style({
  width: 44,
  height: 44,
  display: 'grid',
  placeItems: 'center',
  marginBottom: 4,
  borderRadius: '50%',
  background: vars.fill.canvas,
  color: vars.text.brand,
  fontSize: 20,
});

globalStyle(`.${emptyNote} strong`, {
  color: vars.text.neutral,
});

globalStyle(`.${emptyNote} code`, {
  fontSize: 12,
  overflowWrap: 'anywhere',
});

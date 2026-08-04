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

export const emptyNoteSpot = style({
  width: 120,
  height: 120,
  marginBottom: 4,
});

globalStyle(`.${emptyNote} strong`, {
  color: vars.text.neutral,
});

globalStyle(`.${emptyNote} code`, {
  fontSize: 12,
  overflowWrap: 'anywhere',
});

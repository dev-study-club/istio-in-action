import { style } from '@vanilla-extract/css';

export const notFound = style({
  paddingTop: 96,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 12,
  textAlign: 'center',
});

export const spot = style({
  width: 160,
  height: 160,
  marginBottom: 8,
});

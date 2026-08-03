import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from './theme.css';

globalStyle('*', {
  margin: 0,
  padding: 0,
  boxSizing: 'border-box',
});

globalStyle('html', {
  WebkitTextSizeAdjust: '100%',
});

globalStyle('body', {
  fontFamily:
    "'Toss Product Sans', 'Pretendard Variable', Pretendard, -apple-system, BlinkMacSystemFont, 'Apple SD Gothic Neo', 'Segoe UI', sans-serif",
  background: vars.fill.canvas,
  color: vars.text['neutral-strong'],
  lineHeight: 1.5,
});

globalStyle('button', {
  font: 'inherit',
  color: 'inherit',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
});

globalStyle('ul', {
  listStyle: 'none',
});

/** 단계 전환·등장 애니메이션은 motion이 담당한다 — MotionConfig reducedMotion="user" */
export const app = style({
  width: '100%',
  maxWidth: 520,
  margin: '0 auto',
  minHeight: '100dvh',
  padding: '24px 20px 132px',
});

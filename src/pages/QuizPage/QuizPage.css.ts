import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/*
 * 듀오링고 레슨 상단처럼 뒤로가기 옆에 진행 바가 나란히 눕는다.
 * 진행 바는 문제를 넘길 때마다 차오르므로, 값은 레슨(QuizWidget)이 쥐고 여기로 넘겨준다.
 */
export const progressTrack = style({
  flex: 1,
  height: 12,
  marginLeft: 4,
  borderRadius: 999,
  background: vars.fill.neutral,
  overflow: 'hidden',
});

export const progressFill = style({
  height: '100%',
  borderRadius: 999,
  background: vars.fill.brand,
  transition: 'width 300ms cubic-bezier(0.16, 1, 0.3, 1)',
  '@media': {
    '(prefers-reduced-motion: reduce)': { transition: 'none' },
  },
});

/** 남은 목숨 — 듀오링고처럼 진행 바 오른쪽에 붙는다 */
export const lives = style({
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  gap: 3,
  marginLeft: 10,
});

export const missing = style({
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

import { style } from '@vanilla-extract/css';

import { vars } from './theme.css';

/** 여러 화면이 공유하는 골격 — 상단 내비게이션과 제목 묶음 */

export const nav = style({
  height: 44,
  display: 'flex',
  alignItems: 'center',
  margin: '-8px 0 8px -8px',
});

/** 내비게이션에서 왼쪽(뒤로가기)과 오른쪽(행동 버튼)을 갈라놓는 빈 칸 */
export const navSpacer = style({
  flex: 1,
});

export const title = style({
  fontSize: 24,
  fontWeight: 700,
  lineHeight: 1.4,
  letterSpacing: '-0.02em',
});

export const subtitle = style({
  marginTop: 6,
  fontSize: 15,
  color: vars.text['neutral-weak'],
});

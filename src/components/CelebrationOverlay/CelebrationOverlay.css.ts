import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/**
 * 축하 연출은 화면 전체를 덮는다 — 진도 목록 위 어디에 붙어도 잘리지 않게 fixed로 띄운다.
 *
 * 배경을 앱 바탕색으로 꽉 채워 뒤가 비치지 않게 한다 (라이트 흰색, 다크 먹색).
 * 불투명해진 이상 클릭도 막는다 — 통과시키면 안 보이는 버튼을 잘못 누르게 된다.
 */
export const overlay = style({
  position: 'fixed',
  inset: 0,
  zIndex: 50,
  background: vars.fill.canvas,
});

/** 로티를 화면 한가운데 놓는 자리 */
export const lottieStage = style({
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
});

/*
 * 로티는 원래 크기(375×398) 언저리로 묶는다.
 * svg 렌더러는 담긴 상자를 비율 그대로 채우기 때문에, 상자를 화면 전체로 두면
 * 뷰포트 높이만큼 확대돼 화면을 뒤덮는다 — 잠깐 스치는 연출에는 너무 크다.
 */
export const lottieBox = style({
  width: 'min(70vw, 360px)',
  aspectRatio: '375 / 398',
});

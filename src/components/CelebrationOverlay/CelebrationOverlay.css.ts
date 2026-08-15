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

/** 1단계(듀오)는 화면을 꽉 쓰는 연출이라 오버레이를 그대로 채운다 */
export const fullStage = style({
  width: '100%',
  height: '100%',
});

/** 불사조를 화면 한가운데 놓는 자리 */
export const fireStage = style({
  width: '100%',
  height: '100%',
  display: 'grid',
  placeItems: 'center',
});

/*
 * 불사조는 상자에 묶어 둔다.
 *
 * Rive는 부모 크기를 받아 Fit.Contain으로 맞추기 때문에, 상자를 화면 전체로 두면
 * 뷰포트만큼 확대돼 불꽃이 화면을 뒤덮고 형체가 흐려진다 — 앞서 여기 있던 로티도 같은 이유로
 * 원래 크기 언저리로 묶여 있었다.
 */
export const fireBox = style({
  width: 'min(78vw, 380px)',
  aspectRatio: '1 / 1',
});

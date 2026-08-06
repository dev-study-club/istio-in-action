import { style } from '@vanilla-extract/css';

/**
 * Rive는 이 캔버스의 CSS 크기를 읽어 DPR만큼 확대한 드로잉 버퍼를 잡는다 —
 * 부모가 크기를 정하고 캔버스는 그 안을 채우기만 한다.
 */
export const riveStage = style({
  display: 'block',
  width: '100%',
  height: '100%',
});

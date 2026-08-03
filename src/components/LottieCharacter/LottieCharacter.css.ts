import { globalStyle, style } from '@vanilla-extract/css';

export const pathCharacter = style({
  display: 'block',
  width: '100%',
  height: '100%',
});

/** lottie-web이 런타임에 주입하는 svg라 클래스를 붙일 수 없다 */
globalStyle(`.${pathCharacter} svg`, {
  display: 'block',
  width: '100%',
  height: '100%',
});

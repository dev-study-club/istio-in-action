import {
  assignVars,
  createGlobalTheme,
  createGlobalThemeContract,
  globalStyle,
} from '@vanilla-extract/css';

import darkTokens from './tokens.dark.json';
import lightTokens from './tokens.light.json';

/**
 * 키 경로를 '-'로 이어 기존과 똑같은 변수명을 만든다 (fill.brand-strong → --fill-brand-strong).
 * 이 매핑이 어긋나면 app.css의 var() 참조가 통째로 끊기므로 바꾸지 않는다.
 */
export const vars = createGlobalThemeContract(lightTokens, (_value, path) => path.join('-'));

createGlobalTheme(':root', vars, lightTokens);

globalStyle(':root', {
  '@media': {
    '(prefers-color-scheme: dark)': {
      vars: assignVars(vars, darkTokens),
    },
  },
});

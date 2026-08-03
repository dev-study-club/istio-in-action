import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const backButton = style({
  width: 40,
  height: 40,
  display: 'grid',
  placeItems: 'center',
  borderRadius: 12,
  color: vars.text.neutral,
  selectors: {
    '&:active': { background: vars.fill.neutral },
  },
});

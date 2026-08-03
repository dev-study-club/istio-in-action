import { style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/**
 * 화면 하단 고정 CTA — .app과 같은 520px로 폭을 맞춰 중앙에 붙인다.
 * 위쪽 그라디언트는 스크롤되는 본문이 버튼 뒤로 사라지는 경계를 부드럽게 만든다.
 */
export const bottomCta = style({
  position: 'fixed',
  bottom: 0,
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  maxWidth: 520,
  padding: '12px 20px calc(16px + env(safe-area-inset-bottom))',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  background: `linear-gradient(to top, ${vars.fill.canvas} 70%, transparent)`,
});

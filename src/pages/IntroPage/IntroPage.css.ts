import { globalStyle, style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

export const intro = style({
  paddingTop: 12,
});

export const media = style({
  overflow: 'hidden',
  borderRadius: 20,
  background: vars.fill.media,
});

export const video = style({
  display: 'block',
  width: '100%',
  aspectRatio: '16 / 9',
  objectFit: 'cover',
});

export const greeting = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  marginTop: 12,
});

/**
 * 말풍선 — 학습 경로의 '시작' 툴팁과 같은 꼬리 기법을 쓴다.
 * top으로 내리는 이유: 마진으로 내리면 아래 듀오까지 같이 밀려서
 * 애써 맞춘 듀오 위치가 어긋난다. relative 오프셋은 흐름을 건드리지 않는다.
 */
export const bubble = style({
  position: 'relative',
  top: 140,
  padding: '10px 16px',
  border: `2px solid ${vars.border.neutral}`,
  borderRadius: 12,
  background: vars.fill.canvas,
  color: vars.text['neutral-strong'],
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1,
  whiteSpace: 'nowrap',
});

export const bubbleTail = style({
  position: 'absolute',
  top: 'calc(100% + 1px)',
  left: '50%',
  width: 18,
  height: 11,
  overflow: 'hidden',
  transform: 'translateX(-50%)',
});

globalStyle(`.${bubbleTail} span`, {
  position: 'absolute',
  top: -7,
  left: 3,
  width: 12,
  height: 12,
  borderRight: `2px solid ${vars.border.neutral}`,
  borderBottom: `2px solid ${vars.border.neutral}`,
  borderRadius: 2,
  background: vars.fill.canvas,
  transform: 'rotate(45deg)',
});

/*
 * 아트보드는 916x939인데 듀오는 그 안의 y556~956 구간에만 그려진다 —
 * 상자를 키우면 듀오와 함께 위쪽 빈 여백(높이의 59%)도 커져 말풍선이 그만큼 멀어진다.
 * 그래서 크기를 바꿀 때는 marginTop도 같이 계산해야 간격이 유지된다:
 * marginTop = 원하는간격 - height * 0.592 (300x308 기준 여백 182px).
 */
export const duo = style({
  width: 300,
  height: 308,
  marginTop: -25,
});

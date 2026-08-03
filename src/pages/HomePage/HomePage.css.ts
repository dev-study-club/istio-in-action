import { createVar, globalStyle, keyframes, style } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/* ── 퀘스트 카드 ──────────────────────────── */

export const questCard = style({
  marginTop: 24,
  padding: '15px 17px',
  borderRadius: 20,
  border: `2px solid ${vars.border.neutral}`,
  background: vars.fill.canvas,
  boxShadow: `0 4px 0 ${vars.border.neutral}`,
});

export const questHeading = style({
  display: 'flex',
  alignItems: 'center',
  gap: 9,
  marginBottom: 10,
});

/** 아이콘이 자체 색을 가진 일러스트라 배경 면을 깔면 색이 부딪힌다 — 그대로 놓는다 */
export const questIcon = style({
  width: 32,
  height: 32,
  display: 'grid',
  placeItems: 'center',
});

globalStyle(`.${questIcon} img`, {
  display: 'block',
  width: 30,
  height: 30,
});

export const questEyebrow = style({
  fontSize: 16,
  fontWeight: 700,
});

export const questReward = style({
  marginLeft: 'auto',
  padding: '5px 9px',
  borderRadius: 9,
  background: vars.fill['brand-weak'],
  color: vars.text.brand,
  fontSize: 12,
  fontWeight: 700,
});

export const questBody = style({
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: 12,
  marginBottom: 8,
});

export const questTitle = style({ fontSize: 16 });

export const questCount = style({
  flexShrink: 0,
  color: vars.text.neutral,
  fontSize: 14,
  fontWeight: 700,
});

export const questRemaining = style({
  marginTop: 6,
  color: vars.text['neutral-weak'],
  fontSize: 13,
  fontWeight: 600,
});

/* ── 주차 단위 ────────────────────────────── */

export const studyUnits = style({
  marginTop: 42,
  display: 'flex',
  flexDirection: 'column',
  gap: 38,
});

export const unitHeader = style({
  display: 'flex',
  alignItems: 'center',
  gap: 14,
});

export const divider = style({
  minWidth: 20,
  flex: 1,
  height: 1,
  border: 0,
  background: vars.border.neutral,
});

/** 이번 주차 강조 — 부모 수식자 대신 변형 클래스를 직접 붙여 선택자 결합을 없앤다 */
export const dividerCurrent = style([divider, { background: vars.fill['brand-weak'] }]);

export const topic = style({
  flexShrink: 0,
  maxWidth: '68%',
  fontSize: 15,
  fontWeight: 700,
  lineHeight: 1.35,
  textAlign: 'center',
});

export const topicCurrent = style([topic, { color: vars.text.brand }]);

export const unitSteps = style({
  minHeight: 410,
  padding: '42px 0 24px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gap: 58,
});

/* ── 챕터 노드 ────────────────────────────── */

const nodeShadow = createVar();

export const chapterLevel = style({
  position: 'relative',
  width: 100,
  height: 100,
});

export const chapterNode = style({
  position: 'absolute',
  top: 14,
  left: 14,
  vars: { [nodeShadow]: vars.border.neutral },
  width: 72,
  height: 72,
  display: 'grid',
  placeItems: 'center',
  border: `3px solid ${vars.border.neutral}`,
  borderRadius: '50%',
  background: vars.fill.neutral,
  boxShadow: `0 6px 0 ${nodeShadow}`,
  color: vars.text['neutral-weak'],
  fontSize: 22,
  fontWeight: 800,
  transition: 'box-shadow 120ms ease, background-color 120ms ease, border-color 120ms ease',
  selectors: {
    // 누르면 그림자가 줄며 실제로 눌리는 느낌을 준다
    '&:hover': { boxShadow: `0 3px 0 ${nodeShadow}` },
    '&:active': { boxShadow: `0 0 0 ${nodeShadow}` },
  },
});

/** 진행 중·완료 노드는 같은 강조를 쓴다 */
export const chapterNodeActive = style({
  vars: { [nodeShadow]: vars.fill['brand-strong'] },
  borderColor: vars.fill.brand,
  background: vars.fill.brand,
  color: vars.text['on-brand'],
});

export const nodeIcon = style({
  display: 'block',
  width: 42,
  height: 34,
});

const startBob = keyframes({
  '0%, 100%': { transform: 'translateX(-50%) translateY(0)' },
  '50%': { transform: 'translateX(-50%) translateY(-6px)' },
});

export const nodeStart = style({
  position: 'absolute',
  left: '50%',
  bottom: 'calc(100% + 7px)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  color: vars.text.brand,
  fontSize: 13,
  fontWeight: 800,
  lineHeight: 1,
  whiteSpace: 'nowrap',
  transform: 'translateX(-50%)',
  animation: `${startBob} 1.4s ease-in-out infinite`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

export const startBody = style({
  position: 'relative',
  zIndex: 1,
  padding: '9px 15px 8px',
  border: `2px solid ${vars.border.neutral}`,
  borderRadius: 10,
  background: vars.fill.canvas,
  boxShadow: `0 3px 0 ${vars.border.neutral}`,
});

/** 말풍선 꼬리 — 정사각형을 45도 돌려 두 변만 보이게 잘라낸다 */
export const startTail = style({
  position: 'absolute',
  zIndex: 2,
  top: 'calc(100% + 1px)',
  left: '50%',
  width: 18,
  height: 11,
  overflow: 'hidden',
  transform: 'translateX(-50%)',
});

globalStyle(`.${startTail} span`, {
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

/* ── 보상 장면 ────────────────────────────── */

export const pathRewardScene = style({
  position: 'relative',
  width: '100%',
  height: 126,
});

export const treasureNode = style({
  position: 'absolute',
  top: 18,
  marginLeft: -40,
  width: 80,
  height: 90,
  display: 'grid',
  placeItems: 'center',
  cursor: 'default',
});

globalStyle(`.${treasureNode} img`, {
  display: 'block',
  width: 80,
  height: 90,
});

export const pathCharacterPosition = style({
  position: 'absolute',
  top: -56,
  width: 232,
  height: 232,
  transform: 'translateX(-50%)',
});

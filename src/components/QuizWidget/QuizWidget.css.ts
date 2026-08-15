import { globalStyle, keyframes, style, styleVariants } from '@vanilla-extract/css';

import { vars } from '../../styles/theme.css';

/* 이제 레슨이 화면 하나를 통째로 쓴다 — 카드로 감싸지 않고 페이지 위에 그대로 흐르게 둔다 */
export const card = style({
  marginTop: 20,
});

/* 듀오와 말풍선을 나란히 — 좁은 화면에서도 캐릭터가 밀리지 않게 크기를 고정한다 */
export const prompt = style({
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  marginTop: 20,
});

export const character = style({
  flexShrink: 0,
  width: 84,
  height: 84,
});

export const bubble = style({
  position: 'relative',
  flex: 1,
  padding: '14px 16px',
  borderRadius: 14,
  border: `2px solid ${vars.border.neutral}`,
  background: vars.fill.canvas,
  color: vars.text['neutral-strong'],
  fontSize: 16,
  fontWeight: 600,
  lineHeight: 1.6,
  wordBreak: 'keep-all',
  /* 말풍선 꼬리 — 테두리 삼각형 위에 배경 삼각형을 겹쳐 이음매를 지운다 */
  selectors: {
    '&::before, &::after': {
      content: '""',
      position: 'absolute',
      top: 22,
      right: '100%',
      borderStyle: 'solid',
      borderWidth: '7px 9px 7px 0',
      borderColor: `transparent ${vars.border.neutral} transparent transparent`,
    },
    '&::after': {
      marginRight: -2,
      borderRightColor: vars.fill.canvas,
    },
  },
});

export const choiceList = style({
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  marginTop: 18,
});

const choiceBase = style({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  width: '100%',
  padding: '12px 14px',
  borderRadius: 12,
  border: `2px solid ${vars.border.neutral}`,
  background: vars.fill.canvas,
  color: vars.text.neutral,
  fontSize: 15,
  lineHeight: 1.5,
  textAlign: 'left',
  wordBreak: 'keep-all',
  transition: 'background-color 120ms ease, border-color 120ms ease, transform 120ms ease',
  selectors: {
    '&:active:enabled': { transform: 'scale(0.99)' },
    '&:disabled': { cursor: 'default' },
  },
});

export const choice = styleVariants({
  idle: [choiceBase],
  selected: [
    choiceBase,
    style({
      borderColor: vars.text.brand,
      background: vars.fill['brand-weak'],
      color: vars.text.brand,
      fontWeight: 600,
    }),
  ],
  /* 채점 후: 정답은 항상 드러내고(오답을 골랐어도 정답이 어디였는지 보여야 배운다),
     고른 오답은 danger, 나머지는 가라앉힌다 */
  correct: [
    choiceBase,
    style({
      borderColor: vars.text.brand,
      background: vars.fill['brand-weak'],
      color: vars.text.brand,
      fontWeight: 600,
    }),
  ],
  wrong: [
    choiceBase,
    style({
      borderColor: vars.text.danger,
      color: vars.text.danger,
      fontWeight: 600,
    }),
  ],
  dimmed: [choiceBase, style({ opacity: 0.45 })],
});

/* 빈칸 채우기 — 단어 타일을 문장 아래 늘어놓는다 */
export const bank = style({
  display: 'flex',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 18,
});

export const tile = style({
  padding: '10px 14px',
  borderRadius: 12,
  border: `2px solid ${vars.border.neutral}`,
  borderBottomWidth: 4,
  background: vars.fill.canvas,
  color: vars.text.neutral,
  fontSize: 15,
  fontWeight: 600,
  transition: 'transform 120ms ease, opacity 120ms ease',
  selectors: {
    '&:active:enabled': { transform: 'translateY(2px)' },
    /* 이미 문장에 넣은 단어 — 사라지면 자리가 흔들리니 남겨두고 흐리게만 만든다 */
    '&:disabled': { opacity: 0.3, cursor: 'default' },
  },
});

const slotBase = style({
  minWidth: 76,
  margin: '0 3px',
  padding: '1px 8px',
  borderRadius: 8,
  borderWidth: 0,
  borderBottom: `2px solid ${vars.border.neutral}`,
  background: 'transparent',
  color: vars.text['neutral-strong'],
  fontSize: 16,
  fontWeight: 700,
  lineHeight: 1.5,
  transition: 'background-color 120ms ease, border-color 120ms ease',
  selectors: { '&:disabled': { cursor: 'default' } },
});

export const slot = styleVariants({
  open: [slotBase, style({ selectors: { '&:enabled': { background: vars.fill['brand-weak'] } } })],
  right: [slotBase, style({ borderBottomColor: vars.text.brand, color: vars.text.brand })],
  wrong: [slotBase, style({ borderBottomColor: vars.text.danger, color: vars.text.danger })],
});

/* 보기 앞 번호 배지 — 키보드 1~4로 고를 수 있다는 힌트를 겸한다 */
export const badge = style({
  flexShrink: 0,
  width: 22,
  height: 22,
  borderRadius: 6,
  border: `1px solid currentColor`,
  opacity: 0.5,
  fontSize: 12,
  fontWeight: 700,
  lineHeight: '20px',
  textAlign: 'center',
});

const slideUp = keyframes({
  from: { opacity: 0, transform: 'translateY(8px)' },
  to: { opacity: 1, transform: 'translateY(0)' },
});

/* 듀오링고의 하단 피드백 바 — 채점 결과를 색 면으로 단번에 알린다 */
const feedbackBase = style({
  marginTop: 18,
  padding: '14px 16px',
  borderRadius: 14,
  animation: `${slideUp} 200ms ease-out`,
  '@media': {
    '(prefers-reduced-motion: reduce)': { animation: 'none' },
  },
});

export const feedback = styleVariants({
  correct: [feedbackBase, style({ background: vars.fill['brand-weak'], color: vars.text.brand })],
  wrong: [feedbackBase, style({ background: vars.fill.canvas, color: vars.text.danger })],
});

export const feedbackTitle = style({
  margin: 0,
  fontSize: 16,
  fontWeight: 700,
});

export const feedbackBody = style({
  margin: '6px 0 0',
  color: vars.text['neutral-weak'],
  fontSize: 14,
  lineHeight: 1.6,
  wordBreak: 'keep-all',
});

export const footer = style({
  marginTop: 18,
});

/* 결과 화면 — 듀오가 가운데 서서 점수를 알린다 */
export const result = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 4,
  marginTop: 24,
  textAlign: 'center',
});

/** 결과 연출(Rive)이 서는 자리 — 화면 전체로 두면 확대돼 형체가 흐려진다 */
export const resultScene = style({
  width: 'min(60vw, 220px)',
  aspectRatio: '1 / 1',
});

export const resultTitle = style({
  margin: 0,
  color: vars.text['neutral-strong'],
  fontSize: 20,
  fontWeight: 700,
  letterSpacing: '-0.02em',
});

export const resultScore = style({
  margin: 0,
  color: vars.text['neutral-weak'],
  fontSize: 15,
});

export const notifyStatus = style({
  margin: '10px 0 0',
  color: vars.text['neutral-weak'],
  fontSize: 13,
});

export const hint = style({
  margin: '10px 0 0',
  color: vars.text['neutral-weak'],
  fontSize: 12,
  textAlign: 'center',
});

/* 스크린리더 전용 — 진행 상황을 눈이 아니라 소리로도 알린다 */
export const srOnly = style({
  position: 'absolute',
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
});

globalStyle(`.${bubble} code`, {
  padding: '1px 5px',
  borderRadius: 5,
  background: vars.fill.neutral,
  fontSize: 14,
});

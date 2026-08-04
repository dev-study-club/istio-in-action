import { useFunnel } from '@use-funnel/browser';
import { AnimatePresence, m } from 'motion/react';

import { useEntranceAnimation } from '../hooks/useEntranceAnimation';
import { HomePage } from '../pages/HomePage';
import { MemberSelectPage } from '../pages/MemberSelectPage';
import { goBackToIntro, goToNote } from './route';

// use-funnel은 단계를 지나며 컨텍스트를 누적 병합하므로, 이전 단계는 옵셔널로 선언한다
type StudyFunnelSteps = {
  memberSelect: { member?: string };
  home: { member: string };
};

const STEP_TRANSITION = { duration: 0.24, ease: [0.3, 0.9, 0.3, 1] as const };
const INSTANT = { duration: 0 };

/**
 * 단계 전환을 변형(variants)으로 두는 이유는 exit 때문이다.
 * 나가는 화면은 이동 직전 props로 굳어버려 "지금 뒤로 가는 중"을 알 수 없다 —
 * AnimatePresence의 custom만이 나가는 쪽까지 최신 방향을 전달한다.
 */
const stepVariants = {
  enter: (skip: boolean) => (skip ? { opacity: 1, x: 0 } : { opacity: 0, x: 32 }),
  center: { opacity: 1, x: 0, transition: STEP_TRANSITION },
  exit: (skip: boolean) =>
    skip
      ? { opacity: 0, transition: INSTANT }
      : { opacity: 0, x: -24, transition: STEP_TRANSITION },
};

/**
 * 토스처럼 한 화면에 한 가지 일 — 사람 선택 → 학습 진도.
 * 인트로(비디오)와 챕터 노트는 퍼널 밖 별도 주소다 — routes/route.ts 참고.
 */
export function StudyFunnel() {
  const funnel = useFunnel<StudyFunnelSteps>({
    id: 'istio-study',
    initial: { step: 'memberSelect', context: {} },
  });
  const skipEntrance = !useEntranceAnimation();

  return (
    <AnimatePresence mode="wait" initial={false} custom={skipEntrance}>
      <m.div
        key={funnel.step}
        custom={skipEntrance}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
      >
        <funnel.Render
          memberSelect={({ history }) => (
            <MemberSelectPage
              // 퍼널의 첫 단계라 안에서 돌아갈 곳이 없다 — 퍼널 밖 인트로로 나간다
              onBack={goBackToIntro}
              onSelect={(member) => history.push('home', { member })}
            />
          )}
          home={({ context, history }) => (
            <HomePage
              member={context.member}
              onBack={() => history.back()}
              onSelectChapter={(chapterId) => goToNote(context.member, chapterId)}
            />
          )}
        />
      </m.div>
    </AnimatePresence>
  );
}

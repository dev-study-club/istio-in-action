import { useFunnel } from '@use-funnel/browser';
import { AnimatePresence, m } from 'motion/react';

import { HomePage } from '../pages/HomePage';
import { MemberSelectPage } from '../pages/MemberSelectPage';
import { goToIntro, goToNote } from './route';

// use-funnel은 단계를 지나며 컨텍스트를 누적 병합하므로, 이전 단계는 옵셔널로 선언한다
type StudyFunnelSteps = {
  memberSelect: { member?: string };
  home: { member: string };
};

const STEP_TRANSITION = { duration: 0.24, ease: [0.3, 0.9, 0.3, 1] as const };

/**
 * 토스처럼 한 화면에 한 가지 일 — 사람 선택 → 학습 진도.
 * 인트로(비디오)와 챕터 노트는 퍼널 밖 별도 주소다 — routes/route.ts 참고.
 */
export function StudyFunnel() {
  const funnel = useFunnel<StudyFunnelSteps>({
    id: 'istio-study',
    initial: { step: 'memberSelect', context: {} },
  });

  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div
        key={funnel.step}
        initial={{ opacity: 0, x: 32 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -24 }}
        transition={STEP_TRANSITION}
      >
        <funnel.Render
          memberSelect={({ history }) => (
            <MemberSelectPage
              // 퍼널의 첫 단계라 안에서 돌아갈 곳이 없다 — 퍼널 밖 인트로로 나간다
              onBack={goToIntro}
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

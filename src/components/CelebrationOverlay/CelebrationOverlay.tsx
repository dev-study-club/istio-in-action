import { AnimatePresence, m } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { CelebrationLottie } from './CelebrationLottie';
import * as styles from './CelebrationOverlay.css';

/*
 * Rive 런타임(gzip 44KB)은 축하할 일이 생겨야 필요하다.
 * 정적으로 가져오면 진도 화면 청크에 실려 아무 일 없는 방문에도 매번 받게 된다.
 */
const RiveScene = lazy(() =>
  import('../RiveScene').then(({ RiveScene: Component }) => ({ default: Component })),
);

const HIDDEN = { opacity: 0, scale: 0.86 };
const SHOWN = { opacity: 1, scale: 1 };
const TRANSITION = { duration: 0.28, ease: 'easeOut' as const };

/*
 * 듀오링고가 상태 머신으로 만든 파일이라 그냥 autoplay하면 정지 화면만 나온다 —
 * 트리거를 당겨야 재생된다. 아래 이름과 값은 브라우저에서 파일을 열어 확인한 것이다.
 * 점수 게이지가 차고 듀오가 올라선다. 진도가 늘어난 순간이라 0에서 100까지 채운다.
 */
const RIVE_STATE_MACHINE = 'state machine 1';
const RIVE_TRIGGER = 'continue_trig';
const RIVE_VALUES = {
  guides_off_bool: true,
  intro_percent_num: 0,
  end_percent_num: 100,
  color_num: 3,
};

/**
 * 듀오를 걷고 로티로 넘어가는 시점.
 *
 * 상태 머신에는 "재생 끝"이 없어 Stop 이벤트가 오지 않는다 — 실제로 3.7초에 blank로 빠진 뒤
 * 그대로 머문다. 그래서 제 할 말을 마치는 실측 시간에 맞춰 넘긴다.
 */
const RIVE_MS = 4000;

/** 로티는 제가 끝난 걸 알려주므로 이 값은 안전장치다 — 파일을 못 받았을 때 화면이 붙잡히지 않게 한다 */
const LOTTIE_CAP_MS = 6000;

type Phase = 'rive' | 'lottie';

interface CelebrationOverlayProps {
  /** 축하할 일이 생겼는지 — 지난 방문보다 완료한 칸이 늘었을 때만 켜진다 */
  show: boolean;
  /** 연출이 끝나 화면에서 걷어도 될 때 */
  onDone: () => void;
}

/**
 * 진도가 늘어난 순간 화면을 가득 덮는 연출.
 * 듀오(Rive)가 먼저 나오고, 끝나면 축하 로티가 한 번 돌고 사라진다.
 */
export function CelebrationOverlay({ show, onDone }: CelebrationOverlayProps) {
  /*
   * body에 직접 붙인다.
   *
   * position: fixed는 조상에 transform이 걸려 있으면 뷰포트가 아니라 그 조상을 기준으로 잡힌다 —
   * 진도 화면은 등장할 때 transform으로 미끄러져 들어오고, 축하 연출이 뜨는 순간이 정확히 그때다.
   * 페이지 안에 두면 화면 전체가 아니라 본문 칸 크기(폭 480 · 문서 높이만큼)에 갇힌다.
   */
  return createPortal(
    <AnimatePresence>
      {show && (
        <m.div
          key="celebration"
          className={styles.overlay}
          initial={HIDDEN}
          animate={SHOWN}
          exit={HIDDEN}
          transition={TRANSITION}
        >
          <CelebrationScene onDone={onDone} />
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/**
 * 듀오 → 로티 두 단계를 진행한다.
 *
 * 오버레이가 뜰 때마다 새로 마운트되므로 단계는 늘 'rive'에서 시작한다 —
 * 부모에 상태를 두고 되돌리면 되감기 시점을 따로 맞춰야 한다.
 */
function CelebrationScene({ onDone }: { onDone: () => void }) {
  // 타이머가 콜백 신원이 바뀔 때마다 처음부터 다시 시작하지 않게 한다
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  const [phase, setPhase] = useState<Phase>('rive');

  useEffect(() => {
    const timer = window.setTimeout(() => setPhase('lottie'), RIVE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'lottie') return;
    const timer = window.setTimeout(() => doneRef.current(), LOTTIE_CAP_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'rive') {
    return (
      // 런타임을 받는 동안은 빈 화면이다 — 배경이 이미 화면을 덮고 있어 로딩 표시가 오히려 튄다
      <Suspense fallback={null}>
        <RiveScene
          name="finish"
          stateMachine={RIVE_STATE_MACHINE}
          trigger={RIVE_TRIGGER}
          values={RIVE_VALUES}
        />
      </Suspense>
    );
  }
  return <CelebrationLottie name="celebrate" onFinished={() => doneRef.current()} />;
}

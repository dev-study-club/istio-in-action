import { AnimatePresence, m } from 'motion/react';
import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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
 * 듀오를 걷고 불꽃으로 넘어가는 시점.
 *
 * 상태 머신에는 "재생 끝"이 없어 Stop 이벤트가 오지 않는다 — 실제로 3.7초에 blank로 빠진 뒤
 * 그대로 머문다. 그래서 제 할 말을 마치는 실측 시간에 맞춰 넘긴다.
 */
const RIVE_MS = 4000;

/*
 * 마무리 연출 — fire.riv의 불사조.
 *
 * 이 파일은 연출마다 애니메이션이 따로 들어 있어(PHOENIX/PERFECT/CLASSIC × DARK/LIGHT)
 * 상태 머신 입력으로 고르지 않고 이름으로 곧바로 재생한다. 상태 머신을 거치면
 * streakselect_num의 어떤 숫자가 어떤 연출인지를 추측해야 하는데, 이름은 파일이 직접 알려준다.
 *
 * 배경이 앱 바탕색(라이트 흰색·다크 먹색)이라 불꽃도 같은 쪽을 써야 테두리가 뜨지 않는다.
 */
const FIRE_ARTBOARD = 'IDLE';
const FIRE_DARK = 'PHOENIX_DARK';
const FIRE_LIGHT = 'PHOENIX_LIGHT';

/*
 * PHOENIX_DARK·PHOENIX_LIGHT는 불이 붙는 짧은 도입일 뿐이라, 혼자 재생하면 끝나고
 * 잿빛 실루엣만 남는다. 불사조를 계속 세워두는 건 PHOENIX_LOOP다 — 둘을 겹쳐 재생해
 * 테마에 맞는 색으로 불이 붙고 그대로 타오르게 한다.
 */
const FIRE_LOOP = 'PHOENIX_LOOP';

/** 루프는 끝을 알려주지 않는다 — 여기서 걷을 때를 정한다 */
const FIRE_MS = 3400;

type Phase = 'rive' | 'fire';

interface CelebrationOverlayProps {
  /** 축하할 일이 생겼는지 — 지난 방문보다 완료한 칸이 늘었을 때만 켜진다 */
  show: boolean;
  /** 연출이 끝나 화면에서 걷어도 될 때 */
  onDone: () => void;
}

/**
 * 진도가 늘어난 순간 화면을 가득 덮는 연출.
 * 듀오가 먼저 나오고, 끝나면 불사조가 타오르다 사라진다 (둘 다 Rive).
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
 * 듀오 → 불사조 두 단계를 진행한다.
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
    const timer = window.setTimeout(() => setPhase('fire'), RIVE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (phase !== 'fire') return;
    const timer = window.setTimeout(() => doneRef.current(), FIRE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  return (
    // 런타임을 받는 동안은 빈 화면이다 — 배경이 이미 화면을 덮고 있어 로딩 표시가 오히려 튄다
    <Suspense fallback={null}>
      {/*
       * key로 단계를 갈라 새로 마운트시킨다.
       *
       * 두 단계가 같은 자리의 같은 컴포넌트라 key가 없으면 React가 같은 것으로 보고 갱신만 한다 —
       * 이미 만들어진 Rive 인스턴스가 캔버스를 쥔 채 남아 2단계가 빈 화면으로 나왔다.
       */}
      {phase === 'rive' ? (
        <div className={styles.fullStage}>
          <RiveScene
            key="finish"
            name="finish"
            stateMachine={RIVE_STATE_MACHINE}
            trigger={RIVE_TRIGGER}
            values={RIVE_VALUES}
          />
        </div>
      ) : (
        <div className={styles.fireStage}>
          <div className={styles.fireBox}>
            <RiveScene
              key="fire"
              name="fire"
              artboard={FIRE_ARTBOARD}
              animation={FIRE_ANIMATIONS}
            />
          </div>
        </div>
      )}
    </Suspense>
  );
}

/**
 * 도입은 화면 테마에 맞춰 고르고, 타오르는 루프는 공통이다.
 *
 * 모듈에서 한 번만 만든다 — 렌더마다 새 배열을 넘기면 RiveScene의 useMemo가 매번 다시 돌아
 * 인스턴스를 만들었다 버리길 반복한다 (RiveScene 주석의 그 함정이다).
 */
const FIRE_ANIMATIONS: readonly string[] = [
  window.matchMedia('(prefers-color-scheme: dark)').matches ? FIRE_DARK : FIRE_LIGHT,
  FIRE_LOOP,
];

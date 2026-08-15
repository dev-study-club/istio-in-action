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
 * 마무리 연출 — fire.riv의 불꽃이 불사조로 변한다.
 *
 * 반드시 상태 머신으로 돌린다. 꺼진 불꽃 → 점화 → 불사조라는 순서를 아는 건 상태 머신뿐이라,
 * PHOENIX_* 클립을 이름으로 직접 틀면 변신이 통째로 빠지고 결과 포즈만 남는다
 * (실제로 그렇게 만들었다가 "불꽃이 변하지 않는다"는 지적을 받고 되돌렸다).
 *
 * 입력 이름과 값은 브라우저에서 파일을 열어 확인했다. streakselect_num은 불꽃 종류를 고르는데
 * 3이 불사조다 (0·1·4·5는 꺼진 회색 불꽃, 2는 파란 얼음 불꽃).
 * 배경이 앱 바탕색(라이트 흰색·다크 먹색)이라 불꽃도 같은 쪽을 써야 어긋나지 않는다.
 */
const FIRE_ARTBOARD = 'IDLE';
const FIRE_STATE_MACHINE = 'State Machine';
const FIRE_TRIGGER = 'play_trig';
const FIRE_PHOENIX = 3;
const FIRE_VALUES = {
  darkmode_bool: window.matchMedia('(prefers-color-scheme: dark)').matches,
  streakselect_num: FIRE_PHOENIX,
};

/**
 * 불사조는 변신을 마치면 계속 타오르기만 한다 — 끝을 알려주지 않아 여기서 걷을 때를 정한다.
 * 꺼진 불꽃이 서 있다 점화되기까지 2초쯤 걸려, 변신을 다 보여주고 한 박자 더 태운다.
 */
const FIRE_MS = 4600;

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
              stateMachine={FIRE_STATE_MACHINE}
              trigger={FIRE_TRIGGER}
              values={FIRE_VALUES}
            />
          </div>
        </div>
      )}
    </Suspense>
  );
}

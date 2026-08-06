import type { AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'react';

import { lottieBox, lottieStage } from './CelebrationOverlay.css';

interface LottieMarker {
  /** 마커가 놓인 프레임 */
  tm: number;
  /** 마커 이름 — 애프터이펙트에서 붙인 그대로라 앞뒤 공백이 섞여 있다 */
  cm: string;
}

interface LottieData {
  ip: number;
  op: number;
  markers?: LottieMarker[];
}

/** 반복 구간이 시작되는 지점의 마커 이름 */
const LOOP_START = 'LOOP START';

/**
 * 재생할 구간 — 파일이 알려주는 반복 시작점 앞까지만 쓴다.
 *
 * celebrate.json은 인트로(25~164) + 반복(164~324) 구조라 끝까지 재생하면
 * 반복 구간을 한 바퀴 더 돌아 2.7초가 덧붙는다. 잠깐 스치는 연출에는 인트로면 충분하다.
 * 마커가 없는 파일이면 전체를 재생한다.
 */
function introSegment({ ip, op, markers }: LottieData): [number, number] {
  const loopStart = markers?.find(({ cm }) => cm.trim() === LOOP_START);
  return [ip, loopStart ? loopStart.tm : op];
}

interface CelebrationLottieProps {
  /** public/lottie/<name>.json */
  name: string;
  /** 한 바퀴가 끝났을 때. 파일을 못 받으면 오지 않으니 부르는 쪽이 상한을 함께 둬야 한다 */
  onFinished: () => void;
}

/**
 * 축하를 마무리하는 로티 — 한 번만 돌고 끝난 시점을 알린다.
 *
 * LottieCharacter와 나눠 둔 이유: 그쪽은 진도 목록에 늘 붙어 계속 도는 배경 장식이라
 * 무한 반복 + 화면에 들어올 때까지 로딩을 미루는 게 맞다. 여기는 정반대로,
 * 뜨자마자 한 번 재생하고 끝나야 다음 단계(화면에서 걷기)로 넘어갈 수 있다.
 */
export function CelebrationLottie({ name, onFinished }: CelebrationLottieProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const finishedRef = useRef(onFinished);
  useEffect(() => {
    finishedRef.current = onFinished;
  }, [onFinished]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animation: AnimationItem | undefined;
    let disposed = false;

    /*
     * path로 넘기지 않고 직접 받아 파싱한다.
     *
     * 파일이 없으면 개발 서버는 404가 아니라 index.html을 돌려준다. path로 맡기면 lottie-web이
     * 그 HTML을 파싱하다 조용히 죽고 data_failed도 오지 않아 — 빈 흰 화면이 상한(6초)까지 버텼다.
     * 여기서 파싱하면 실패를 그 자리에서 잡아 곧바로 다음으로 넘길 수 있다.
     */
    void (async () => {
      const [{ default: lottie }, animationData] = await Promise.all([
        // svg 렌더러만 쓰므로 canvas·html 렌더러가 빠진 light 빌드로 충분하다
        import('lottie-web/build/player/lottie_light'),
        fetch(`${import.meta.env.BASE_URL}lottie/${name}.json`).then((res) => {
          if (!res.ok) throw new Error(`lottie ${name}: HTTP ${res.status}`);
          return res.json() as Promise<LottieData>;
        }),
      ]);
      if (disposed) return;
      animation = lottie.loadAnimation({
        container,
        renderer: 'svg',
        loop: false,
        // 구간을 직접 지정하므로 자동 재생에 맡기지 않는다
        autoplay: false,
        animationData,
        rendererSettings: { progressiveLoad: true },
      });
      animation.addEventListener('complete', () => finishedRef.current());
      animation.playSegments(introSegment(animationData), true);
    })().catch(() => {
      // 못 띄우면 빈 화면으로 붙잡지 말고 즉시 넘긴다
      if (!disposed) finishedRef.current();
    });

    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, [name]);

  return (
    <div className={lottieStage} aria-hidden>
      <div ref={containerRef} className={lottieBox} />
    </div>
  );
}

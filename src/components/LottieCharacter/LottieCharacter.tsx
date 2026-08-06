import type { AnimationItem } from 'lottie-web';
import { useEffect, useRef } from 'react';
import { pathCharacter } from './LottieCharacter.css';

interface LottieCharacterProps {
  name: string;
}

export function LottieCharacter({ name }: LottieCharacterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animation: AnimationItem | undefined;
    let disposed = false;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        /*
         * 한 번 띄운 뒤에도 계속 지켜본다.
         *
         * 예전에는 첫 등장에서 관찰을 끊어버려, 스크롤해 지나간 캐릭터가 화면 밖에서도
         * 끝없이 돌았다 — 캐릭터 하나가 SVG 노드 180개쯤을 쥐고 있어 목록을 끝까지 내리면
         * rAF 루프와 DOM이 캐릭터 수만큼 그대로 쌓인다.
         */
        if (animation) {
          // 감속 모션에서는 정지 프레임 한 장이라 되살릴 것이 없다
          if (reduceMotion) return;
          if (entry.isIntersecting) animation.play();
          else animation.pause();
          return;
        }
        if (!entry.isIntersecting) return;

        // svg 렌더러만 쓰므로 canvas·html 렌더러가 빠진 light 빌드로 충분하다 (75KB → 46KB gzip)
        void import('lottie-web/build/player/lottie_light').then(({ default: lottie }) => {
          if (disposed) return;
          animation = lottie.loadAnimation({
            container,
            renderer: 'svg',
            loop: !reduceMotion,
            autoplay: !reduceMotion,
            path: `${import.meta.env.BASE_URL}lottie/${name}.json`,
            rendererSettings: { progressiveLoad: true },
          });
          if (reduceMotion) animation.goToAndStop(0, true);
        });
      },
      { rootMargin: '200px' },
    );
    observer.observe(container);

    return () => {
      disposed = true;
      observer.disconnect();
      animation?.destroy();
    };
  }, [name]);

  return <div ref={containerRef} className={pathCharacter} aria-hidden />;
}

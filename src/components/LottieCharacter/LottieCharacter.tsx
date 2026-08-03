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
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        void import('lottie-web').then(({ default: lottie }) => {
          if (disposed) return;
          const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

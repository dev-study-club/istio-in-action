import { m } from 'motion/react';

import { BottomCta } from '../../components/BottomCta';
import { Button } from '../../components/Button';
import * as screen from '../../styles/screen.css';
import * as styles from './IntroPage.css';

// Slash 23 메인 세션 애니메이션 — 외부 CDN 의존 없이 로컬(public/media)에서 서빙한다
const INTRO_VIDEO_URL = `${import.meta.env.BASE_URL}media/intro.mp4`;
const INTRO_POSTER_URL = `${import.meta.env.BASE_URL}media/intro-poster.jpg`;

interface IntroPageProps {
  onStart: () => void;
}

export function IntroPage({ onStart }: IntroPageProps) {
  return (
    <div className={styles.intro}>
      <m.div
        className={styles.media}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* 17MB 원본 — poster를 먼저 그리고 재생에 필요한 만큼만 스트리밍한다 */}
        <video
          className={styles.video}
          src={INTRO_VIDEO_URL}
          poster={INTRO_POSTER_URL}
          preload="metadata"
          autoPlay
          muted
          loop
          playsInline
        />
      </m.div>

      <m.h1
        className={`${screen.title} ${styles.introTitle}`}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15, ease: 'easeOut' }}
      >
        Dev Study Club
      </m.h1>
      <m.p
        className={screen.subtitle}
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25, ease: 'easeOut' }}
      >
        함께 배우고, 꾸준히 기록해요
      </m.p>

      <BottomCta>
        <Button onClick={onStart}>시작하기</Button>
      </BottomCta>
    </div>
  );
}

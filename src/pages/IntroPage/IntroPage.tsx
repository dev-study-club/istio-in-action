import { m } from 'motion/react';
import { useEffect, useRef } from 'react';

import { BottomCta } from '../../components/BottomCta';
import { Button } from '../../components/Button';
import { LottieCharacter } from '../../components/LottieCharacter';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import * as styles from './IntroPage.css';

// Slash 23 메인 세션 애니메이션 — 외부 CDN 의존 없이 로컬(public/media)에서 서빙한다
const INTRO_VIDEO_URL = `${import.meta.env.BASE_URL}media/intro.mp4`;
const INTRO_POSTER_URL = `${import.meta.env.BASE_URL}media/intro-poster.jpg`;

const MEDIA_ENTER = { opacity: 0, scale: 0.96 };
const MEDIA_SETTLED = { opacity: 1, scale: 1 };

/**
 * 인트로로 돌아왔을 때 영상을 처음부터 다시 틀면 방금 본 장면을 또 보게 된다 —
 * 화면을 떠날 때 재생 위치를 남겨 두고, 다시 들어오면 그 지점부터 잇는다.
 * 새로고침 전까지 이 모듈은 살아 있으므로 화면 밖 상태를 둘 자리로 충분하다.
 */
let lastPlaybackTime = 0;

interface IntroPageProps {
  onStart: () => void;
}

export function IntroPage({ onStart }: IntroPageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animateEntrance = useEntranceAnimation();

  /*
   * React는 muted를 DOM 속성이 아니라 프로퍼티로만 설정한다. Chrome은 그걸로 충분하지만
   * Safari는 파싱 시점의 muted "속성"을 보고 자동재생을 판단해서, 오디오 트랙이 있는 이 영상은
   * 무음으로 취급되지 않아 재생이 막힌다 — 마운트 직후 직접 음소거하고 재생을 요청한다.
   */
  useEffect(() => {
    const video = videoRef.current;
    if (video === null) return;

    video.muted = true;
    // 메타데이터가 아직 없어도 브라우저가 이 값을 재생 시작 위치로 잡아준다
    if (lastPlaybackTime > 0) video.currentTime = lastPlaybackTime;
    // 저전력 모드 등 정책으로 거부되면 poster가 남는다 — 화면이 비지 않으므로 조용히 넘긴다
    video.play().catch(() => {});

    return () => {
      lastPlaybackTime = video.currentTime;
    };
  }, []);

  return (
    <div className={styles.intro}>
      <m.div
        className={styles.media}
        initial={animateEntrance ? MEDIA_ENTER : MEDIA_SETTLED}
        animate={MEDIA_SETTLED}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* 17MB 원본 — poster를 먼저 그리고 재생에 필요한 만큼만 스트리밍한다 */}
        <video
          ref={videoRef}
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

      <m.div
        className={styles.greeting}
        initial={animateEntrance ? MEDIA_ENTER : MEDIA_SETTLED}
        animate={MEDIA_SETTLED}
        transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
      >
        <span className={styles.bubble}>
          안녕하세요! 듀오예요!
          <span className={styles.bubbleTail} aria-hidden>
            <span />
          </span>
        </span>
        <div className={styles.duo}>
          <LottieCharacter name="intro-duo" />
        </div>
      </m.div>

      <BottomCta>
        <Button onClick={onStart}>시작하기</Button>
      </BottomCta>
    </div>
  );
}

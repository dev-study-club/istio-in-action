import { m } from 'motion/react';

import { BottomCta } from '../../components/BottomCta';
import { Button } from '../../components/Button';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import * as screen from '../../styles/screen.css';
import * as styles from './NotFoundPage.css';

const SPOT_ENTER = { opacity: 0, scale: 0.9 };
const SPOT_SETTLED = { opacity: 1, scale: 1 };

interface NotFoundPageProps {
  onHome: () => void;
}

/** 모르는 해시로 들어왔을 때 — 인트로로 조용히 넘기지 않고 없는 페이지라고 알린다 */
export function NotFoundPage({ onHome }: NotFoundPageProps) {
  const animateEntrance = useEntranceAnimation();

  return (
    <div className={styles.notFound}>
      <m.img
        className={styles.spot}
        src={`${import.meta.env.BASE_URL}images/not-found.png`}
        alt=""
        width={160}
        height={160}
        decoding="async"
        initial={animateEntrance ? SPOT_ENTER : SPOT_SETTLED}
        animate={SPOT_SETTLED}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <h1 className={screen.title}>주소를 찾을 수 없어요</h1>
      <p className={screen.subtitle}>
        주소를 잘못 입력했거나, 사라진 페이지일 수 있어요. 주소를 다시 확인해주세요.
      </p>

      <BottomCta>
        <Button onClick={onHome}>처음으로</Button>
      </BottomCta>
    </div>
  );
}

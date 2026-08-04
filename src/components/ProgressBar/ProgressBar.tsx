import { m } from 'motion/react';

import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { fill, track } from './ProgressBar.css';

interface ProgressBarProps {
  percent: number;
}

export function ProgressBar({ percent }: ProgressBarProps) {
  // 되돌아온 화면에서는 이미 채워진 막대를 다시 0부터 채우지 않는다
  const animateEntrance = useEntranceAnimation();

  return (
    <div
      className={track}
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <m.div
        className={fill}
        initial={{ width: animateEntrance ? 0 : `${percent}%` }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}

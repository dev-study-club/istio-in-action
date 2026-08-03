import { Button } from '../Button/Button';
import { errorMessage, errorScreen, errorSpot, skeleton } from './ScreenStates.css';

const SKELETON_CARD_COUNT = 5;

export function LoadingScreen() {
  return (
    <div aria-label="불러오는 중">
      <div className={skeleton} style={{ height: 32, width: '60%' }} />
      <div className={skeleton} style={{ height: 96, marginTop: 24 }} />
      {Array.from({ length: SKELETON_CARD_COUNT }, (_, index) => (
        <div key={index} className={skeleton} style={{ height: 72, marginTop: 10 }} />
      ))}
    </div>
  );
}

interface ErrorScreenProps {
  message: string;
  actionLabel: string;
  onAction: () => void;
}

export function ErrorScreen({ message, actionLabel, onAction }: ErrorScreenProps) {
  return (
    <div className={errorScreen}>
      {/* 장식 이미지라 alt는 비운다 — 상황은 아래 message가 전한다 */}
      <img
        className={errorSpot}
        src={`${import.meta.env.BASE_URL}images/error-spot.png`}
        alt=""
        width={140}
        height={140}
        decoding="async"
      />
      <p className={errorMessage}>{message}</p>
      <Button
        variant="weak"
        style={{ width: 'auto', padding: '0 24px', height: 48 }}
        onClick={onAction}
      >
        {actionLabel}
      </Button>
    </div>
  );
}

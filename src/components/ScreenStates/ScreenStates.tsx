import { Button } from '../Button/Button';
import { errorMessage, errorScreen, errorSpot, noteSkeleton, skeleton } from './ScreenStates.css';

const SKELETON_CARD_COUNT = 5;

/** 글줄처럼 보이도록 폭을 조금씩 달리한다 — 전부 같은 길이면 표처럼 읽힌다 */
const NOTE_LINE_WIDTHS = ['92%', '100%', '86%', '96%', '64%'];

/**
 * 노트 본문 청크를 기다리는 동안의 자리.
 * 이게 없으면 제목만 뜨고 본문 자리가 완전히 비어 "글이 없는 페이지"로 보인다.
 */
export function NoteSkeleton() {
  return (
    <div className={noteSkeleton} role="status" aria-label="노트를 불러오는 중">
      {NOTE_LINE_WIDTHS.map((width, index) => (
        <div key={index} className={skeleton} style={{ height: 16, width }} />
      ))}
    </div>
  );
}

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

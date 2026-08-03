import { backButton } from './BackButton.css';

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" className={backButton} aria-label="뒤로 가기" onClick={onClick}>
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
        <path
          d="M12.5 4L6.5 10L12.5 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}

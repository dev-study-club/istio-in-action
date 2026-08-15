import { heart } from './Heart.css';

/**
 * 목숨 한 칸.
 *
 * 듀오링고 CDN의 하트 이미지를 가져오지 않고 같은 모양을 직접 그린다 —
 * 남의 저작물을 저장소에 넣지 않으면서, 색이 테마 토큰을 따라가고 크기도 자유롭다.
 */
export function Heart({ spent }: { spent: boolean }) {
  return (
    <svg className={heart[spent ? 'spent' : 'alive']} viewBox="0 0 24 22" aria-hidden>
      <path
        d="M12 21.35 3.55 12.9a5.7 5.7 0 0 1 0-8.06 5.7 5.7 0 0 1 8.06 0l.39.39.39-.39a5.7 5.7 0 0 1 8.06 0 5.7 5.7 0 0 1 0 8.06Z"
        fill="currentColor"
      />
    </svg>
  );
}

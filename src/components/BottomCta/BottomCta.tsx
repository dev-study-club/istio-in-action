import type { ReactNode } from 'react';

import { bottomCta } from './BottomCta.css';

/** 화면 하단 고정 CTA 영역 — 토스 퍼널의 하단 버튼 패턴 */
export function BottomCta({ children }: { children: ReactNode }) {
  return <div className={bottomCta}>{children}</div>;
}

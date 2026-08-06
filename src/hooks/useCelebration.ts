import { useCallback, useEffect, useState } from 'react';

import { newlyCompleted, readSeenChapters, writeSeenChapters } from '../services/celebration';

const NOTHING: ReadonlySet<number> = new Set();

interface Celebration {
  /** 이번 방문에 축하할 챕터들. 비어 있으면 띄울 게 없다 */
  celebrating: ReadonlySet<number>;
  /** 연출이 끝나 화면에서 걷어도 될 때 부른다 */
  dismiss: () => void;
}

/**
 * 이번 방문에 축하 연출을 띄울 챕터들.
 *
 * 마운트 시점에 지난 방문 기록과 대조하고, 새 기준은 **연출이 끝난 뒤에** 남긴다.
 *
 * 마운트하자마자 기준을 덮어쓰면 재마운트 한 번에 축하가 통째로 사라진다 —
 * 퍼널의 AnimatePresence mode="wait"가 단계 전환에서 진도 화면을 한 번 떼었다 다시 붙이는데,
 * 그때 기준이 이미 갱신돼 있으면 새로 채워진 칸이 없는 걸로 보인다 (연출이 231ms만에 꺼졌다).
 * 갱신을 미루면 재마운트해도 같은 결과가 나와 연출이 이어진다.
 *
 * 감속 모션을 켠 사용자에게는 아예 띄우지 않는다 — 이 연출은 순수 장식이다.
 */
export function useCelebration(member: string, completedChapterIds: number[]): Celebration {
  const [celebrating, setCelebrating] = useState<ReadonlySet<number>>(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return NOTHING;
    return new Set(newlyCompleted(readSeenChapters(member), completedChapterIds));
  });

  // 배열은 렌더마다 새로 만들어져 의존성으로 못 쓴다 — 내용으로 비교한다
  const completedKey = completedChapterIds.join(',');

  /* 축하가 끝났을 때만 기준을 남긴다. 연출 도중에 화면을 떠나면 기록이 안 되어
     다음 방문에 한 번 더 축하되는데, 못 보고 지나치는 것보다 그 편이 낫다. */
  useEffect(() => {
    if (celebrating.size > 0) return;
    writeSeenChapters(member, completedKey === '' ? [] : completedKey.split(',').map(Number));
  }, [member, completedKey, celebrating]);

  const dismiss = useCallback(() => setCelebrating(NOTHING), []);

  return { celebrating, dismiss };
}

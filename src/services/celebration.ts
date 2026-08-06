/**
 * 축하 연출 기준 — "이 기기가 지난번에 본 완료 목록".
 *
 * 진도는 노트 파일 존재 여부로 정해져 화면에서 체크하는 순간이 없다.
 * 그래서 "방금 채워졌다"를 알려면 지난 방문의 완료 목록을 남겨두고 이번과 대조해야 한다.
 */

const STORAGE_PREFIX = 'istio-seen-chapters:v1';

/** 기록이 없으면(첫 방문·저장소 차단) null. 완료 0개였던 빈 배열과 구분해야 한다 */
export function readSeenChapters(member: string): number[] | null {
  const raw = readItem(`${STORAGE_PREFIX}:${member}`);
  if (raw === null) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.some((id) => typeof id !== 'number')) return null;
    return parsed;
  } catch {
    // 이전 버전이 남겼거나 손상된 값 — 기록 없음으로 보고 새로 쓴다
    return null;
  }
}

export function writeSeenChapters(member: string, chapterIds: number[]): void {
  writeItem(`${STORAGE_PREFIX}:${member}`, JSON.stringify(chapterIds));
}

/**
 * 지난번에 본 뒤 새로 채워진 칸.
 *
 * 첫 방문(seen === null)은 채워지는 순간을 본 게 아니라 이미 채워진 걸 처음 본 것이라
 * 아무것도 축하하지 않는다 — 안 그러면 진도를 쌓아둔 사람은 들어오자마자 모든 노드에 불이 붙는다.
 */
export function newlyCompleted(seen: number[] | null, completed: number[]): number[] {
  if (seen === null) return [];
  const before = new Set(seen);
  return completed.filter((id) => !before.has(id));
}

/* 저장소는 보조 수단이다 — 사파리 시크릿·쿠키 차단에서는 접근 자체가 던진다.
   실패는 "기록 없음"으로 흡수하고 화면은 그대로 굴러가게 둔다. */

function readItem(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeItem(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* 기록을 못 남기면 다음 방문에 한 번 더 축하될 뿐이다 */
  }
}

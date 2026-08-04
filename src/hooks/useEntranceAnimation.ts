import { useSyncExternalStore } from 'react';

import { readNavigationType, subscribeToRoute } from '../routes/route';

/**
 * 이 화면의 등장 애니메이션을 재생할지.
 *
 * 뒤로/앞으로로 되돌아온 화면은 방금 본 화면이라, 페이드인·슬라이드업이 다시 재생되면
 * 멀쩡하던 화면이 처음부터 그려지는 것처럼 보인다. 그때는 도착 상태에서 바로 시작한다.
 *
 * motion의 initial은 마운트 시점에만 읽히고 화면은 이동할 때마다 다시 마운트되므로,
 * 이 값은 그 화면이 "어떻게 열렸는지"를 그대로 가리킨다.
 */
export function useEntranceAnimation(): boolean {
  return useSyncExternalStore(subscribeToRoute, readNavigationType) === 'push';
}

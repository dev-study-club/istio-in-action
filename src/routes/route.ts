/**
 * 최상위 화면을 경로로 가른다 (해시 없음).
 *
 *   /                    인트로(비디오) — 랜딩
 *   /member              스터디 퍼널 — 사람 선택 → 학습 진도
 *   /note/<이름>/<장번호>  챕터 노트 — 공유 가능한 글이라 자체 주소를 가진다
 *   그 외                 404
 *
 * GitHub Pages에는 SPA 폴백이 없어 /member로 직접 들어오면 서버가 404를 낸다 —
 * 배포 워크플로가 index.html을 404.html로 복사해 앱이 뜨게 만든다(.github/workflows/deploy.yml).
 * 그리고 깊은 주소에서 자산 경로가 어긋나지 않도록 base는 절대 경로여야 한다(vite.config.ts).
 *
 * 퍼널 내부 단계는 계속 @use-funnel이 쿼리스트링으로 관리한다.
 */

export type Route =
  | { name: 'intro' }
  | { name: 'funnel' }
  | { name: 'note'; member: string; chapterId: number }
  | { name: 'notFound' };

/** 배포 위치(예: '/istio-in-action/')를 떼어내야 우리 경로만 남는다 */
const BASE = import.meta.env.BASE_URL;

const NOTE_PATTERN = /^note\/([^/]+)\/(\d+)$/;

/**
 * @use-funnel은 단계를 옮길 때 pushState로 URL을 통째로 갈아치우며 경로를 base로 되돌린다.
 * 경로만 보면 퍼널 2단계부터 인트로로 튕기므로, 퍼널 쿼리가 남아 있으면 퍼널로 판정한다.
 */
const FUNNEL_QUERY_KEY = 'istio-study.step';

/** pushState는 popstate를 띄우지 않는다 — 직접 알린다 */
const ROUTE_CHANGE_EVENT = 'app:routechange';

function readPath(): string {
  const pathname = window.location.pathname;
  const rest = (pathname.startsWith(BASE) ? pathname.slice(BASE.length) : pathname).replace(
    /^\/+|\/+$/g,
    '',
  );
  if (rest === '' && new URLSearchParams(window.location.search).has(FUNNEL_QUERY_KEY)) {
    return 'member';
  }
  return rest;
}

function parsePath(path: string): Route {
  if (path === '') return { name: 'intro' };
  if (path === 'member') return { name: 'funnel' };

  const match = NOTE_PATTERN.exec(path);
  if (match !== null) {
    return { name: 'note', member: decodeURIComponent(match[1]), chapterId: Number(match[2]) };
  }

  // 모르는 주소를 인트로로 흘려보내면 오타 URL이 정상 화면처럼 보인다
  return { name: 'notFound' };
}

/**
 * useSyncExternalStore는 getSnapshot이 매번 새 객체를 주면 무한 리렌더에 빠진다 —
 * 경로가 실제로 바뀔 때만 새 Route를 만들고 그 외에는 같은 참조를 돌려준다.
 */
let cachedPath: string | null = null;
let cachedRoute: Route = { name: 'intro' };

export function readRoute(): Route {
  const path = readPath();
  if (path !== cachedPath) {
    cachedPath = path;
    cachedRoute = parsePath(path);
  }
  return cachedRoute;
}

export function subscribeToRoute(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange);
  window.addEventListener(ROUTE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener('popstate', onChange);
    window.removeEventListener(ROUTE_CHANGE_EVENT, onChange);
  };
}

/** 이동은 history에 쌓이므로 브라우저 뒤로가기가 그대로 동작한다 */
function navigate(path: string): void {
  window.history.pushState(null, '', `${BASE}${path}`);
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

/** 퍼널 쿼리를 함께 지운다 — 남기면 위 readPath가 퍼널로 판정해 인트로가 열리지 않는다 */
export function goToIntro(): void {
  navigate('');
}

export function goToFunnel(): void {
  navigate('member');
}

export function goToNote(member: string, chapterId: number): void {
  navigate(`note/${encodeURIComponent(member)}/${chapterId}`);
}

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
  | { name: 'quiz'; member: string; chapterId: number }
  | { name: 'notFound' };

/** 배포 위치(예: '/istio-in-action/')를 떼어내야 우리 경로만 남는다 */
const BASE = import.meta.env.BASE_URL;

const NOTE_PATTERN = /^note\/([^/]+)\/(\d+)$/;
/** 퀴즈는 노트와 짝이라 주소 모양도 같게 둔다 — 링크를 서로 바꿔 붙여도 헷갈리지 않는다 */
const QUIZ_PATTERN = /^quiz\/([^/]+)\/(\d+)$/;

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

  const note = NOTE_PATTERN.exec(path);
  if (note !== null) {
    const member = decodeMember(note[1]);
    if (member !== null) return { name: 'note', member, chapterId: Number(note[2]) };
  }

  const quiz = QUIZ_PATTERN.exec(path);
  if (quiz !== null) {
    const member = decodeMember(quiz[1]);
    if (member !== null) return { name: 'quiz', member, chapterId: Number(quiz[2]) };
  }

  // 모르는 주소를 인트로로 흘려보내면 오타 URL이 정상 화면처럼 보인다
  return { name: 'notFound' };
}

/**
 * 주소에 담긴 이름을 사람 이름으로 되돌린다. 되돌릴 수 없으면 null.
 *
 * NOTE_PATTERN의 `[^/]+`는 `%zz`처럼 깨진 퍼센트 인코딩도 통과시키는데
 * decodeURIComponent는 거기서 URIError를 던진다. 이 함수는 App이 렌더되는 도중
 * (useSyncExternalStore → readRoute) 불려서 ErrorBoundary 바깥이라,
 * 그대로 두면 잘못 복사된 링크 하나에 화면 전체가 빈 채로 멈춘다.
 */
function decodeMember(raw: string): string | null {
  try {
    return decodeURIComponent(raw);
  } catch {
    return null;
  }
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

/**
 * 이 이동으로 화면을 "처음 여는지"(push) "다시 보는지"(pop).
 * 뒤로/앞으로로 되돌아온 화면은 이미 본 화면이라 등장 애니메이션을 재생하지 않는다 —
 * hooks/useEntranceAnimation.ts가 이 값을 읽는다.
 */
export type NavigationType = 'push' | 'pop';

/** 첫 진입은 아무 화면도 본 적이 없으므로 push다 */
let navigationType: NavigationType = 'push';

/**
 * 방향을 알 수 있는 곳은 전역 history뿐이다. pushState를 부르는 건 아래 navigate만이 아니라
 * @use-funnel도 마찬가지라(단계를 옮길 때 직접 부른다), 여기 한 곳을 감싸야
 * 퍼널 단계 전진까지 "처음 여는 화면"으로 잡힌다.
 */
const pushState = window.history.pushState.bind(window.history);
window.history.pushState = (...args: Parameters<History['pushState']>) => {
  navigationType = 'push';
  pushState(...args);
};

/** 구독자보다 먼저 붙어야 subscribeToRoute로 깨어난 쪽이 갱신된 방향을 본다 */
window.addEventListener('popstate', () => {
  navigationType = 'pop';
});

export function readNavigationType(): NavigationType {
  return navigationType;
}

/** 이동은 history에 쌓이므로 브라우저 뒤로가기가 그대로 동작한다 */
function navigate(path: string, options?: { asBack: true }): void {
  window.history.pushState(null, '', `${BASE}${path}`);
  // 화면 안의 뒤로가기 버튼은 히스토리에 쌓이지만, 사용자에겐 되돌아가는 이동이다
  if (options?.asBack === true) navigationType = 'pop';
  window.dispatchEvent(new Event(ROUTE_CHANGE_EVENT));
}

/** 퍼널 쿼리를 함께 지운다 — 남기면 위 readPath가 퍼널로 판정해 인트로가 열리지 않는다 */
export function goToIntro(): void {
  navigate('');
}

/** 퍼널 첫 단계에는 안에서 돌아갈 곳이 없어 인트로로 나간다 — 방향은 뒤로가기다 */
export function goBackToIntro(): void {
  navigate('', { asBack: true });
}

export function goToFunnel(): void {
  navigate('member');
}

export function goToNote(member: string, chapterId: number): void {
  navigate(`note/${encodeURIComponent(member)}/${chapterId}`);
}

export function goToQuiz(member: string, chapterId: number): void {
  navigate(`quiz/${encodeURIComponent(member)}/${chapterId}`);
}

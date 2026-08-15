import { lazy, useSyncExternalStore, type ReactElement } from 'react';

import { IntroPage } from '../pages/IntroPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { isKnownMember } from '../services/content';
import { goToFunnel, goToIntro, readRoute, type Route, subscribeToRoute } from './route';
import { StudyFunnel } from './StudyFunnel';

/*
 * 노트 화면만 따로 받는다.
 *
 * 마크다운을 HTML로 바꾸는 marked·DOMPurify가 gzip 46KB인데, 정적으로 매달아두면
 * 마크다운을 한 줄도 그리지 않는 인트로·사람 선택·진도 화면까지 전부 받고 시작한다.
 * 기다리는 동안은 App의 Suspense가 세운 LoadingScreen이 자리를 지킨다.
 */
const NotePage = lazy(() =>
  import('../pages/NotePage').then(({ NotePage: Component }) => ({ default: Component })),
);

/* 퀴즈도 노트에서만 들어가는 화면이라 초기 번들에 실을 이유가 없다 */
const QuizPage = lazy(() =>
  import('../pages/QuizPage').then(({ QuizPage: Component }) => ({ default: Component })),
);

/**
 * 주소 하나를 화면 하나로 바꾼다.
 *
 * 화면이 늘어나면 함께 커지는 곳이라 App에서 떼어냈다 — App은 앱을 감싸는 껍데기
 * (모션 설정·에러 경계·로딩 자리)만 맡고, "어떤 주소가 어떤 화면인지"는 여기 한 곳에 모은다.
 *
 * App의 ErrorBoundary 안쪽에서 렌더돼야 한다 — isKnownMember가 members.json 문제로 던질 수 있다.
 */
export function RouteView() {
  const route = useSyncExternalStore(subscribeToRoute, readRoute);
  return renderRoute(route);
}

function renderRoute(route: Route) {
  switch (route.name) {
    case 'intro':
      return <IntroPage onStart={goToFunnel} />;
    case 'funnel':
      return <StudyFunnel />;
    /* 노트·퀴즈는 주소로 직접 들어오는 화면이라 이름을 여기서 한 번 거른다 */
    case 'note':
      return withKnownMember(route.member, () => (
        <NotePage member={route.member} chapterId={route.chapterId} />
      ));
    case 'quiz':
      return withKnownMember(route.member, () => (
        <QuizPage member={route.member} chapterId={route.chapterId} />
      ));
    case 'notFound':
      return <NotFoundPage onHome={goToIntro} />;
  }
}

/** members.json에 없는 이름으로 들어온 주소는 정상 화면처럼 보이면 안 된다 — 404로 보낸다 */
function withKnownMember(member: string, render: () => ReactElement) {
  return isKnownMember(member) ? render() : <NotFoundPage onHome={goToIntro} />;
}

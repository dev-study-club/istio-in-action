import { ErrorBoundary, Suspense } from '@suspensive/react';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { lazy, useSyncExternalStore } from 'react';

import { ErrorScreen, LoadingScreen } from './components/ScreenStates';
import { isKnownMember } from './services/content';
import { IntroPage } from './pages/IntroPage';
/*
 * 노트 화면만 따로 받는다.
 *
 * 마크다운을 HTML로 바꾸는 marked·DOMPurify가 gzip 46KB인데, 정적으로 매달아두면
 * 마크다운을 한 줄도 그리지 않는 인트로·사람 선택·진도 화면까지 전부 받고 시작한다.
 * 기다리는 동안은 바깥 Suspense의 LoadingScreen이 자리를 지킨다.
 */
const NotePage = lazy(() =>
  import('./pages/NotePage').then(({ NotePage: Component }) => ({ default: Component })),
);
import { NotFoundPage } from './pages/NotFoundPage';
import { goToFunnel, goToIntro, readRoute, type Route, subscribeToRoute } from './routes/route';
import { StudyFunnel } from './routes/StudyFunnel';
import { app } from './styles/global.css';

function renderRoute(route: Route) {
  switch (route.name) {
    case 'intro':
      return <IntroPage onStart={goToFunnel} />;
    case 'funnel':
      return <StudyFunnel />;
    case 'note':
      /* 주소로 직접 들어오는 화면이라 이름을 여기서 한 번 거른다.
         members()가 던질 수 있어 ErrorBoundary 안쪽인 이 자리에서 확인한다 */
      return isKnownMember(route.member) ? (
        <NotePage member={route.member} chapterId={route.chapterId} />
      ) : (
        <NotFoundPage onHome={goToIntro} />
      );
    case 'notFound':
      return <NotFoundPage onHome={goToIntro} />;
  }
}

export function App() {
  const route = useSyncExternalStore(subscribeToRoute, readRoute);

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className={app}>
          <ErrorBoundary
            fallback={({ error, reset }) => (
              <ErrorScreen message={error.message} actionLabel="다시 시도" onAction={reset} />
            )}
          >
            <Suspense fallback={<LoadingScreen />}>{renderRoute(route)}</Suspense>
          </ErrorBoundary>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}

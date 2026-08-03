import { ErrorBoundary, Suspense } from '@suspensive/react';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';
import { useSyncExternalStore } from 'react';

import { ErrorScreen, LoadingScreen } from './components/ScreenStates';
import { IntroPage } from './pages/IntroPage';
import { NotePage } from './pages/NotePage';
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
      return <NotePage member={route.member} chapterId={route.chapterId} />;
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

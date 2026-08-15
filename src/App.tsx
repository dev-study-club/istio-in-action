import { ErrorBoundary, Suspense } from '@suspensive/react';
import { domAnimation, LazyMotion, MotionConfig } from 'motion/react';

import { ErrorScreen, LoadingScreen } from './components/ScreenStates';
import { RouteView } from './routes/RouteView';
import { app } from './styles/global.css';

/**
 * 앱을 감싸는 껍데기만 맡는다 — 모션 설정, 에러 경계, 화면을 받는 동안의 로딩 자리.
 * 어떤 주소가 어떤 화면인지는 routes/RouteView가 안다.
 */
export function App() {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <main className={app}>
          <ErrorBoundary
            fallback={({ error, reset }) => (
              <ErrorScreen message={error.message} actionLabel="다시 시도" onAction={reset} />
            )}
          >
            <Suspense fallback={<LoadingScreen />}>
              <RouteView />
            </Suspense>
          </ErrorBoundary>
        </main>
      </MotionConfig>
    </LazyMotion>
  );
}

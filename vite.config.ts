/// <reference types="vitest/config" />
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { defineConfig, type Plugin } from 'vite';

/**
 * GitHub Pages에는 SPA 폴백이 없어 /book으로 직접 들어오면 404.html을 준다 —
 * index.html을 그 이름으로도 내보내 앱이 뜨게 한다.
 *
 * CI 스텝(cp)이 아니라 빌드에 두는 이유: 로컬 `pnpm preview`에서도 같은 폴백을
 * 검증할 수 있고, 셸에 의존하지 않아 어느 OS에서 빌드하든 동일하다.
 */
function spaFallbackHtml(): Plugin {
  return {
    name: 'spa-fallback-html',
    apply: 'build',
    writeBundle(options, bundle) {
      const html = bundle['index.html'];
      if (html?.type !== 'asset' || options.dir === undefined) return;
      writeFileSync(join(options.dir, '404.html'), html.source);
    },
  };
}

/*
 * 경로 라우팅(#) 없이 /book, /note/... 을 쓰려면 절대 경로 base가 필요하다.
 * 상대 경로('./')는 /note/성수/1처럼 깊은 주소에서 자산 경로가 어긋난다.
 * 저장소 이름은 배포 워크플로가 VITE_BASE로 주입하므로 여기에 하드코딩하지 않는다.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  plugins: [vanillaExtractPlugin(), react(), spaFallbackHtml()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});

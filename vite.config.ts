/// <reference types="vitest/config" />
import babel from '@rolldown/plugin-babel';
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

import { defineConfig, type Plugin } from 'vite';

/**
 * GitHub Pages에는 SPA 폴백이 없어 /member로 직접 들어오면 404.html을 준다 —
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

/**
 * 배포 사이트의 절대 주소(끝 슬래시 포함).
 *
 * 링크 미리보기 크롤러(카카오톡·페이스북·X)는 og:image를 자기 서버에서 직접 받아간다 —
 * 문서 기준 상대 경로가 없으니 '/og.png'로는 아무것도 못 가져온다. 그래서 절대 URL이어야 한다.
 * 배포 워크플로가 actions/configure-pages에게 받은 실제 주소를 VITE_SITE_URL로 넣어준다
 * (저장소 이름을 바꾸거나 커스텀 도메인을 붙여도 따라간다).
 * 로컬에는 미리보기를 볼 크롤러가 없으므로 dev 서버 주소로 충분하다.
 */
const SITE_URL = `${(process.env.VITE_SITE_URL ?? 'http://localhost:5173').replace(/\/+$/, '')}/`;

/**
 * index.html의 {{SITE_URL}} 자리를 위 절대 주소로 바꾼다.
 *
 * Vite가 기본 제공하는 %VITE_XXX% 치환을 쓰지 않는 이유: 값이 없으면 그 표기가 문서에
 * 그대로 남아 og:image가 '%VITE_SITE_URL%og.png'가 된다. 여기서 채우면 항상 URL 모양이 된다.
 */
function absoluteSiteUrls(): Plugin {
  return {
    name: 'absolute-site-urls',
    transformIndexHtml: (html) => html.replaceAll('{{SITE_URL}}', SITE_URL),
  };
}

/** 헤더만 읽어 이미지 원본 크기를 구한다 — 이 용도로 의존성을 하나 더 들이지 않는다 */
function readImageSize(buffer: Buffer): [number, number] | null {
  /*
   * AVIF: ISOBMFF 박스 구조라 크기가 meta > iprp > ipco > ispe 안에 들어 있다.
   * 박스를 전부 파고들 것 없이 ispe를 찾아 그 뒤의 폭·높이를 읽는다.
   * 썸네일·알파 같은 보조 이미지도 각자 ispe를 갖지만, 주 이미지 것이 먼저 나온다.
   */
  if (buffer.length > 12 && buffer.toString('ascii', 4, 8) === 'ftyp') {
    const ispe = buffer.indexOf('ispe', 0, 'ascii');
    // 4바이트 version/flags를 건너뛰면 폭·높이가 32비트 빅엔디언으로 이어진다
    if (ispe !== -1 && ispe + 16 <= buffer.length) {
      const width = buffer.readUInt32BE(ispe + 8);
      const height = buffer.readUInt32BE(ispe + 12);
      if (width > 0 && height > 0) return [width, height];
    }
    return null;
  }
  // WebP: RIFF....WEBP + VP8 / VP8L / VP8X 청크
  if (buffer.length > 30 && buffer.toString('ascii', 0, 4) === 'RIFF') {
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8 ') {
      return [buffer.readUInt16LE(26) & 0x3fff, buffer.readUInt16LE(28) & 0x3fff];
    }
    if (chunk === 'VP8L') {
      const bits = buffer.readUInt32LE(21);
      return [(bits & 0x3fff) + 1, ((bits >> 14) & 0x3fff) + 1];
    }
    if (chunk === 'VP8X') {
      return [buffer.readUIntLE(24, 3) + 1, buffer.readUIntLE(27, 3) + 1];
    }
  }
  // PNG: 시그니처 다음이 IHDR이고 폭·높이가 빅엔디언으로 이어진다
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return [buffer.readUInt32BE(16), buffer.readUInt32BE(20)];
  }
  // JPEG: SOF0~SOF15 마커를 찾을 때까지 세그먼트를 건너뛴다
  if (buffer.length > 4 && buffer.readUInt16BE(0) === 0xffd8) {
    let offset = 2;
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) break;
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      if (
        marker >= 0xc0 &&
        marker <= 0xcf &&
        marker !== 0xc4 &&
        marker !== 0xc8 &&
        marker !== 0xcc
      ) {
        return [buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5)];
      }
      offset += 2 + length;
    }
  }
  return null;
}

function* walkFiles(dir: string): Generator<string> {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) yield* walkFiles(full);
    else yield full;
  }
}

const NOTE_IMAGE_SIZES_ID = 'virtual:note-image-sizes';

/**
 * 노트 이미지의 원본 크기를 빌드 시점에 모아 가상 모듈로 넘긴다.
 *
 * 노트 본문은 마크다운이라 글쓴이가 크기를 적지 않는다. 크기 없이 <img>를 그리면
 * 이미지가 로드될 때마다 아래 본문이 밀려 내려가(레이아웃 시프트) 읽던 위치를 잃는다.
 * 파일에 답이 있으니 사람이 적게 하지 말고 빌드가 읽어서 채운다.
 */
function noteImageSizes(): Plugin {
  const resolvedId = `\0${NOTE_IMAGE_SIZES_ID}`;
  return {
    name: 'note-image-sizes',
    resolveId: (id) => (id === NOTE_IMAGE_SIZES_ID ? resolvedId : undefined),
    load(id) {
      if (id !== resolvedId) return;

      const publicDir = join(process.cwd(), 'public');
      const notesDir = join(publicDir, 'images', 'notes');
      const sizes: Record<string, [number, number]> = {};
      for (const file of walkFiles(notesDir)) {
        const size = readImageSize(readFileSync(file));
        if (size !== null) sizes[relative(publicDir, file).split(sep).join('/')] = size;
      }
      return `export default ${JSON.stringify(sizes)};`;
    },
  };
}

/*
 * 경로 라우팅(#) 없이 /member, /note/... 을 쓰려면 절대 경로 base가 필요하다.
 * 상대 경로('./')는 /note/성수/1처럼 깊은 주소에서 자산 경로가 어긋난다.
 * 저장소 이름은 배포 워크플로가 VITE_BASE로 주입하므로 여기에 하드코딩하지 않는다.
 */
export default defineConfig({
  base: process.env.VITE_BASE ?? '/',
  /*
   * React Compiler가 메모이제이션을 대신 넣어준다.
   * 이 저장소는 이미 컴파일러의 정적 분석 규칙(eslint-plugin-react-hooks v7의
   * react-hooks/refs·set-state-in-effect 등)을 통과하고 있어 그대로 켤 수 있다.
   */
  plugins: [
    vanillaExtractPlugin(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    noteImageSizes(),
    absoluteSiteUrls(),
    spaFallbackHtml(),
  ],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});

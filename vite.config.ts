/// <reference types="vitest/config" />
import { vanillaExtractPlugin } from '@vanilla-extract/vite-plugin';
import react from '@vitejs/plugin-react';
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

/** 헤더만 읽어 이미지 원본 크기를 구한다 — 이 용도로 의존성을 하나 더 들이지 않는다 */
function readImageSize(buffer: Buffer): [number, number] | null {
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
  plugins: [vanillaExtractPlugin(), react(), noteImageSizes(), spaFallbackHtml()],
  test: {
    environment: 'node',
    include: ['src/tests/**/*.test.ts'],
  },
});

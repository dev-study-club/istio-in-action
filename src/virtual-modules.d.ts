/**
 * vite.config.ts의 note-image-sizes 플러그인이 빌드 때 만들어 주는 가상 모듈.
 * 키는 public/ 기준 경로(예: images/notes/istio-in-action/1-1.webp), 값은 [폭, 높이]다.
 */
declare module 'virtual:note-image-sizes' {
  const noteImageSizes: Record<string, [number, number] | undefined>;
  export default noteImageSizes;
}

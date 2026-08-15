/**
 * 우리가 쓰는 빌드 시점 환경변수 — vite/client의 ImportMetaEnv에 병합된다.
 * deploy.yml이 시크릿에서 주입하고, 로컬에서는 .env.local(git-ignore)로 넣는다.
 */
interface ImportMetaEnv {
  /** Discord 웹훅 URL — 없으면 퀴즈 성공 알림만 조용히 빠진다 */
  readonly VITE_DISCORD_WEBHOOK_URL?: string;
}

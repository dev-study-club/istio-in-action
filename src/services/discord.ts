/**
 * 퀴즈 전 문제 정답 시 Discord 웹훅으로 성공을 알린다.
 *
 * 정적 사이트(GitHub Pages)라 서버가 없어 웹훅 URL을 빌드 시점 환경변수
 * (VITE_DISCORD_WEBHOOK_URL, deploy.yml에서 시크릿으로 주입)로 받는다.
 * 알림은 보조 기능이다 — 시크릿이 없거나 전송이 실패해도 퀴즈 화면은 그대로 굴러간다.
 *
 * 같은 기기에서 같은 (멤버, 챕터) 성공은 한 번만 보낸다. 다시 풀 때마다 채널에
 * 같은 알림이 쌓이면 축하가 스팸이 된다 — 기록은 celebration.ts처럼 localStorage에 남긴다.
 */

const STORAGE_PREFIX = 'istio-quiz-notified:v1';
const REQUEST_TIMEOUT_MS = 5_000;

export type NotifyResult = 'sent' | 'skipped' | 'failed';

function webhookUrl(): string | null {
  const url: unknown = import.meta.env.VITE_DISCORD_WEBHOOK_URL;
  return typeof url === 'string' && url.length > 0 ? url : null;
}

export async function notifyQuizSuccess(
  member: string,
  chapterTitle: string,
): Promise<NotifyResult> {
  const url = webhookUrl();
  if (url === null) return 'skipped';

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: `🎉 **${member}** 님이 **${chapterTitle}** 퀴즈를 모두 맞혔습니다. 성공하였습니다!`,
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    return response.ok ? 'sent' : 'failed';
  } catch {
    return 'failed';
  }
}

/* 저장소는 보조 수단이다 — 사파리 시크릿·쿠키 차단에서는 접근 자체가 던진다.
   실패는 "기록 없음"으로 흡수한다. 최악의 경우 알림이 한 번 더 갈 뿐이다. */

function storageKey(member: string, chapterId: number): string {
  return `${STORAGE_PREFIX}:${member}:${chapterId}`;
}

export function wasNotified(member: string, chapterId: number): boolean {
  try {
    return window.localStorage.getItem(storageKey(member, chapterId)) !== null;
  } catch {
    return false;
  }
}

export function markNotified(member: string, chapterId: number): void {
  try {
    window.localStorage.setItem(storageKey(member, chapterId), '1');
  } catch {
    /* 기록을 못 남기면 다음 성공에 한 번 더 알림이 갈 뿐이다 */
  }
}

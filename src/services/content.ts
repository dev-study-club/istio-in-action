/**
 * content/ 마크다운을 읽는 유일한 지점 — import.meta.glob으로 빌드 시점에 묶는다.
 *
 * 배포가 push마다 전체 재빌드라 런타임 fetch로 얻을 이점이 없다. 대신 빌드타임에 읽으면
 * 파일 누락·경로 오타가 배포된 화면이 아니라 빌드·테스트에서 드러나고, 챕터 완료 판정을
 * 위해 장마다 두드리던 탐색 요청(멤버당 14회)과 dev 서버 SPA 폴백 우회 코드가 사라진다.
 *
 * 진도·일정은 첫 화면에 바로 필요해 eager, 챕터 노트 본문은 해당 챕터를 열 때만 필요하고
 * 앞으로 계속 늘어날 콘텐츠라 lazy로 나눈다 — 노트가 늘어도 초기 번들이 커지지 않는다.
 *
 * 배치는 책 단위다: content/<책>/{chapters.md, schedule.md, members.json} + content/<책>/<이름>/<장번호>.md
 * 지금은 한 책만 열려 있지만, 경로에 책 이름이 없으면 다음 책을 둘 자리가 없어 이 층을 남겨둔다.
 */

import type { Member } from './types';
import { parseQuiz, type QuizQuestion } from './quiz';

/**
 * Vite는 glob 패턴에 리터럴만 허용해 책 이름을 상수로 끼워 넣을 수 없다.
 * 대신 책 자리를 '*'로 두어 새 책이 생겨도 패턴을 고칠 일이 없게 한다.
 * 지금 열려 있는 스터디는 Istio 하나뿐이라 조회는 이 상수로 좁힌다 —
 * 책이 늘면 이 상수를 함수 파라미터로 바꾸면 되고, 파일 배치는 그대로 쓴다.
 */
const BOOK = 'istio-in-action';

/**
 * 한글 파일명은 환경에 따라 NFC(macOS APFS·Linux)와 NFD로 갈린다.
 * glob 키와 members.json의 이름을 같은 정규화로 맞추지 않으면 파일이 있는데도
 * "없음"으로 조용히 새어나간다 — fetch URL 인코딩이 가려주던 문제라 여기서 명시적으로 막는다.
 */
function normalizeName(name: string): string {
  return name.normalize('NFC');
}

function keyOf(book: string, member: string): string {
  return `${normalizeName(book)}/${normalizeName(member)}`;
}

/** 멤버 목록도 콘텐츠다 — 사람이 늘 때 코드를 열지 않는다 */
const memberFiles = import.meta.glob<readonly Member[]>('/content/*/members.json', {
  import: 'default',
  eager: true,
});

const MEMBERS_PATH_PATTERN = /\/content\/([^/]+)\/members\.json$/;

const membersByBook = new Map<string, readonly Member[]>();
for (const [path, list] of Object.entries(memberFiles)) {
  const match = MEMBERS_PATH_PATTERN.exec(path);
  if (match !== null) membersByBook.set(normalizeName(match[1]), list);
}

const CHAPTERS_PATH_PATTERN = /\/content\/([^/]+)\/chapters\.md$/;
const NOTE_PATH_PATTERN = /\/content\/([^/]+)\/([^/]+)\/(\d+)\.md$/;
const SCHEDULE_PATH_PATTERN = /\/content\/([^/]+)\/schedule\.md$/;
const MEMBER_SCHEDULE_PATH_PATTERN = /\/content\/([^/]+)\/([^/]+)\/schedule\.md$/;

/** 목차는 책에 속한다 — 같은 책을 함께 읽으므로 사람마다 복사할 이유가 없다 */
const chaptersByBook = new Map<string, string>();
for (const [path, markdown] of Object.entries(
  import.meta.glob<string>('/content/*/chapters.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)) {
  const match = CHAPTERS_PATH_PATTERN.exec(path);
  if (match !== null) chaptersByBook.set(normalizeName(match[1]), markdown);
}

const scheduleByBook = new Map<string, string>();
for (const [path, markdown] of Object.entries(
  import.meta.glob<string>('/content/*/schedule.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)) {
  const match = SCHEDULE_PATH_PATTERN.exec(path);
  if (match !== null) scheduleByBook.set(normalizeName(match[1]), markdown);
}

/**
 * 사람별 일정 — 같이 읽어도 속도가 갈려서, 자기 폴더에 schedule.md를 두면 그것이 우선한다.
 * 없으면 책 공용 일정을 그대로 쓴다.
 */
const scheduleByMember = new Map<string, string>();
for (const [path, markdown] of Object.entries(
  import.meta.glob<string>('/content/*/*/schedule.md', {
    query: '?raw',
    import: 'default',
    eager: true,
  }),
)) {
  const match = MEMBER_SCHEDULE_PATH_PATTERN.exec(path);
  if (match !== null) scheduleByMember.set(keyOf(match[1], match[2]), markdown);
}

/*
 * 멤버 폴더에는 노트 말고 개인 일정(schedule.md)도 있다 — 숫자로 시작하는 파일만 집는다.
 * `*.md`로 넓게 잡으면 개인 일정이 여기서도 걸려, 위에서 이미 정적으로 읽은 파일에
 * 쓰이지도 않을 lazy 청크가 하나 더 생긴다 (빌드가 INEFFECTIVE_DYNAMIC_IMPORT로 경고한다).
 */
const noteLoadersByMember = new Map<string, Map<number, () => Promise<string>>>();
for (const [path, load] of Object.entries(
  import.meta.glob<string>('/content/*/*/[0-9]*.md', {
    query: '?raw',
    import: 'default',
  }),
)) {
  const match = NOTE_PATH_PATTERN.exec(path);
  if (match === null) continue;

  const key = keyOf(match[1], match[2]);
  let loaders = noteLoadersByMember.get(key);
  if (!loaders) {
    loaders = new Map();
    noteLoadersByMember.set(key, loaders);
  }
  loaders.set(Number(match[3]), load);
}

/**
 * 멤버별 완료 챕터 집합을 모듈 로드 시 한 번만 만든다.
 * 호출마다 새 Set을 만들면 useMemo 의존성이 매 렌더 바뀌어 파싱이 반복된다.
 */
const EMPTY_CHAPTER_IDS: ReadonlySet<number> = new Set();
const completedByMember = new Map<string, ReadonlySet<number>>(
  [...noteLoadersByMember].map(([key, loaders]) => [key, new Set(loaders.keys())]),
);

/** 노트 본문 프라미스 캐시 — use()가 같은 프라미스를 받아야 렌더마다 다시 로드하지 않는다 */
const notePromises = new Map<string, Promise<string>>();

/**
 * 퀴즈는 챕터에 속한다 — 같은 책을 읽으므로 목차처럼 책 단위로 두고 멤버가 공유한다.
 * 노트처럼 lazy로 나눈다: 해당 챕터를 열 때만 필요하고 앞으로 계속 늘어날 콘텐츠다.
 */
const QUIZ_PATH_PATTERN = /\/content\/([^/]+)\/quiz\/(\d+)\.json$/;

const quizLoadersByBook = new Map<string, Map<number, () => Promise<unknown>>>();
for (const [path, load] of Object.entries(
  import.meta.glob<unknown>('/content/*/quiz/[0-9]*.json', { import: 'default' }),
)) {
  const match = QUIZ_PATH_PATTERN.exec(path);
  if (match === null) continue;

  const book = normalizeName(match[1]);
  let loaders = quizLoadersByBook.get(book);
  if (!loaders) {
    loaders = new Map();
    quizLoadersByBook.set(book, loaders);
  }
  loaders.set(Number(match[2]), load);
}

const quizPromises = new Map<number, Promise<QuizQuestion[]>>();

/** 표시 순서는 members.json의 배열 순서를 그대로 따른다 */
export function members(): readonly Member[] {
  const list = membersByBook.get(normalizeName(BOOK));
  if (list === undefined || list.length === 0) {
    throw new Error(`content/${BOOK}/members.json이 없거나 비어 있습니다.`);
  }
  return list;
}

/**
 * members.json에 있는 이름인지.
 *
 * 노트는 주소를 직접 타고 들어올 수 있어 이름을 그대로 믿으면 안 된다 —
 * 없는 사람으로 들어와도 목차에서 챕터를 찾아버려 "아직 작성한 내용이 없어요"라는
 * 정상 화면처럼 보인다. 오타 URL은 404로 보내야 한다.
 */
export function isKnownMember(name: string): boolean {
  const target = normalizeName(name);
  return members().some((member) => normalizeName(member.name) === target);
}

/** 저장소 안에서 챕터 노트를 두는 경로 (아직 노트가 없을 때 안내에 사용) */
export function chapterNotePath(member: string, chapterId: number): string {
  return `content/${BOOK}/${member}/${chapterId}.md`;
}

/** 목차는 핵심 데이터 — 없으면 그럴싸한 빈 화면 대신 명확히 실패한다 */
export function chaptersMarkdown(): string {
  const markdown = chaptersByBook.get(normalizeName(BOOK));
  if (markdown === undefined) {
    throw new Error(
      `목차를 찾지 못했습니다. content/${BOOK}/chapters.md 파일이 있는지 확인하세요.`,
    );
  }
  return markdown;
}

/** 자기 폴더의 일정이 있으면 그것을, 없으면 책 공용 일정을 쓴다 */
export function scheduleMarkdown(member: string): string {
  const own = scheduleByMember.get(keyOf(BOOK, member));
  if (own !== undefined) return own;

  const shared = scheduleByBook.get(normalizeName(BOOK));
  if (shared === undefined) {
    throw new Error(`content/${BOOK}/schedule.md를 찾지 못했습니다.`);
  }
  return shared;
}

/** 노트 파일이 존재하는 챕터 = 그 멤버가 완료한 챕터 */
export function completedChapterIds(member: string): ReadonlySet<number> {
  return completedByMember.get(keyOf(BOOK, member)) ?? EMPTY_CHAPTER_IDS;
}

/** 퀴즈가 없으면 null — 퀴즈는 보조 콘텐츠라 아직 안 만든 챕터가 있는 것이 정상이다 */
export function chapterQuizPromise(chapterId: number): Promise<QuizQuestion[]> | null {
  const load = quizLoadersByBook.get(normalizeName(BOOK))?.get(chapterId);
  if (!load) return null;

  let promise = quizPromises.get(chapterId);
  if (!promise) {
    promise = load().then(parseQuiz);
    quizPromises.set(chapterId, promise);
  }
  return promise;
}

/** 노트가 없으면 null — 노트는 보조 데이터라 없는 것이 정상이다 */
export function chapterNotePromise(member: string, chapterId: number): Promise<string> | null {
  const memberKey = keyOf(BOOK, member);
  const load = noteLoadersByMember.get(memberKey)?.get(chapterId);
  if (!load) return null;

  const cacheKey = `${memberKey}/${chapterId}`;
  let promise = notePromises.get(cacheKey);
  if (!promise) {
    promise = load();
    notePromises.set(cacheKey, promise);
  }
  return promise;
}

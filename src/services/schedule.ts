export interface StudyQuest {
  start: string;
  end: string;
  chapterIds: readonly [number, number];
  topic: string;
}

const SCHEDULE_ROW_PATTERN =
  /^\|\s*(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d+)\s*,\s*(\d+)\s*\|\s*(.+?)\s*\|$/;

export function parseStudySchedule(markdown: string): readonly StudyQuest[] {
  const schedule = markdown.split('\n').flatMap((line) => {
    const match = line.trim().match(SCHEDULE_ROW_PATTERN);
    if (!match) return [];
    return [
      {
        start: match[1],
        end: match[2],
        chapterIds: [Number(match[3]), Number(match[4])] as const,
        topic: match[5],
      },
    ];
  });

  if (schedule.length === 0) {
    throw new Error('schedule.md에서 일정을 찾지 못했습니다. 날짜와 챕터 표 형식을 확인하세요.');
  }
  return schedule;
}

export function getStudyQuest(schedule: readonly StudyQuest[], now = new Date()): StudyQuest {
  const today = toLocalDate(now);
  const active = [...schedule].reverse().find(({ start, end }) => start <= today && today <= end);

  if (active) return active;
  if (today < schedule[0].start) return schedule[0];
  return schedule.at(-1)!;
}

function toLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

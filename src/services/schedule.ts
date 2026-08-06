export interface StudyQuest {
  start: string;
  end: string;
  /** 그 주에 나갈 챕터. 사람마다 속도가 달라 한 개일 수도, 여러 개일 수도 있다 */
  chapterIds: readonly number[];
  topic: string;
}

const SCHEDULE_ROW_PATTERN =
  /^\|\s*(\d{4}-\d{2}-\d{2})\s*~\s*(\d{4}-\d{2}-\d{2})\s*\|\s*(\d+(?:\s*,\s*\d+)*)\s*\|\s*(.+?)\s*\|$/;

/** 표의 머리글·구분선과 일정 행을 가르는 표식 — 날짜가 있으면 일정을 적으려던 줄로 본다 */
const DATE_HINT = /\d{4}-\d{2}-\d{2}/;

export function parseStudySchedule(markdown: string): readonly StudyQuest[] {
  const schedule = markdown.split('\n').flatMap((line) => {
    const row = line.trim();
    const match = row.match(SCHEDULE_ROW_PATTERN);
    if (!match) {
      /*
       * 날짜가 있는데 형식이 어긋난 줄은 조용히 버리지 않는다.
       * 그 주차가 화면에서 통째로 사라지는데, 에러도 빈 자리도 없어 아무도 눈치채지 못한다.
       */
      if (DATE_HINT.test(row)) {
        throw new Error(
          `schedule.md의 일정 행 형식이 어긋났습니다. "| YYYY-MM-DD ~ YYYY-MM-DD | 1, 2 | 소주제 |" 형태여야 하고 챕터는 쉼표로 하나 이상 적습니다. 문제된 줄: ${row}`,
        );
      }
      return [];
    }
    return [
      {
        start: match[1],
        end: match[2],
        chapterIds: match[3].split(',').map((id) => Number(id.trim())),
        topic: match[4],
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

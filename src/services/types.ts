interface Section {
  /** 파일 내 위치 기반 식별자 — "챕터id-절순번" (절 번호 표기가 없어도 안정적) */
  id: string;
  title: string;
  done: boolean;
}

export interface Chapter {
  /** 문서 등장 순서 기반 1부터 시작 */
  id: number;
  title: string;
  sections: Section[];
}

export interface Member {
  name: string;
  /** public/ 기준 상대 경로 — Slash 23 ID 카드 이미지 (https://toss.im/slash-23) */
  avatar: string;
}

export interface Progress {
  title: string;
  chapters: Chapter[];
}

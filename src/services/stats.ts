import { round } from 'es-toolkit';

import type { Chapter } from './types';

const PERCENT_PRECISION = 0;

export interface ProgressStats {
  done: number;
  total: number;
  percent: number;
}

export function chapterStats(chapter: Chapter): ProgressStats {
  const total = chapter.sections.length;
  const done = chapter.sections.filter((section) => section.done).length;
  return { done, total, percent: toPercent(done, total) };
}

function toPercent(done: number, total: number): number {
  if (total === 0) return 0;
  return round((done / total) * 100, PERCENT_PRECISION);
}

import { describe, expect, test } from 'vitest';

import { applyCheckState, parseProgress } from '../services/progress';

const SAMPLE_MARKDOWN = [
  '# Istio in Action 학습 진도',
  '',
  '## 1장. 서비스 메시 소개',
  '- [x] 1.1 서비스 메시란',
  '- [ ] 1.2 이스티오 소개',
  '',
  '## 2장. 이스티오 첫걸음',
  '- [ ] 2.1 설치하기',
  '- [X] 2.2 배포하기',
  '- [ ] 2.3 라우팅하기',
].join('\n');

describe('parseProgress', () => {
  test('정상 샘플에서 제목·챕터·절·체크 상태를 파싱한다', () => {
    // Act
    const progress = parseProgress(SAMPLE_MARKDOWN);

    // Assert
    expect(progress.title).toBe('Istio in Action 학습 진도');
    expect(progress.chapters).toHaveLength(2);
    expect(progress.chapters[0].sections.map((s) => s.done)).toEqual([true, false]);
    // 대문자 X도 완료로 인식해야 한다
    expect(progress.chapters[1].sections[1].done).toBe(true);
    expect(progress.chapters[1].sections[2].id).toBe('2-2');
  });

  test('체크박스 형식이 아닌 줄은 무시하고 파싱 결과에 영향을 주지 않는다', () => {
    // Arrange — 본문 메모와 깨진 체크박스가 섞인 입력
    const noisy = [
      '## 1장. 소개',
      '메모: 이 챕터는 중요하다',
      '- [x] 1.1 정상 항목',
      '- [] 깨진 체크박스',
      '* [ ] 다른 불릿 기호',
    ].join('\n');

    // Act
    const progress = parseProgress(noisy);

    // Assert
    expect(progress.chapters[0].sections).toHaveLength(1);
    expect(progress.chapters[0].sections[0].title).toBe('1.1 정상 항목');
  });

  test('체크 항목이 하나도 없으면 throw한다 (빈 파일이 진도 0%로 보이면 안 됨)', () => {
    expect(() => parseProgress('')).toThrowError(/체크 항목/);
    expect(() => parseProgress('# 제목만 있는 문서')).toThrowError(/체크 항목/);
  });
});

describe('applyCheckState', () => {
  test('대상 챕터의 체크 상태만 갱신하고 다른 챕터·본문은 보존한다', () => {
    // Act — 2장의 2.1만 완료 처리 (기존 완료였던 2.2는 해제)
    const updated = applyCheckState(SAMPLE_MARKDOWN, 2, ['2-0']);

    // Assert — 1장은 그대로
    expect(updated).toContain('- [x] 1.1 서비스 메시란');
    expect(updated).toContain('- [ ] 1.2 이스티오 소개');
    // 2장은 지정한 상태로
    expect(updated).toContain('- [x] 2.1 설치하기');
    expect(updated).toContain('- [ ] 2.2 배포하기');
    expect(updated).toContain('- [ ] 2.3 라우팅하기');
    // 제목 줄 보존
    expect(updated).toContain('# Istio in Action 학습 진도');
  });

  test('갱신 결과를 다시 파싱하면 지정한 체크 상태와 일치한다 (roundtrip)', () => {
    // Act
    const updated = applyCheckState(SAMPLE_MARKDOWN, 2, ['2-0', '2-2']);
    const reparsed = parseProgress(updated);

    // Assert
    const doneStates = reparsed.chapters[1].sections.map((s) => s.done);
    expect(doneStates, `updated was:\n${updated}`).toEqual([true, false, true]);
  });

  test('체크 상태가 그대로면 원문과 동일한 문자열을 반환한다', () => {
    // Act — 현재 완료 상태(2.2)를 그대로 지정
    const unchanged = applyCheckState(SAMPLE_MARKDOWN, 2, ['2-1']);

    // Assert
    expect(unchanged).toBe(SAMPLE_MARKDOWN);
  });
});

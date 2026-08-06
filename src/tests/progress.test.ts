import { describe, expect, test } from 'vitest';

import { parseProgress } from '../services/progress';

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

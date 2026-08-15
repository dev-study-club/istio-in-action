import { useState } from 'react';

import { BackButton } from '../../components/BackButton';
import { QuizWidget } from '../../components/QuizWidget';
import { ErrorScreen } from '../../components/ScreenStates';
import { goToFunnel, goToNote } from '../../routes/route';
import { hasChapterQuiz } from '../../services/content';
import { useMemberProgress } from '../../hooks/useMemberProgress';
import * as screen from '../../styles/screen.css';
import * as styles from './QuizPage.css';

interface QuizPageProps {
  member: string;
  chapterId: number;
}

/**
 * 챕터 퀴즈 화면 — 노트에서 "문제 풀러 가기"로 들어온다.
 *
 * 듀오링고 레슨처럼 상단은 나가기(뒤로가기) + 진행 바만 두고 본문은 문제 하나로 채운다.
 * 진행 값은 문제를 넘길 때 정해지므로 레슨이 쥐고 여기로 올려준다 — 상단 바와 본문이
 * 서로 다른 문제 번호를 가리키지 않게 하려면 출처가 하나여야 한다.
 */
export function QuizPage({ member, chapterId }: QuizPageProps) {
  const { progress, completedChapters } = useMemberProgress(member);
  const chapter = progress.chapters.find(({ id }) => id === chapterId);
  const [ratio, setRatio] = useState(0);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else goToNote(member, chapterId);
  };

  if (!chapter) {
    return (
      <ErrorScreen
        message="해당 챕터를 찾을 수 없어요. 주소를 다시 확인해주세요."
        actionLabel="학습 진도로"
        onAction={goToFunnel}
      />
    );
  }

  /* 노트를 안 쓴 장이나 문제가 없는 장으로 주소를 타고 들어올 수 있다 */
  const ready = completedChapters.has(chapter.id) && hasChapterQuiz(chapter.id);

  return (
    <div>
      <nav className={screen.nav}>
        <BackButton onClick={goBack} />
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(ratio * 100)}
          aria-label="퀴즈 진행률"
        >
          <div className={styles.progressFill} style={{ width: `${ratio * 100}%` }} />
        </div>
      </nav>
      <h1 className={screen.title}>{chapter.title}</h1>
      {ready ? (
        <QuizWidget
          member={member}
          chapterId={chapter.id}
          chapterTitle={chapter.title}
          onProgress={setRatio}
        />
      ) : (
        <div className={styles.missing}>
          <strong>아직 풀 문제가 없어요</strong>
          <span>
            노트를 먼저 쓰고, content/istio-in-action/quiz/{chapter.id}.json을 만들어주세요.
          </span>
        </div>
      )}
    </div>
  );
}

import { m } from 'motion/react';

import { BackButton } from '../../components/BackButton';
import { ChapterNote } from '../../components/ChapterNote';
import { QuizWidget } from '../../components/QuizWidget';
import { ErrorScreen } from '../../components/ScreenStates';
import { goToFunnel } from '../../routes/route';
import { chapterNotePath } from '../../services/content';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { useMemberProgress } from '../../hooks/useMemberProgress';
import * as screen from '../../styles/screen.css';
import * as styles from './NotePage.css';

const SPOT_ENTER = { opacity: 0, scale: 0.9 };
const SPOT_SETTLED = { opacity: 1, scale: 1 };

interface NotePageProps {
  member: string;
  chapterId: number;
}

/**
 * 챕터 노트 — 퍼널 단계가 아니라 #/note/<이름>/<장>으로 직접 들어올 수 있는 글이다.
 * 뒤로가기는 브라우저 히스토리에 맡기고, 히스토리가 없으면(직접 진입) 퍼널로 보낸다.
 */
export function NotePage({ member, chapterId }: NotePageProps) {
  const { progress, completedChapters } = useMemberProgress(member);
  const animateEntrance = useEntranceAnimation();
  const chapter = progress.chapters.find(({ id }) => id === chapterId);

  const goBack = () => {
    if (window.history.length > 1) window.history.back();
    else goToFunnel();
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

  return (
    <div>
      <nav className={screen.nav}>
        <BackButton onClick={goBack} />
      </nav>
      <h1 className={screen.title}>{chapter.title}</h1>
      {completedChapters.has(chapter.id) ? (
        <>
          <ChapterNote member={member} chapterId={chapter.id} />
          {/* 퀴즈는 노트를 읽은 뒤 푸는 것이라 노트가 있는 챕터에만 세운다 */}
          <QuizWidget member={member} chapterId={chapter.id} chapterTitle={chapter.title} />
        </>
      ) : (
        <div className={styles.emptyNote}>
          {/* 둥실 떠 있게 해 빈 화면이 고장난 것처럼 보이지 않게 한다.
              감속 모션 설정은 App의 MotionConfig(reducedMotion="user")가 알아서 꺼준다 */}
          <m.img
            className={styles.emptyNoteSpot}
            src={`${import.meta.env.BASE_URL}images/not-found.png`}
            alt=""
            width={120}
            height={120}
            decoding="async"
            // 둥실 뜨는 반복 모션은 그대로 두고, 처음 나타나는 페이드인만 건너뛴다
            initial={animateEntrance ? SPOT_ENTER : SPOT_SETTLED}
            animate={{ ...SPOT_SETTLED, y: [0, -8, 0] }}
            transition={{
              opacity: { duration: 0.35, ease: 'easeOut' },
              scale: { duration: 0.35, ease: 'easeOut' },
              y: { duration: 2.6, ease: 'easeInOut', repeat: Infinity },
            }}
          />
          <strong>아직 작성한 내용이 없어요</strong>
          <code>{chapterNotePath(member, chapter.id)}</code>
        </div>
      )}
    </div>
  );
}

import { BackButton } from '../../components/BackButton';
import { ChapterNote } from '../../components/ChapterNote';
import { ErrorScreen } from '../../components/ScreenStates';
import { goToFunnel } from '../../routes/route';
import { chapterNotePath } from '../../services/content';
import { useMemberProgress } from '../../hooks/useMemberProgress';
import * as screen from '../../styles/screen.css';
import * as styles from './NotePage.css';

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
        <ChapterNote member={member} chapterId={chapter.id} />
      ) : (
        <div className={styles.emptyNote}>
          <span className={styles.emptyNoteIcon} aria-hidden>
            ✎
          </span>
          <strong>아직 작성한 내용이 없어요</strong>
          <code>{chapterNotePath(member, chapter.id)}</code>
        </div>
      )}
    </div>
  );
}

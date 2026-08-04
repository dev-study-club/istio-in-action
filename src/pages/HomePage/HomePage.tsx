import { m } from 'motion/react';
import { Fragment, useMemo } from 'react';

import { chapterStats } from '../../services/stats';
import { scheduleMarkdown } from '../../services/content';
import { LottieCharacter } from '../../components/LottieCharacter';
import { ProgressBar } from '../../components/ProgressBar';
import { getStudyQuest, parseStudySchedule } from '../../services/schedule';
import { useEntranceAnimation } from '../../hooks/useEntranceAnimation';
import { useMemberProgress } from '../../hooks/useMemberProgress';
import { BackButton } from '../../components/BackButton';
import * as screen from '../../styles/screen.css';
import * as styles from './HomePage.css';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.04 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: 'easeOut' as const } },
};

const QUEST_ENTER = { opacity: 0, y: 16 };
const QUEST_SETTLED = { opacity: 1, y: 0 };

/*
 * 보물상자와 캐릭터를 중앙에서 서로 반대쪽으로 밀어내는 거리.
 * 상자는 폭 80px(margin-left -40으로 중앙 정렬), 캐릭터 박스는 폭 232px(translateX -50%)다.
 *
 * 상한은 넓은 화면이 아니라 좁은 화면이 정한다. 캐릭터가 중앙에서 차지하는 폭이
 * 오프셋 + 116(박스 절반)이라, iPhone 15(393px)에서 넘치지 않으려면 오프셋이 80 이하여야 한다 —
 * 100이던 값이 19.5px 넘쳐 가로 스크롤을 만들었다. 더 좁은 기기는 studyUnits의 clip이 받는다.
 */
const TREASURE_OFFSET_X = 112;
const CHARACTER_OFFSET_X = 68;

const pathCharacters = [
  'path-character-1',
  'path-character-4',
  'path-character-9',
  'path-character-10',
  'path-character-11',
  'path-character-12',
  'path-character-13',
  'path-character-14',
  'path-character-15',
  'path-character-16',
  'path-character-17',
  'path-character-18',
] as const;

interface HomePageProps {
  member: string;
  onSelectChapter: (chapterId: number) => void;
  onBack: () => void;
}

export function HomePage({ member, onSelectChapter, onBack }: HomePageProps) {
  const { progress } = useMemberProgress(member);
  const animateEntrance = useEntranceAnimation();
  // 일정 원문은 빌드에 고정돼 있어 한 번만 파싱하면 된다
  const schedule = useMemo(() => parseStudySchedule(scheduleMarkdown()), []);
  const quest = getStudyQuest(schedule);
  const questDone = quest.chapterIds.filter((chapterId) => {
    const chapter = progress.chapters.find(({ id }) => id === chapterId);
    if (!chapter) return false;
    const stat = chapterStats(chapter);
    return stat.total > 0 && stat.done === stat.total;
  }).length;
  const activeChapterId = quest.chapterIds.find((chapterId) => {
    const chapter = progress.chapters.find(({ id }) => id === chapterId);
    if (!chapter) return false;
    const stat = chapterStats(chapter);
    return stat.total === 0 || stat.done !== stat.total;
  });
  const questPercent = (questDone / quest.chapterIds.length) * 100;

  return (
    <div>
      <header>
        <nav className={screen.nav}>
          <BackButton onClick={onBack} />
        </nav>
        <h1 className={screen.title}>{progress.title}</h1>
      </header>

      <m.section
        className={styles.questCard}
        aria-label="완독 퀘스트 진행 상황"
        initial={animateEntrance ? QUEST_ENTER : QUEST_SETTLED}
        animate={QUEST_SETTLED}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      >
        <div className={styles.questHeading}>
          <span className={styles.questIcon} aria-hidden>
            <img
              src={`${import.meta.env.BASE_URL}images/goals/quest.svg`}
              alt=""
              width={30}
              height={30}
              decoding="async"
            />
          </span>
          <span className={styles.questEyebrow}>오늘의 퀘스트</span>
          <span className={styles.questReward}>+20 XP</span>
        </div>
        <div className={styles.questBody}>
          <strong className={styles.questTitle}>
            {quest.chapterIds[0]}장 · {quest.chapterIds[1]}장 완료하기
          </strong>
          <span className={styles.questCount}>
            {questDone} / {quest.chapterIds.length}
          </span>
        </div>
        <ProgressBar percent={questPercent} />
        <p className={styles.questRemaining}>
          {quest.start} ~ {quest.end}
        </p>
      </m.section>

      <m.div
        className={styles.studyUnits}
        variants={listVariants}
        initial={animateEntrance ? 'hidden' : 'show'}
        animate="show"
      >
        {schedule.map((unit, unitIndex) => {
          const isCurrentUnit = unit === quest;
          const curveDirection = unitIndex % 2 === 0 ? -1 : 1;
          return (
            <m.section key={`${unit.start}-${unit.chapterIds[0]}`} variants={cardVariants}>
              <header className={styles.unitHeader}>
                <hr className={isCurrentUnit ? styles.dividerCurrent : styles.divider} />
                <h2 className={isCurrentUnit ? styles.topicCurrent : styles.topic}>{unit.topic}</h2>
                <hr className={isCurrentUnit ? styles.dividerCurrent : styles.divider} />
              </header>
              <div className={styles.unitSteps}>
                {unit.chapterIds.map((chapterId, chapterIndex) => {
                  const chapter = progress.chapters.find(({ id }) => id === chapterId);
                  if (!chapter) return null;
                  const stat = chapterStats(chapter);
                  const isChapterDone = stat.total > 0 && stat.done === stat.total;
                  const isActiveChapter = chapter.id === activeChapterId;
                  return (
                    <Fragment key={chapter.id}>
                      <div
                        className={styles.chapterLevel}
                        style={{ marginLeft: curveDirection * -24 }}
                      >
                        <m.button
                          type="button"
                          className={`${styles.chapterNode}${isActiveChapter || isChapterDone ? ` ${styles.chapterNodeActive}` : ''}`}
                          aria-label={`${chapter.id}장 ${chapter.title}${isChapterDone ? ', 완료' : ''}`}
                          whileHover={{ y: 3 }}
                          whileTap={{ y: 6, scale: 0.97 }}
                          onClick={() => onSelectChapter(chapter.id)}
                        >
                          {isChapterDone && (
                            <svg viewBox="0 0 32 24" width={32} height={24} fill="none" aria-hidden>
                              <path
                                d="M3 11.5 12.2 21 29 3"
                                stroke="currentColor"
                                strokeWidth="6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          )}
                          {!isChapterDone && isActiveChapter && (
                            <svg
                              className={styles.nodeIcon}
                              viewBox="0 0 42 34"
                              width={42}
                              height={34}
                              fill="none"
                              aria-hidden
                            >
                              <path
                                d="M18.7521 4.41157C19.6598 2.52948 22.3402 2.52948 23.2479 4.41157L25.8539 9.81517C26.225 10.5847 26.9639 11.1109 27.8125 11.2099L33.7906 11.9076C35.9269 12.1569 36.7684 14.8114 35.1658 16.2459L30.8845 20.0785C30.224 20.6691 29.9267 21.567 30.1035 22.4357L31.2468 28.053C31.6684 30.124 29.4857 31.7487 27.6228 30.7506L22.1786 27.8339C21.4424 27.4395 20.5576 27.4395 19.8214 27.8339L14.3772 30.7506C12.5143 31.7487 10.3316 30.124 10.7532 28.053L11.8965 22.4357C12.0733 21.567 11.776 20.6691 11.1155 20.0785L6.83415 16.2459C5.23162 14.8114 6.07307 12.1569 8.20939 11.9076L14.1875 11.2099C15.0361 11.1109 15.775 10.5847 16.1461 9.81517L18.7521 4.41157Z"
                                fill="currentColor"
                              />
                            </svg>
                          )}
                          {!isChapterDone && !isActiveChapter && (
                            <span aria-hidden>{chapter.id}</span>
                          )}
                        </m.button>
                        {isActiveChapter && (
                          <span className={styles.nodeStart} aria-hidden>
                            <span className={styles.startBody}>시작</span>
                            <span className={styles.startTail}>
                              <span />
                            </span>
                          </span>
                        )}
                      </div>
                      {chapterIndex === 0 && (
                        <div className={styles.pathRewardScene}>
                          <m.span
                            className={styles.treasureNode}
                            style={{ left: `calc(50% + ${curveDirection * TREASURE_OFFSET_X}px)` }}
                            role="img"
                            aria-label="보물 상자"
                            whileHover={{ y: -4, rotate: -3 }}
                          >
                            <img
                              src={`${import.meta.env.BASE_URL}images/path/${isChapterDone ? 'treasure-chest-open.svg' : 'treasure-chest.svg'}`}
                              alt=""
                              width={80}
                              height={90}
                              decoding="async"
                            />
                          </m.span>
                          {pathCharacters[unitIndex] && (
                            <div
                              className={styles.pathCharacterPosition}
                              style={{
                                left: `calc(50% + ${curveDirection * -CHARACTER_OFFSET_X}px)`,
                              }}
                            >
                              <LottieCharacter name={pathCharacters[unitIndex]} />
                            </div>
                          )}
                        </div>
                      )}
                    </Fragment>
                  );
                })}
              </div>
            </m.section>
          );
        })}
      </m.div>
    </div>
  );
}

import { m } from 'motion/react';
import * as screen from '../../styles/screen.css';
import * as styles from './StudySelectPage.css';

const STUDIES = [
  {
    id: 'istio-in-action',
    title: 'istio-in-action',
    description: 'Istio 실전 가이드',
    image: 'images/studies/istio-in-action.jpg',
    available: true,
  },
  {
    id: 'npm-deep-dive',
    title: 'npm-deep-dive',
    description: 'npm을 깊이 이해하는 스터디',
    image: 'images/studies/npm-deep-dive.jpg',
    available: false,
  },
  {
    id: 'core-frontend-ui',
    title: '코어 프론트엔드 UI',
    description: '프론트엔드 UI 핵심 스터디',
    image: 'images/studies/core-frontend-ui.jpg',
    available: false,
  },
] as const;

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: 'easeOut' as const } },
};

interface StudySelectPageProps {
  onSelectIstio: () => void;
}

export function StudySelectPage({ onSelectIstio }: StudySelectPageProps) {
  return (
    <div>
      <h1 className={screen.title}>Dev Study Club</h1>
      <p className={screen.subtitle}>참여할 스터디를 선택해 주세요</p>

      <m.ul className={styles.list} variants={listVariants} initial="hidden" animate="show">
        {STUDIES.map((study) => (
          <m.li key={study.id} variants={cardVariants}>
            <m.button
              type="button"
              className={styles.card}
              disabled={!study.available}
              whileHover={study.available ? { y: -3 } : undefined}
              whileTap={study.available ? { scale: 0.98 } : undefined}
              onClick={study.available ? onSelectIstio : undefined}
            >
              <img
                className={styles.cover}
                src={`${import.meta.env.BASE_URL}${study.image}`}
                alt={`${study.title} 책 표지`}
                width={64}
                height={84}
                loading="lazy"
                decoding="async"
              />
              <span className={styles.content}>
                <span className={styles.cardTitle}>{study.title}</span>
                <span className={styles.description}>{study.description}</span>
              </span>
              {study.available ? (
                <span className={styles.arrow} aria-hidden />
              ) : (
                <span className={styles.status}>준비 중</span>
              )}
            </m.button>
          </m.li>
        ))}
      </m.ul>
    </div>
  );
}

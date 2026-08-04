import { m } from 'motion/react';

import { members } from '../../services/content';
import { BackButton } from '../../components/BackButton';
import * as screen from '../../styles/screen.css';
import * as styles from './MemberSelectPage.css';

const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

interface MemberSelectPageProps {
  onSelect: (member: string) => void;
  onBack: () => void;
}

/**
 * 이 화면은 인트로 다음 첫 화면이라 아바타가 대부분 처음부터 보인다 —
 * lazy로 두면 스크롤도 하기 전에 빈 칸부터 보인다. 접힘 아래에 있을 만한 것만 미룬다.
 */
const EAGER_AVATAR_COUNT = 2;

export function MemberSelectPage({ onSelect, onBack }: MemberSelectPageProps) {
  return (
    <div>
      <nav className={screen.nav}>
        <BackButton onClick={onBack} />
      </nav>
      <h2 className={screen.title}>
        누가
        <br />
        공부하나요?
      </h2>
      <p className={screen.subtitle}>이름을 선택하면 내 진도가 열려요</p>

      <m.ul className={styles.grid} variants={listVariants} initial="hidden" animate="show">
        {members().map((member, index) => (
          <m.li key={member.name} variants={cardVariants}>
            <m.button
              type="button"
              className={styles.card}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onSelect(member.name)}
            >
              <span className={styles.avatarFrame}>
                <img
                  className={styles.avatar}
                  src={`${import.meta.env.BASE_URL}${member.avatar}`}
                  alt=""
                  width={1000}
                  height={562}
                  loading={index < EAGER_AVATAR_COUNT ? 'eager' : 'lazy'}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  decoding="async"
                />
              </span>
              <span className={styles.name}>{member.name}</span>
            </m.button>
          </m.li>
        ))}
      </m.ul>
    </div>
  );
}

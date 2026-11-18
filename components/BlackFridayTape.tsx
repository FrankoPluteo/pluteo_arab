// BLACK FRIDAY WEEK — temporary, see lib/blackFriday.ts for how to remove.
import { isBlackFridayActive } from '@/lib/blackFriday';
import styles from '@/styles/blackfriday.module.css';

type Placement = 'hero' | 'gift' | 'card';

/**
 * Strips of police tape (public/black-friday-tape.svg, repeated along each strip).
 * Absolutely positioned: the parent needs `position: relative` and `overflow: hidden`.
 * Purely decorative, so hidden from screen readers and clicks pass through.
 */
export default function BlackFridayTape({ placement }: { placement: Placement }) {
  if (!isBlackFridayActive()) return null;

  const strips = placement === 'card' ? 1 : placement === 'hero' ? 2 : 3;

  return (
    <div className={`${styles.layer} ${styles[placement]}`} aria-hidden="true">
      {Array.from({ length: strips }, (_, i) => (
        <span key={i} className={styles.tape} />
      ))}
    </div>
  );
}

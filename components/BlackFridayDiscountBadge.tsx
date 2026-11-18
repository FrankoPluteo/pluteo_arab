// BLACK FRIDAY WEEK — temporary, see lib/blackFriday.ts for how to remove.
import { isBlackFridayActive } from '@/lib/blackFriday';
import styles from '@/styles/blackfriday.module.css';

interface Props {
  price: number;
  discountAmount: number;
  /** 'card' for product cards, 'detail' for the product page photo. */
  size: 'card' | 'detail';
}

/**
 * Round black sticker with a thin white inner ring and the discount, e.g. "30%",
 * in the bottom-left corner of a product photo. The parent needs `position: relative`.
 */
export default function BlackFridayDiscountBadge({ price, discountAmount, size }: Props) {
  if (!isBlackFridayActive() || discountAmount <= 0 || price <= 0) return null;

  const percent = Math.round((discountAmount / price) * 100);
  if (percent <= 0) return null;

  return (
    <div className={`${styles.discountBadge} ${styles[`discountBadge_${size}`]}`}>
      <span className={styles.discountRing} aria-hidden="true" />
      <span className={styles.discountText}>
        <span className="sr-only">Popust </span>
        {percent}%
      </span>
    </div>
  );
}

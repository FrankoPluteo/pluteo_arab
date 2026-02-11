'use client';

import styles from '@/styles/starrating.module.css';

interface StarRatingProps {
  rating: number;
  size?: 'small' | 'medium';
}

export default function StarRating({ rating, size = 'medium' }: StarRatingProps) {
  return (
    <span className={`${styles.stars} ${size === 'small' ? styles.small : ''}`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? styles.filled : styles.empty}
        >
          &#9733;
        </span>
      ))}
    </span>
  );
}

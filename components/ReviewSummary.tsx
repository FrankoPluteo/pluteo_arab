'use client';

import { useState, useEffect, useCallback } from 'react';
import StarRating from './StarRating';
import ReviewForm from './ReviewForm';
import { useLanguage } from '@/lib/languageContext';
import styles from '@/styles/reviewsummary.module.css';

interface ReviewSummaryProps {
  productId: string;
}

export default function ReviewSummary({ productId }: ReviewSummaryProps) {
  const [averageRating, setAverageRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const { t } = useLanguage();

  const fetchAggregates = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`);
      if (res.ok) {
        const data = await res.json();
        setAverageRating(data.averageRating);
        setReviewCount(data.reviewCount);
      }
    } catch {
      // silently fail
    }
  }, [productId]);

  useEffect(() => {
    fetchAggregates();
  }, [fetchAggregates]);

  return (
    <div className={styles.reviewSummary}>
      <h3 className={styles.heading}>{t.reviews.title}</h3>

      <div className={styles.aggregate}>
        <StarRating rating={averageRating} />
        <span className={styles.ratingText}>
          {averageRating > 0 ? averageRating.toFixed(1) : '0'} {t.reviews.outOf5}
        </span>
        <span className={styles.countText}>
          ({reviewCount} {t.reviews.reviewCountText(reviewCount)})
        </span>
      </div>

      <ReviewForm productId={productId} onReviewSubmitted={fetchAggregates} />
    </div>
  );
}

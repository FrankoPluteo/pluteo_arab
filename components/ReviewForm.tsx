'use client';

import { useState } from 'react';
import styles from '@/styles/reviewform.module.css';

interface ReviewFormProps {
  productId: string;
  onReviewSubmitted: () => void;
}

export default function ReviewForm({ productId, onReviewSubmitted }: ReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [reviewerName, setReviewerName] = useState('');
  const [reviewerEmail, setReviewerEmail] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (rating === 0) {
      setError('Please select a rating.');
      return;
    }

    if (!reviewerEmail) {
      setError('Please enter your email.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, reviewerName, reviewerEmail, rating, title, comment }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to submit review.');
        return;
      }

      setSubmitted(true);
      onReviewSubmitted();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <div className={styles.successMessage}>Thank you for your review!</div>;
  }

  if (!isOpen) {
    return (
      <button className={styles.writeReviewBtn} onClick={() => setIsOpen(true)}>
        WRITE A REVIEW
      </button>
    );
  }

  return (
    <form className={styles.reviewForm} onSubmit={handleSubmit}>
      <h4 className={styles.formTitle}>Write a Review</h4>

      <div className={styles.fieldGroup}>
        <label>Rating *</label>
        <div className={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span
              key={star}
              className={`${styles.ratingStar} ${star <= (hoveredRating || rating) ? styles.ratingStarActive : ''}`}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
            >
              &#9733;
            </span>
          ))}
        </div>
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="reviewerEmail">Email *</label>
        <input
          id="reviewerEmail"
          type="email"
          required
          value={reviewerEmail}
          onChange={(e) => setReviewerEmail(e.target.value)}
          placeholder="Your email (not displayed publicly)"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="reviewerName">Name</label>
        <input
          id="reviewerName"
          type="text"
          maxLength={100}
          value={reviewerName}
          onChange={(e) => setReviewerName(e.target.value)}
          placeholder="Your name (optional)"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="reviewTitle">Title</label>
        <input
          id="reviewTitle"
          type="text"
          maxLength={200}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Summary of your review (optional)"
        />
      </div>

      <div className={styles.fieldGroup}>
        <label htmlFor="reviewComment">Review</label>
        <textarea
          id="reviewComment"
          maxLength={2000}
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Tell others about your experience (optional)"
        />
      </div>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.formActions}>
        <button type="button" className={styles.cancelBtn} onClick={() => setIsOpen(false)}>
          Cancel
        </button>
        <button type="submit" className={styles.submitBtn} disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </form>
  );
}

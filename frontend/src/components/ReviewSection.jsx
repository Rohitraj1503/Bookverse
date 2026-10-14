import React, { useState, useEffect, useCallback } from 'react';
import reviewService from '../services/reviewService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ReviewSection = ({ bookId, currentBookRating, totalReviewCount }) => {
  const { user, isLoggedIn } = useAuth();
  const toast = useToast();

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'highest' | 'lowest' | 'helpful'

  // New review form state
  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [formTitle, setFormTitle] = useState('');
  const [formBody, setFormBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [votedHelpful, setVotedHelpful] = useState({});

  const fetchReviews = useCallback(async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      const [reviewData, statsData] = await Promise.allSettled([
        reviewService.getByBookId(bookId),
        reviewService.getRatingStats(bookId),
      ]);

      if (reviewData.status === 'fulfilled' && Array.isArray(reviewData.value)) {
        setReviews(reviewData.value);
      }
      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value);
      }
    } catch (err) {
      console.warn('Failed to load reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [bookId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!isLoggedIn) {
      toast.error('Please login to post a review');
      return;
    }
    if (!formRating) {
      toast.warning('Please select a star rating');
      return;
    }
    if (!formTitle.trim() || !formBody.trim()) {
      toast.warning('Please provide a title and review text');
      return;
    }

    try {
      setSubmitting(true);
      await reviewService.createReview({
        bookId: parseInt(bookId),
        userId: user.id,
        rating: formRating,
        title: formTitle.trim(),
        body: formBody.trim(),
      });
      toast.success('Your review has been published!');
      setFormTitle('');
      setFormBody('');
      setFormRating(5);
      setShowForm(false);
      fetchReviews();
    } catch (err) {
      console.error('Failed to submit review:', err);
      toast.error(err.response?.data?.message || 'Failed to submit review. You may have already reviewed this book.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (votedHelpful[reviewId]) {
      toast.info('You have already marked this review as helpful');
      return;
    }
    try {
      await reviewService.markHelpful(reviewId);
      setVotedHelpful((prev) => ({ ...prev, [reviewId]: true }));
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: (r.helpfulCount || 0) + 1 } : r))
      );
      toast.success('Thank you for your feedback!');
    } catch (err) {
      toast.error('Could not update helpful vote');
    }
  };

  const handleReport = async (reviewId) => {
    try {
      await reviewService.reportReview(reviewId);
      toast.info('Review reported for moderation');
    } catch (err) {
      toast.error('Could not report review');
    }
  };

  // Sort reviews
  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    }
    if (sortBy === 'highest') {
      return (b.rating || 0) - (a.rating || 0);
    }
    if (sortBy === 'lowest') {
      return (a.rating || 0) - (b.rating || 0);
    }
    if (sortBy === 'helpful') {
      return (b.helpfulCount || 0) - (a.helpfulCount || 0);
    }
    return 0;
  });

  const renderStars = (rating, interactive = false) => {
    const stars = [];
    const val = interactive ? (hoverRating || formRating) : Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span
          key={i}
          className={`star ${i <= val ? '' : 'empty'}`}
          style={{
            cursor: interactive ? 'pointer' : 'default',
            fontSize: interactive ? '1.8rem' : '1.1rem',
            transition: 'transform 0.15s ease',
            color: i <= val ? '#f59e0b' : 'var(--border-color)',
          }}
          onMouseEnter={interactive ? () => setHoverRating(i) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          onClick={interactive ? () => setFormRating(i) : undefined}
        >
          ★
        </span>
      );
    }
    return <div className="stars" style={{ display: 'flex', gap: '3px' }}>{stars}</div>;
  };

  // Computed summary
  const averageRating = stats?.averageRating ?? (currentBookRating || 4.5);
  const totalCount = stats?.totalReviews ?? (reviews.length || totalReviewCount || 0);
  const dist = stats?.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

  return (
    <div className="reviews-section" style={{ marginTop: '50px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, margin: 0 }}>
            Customer <span className="text-gradient">Reviews & Ratings</span>
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Real opinions from verified book readers
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => {
            if (!isLoggedIn) {
              toast.info('Please log in to leave a review');
              return;
            }
            setShowForm((prev) => !prev);
          }}
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span>✍️</span> {showForm ? 'Cancel Review' : 'Write a Review'}
        </button>
      </div>

      {/* Review Submission Form */}
      {showForm && (
        <form
          onSubmit={handleSubmitReview}
          className="animate-fade-up"
          style={{
            background: 'var(--card-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            padding: '24px',
            marginBottom: '32px',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
          }}
        >
          <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 600 }}>Share Your Experience</h3>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
              YOUR RATING *
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {renderStars(formRating, true)}
              <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                {hoverRating || formRating} of 5 Stars
              </span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              HEADLINE / TITLE *
            </label>
            <input
              type="text"
              placeholder="e.g. Masterpiece of modern storytelling"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600 }}>
              DETAILED REVIEW *
            </label>
            <textarea
              rows={4}
              placeholder="What did you like or dislike? How was the writing style, plot, or key takeaways?"
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--input-bg, rgba(255,255,255,0.05))',
                color: 'var(--text-primary)',
                fontSize: '0.95rem',
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Post Review'}
            </button>
          </div>
        </form>
      )}

      {/* Ratings Overview Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          background: 'var(--card-bg)',
          border: '1px solid var(--border-color)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px',
        }}
      >
        {/* Average Score */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '10px' }}>
          <div style={{ fontSize: '3.6rem', fontWeight: 800, lineHeight: 1, color: 'var(--text-primary)' }}>
            {Number(averageRating).toFixed(1)}
          </div>
          <div style={{ margin: '8px 0' }}>{renderStars(averageRating)}</div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Based on {totalCount.toLocaleString()} {totalCount === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Rating Breakdown Bars */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
          {[5, 4, 3, 2, 1].map((star) => {
            const count = dist[star] || 0;
            const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : star >= 4 ? (star === 5 ? 70 : 20) : 5;
            return (
              <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.85rem' }}>
                <span style={{ width: '45px', color: 'var(--text-muted)' }}>{star} ★</span>
                <div
                  style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    background: 'var(--border-color)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #f59e0b, #fbbf24)',
                      borderRadius: '4px',
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ width: '38px', textAlign: 'right', color: 'var(--text-muted)' }}>
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Sorting Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>
          {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
        </h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <label style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--card-bg)',
              color: 'var(--text-primary)',
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            <option value="newest">Most Recent</option>
            <option value="highest">Highest Rating</option>
            <option value="lowest">Lowest Rating</option>
            <option value="helpful">Most Helpful</option>
          </select>
        </div>
      </div>

      {/* Review List */}
      {loading ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Loading reviews...
        </div>
      ) : sortedReviews.length === 0 ? (
        <div
          style={{
            padding: '40px 20px',
            textAlign: 'center',
            background: 'var(--card-bg)',
            border: '1px dashed var(--border-color)',
            borderRadius: '16px',
            color: 'var(--text-muted)',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>💬</div>
          <p style={{ fontWeight: 500, margin: '0 0 6px 0' }}>No reviews yet for this title.</p>
          <p style={{ fontSize: '0.85rem', margin: 0 }}>Be the first reader to share your thoughts!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedReviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--border-color)',
                borderRadius: '14px',
                padding: '20px',
                transition: 'border-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--primary, #6366f1), var(--secondary, #a855f7))',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}
                  >
                    {(rev.user?.fullName || 'Reader').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {rev.user?.fullName || 'Verified Reader'}
                      {rev.verifiedPurchase && (
                        <span
                          style={{
                            fontSize: '0.72rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            fontWeight: 600,
                          }}
                        >
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {rev.createdAt ? new Date(rev.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'Recently'}
                    </div>
                  </div>
                </div>
                <div>{renderStars(rev.rating)}</div>
              </div>

              {rev.title && (
                <h4 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '8px 0 6px 0', color: 'var(--text-primary)' }}>
                  {rev.title}
                </h4>
              )}

              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, fontSize: '0.92rem', margin: '0 0 14px 0' }}>
                {rev.body}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-color)', paddingTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => handleHelpful(rev.id)}
                  style={{
                    background: 'transparent',
                    border: '1px solid var(--border-color)',
                    borderRadius: '20px',
                    padding: '4px 12px',
                    color: votedHelpful[rev.id] ? '#10b981' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                  }}
                >
                  <span>👍</span>
                  <span>Helpful ({rev.helpfulCount || 0})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReport(rev.id)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.78rem',
                  }}
                  title="Report inappropriate review"
                >
                  🚩 Report
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;

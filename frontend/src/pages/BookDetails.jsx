import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import BookCard from '../components/BookCard';
import BookCover from '../components/BookCover';
import ReviewSection from '../components/ReviewSection';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getDiscountPercent } from '../utils/formatters';

const BookDetails = () => {
  const { id } = useParams();
  const [book, setBook] = useState(null);
  const [relatedBooks, setRelatedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQty, setSelectedQty] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [isDescExpanded, setIsDescExpanded] = useState(false);

  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;
    async function loadBook() {
      try {
        setLoading(true);
        setSelectedQty(1);
        setIsDescExpanded(false);
        const bookData = await bookService.getById(id);
        if (!isMounted) return;

        setBook(bookData);
        if (bookData) {
          document.title = `${bookData.title} — BookVerse`;

          // Track Recently Viewed Books
          try {
            const rawRecent = localStorage.getItem('bv_recently_viewed');
            const recent = rawRecent ? JSON.parse(rawRecent) : [];
            const filtered = recent.filter((b) => b.id !== bookData.id);
            filtered.unshift({
              id: bookData.id,
              title: bookData.title,
              author: bookData.author,
              price: bookData.price,
              cover: bookData.cover,
              category: bookData.category,
              rating: bookData.rating,
            });
            localStorage.setItem('bv_recently_viewed', JSON.stringify(filtered.slice(0, 10)));
          } catch (e) {
            console.warn('Could not save recently viewed book:', e);
          }

          // Load related books
          if (bookData.categoryId) {
            const related = await bookService.getByCategory(bookData.categoryId);
            if (isMounted) {
              setRelatedBooks(
                related.filter((b) => b.id !== bookData.id).slice(0, 4)
              );
            }
          }
        }
      } catch (err) {
        console.error('Failed to load book details:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadBook();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleQtyChange = (delta) => {
    setSelectedQty((prev) => Math.max(1, Math.min(10, prev + delta)));
  };

  const handleAddToCart = () => {
    if (!book) return;
    addToCart(book.id, selectedQty, true);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleWishlist = () => {
    if (!book) return;
    toggleWishlist(book);
  };

  const renderStars = (rating) => {
    const stars = [];
    const rounded = Math.round(Number(rating) || 0);
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={`star ${i <= rounded ? '' : 'empty'}`}>
          ★
        </span>
      );
    }
    return <div className="stars">{stars}</div>;
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '60px 20px', minHeight: '60vh' }}>
        <div className="loading-shimmer" style={{ height: '400px', borderRadius: '16px' }}></div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '60vh' }}>
        <div className="empty-state">
          <div className="empty-icon">📖</div>
          <h3>Book not found</h3>
          <p>The book you're looking for doesn't exist.</p>
          <Link to="/books" className="btn btn-primary" style={{ marginTop: '16px' }}>
            Browse Books
          </Link>
        </div>
      </div>
    );
  }

  const inWishlist = isInWishlist(book.id);
  const discount = getDiscountPercent(book.originalPrice, book.price);
  const stockClass =
    book.stock > 20 ? 'in-stock' : book.stock > 0 ? 'low-stock' : 'out-of-stock';
  const stockText =
    book.stock > 20
      ? 'In Stock'
      : book.stock > 0
      ? `Only ${book.stock} left`
      : 'Out of Stock';

  const desc = book.description || 'No detailed synopsis provided for this edition.';
  const isLongDesc = desc.length > 220;
  const isRtl = ['arabic', 'persian', 'hebrew', 'urdu'].includes(book.language?.toLowerCase()) ||
                book.readingDirection?.toLowerCase().includes('right-to-left');

  return (
    <div className="container" style={{ paddingBottom: '60px' }}>
      <div className="book-detail-layout" id="bookDetail">
        {/* Book Cover Image */}
        <div className="book-detail-img animate-fade-up">
          <div className="img-wrapper" style={{ minHeight: '440px', padding: '24px' }}>
            <div style={{ width: '280px', height: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookCover
                src={book.coverUrl || book.cover}
                title={book.title}
                author={book.author}
                category={book.category}
                language={book.language}
                fit="contain"
                size="lg"
              />
            </div>
          </div>
        </div>

        {/* Book Info */}
        <div className="book-detail-info animate-fade-up stagger-2">
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
            <span className="book-category">{book.category}</span>
            <span className="badge badge-purple" style={{ fontSize: '0.75rem' }}>{book.language || 'English'}</span>
            <span className="badge badge-secondary" style={{ fontSize: '0.75rem' }}>{book.format || 'Paperback'}</span>
            {isRtl && <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>📖 RTL / Right-to-Left</span>}
            {book.isBestseller && <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>🏆 Bestseller</span>}
            {book.isNewArrival && <span className="badge badge-success" style={{ fontSize: '0.75rem' }}>✨ New Arrival</span>}
          </div>

          <h1 dir={isRtl ? 'rtl' : 'ltr'} style={isRtl ? { textAlign: 'right' } : {}}>{book.title}</h1>
          {book.subtitle && (
            <p dir={isRtl ? 'rtl' : 'ltr'} style={{ fontStyle: 'italic', color: 'var(--text-muted)', fontSize: '1rem', marginTop: '-4px', marginBottom: '8px', textAlign: isRtl ? 'right' : 'left' }}>
              {book.subtitle}
            </p>
          )}

          <p className="book-author">
            by <strong>{book.author}</strong>
            {book.illustrator && <span> • Illustrated by <em>{book.illustrator}</em></span>}
          </p>

          <div className="book-rating-row">
            {renderStars(book.rating)}
            <span style={{ fontWeight: 600 }}>{Number(book.rating || 0).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              ({(book.reviews || 0).toLocaleString()} reviews)
            </span>
          </div>

          <div className="book-price">
            {formatPrice(book.price)}
            {discount > 0 && (
              <>
                <span className="original">{formatPrice(book.originalPrice)}</span>
                <span className="discount-badge">-{discount}% OFF</span>
              </>
            )}
          </div>

          <div className={`stock-indicator ${stockClass}`}>
            <span className="dot"></span>
            <span>{stockText}</span>
          </div>

          {/* Short Teaser if available */}
          {book.shortDescription && (
            <div style={{ padding: '10px 14px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: '8px', borderLeft: '3px solid var(--primary, #6366f1)', margin: '14px 0', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {book.shortDescription}
            </div>
          )}

          {/* Expandable Description */}
          <div style={{ margin: '18px 0' }}>
            <p
              dir={isRtl ? 'rtl' : 'ltr'}
              style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.8,
                margin: 0,
                textAlign: isRtl ? 'right' : 'left',
              }}
            >
              {isLongDesc && !isDescExpanded ? `${desc.slice(0, 220)}...` : desc}
            </p>
            {isLongDesc && (
              <button
                type="button"
                onClick={() => setIsDescExpanded(!isDescExpanded)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--primary, #6366f1)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  padding: '4px 0',
                  marginTop: '4px',
                }}
              >
                {isDescExpanded ? 'Show less ▲' : 'Read more ▼'}
              </button>
            )}
          </div>

          {/* Comic & Manga Specifications (if present) */}
          {(book.seriesName || book.volumeNumber || book.issueNumber || book.artist || book.readingDirection) && (
            <div
              style={{
                marginBottom: '16px',
                padding: '12px 16px',
                borderRadius: '8px',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.2)',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '10px',
                fontSize: '0.82rem',
              }}
            >
              {book.seriesName && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Series</span>
                  <strong>{book.seriesName}</strong>
                </div>
              )}
              {book.volumeNumber && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Volume</span>
                  <strong>{book.volumeNumber}</strong>
                </div>
              )}
              {book.issueNumber && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Issue</span>
                  <strong>{book.issueNumber}</strong>
                </div>
              )}
              {book.artist && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Artist</span>
                  <strong>{book.artist}</strong>
                </div>
              )}
              {book.readingDirection && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Reading Direction</span>
                  <strong>{book.readingDirection}</strong>
                </div>
              )}
              {book.ageRecommendation && (
                <div>
                  <span style={{ color: 'var(--text-muted)', display: 'block' }}>Age Rating</span>
                  <strong>{book.ageRecommendation}</strong>
                </div>
              )}
            </div>
          )}

          {/* Book Meta & Specifications */}
          <div className="book-meta" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
            <div className="meta-item">
              <div className="label">Pages</div>
              <div className="value">{book.pages || 320}</div>
            </div>
            <div className="meta-item">
              <div className="label">Publisher</div>
              <div className="value">{book.publisher || 'BookVerse'}</div>
            </div>
            <div className="meta-item">
              <div className="label">Year</div>
              <div className="value">{book.year || 2024}</div>
            </div>
            <div className="meta-item">
              <div className="label">Language</div>
              <div className="value">{book.language || 'English'}</div>
            </div>
            <div className="meta-item">
              <div className="label">Format</div>
              <div className="value">{book.format || 'Paperback'}</div>
            </div>
            {book.isbn && (
              <div className="meta-item">
                <div className="label">ISBN</div>
                <div className="value" style={{ fontSize: '0.82rem' }}>{book.isbn}</div>
              </div>
            )}
          </div>

          {/* Add to Cart Actions */}
          <div className="add-to-cart-section" style={{ marginTop: '24px' }}>
            <div className="qty-selector">
              <button onClick={() => handleQtyChange(-1)} disabled={selectedQty <= 1}>
                −
              </button>
              <span className="qty-value" id="qtyValue">
                {selectedQty}
              </span>
              <button onClick={() => handleQtyChange(1)} disabled={selectedQty >= 10}>
                +
              </button>
            </div>
            <button
              className="btn btn-primary btn-lg"
              id="addToCartBtn"
              onClick={handleAddToCart}
              disabled={book.stock === 0}
              style={{
                flex: 1,
                background: isAdded ? 'linear-gradient(135deg, #10b981, #059669)' : undefined,
              }}
            >
              {isAdded ? '✓ Added to Cart!' : `🛒 Add to Cart — ${formatPrice(book.price * selectedQty)}`}
            </button>
          </div>

          {/* Wishlist Button with Connected State */}
          <button
            className={`btn ${inWishlist ? 'btn-primary' : 'btn-secondary'}`}
            style={{
              width: '100%',
              marginTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: inWishlist ? 'rgba(244, 63, 94, 0.15)' : undefined,
              borderColor: inWishlist ? '#f43f5e' : undefined,
              color: inWishlist ? '#f43f5e' : undefined,
            }}
            onClick={handleWishlist}
          >
            <span>{inWishlist ? '❤️' : '♡'}</span>
            <span>{inWishlist ? 'Saved in Wishlist (Click to remove)' : 'Add to Wishlist'}</span>
          </button>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <ReviewSection
        bookId={book.id}
        currentBookRating={book.rating}
        totalReviewCount={book.reviews}
      />

      {/* Related Books */}
      <div className="section" style={{ paddingTop: '50px' }}>
        <div className="section-header">
          <h2>
            📖 You May Also <span className="text-gradient">Like</span>
          </h2>
        </div>
        {relatedBooks.length > 0 ? (
          <div className="book-grid" id="relatedBooks">
            {relatedBooks.map((relBook) => (
              <BookCard key={relBook.id} book={relBook} />
            ))}
          </div>
        ) : (
          <p style={{ color: 'var(--text-muted)' }}>No related books found</p>
        )}
      </div>
    </div>
  );
};

export default BookDetails;

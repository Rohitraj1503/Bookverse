import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, getDiscountPercent } from '../utils/formatters';
import BookCover from './BookCover';

const BookCard = ({ book }) => {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const toast = useToast();
  const [isAdded, setIsAdded] = useState(false);

  if (!book) return null;

  const inWishlist = isInWishlist(book.id);
  const discount = getDiscountPercent(book.originalPrice, book.price);

  const handleCardClick = () => {
    navigate(`/books/${book.id}`);
  };

  const handleAddToCart = (e) => {
    e.stopPropagation();
    addToCart(book.id, 1, true);
    setIsAdded(true);
    setTimeout(() => {
      setIsAdded(false);
    }, 1500);
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
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

  return (
    <div
      className="book-card animate-fade-up"
      data-id={book.id}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', height: '100%' }}
    >
      <div className="card-img" style={{ position: 'relative', height: '280px', padding: '14px' }}>
        <BookCover
          src={book.coverUrl || book.cover}
          title={book.title}
          author={book.author}
          category={book.category}
          language={book.language}
          fit="contain"
          size="md"
        />
        {discount > 0 && <span className="card-badge">-{discount}%</span>}
        <div
          className={`card-wishlist ${inWishlist ? 'active' : ''}`}
          onClick={handleWishlist}
          title={inWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          style={inWishlist ? { color: '#f43f5e', transform: 'scale(1.1)' } : {}}
        >
          {inWishlist ? '❤️' : '♡'}
        </div>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: '18px 20px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', minHeight: '20px' }}>
          <span className="card-category">{book.category || 'General'}</span>
          {book.language && book.language !== 'English' && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 6px',
                borderRadius: '4px',
                background: 'rgba(240, 185, 11, 0.12)',
                color: '#F0B90B',
                fontWeight: 600,
              }}
            >
              {book.language}
            </span>
          )}
        </div>
        {book.seriesName ? (
          <span style={{ display: 'block', fontSize: '0.72rem', color: '#F0B90B', marginBottom: '2px' }}>
            {book.seriesName} {book.volumeNumber ? `Vol. ${book.volumeNumber}` : ''}
          </span>
        ) : null}
        <h3
          className="card-title"
          title={book.title}
          style={{
            minHeight: '2.6em',
            lineHeight: '1.3em',
            margin: '4px 0 6px',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            whiteSpace: 'normal',
          }}
        >
          {book.title}
        </h3>
        <p
          className="card-author"
          style={{
            margin: '0 0 10px 0',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          by {book.author}
        </p>
        <div className="card-footer" style={{ marginTop: 'auto', paddingTop: '10px' }}>
          <span className="card-price">
            {formatPrice(book.price)}
            {discount > 0 && (
              <span className="original">{formatPrice(book.originalPrice)}</span>
            )}
          </span>
          <span className="card-rating">
            {renderStars(book.rating)} {Number(book.rating || 0).toFixed(1)}
          </span>
        </div>
        <button
          className={`add-to-cart-btn ${isAdded ? 'added' : ''}`}
          onClick={handleAddToCart}
          style={{ marginTop: '12px' }}
        >
          {isAdded ? '✓ Added!' : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
};

export default BookCard;

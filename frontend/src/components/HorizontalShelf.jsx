import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from './BookCover';
import { formatPrice } from '../utils/formatters';

const HorizontalShelf = ({
  title = 'Trends',
  seeMoreLink = '/books?sort=bestseller',
  books = [],
}) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  if (!books || books.length === 0) return null;

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  return (
    <section className="horizontal-shelf-wrap">
      <div className="container">
        <div className="editorial-section-header">
          <h2 className="editorial-section-title">{title}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div className="shelf-controls">
              <button
                className="shelf-arrow-btn"
                onClick={scrollLeft}
                aria-label="Scroll left"
                type="button"
              >
                ‹
              </button>
              <button
                className="shelf-arrow-btn"
                onClick={scrollRight}
                aria-label="Scroll right"
                type="button"
              >
                ›
              </button>
            </div>
            <Link to={seeMoreLink} className="editorial-see-more">
              <span>See More</span>
              <span>→</span>
            </Link>
          </div>
        </div>

        <div className="horizontal-shelf-track" ref={scrollRef}>
          {books.map((book) => (
            <div
              key={book.id}
              className="shelf-book-card"
              onClick={() => navigate(`/books/${book.id}`)}
            >
              <div className="shelf-book-cover">
                <BookCover
                  src={book.coverUrl || book.cover}
                  title={book.title}
                  author={book.author}
                  category={book.category}
                  language={book.language}
                  fit="contain"
                  size="md"
                />
              </div>
              <div className="shelf-book-info">
                <h4 className="shelf-book-title" title={book.title}>
                  {book.title}
                </h4>
                <p className="shelf-book-author" title={book.author}>
                  {book.author}
                </p>
                <div className="shelf-book-bottom">
                  <span className="shelf-book-price">
                    {formatPrice(book.price)}
                  </span>
                  {book.rating && (
                    <span className="shelf-book-rating">
                      ★ {Number(book.rating).toFixed(1)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HorizontalShelf;

import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from './BookCover';

const BookOfTheYearBanner = ({ books = [] }) => {
  const navigate = useNavigate();

  if (!books || books.length === 0) return null;

  // Pick top 3 or 4 books to showcase
  const showcaseBooks = books.slice(0, 4);
  const primary = showcaseBooks[0];

  return (
    <div className="container">
      <div className="book-of-the-year-banner">
        {/* Left Side: Editorial Typography & Action */}
        <div className="boty-left">
          <span className="boty-badge">BookVerse Honors</span>
          <h2 className="boty-title">Book of the Year</h2>
          <p className="boty-subtitle">
            Curated by our literary council — celebrating books of exceptional storytelling, depth, and resonance.
          </p>
          {primary && (
            <Link to={`/books/${primary.id}`} className="boty-btn">
              <span>Explore Winner</span>
              <span>→</span>
            </Link>
          )}
        </div>

        {/* Right Side: Staggered Book Covers */}
        <div className="boty-right-books">
          {showcaseBooks.map((book, idx) => (
            <div
              key={book.id || idx}
              className="boty-book-item"
              onClick={() => navigate(`/books/${book.id}`)}
              title={`${book.title} by ${book.author}`}
              style={{
                transform: idx % 2 === 1 ? 'translateY(12px)' : 'translateY(0)',
                zIndex: 4 - idx,
              }}
            >
              <div className="boty-book-cover">
                <BookCover
                  src={book.coverUrl || book.cover}
                  title={book.title}
                  author={book.author}
                  category={book.category}
                  language={book.language}
                  fit="cover"
                  size="sm"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BookOfTheYearBanner;

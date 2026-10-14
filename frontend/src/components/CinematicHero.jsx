import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from './BookCover';

const CinematicHero = ({ primaryBook, secondaryBooks = [] }) => {
  const navigate = useNavigate();

  if (!primaryBook) return null;

  const leftBook = secondaryBooks[0] || null;
  const rightBook = secondaryBooks[1] || null;

  // Approximate reading time based on page count
  const pages = primaryBook.pages || 320;
  const hours = Math.floor(pages / 35);
  const minutes = Math.floor((pages % 35) * 1.5);
  const readingTime = `${hours}h ${minutes}m`;

  const reads = (primaryBook.reviews || 14) * 85 + 420;
  const readsFormatted = reads > 1000 ? `${(reads / 1000).toFixed(1)}k` : reads;

  return (
    <section className="cinematic-hero">
      <div className="container">
        <div className="cinematic-hero-grid">
          {/* Left Column: Book Details & Actions */}
          <div className="cinematic-hero-left">
            <div className="cinematic-hero-badge">
              <span>✦</span>
              <span>Featured Selection</span>
            </div>

            <h1 className="cinematic-hero-title">
              {primaryBook.title}
            </h1>

            <div className="cinematic-hero-author">
              By {primaryBook.author}
            </div>

            <p className="cinematic-hero-desc">
              {primaryBook.shortDescription ||
                primaryBook.description ||
                'An extraordinary journey into human character, destiny, and the mysterious forces that guide the path of a lifetime. A quintessential modern masterpiece.'}
            </p>

            <div className="cinematic-hero-meta">
              <div className="cinematic-meta-item">
                <span>👁️</span>
                <span>Reads <strong>{readsFormatted}</strong></span>
              </div>
              <span style={{ color: '#333' }}>•</span>
              <div className="cinematic-meta-item">
                <span>📄</span>
                <span>Pages <strong>{pages}</strong></span>
              </div>
              <span style={{ color: '#333' }}>•</span>
              <div className="cinematic-meta-item">
                <span>⏱️</span>
                <span>Time <strong>{readingTime}</strong></span>
              </div>
            </div>

            <div className="cinematic-hero-actions">
              <Link to={`/books/${primaryBook.id}`} className="btn-pill-gold">
                Start Reading
              </Link>
              <Link to={`/books/${primaryBook.id}`} className="btn-pill-outline">
                More Info <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Staircase & Standing Books with Downward Reflections */}
          <div className="cinematic-hero-right">
            <div className="staircase-stage">
              {/* Pedestal Stair Steps */}
              <div className="stair-step-base"></div>
              <div className="stair-step-mid"></div>
              <div className="stair-step-top"></div>

              {/* 3 Standing Books Cluster */}
              <div className="standing-books-cluster">
                {/* Left Book */}
                {leftBook && (
                  <div
                    className="standing-book left-book"
                    onClick={() => navigate(`/books/${leftBook.id}`)}
                    title={`${leftBook.title} by ${leftBook.author}`}
                  >
                    <div className="standing-book-cover">
                      <BookCover
                        src={leftBook.coverUrl || leftBook.cover}
                        title={leftBook.title}
                        author={leftBook.author}
                        category={leftBook.category}
                        language={leftBook.language}
                        fit="cover"
                        size="md"
                      />
                    </div>
                  </div>
                )}

                {/* Center Main Featured Book */}
                <div
                  className="standing-book center-book"
                  onClick={() => navigate(`/books/${primaryBook.id}`)}
                  title={`${primaryBook.title} by ${primaryBook.author}`}
                >
                  <div className="standing-book-cover">
                    <BookCover
                      src={primaryBook.coverUrl || primaryBook.cover}
                      title={primaryBook.title}
                      author={primaryBook.author}
                      category={primaryBook.category}
                      language={primaryBook.language}
                      fit="cover"
                      size="lg"
                    />
                  </div>
                </div>

                {/* Right Book */}
                {rightBook && (
                  <div
                    className="standing-book right-book"
                    onClick={() => navigate(`/books/${rightBook.id}`)}
                    title={`${rightBook.title} by ${rightBook.author}`}
                  >
                    <div className="standing-book-cover">
                      <BookCover
                        src={rightBook.coverUrl || rightBook.cover}
                        title={rightBook.title}
                        author={rightBook.author}
                        category={rightBook.category}
                        language={rightBook.language}
                        fit="cover"
                        size="md"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;

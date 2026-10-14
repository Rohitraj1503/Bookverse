import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import BookCover from './BookCover';

const CinematicHero = ({ primaryBook, secondaryBooks = [], books = [] }) => {
  const navigate = useNavigate();

  // Establish the pool of books for the showcase rotation
  const pool = React.useMemo(() => {
    if (Array.isArray(books) && books.length >= 3) {
      return books;
    }
    const combined = [primaryBook, ...secondaryBooks].filter(Boolean);
    return combined.length > 0 ? combined : [];
  }, [books, primaryBook, secondaryBooks]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const fadeTimeoutRef = useRef(null);

  // Safely switch to target index with brief text cross-fade
  const handleSelectBook = useCallback((targetIndex) => {
    if (pool.length === 0) return;
    setIsFading(true);
    if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    setCurrentIndex(targetIndex);
    fadeTimeoutRef.current = setTimeout(() => {
      setIsFading(false);
    }, 350);
  }, [pool.length]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, []);

  // Automatic rotation interval (~5 seconds)
  useEffect(() => {
    if (pool.length < 2 || isPaused) return;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) return;

    const intervalId = setInterval(() => {
      handleSelectBook((prevIndex) => (prevIndex + 1) % pool.length);
    }, 5000);

    return () => clearInterval(intervalId);
  }, [pool.length, isPaused, handleSelectBook]);

  if (!primaryBook && pool.length === 0) return null;

  // Active book currently featured in the center
  const activeBook = pool[currentIndex] || primaryBook;

  // Reading time and metadata based on the active book
  const pages = activeBook.pages || 320;
  const hours = Math.floor(pages / 35);
  const minutes = Math.floor((pages % 35) * 1.5);
  const readingTime = `${hours}h ${minutes}m`;

  const reads = (activeBook.reviews || 14) * 85 + 420;
  const readsFormatted = reads > 1000 ? `${(reads / 1000).toFixed(1)}k` : reads;

  // Determine slot class for a given book index relative to currentIndex
  const getSlotClass = (idx) => {
    const total = pool.length;
    if (total === 1) return 'slot-center';
    if (total === 2) {
      return idx === currentIndex ? 'slot-center' : 'slot-right';
    }
    const diff = (idx - currentIndex + total) % total;
    if (diff === 0) return 'slot-center';
    if (diff === 1) return 'slot-right';
    if (diff === total - 1) return 'slot-left';
    return 'slot-hidden';
  };

  const handleBookCoverClick = (idx, book) => {
    const slot = getSlotClass(idx);
    if (slot === 'slot-center') {
      navigate(`/books/${book.id}`);
    } else {
      handleSelectBook(idx);
    }
  };

  return (
    <section className="cinematic-hero">
      <div className="container">
        <div className="cinematic-hero-grid">
          {/* Left Column: Synchronized Book Details & Actions */}
          <div className="cinematic-hero-left">
            <div className="cinematic-hero-badge">
              <span>✦</span>
              <span>Featured Selection</span>
            </div>

            <div className={`cinematic-hero-text-fade ${isFading ? 'fading' : ''}`}>
              <h1 className="cinematic-hero-title">
                {activeBook.title}
              </h1>

              <div className="cinematic-hero-author">
                By {activeBook.author}
              </div>

              <p className="cinematic-hero-desc">
                {activeBook.shortDescription ||
                  activeBook.description ||
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
            </div>

            <div className="cinematic-hero-actions">
              <Link to={`/books/${activeBook.id}`} className="btn-pill-gold">
                Start Reading
              </Link>
              <Link to={`/books/${activeBook.id}`} className="btn-pill-outline">
                More Info <span>→</span>
              </Link>
            </div>
          </div>

          {/* Right Column: 3D Staircase & Rotating Showcase with Downward Reflections */}
          <div
            className="cinematic-hero-right"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocus={() => setIsPaused(true)}
            onBlur={() => setIsPaused(false)}
            tabIndex={0}
            role="region"
            aria-label="Rotating book showcase"
          >
            <div className="staircase-stage">
              {/* Pedestal Stair Steps */}
              <div className="stair-step-base"></div>
              <div className="stair-step-mid"></div>
              <div className="stair-step-top"></div>

              {/* Rotating Standing Books Showcase */}
              <div className="standing-books-cluster">
                {pool.map((book, idx) => {
                  const slotClass = getSlotClass(idx);
                  const isCenter = slotClass === 'slot-center';

                  return (
                    <div
                      key={book.id || idx}
                      className={`standing-book ${slotClass}`}
                      onClick={() => handleBookCoverClick(idx, book)}
                      title={`${book.title} by ${book.author} — ${isCenter ? 'Click to view details' : 'Click to bring to center'}`}
                      role="button"
                      tabIndex={slotClass !== 'slot-hidden' ? 0 : -1}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleBookCoverClick(idx, book);
                        }
                      }}
                      aria-hidden={slotClass === 'slot-hidden'}
                    >
                      <div className="standing-book-cover">
                        <BookCover
                          src={book.coverUrl || book.cover}
                          title={book.title}
                          author={book.author}
                          category={book.category}
                          language={book.language}
                          fit="cover"
                          size={isCenter ? 'lg' : 'md'}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CinematicHero;

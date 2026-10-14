import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import bookService from '../services/bookService';
import BookCycloneScene from '../components/BookCycloneScene';

/**
 * LandingPage Component
 * Cinematic 3D Book Cyclone entry experience for BookVerse.
 * Features hundreds of rotating real book covers in multi-orbital vortex rings,
 * atmospheric golden particles, and a cinematic warp transition into the bookstore.
 */
export const LandingPage = () => {
  const [books, setBooks] = useState([]);
  const [isEntering, setIsEntering] = useState(false);
  const [fadeActive, setFadeActive] = useState(false);
  const navigate = useNavigate();

  // Load real catalog books for the 3D cyclone
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      try {
        const data = await bookService.getAll();
        if (isMounted && Array.isArray(data) && data.length > 0) {
          // Select 60 books with valid titles/covers for the multi-layer cyclone
          setBooks(data.slice(0, 60));
        }
      } catch (err) {
        console.warn('Could not load books for cyclone scene:', err);
      }
    }
    loadCatalog();
    return () => {
      isMounted = false;
    };
  }, []);

  // Update document title for the cinematic landing
  useEffect(() => {
    document.title = 'BookVerse — The Infinite Library (3D Cyclone)';
  }, []);

  // Handle Enter BookVerse Transition
  const handleEnter = useCallback(() => {
    if (isEntering) return;
    setIsEntering(true);

    // Save session flag so user can smoothly navigate inside store
    try {
      sessionStorage.setItem('bv_entered', 'true');
    } catch (_) {}

    // Start screen dissolve fade after camera begins acceleration
    setTimeout(() => {
      setFadeActive(true);
    }, 600);
  }, [isEntering]);

  // Complete transition and navigate to real bookstore home
  const handleEnterComplete = useCallback(() => {
    navigate('/home', { replace: true });
  }, [navigate]);

  // Keyboard accessibility: Pressing Enter starts the cinematic warp
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Enter' && !isEntering) {
        handleEnter();
      } else if (e.key === 'Escape' && !isEntering) {
        navigate('/home');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleEnter, isEntering, navigate]);

  return (
    <div className="bookverse-landing-page">
      {/* Radial Gold Lighting Core */}
      <div className="landing-ambient-glow" />

      {/* 3D Cyclone Scene */}
      <div className="landing-canvas-wrapper">
        <BookCycloneScene
          books={books}
          isEntering={isEntering}
          onEnterComplete={handleEnterComplete}
        />
      </div>

      {/* Foreground Cinematic UI Overlay */}
      <div className="landing-ui-layer">
        {/* Top Header */}
        <header className="landing-top-bar">
          <div className="landing-brand">
            <img
              src="/logo.png"
              alt="BookVerse"
              className="landing-brand-logo"
            />
          </div>

          <Link to="/home" className="landing-skip-link" title="Skip directly to bookstore">
            <span>Skip to Store</span>
            <span>→</span>
          </Link>
        </header>

        {/* Central Identity & Action */}
        <div className="landing-hero-center">
          <div className="landing-badge">
            <span>✦</span>
            <span>The Infinite Library</span>
            <span>✦</span>
          </div>

          <h1 className="landing-main-title">
            Discover a <span className="landing-gold-gradient-text">Larger World</span>
          </h1>

          <p className="landing-tagline">
            Immerse yourself in a celestial cyclone of literature. Over 10,000 timeless classics, modern masterpieces, and rare editions curated in golden editorial luxury.
          </p>

          <div className="landing-cta-container">
            <button
              className={`landing-enter-btn ${isEntering ? 'entering' : ''}`}
              onClick={handleEnter}
              disabled={isEntering}
              aria-label="Enter BookVerse Bookstore"
            >
              <span>{isEntering ? 'Entering BookVerse...' : 'Enter BookVerse'}</span>
              {!isEntering && <span style={{ fontSize: '1.2rem', marginLeft: '4px' }}>→</span>}
            </button>
            <span className="landing-key-hint">[ Press Enter to Begin ]</span>
          </div>
        </div>

        {/* Bottom Status & Atmosphere Info */}
        <footer className="landing-bottom-bar">
          <div className="landing-stat-pills">
            <div className="landing-stat-item">
              <span>📚</span>
              <span><strong>550+</strong> Authentic Titles in Orbit</span>
            </div>
            <div className="landing-stat-item">
              <span>✦</span>
              <span><strong>3D</strong> Multi-Orbital Perspective</span>
            </div>
          </div>

          <div>
            <span>© {new Date().getFullYear()} BookVerse Editorial. All rights reserved.</span>
          </div>
        </footer>
      </div>

      {/* Camera Fly-Through Dissolve Fade */}
      <div className={`landing-dissolve-fade ${fadeActive ? 'active' : ''}`} />
    </div>
  );
};

export default LandingPage;

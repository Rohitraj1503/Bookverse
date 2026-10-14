import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import bookService from '../services/bookService';
import categoryService from '../services/categoryService';
import BookGrid from '../components/BookGrid';
import CinematicHero from '../components/CinematicHero';
import BookOfTheYearBanner from '../components/BookOfTheYearBanner';
import WritersSection from '../components/WritersSection';
import PublishersSection from '../components/PublishersSection';
import HorizontalShelf from '../components/HorizontalShelf';
import CategoryPillNav from '../components/CategoryPillNav';
import { useToast } from '../context/ToastContext';

const Home = () => {
  const [allBooks, setAllBooks] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [topRatedBooks, setTopRatedBooks] = useState([]);
  const [hindiBooks, setHindiBooks] = useState([]);
  const [comicMangaBooks, setComicMangaBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const toast = useToast();

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        setLoading(true);
        const [booksData, catsData] = await Promise.all([
          bookService.getAll(),
          categoryService.getAll(),
        ]);

        if (!isMounted) return;

        setAllBooks(booksData);

        const featured = booksData.filter((b) => b.isFeatured || b.featured);
        const topRated = [...booksData]
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        const hindi = booksData.filter(
          (b) => (b.language || '').toLowerCase() === 'hindi'
        );

        const comics = booksData.filter(
          (b) =>
            ['manga', 'comic', 'graphic novel'].includes((b.format || '').toLowerCase()) ||
            ['comics', 'manga'].includes((b.category || '').toLowerCase())
        );

        setFeaturedBooks(featured.length > 0 ? featured : booksData.slice(0, 6));
        setTopRatedBooks(topRated.length > 0 ? topRated : booksData.slice(0, 8));
        setHindiBooks(hindi);
        setComicMangaBooks(comics);
        setCategories(catsData);
      } catch (err) {
        console.error('Error loading home data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || !newsletterEmail.includes('@')) {
      toast.error('Please enter a valid email address');
      return;
    }
    toast.success('Subscribed successfully!');
    setNewsletterEmail('');
  };

  // Filter books for the main "Books" section
  const displayedBooks = selectedCategory === 'all'
    ? allBooks
    : allBooks.filter((b) => {
        const catVal = (b.category || b.categoryName || '').toLowerCase();
        const targetVal = String(selectedCategory).toLowerCase();
        return catVal === targetVal || String(b.categoryId) === targetVal;
      });

  const primaryHeroBook = featuredBooks[0] || allBooks[0];
  const secondaryHeroBooks = [
    featuredBooks[1] || allBooks[1],
    featuredBooks[2] || allBooks[2],
  ].filter(Boolean);

  return (
    <div className="home-page" style={{ background: '#050505', minHeight: '100vh' }}>
      {/* 1. CINEMATIC HERO SECTION */}
      {primaryHeroBook && (
        <CinematicHero
          books={featuredBooks.length >= 3 ? featuredBooks : allBooks.slice(0, 6)}
          primaryBook={primaryHeroBook}
          secondaryBooks={secondaryHeroBooks}
        />
      )}

      {/* 2. BOOK OF THE YEAR / FEATURED BOOKS BANNER */}
      {topRatedBooks.length > 0 && (
        <BookOfTheYearBanner books={topRatedBooks} />
      )}

      {/* 3. WRITERS DISCOVERY SECTION */}
      {allBooks.length > 0 && (
        <WritersSection books={allBooks} />
      )}

      {/* 4. PUBLISHERS SECTION */}
      {allBooks.length > 0 && (
        <PublishersSection books={allBooks} />
      )}

      {/* 5. TRENDS HORIZONTAL SHELF */}
      {topRatedBooks.length > 0 && (
        <HorizontalShelf
          title="Trends"
          seeMoreLink="/books?sort=bestseller"
          books={topRatedBooks.slice(0, 8)}
        />
      )}

      {/* 6. MOST LISTING BOOKS HORIZONTAL SHELF */}
      {allBooks.length > 3 && (
        <HorizontalShelf
          title="Most Listing Books"
          seeMoreLink="/books"
          books={allBooks.slice(3, 12)}
        />
      )}

      {/* 7. MAIN BOOKS EXPLORATION WITH CATEGORY PILL NAVIGATION */}
      <section className="section" id="categories" style={{ paddingTop: '24px' }}>
        <div className="container">
          <div className="editorial-section-header">
            <h2 className="editorial-section-title">Books</h2>
            <Link to="/books" className="editorial-see-more">
              <span>See More</span>
              <span>→</span>
            </Link>
          </div>

          {/* Horizontal Category Pill Selector inspired by the reference */}
          <CategoryPillNav
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={(catId) => setSelectedCategory(catId)}
          />

          {/* Book Grid */}
          <BookGrid
            books={displayedBooks.slice(0, 8)}
            loading={loading}
            count={4}
            className="book-grid"
          />
        </div>
      </section>

      {/* 8. REGIONAL LITERATURE: HINDI */}
      {hindiBooks.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="editorial-section-header">
              <div>
                <h2 className="editorial-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🇮🇳</span>
                  <span>Hindi Literature</span>
                  <span style={{ fontSize: '1rem', color: '#858585', fontWeight: 400 }}>हिन्दी साहित्य</span>
                </h2>
              </div>
              <Link to="/books?lang=Hindi" className="editorial-see-more">
                <span>View Collection ({hindiBooks.length})</span>
                <span>→</span>
              </Link>
            </div>
            <BookGrid
              books={hindiBooks.slice(0, 4)}
              loading={loading}
              count={4}
              className="book-grid"
            />
          </div>
        </section>
      )}

      {/* 9. COMICS & MANGA SECTION */}
      {comicMangaBooks.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="editorial-section-header">
              <div>
                <h2 className="editorial-section-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span>🇯🇵</span>
                  <span>Comics & Manga</span>
                  <span style={{ fontSize: '1rem', color: '#858585', fontWeight: 400 }}>漫画</span>
                </h2>
              </div>
              <Link to="/books?format=Manga" className="editorial-see-more">
                <span>View Collection ({comicMangaBooks.length})</span>
                <span>→</span>
              </Link>
            </div>
            <BookGrid
              books={comicMangaBooks.slice(0, 4)}
              loading={loading}
              count={4}
              className="book-grid"
            />
          </div>
        </section>
      )}

      {/* 10. NEWSLETTER DISPATCH */}
      <section className="section" style={{ paddingTop: '20px' }}>
        <div className="container">
          <div
            style={{
              background: '#101010',
              border: '1px solid #222222',
              borderRadius: '16px',
              padding: '48px 32px',
              textAlign: 'center',
            }}
          >
            <h2 style={{ fontFamily: 'var(--font-serif), Georgia, serif', fontSize: '1.9rem', marginBottom: '10px', color: '#FFFFFF' }}>
              Literary Dispatches to Your Inbox
            </h2>
            <p style={{ color: '#858585', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '500px', margin: '0 auto 24px' }}>
              Subscribe for weekly book selections, author retrospectives, and exclusive editions.
            </p>
            <form
              onSubmit={handleSubscribe}
              style={{
                display: 'flex',
                gap: '12px',
                maxWidth: '460px',
                margin: '0 auto',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                style={{
                  flex: '1 1 240px',
                  borderRadius: '50px',
                  padding: '12px 20px',
                  background: '#151515',
                  border: '1px solid #333333',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  outline: 'none',
                }}
                required
              />
              <button
                type="submit"
                className="btn-pill-gold"
                style={{ padding: '12px 28px', border: 'none' }}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

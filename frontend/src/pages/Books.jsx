import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import bookService from '../services/bookService';
import categoryService from '../services/categoryService';
import languageService from '../services/languageService';
import BookCard from '../components/BookCard';
import FilterMenuBar from '../components/FilterMenuBar';
import SkeletonCard from '../components/SkeletonCard';

const ITEMS_PER_PAGE = 8;

const Books = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [allBooks, setAllBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [selectedCategories, setSelectedCategories] = useState(() => {
    const cat = searchParams.get('cat');
    return cat ? [parseInt(cat)] : [];
  });
  const [selectedGenres, setSelectedGenres] = useState(() => {
    const genre = searchParams.get('genre');
    return genre ? [genre] : [];
  });
  const [priceMin, setPriceMin] = useState(searchParams.get('minPrice') || '');
  const [priceMax, setPriceMax] = useState(searchParams.get('maxPrice') || '');
  const [minRating, setMinRating] = useState(() => {
    const r = searchParams.get('rating');
    return r ? Number(r) : 0;
  });
  const [availability, setAvailability] = useState(searchParams.get('avail') || 'all');
  const [language, setLanguage] = useState(searchParams.get('lang') || 'all');
  const [formatFilter, setFormatFilter] = useState(searchParams.get('format') || 'all');
  const [isBestsellerOnly, setIsBestsellerOnly] = useState(false);
  const [isFeaturedOnly, setIsFeaturedOnly] = useState(false);
  const [isNewArrivalOnly, setIsNewArrivalOnly] = useState(false);
  const [sortOption, setSortOption] = useState(searchParams.get('sort') || 'default');
  const [currentPage, setCurrentPage] = useState(1);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Sync with URL params
  useEffect(() => {
    const s = searchParams.get('search');
    if (s !== null) setSearchQuery(s);

    const c = searchParams.get('cat');
    if (c !== null) setSelectedCategories([parseInt(c)]);

    const g = searchParams.get('genre');
    if (g !== null) setSelectedGenres([g]);

    const l = searchParams.get('lang');
    if (l !== null) setLanguage(l);

    const f = searchParams.get('format');
    if (f !== null) setFormatFilter(f);

    const sort = searchParams.get('sort');
    if (sort !== null) setSortOption(sort);
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        setLoading(true);
        const [booksData, catsData, langsData] = await Promise.all([
          bookService.getAll(),
          categoryService.getAll(),
          languageService.getAll(),
        ]);
        if (isMounted) {
          setAllBooks(booksData);
          setCategories(catsData);
          setLanguages(langsData);
        }
      } catch (err) {
        console.error('Failed to load books/categories/languages', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('bv_recently_viewed');
      if (stored) {
        setRecentlyViewed(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read recently viewed:', e);
    }
  }, []);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedCategories([]);
    setSelectedGenres([]);
    setPriceMin('');
    setPriceMax('');
    setMinRating(0);
    setAvailability('all');
    setLanguage('all');
    setFormatFilter('all');
    setIsBestsellerOnly(false);
    setIsFeaturedOnly(false);
    setIsNewArrivalOnly(false);
    setSortOption('default');
    setCurrentPage(1);
    setSearchParams({});
  };

  const filteredBooks = useMemo(() => {
    let list = [...allBooks];

    // Search query with multilingual, subtitle, series, ISBN, publisher support
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      list = list.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.subtitle?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.category?.name?.toLowerCase().includes(q) ||
          (typeof b.category === 'string' && b.category.toLowerCase().includes(q)) ||
          b.language?.toLowerCase().includes(q) ||
          b.seriesName?.toLowerCase().includes(q) ||
          b.genre?.toLowerCase().includes(q) ||
          b.publisher?.toLowerCase().includes(q) ||
          (b.isbn && b.isbn.toLowerCase().includes(q))
      );
    }

    // Category filter (support multiple)
    if (selectedCategories.length > 0) {
      list = list.filter((b) => {
        const catId = b.categoryId || b.category?.id;
        return selectedCategories.includes(catId);
      });
    }

    // Genre filter (support multiple)
    if (selectedGenres.length > 0) {
      list = list.filter((b) => {
        const bookGenre = (
          b.genre ||
          b.category?.name ||
          (typeof b.category === 'string' ? b.category : '')
        ).toLowerCase();
        return selectedGenres.some((g) => bookGenre.includes(g.toLowerCase()));
      });
    }

    // Language filter
    if (language !== 'all') {
      list = list.filter((b) => (b.language || 'English').toLowerCase() === language.toLowerCase());
    }

    // Price range
    const min = parseFloat(priceMin) || 0;
    const max = parseFloat(priceMax) || Infinity;
    list = list.filter((b) => b.price >= min && b.price <= max);

    // Rating
    if (minRating > 0) {
      list = list.filter((b) => (b.rating || 0) >= minRating);
    }

    // Availability
    if (availability === 'in-stock') {
      list = list.filter((b) => Number(b.stock || 0) > 0);
    } else if (availability === 'on-sale') {
      list = list.filter((b) => Number(b.discount || 0) > 0 || (b.originalPrice && b.originalPrice > b.price));
    } else if (availability === 'out-of-stock') {
      list = list.filter((b) => Number(b.stock || 0) <= 0);
    }

    // Format
    if (formatFilter !== 'all') {
      list = list.filter((b) => (b.format || 'Paperback').toLowerCase() === formatFilter.toLowerCase());
    }

    // Status / Curations
    if (isBestsellerOnly) {
      list = list.filter((b) => b.isBestseller === true);
    }
    if (isFeaturedOnly) {
      list = list.filter((b) => b.isFeatured === true);
    }
    if (isNewArrivalOnly) {
      list = list.filter((b) => b.isNewArrival === true);
    }

    // Sorting
    switch (sortOption) {
      case 'price-asc':
        list.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        list.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'title':
        list.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'newest':
        list.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      default:
        break;
    }

    return list;
  }, [
    allBooks,
    searchQuery,
    selectedCategories,
    selectedGenres,
    language,
    priceMin,
    priceMax,
    minRating,
    availability,
    formatFilter,
    isBestsellerOnly,
    isFeaturedOnly,
    isNewArrivalOnly,
    sortOption,
  ]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE);
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 200, behavior: 'smooth' });
  };

  const paginationScrollRef = useRef(null);
  const activePageButtonRef = useRef(null);

  // Auto-scroll the active page button into view within the horizontal track without jumping window
  useEffect(() => {
    if (activePageButtonRef.current && paginationScrollRef.current) {
      const container = paginationScrollRef.current;
      const button = activePageButtonRef.current;

      const containerWidth = container.clientWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.clientWidth;

      const targetScrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);

      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: 'smooth',
      });
    }
  }, [currentPage, totalPages]);

  // Enable mouse-wheel horizontal scrolling over the pagination track
  useEffect(() => {
    const scrollEl = paginationScrollRef.current;
    if (!scrollEl) return;

    const handleWheel = (e) => {
      if (scrollEl.scrollWidth > scrollEl.clientWidth) {
        if (Math.abs(e.deltaY) > 0) {
          scrollEl.scrollLeft += e.deltaY;
          e.preventDefault();
        }
      }
    };

    scrollEl.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      scrollEl.removeEventListener('wheel', handleWheel);
    };
  }, [totalPages]);

  return (
    <div className="books-page container">
      {/* Page Header */}
      <div className="books-page__header" style={{ marginBottom: '20px' }}>
        <div>
          <h1 className="books-page__title">
            Explore Our <span className="text-gradient">Collection</span>
          </h1>
          <p className="books-page__subtitle" id="resultsCount">
            {loading
              ? 'Loading books...'
              : `Showing ${filteredBooks.length} book${filteredBooks.length !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Modern Filter Menu Bar replacing the tall vertical sidebar */}
      <FilterMenuBar
        searchQuery={searchQuery}
        setSearchQuery={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        selectedCategories={selectedCategories}
        setSelectedCategories={(cats) => { setSelectedCategories(cats); setCurrentPage(1); }}
        selectedGenres={selectedGenres}
        setSelectedGenres={(g) => { setSelectedGenres(g); setCurrentPage(1); }}
        language={language}
        setLanguage={(l) => { setLanguage(l); setCurrentPage(1); }}
        priceMin={priceMin}
        setPriceMin={(min) => { setPriceMin(min); setCurrentPage(1); }}
        priceMax={priceMax}
        setPriceMax={(max) => { setPriceMax(max); setCurrentPage(1); }}
        minRating={minRating}
        setMinRating={(r) => { setMinRating(r); setCurrentPage(1); }}
        availability={availability}
        setAvailability={(a) => { setAvailability(a); setCurrentPage(1); }}
        formatFilter={formatFilter}
        setFormatFilter={(f) => { setFormatFilter(f); setCurrentPage(1); }}
        isBestsellerOnly={isBestsellerOnly}
        setIsBestsellerOnly={(b) => { setIsBestsellerOnly(b); setCurrentPage(1); }}
        isFeaturedOnly={isFeaturedOnly}
        setIsFeaturedOnly={(f) => { setIsFeaturedOnly(f); setCurrentPage(1); }}
        isNewArrivalOnly={isNewArrivalOnly}
        setIsNewArrivalOnly={(n) => { setIsNewArrivalOnly(n); setCurrentPage(1); }}
        sortOption={sortOption}
        setSortOption={(s) => { setSortOption(s); setCurrentPage(1); }}
        categories={categories}
        languages={languages}
        allBooks={allBooks}
        onClearAll={clearFilters}
      />

      {/* Book Grid Main (Full-width 4-column responsive layout) */}
      <div className="books-page__layout">
        <main className="books-page__main" style={{ width: '100%' }}>
          {loading ? (
            <div className="book-grid book-grid--4col">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : paginatedBooks.length === 0 ? (
            <div className="empty-state" style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>📭</div>
              <h3>No books found</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                We couldn't find any books matching your current filters or search term.
              </p>
              <button className="btn btn-primary" onClick={clearFilters}>
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="book-grid book-grid--4col" id="bookGrid">
              {paginatedBooks.map((book) => (
                <BookCard key={book.id} book={book} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className="pagination-wrapper" style={{ marginTop: '40px' }}>
              <div className="pagination-container" id="pagination">
                <button
                  type="button"
                  className="pagination-nav-btn pagination-nav-prev"
                  disabled={currentPage === 1}
                  onClick={() => goToPage(currentPage - 1)}
                  aria-label="Previous Page"
                >
                  ‹
                </button>

                <div
                  className="pagination-scroll"
                  ref={paginationScrollRef}
                >
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      ref={(el) => {
                        if (p === currentPage) activePageButtonRef.current = el;
                      }}
                      type="button"
                      className={p === currentPage ? 'active' : ''}
                      onClick={() => goToPage(p)}
                      aria-label={`Page ${p}`}
                      aria-current={p === currentPage ? 'page' : undefined}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="pagination-nav-btn pagination-nav-next"
                  disabled={currentPage === totalPages}
                  onClick={() => goToPage(currentPage + 1)}
                  aria-label="Next Page"
                >
                  ›
                </button>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Recently Viewed Section */}
      {recentlyViewed.length > 0 && (
        <section style={{ marginTop: '60px', borderTop: '1px solid var(--border-color)', paddingTop: '40px' }}>
          <div className="section-header" style={{ marginBottom: '20px' }}>
            <h2>
              🕒 Recently <span className="text-gradient">Viewed</span>
            </h2>
          </div>
          <div className="book-grid book-grid--4col">
            {recentlyViewed.slice(0, 4).map((book) => (
              <BookCard key={'recent-' + book.id} book={book} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Books;

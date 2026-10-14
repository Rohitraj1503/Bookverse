import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  LayoutGrid,
  BookOpen,
  Languages,
  IndianRupee,
  Star,
  PackageCheck,
  SlidersHorizontal,
  ChevronDown,
  X,
  Check,
  RotateCcw,
} from 'lucide-react';
import CategoryIcon from './CategoryIcon';
import '../styles/filter-menu-bar.css';

const PRICE_PRESETS = [
  { label: 'All Prices', min: '', max: '' },
  { label: 'Under ₹300', min: '0', max: '300' },
  { label: '₹300 – ₹500', min: '300', max: '500' },
  { label: '₹500 – ₹1,000', min: '500', max: '1000' },
  { label: 'Above ₹1,000', min: '1000', max: '' },
];

const RATING_OPTIONS = [
  { label: 'All Ratings', value: 0 },
  { label: '4★ & Above', value: 4 },
  { label: '3★ & Above', value: 3 },
  { label: '2★ & Above', value: 2 },
];

const AVAILABILITY_OPTIONS = [
  { label: 'All Books', value: 'all' },
  { label: 'In Stock Only', value: 'in-stock' },
  { label: 'On Sale / Discounted', value: 'on-sale' },
  { label: 'Out of Stock', value: 'out-of-stock' },
];

const FORMAT_OPTIONS = [
  'All',
  'Paperback',
  'Hardcover',
  'Manga',
  'Comic Book',
  'Graphic Novel',
  'Textbook',
  'Audiobook',
  'eBook',
];

const FilterMenuBar = ({
  searchQuery,
  setSearchQuery,
  selectedCategories,
  setSelectedCategories,
  selectedGenres,
  setSelectedGenres,
  language,
  setLanguage,
  priceMin,
  setPriceMin,
  priceMax,
  setPriceMax,
  minRating,
  setMinRating,
  availability,
  setAvailability,
  formatFilter,
  setFormatFilter,
  isBestsellerOnly,
  setIsBestsellerOnly,
  isFeaturedOnly,
  setIsFeaturedOnly,
  isNewArrivalOnly,
  setIsNewArrivalOnly,
  sortOption,
  setSortOption,
  categories = [],
  languages = [],
  allBooks = [],
  onClearAll,
}) => {
  const [activeDropdown, setActiveDropdown] = useState(null); // 'cat' | 'genre' | 'lang' | 'price' | 'rating' | 'avail' | 'more' | null
  const [catSearch, setCatSearch] = useState('');
  const [genreSearch, setGenreSearch] = useState('');
  const [langSearch, setLangSearch] = useState('');
  const [customMin, setCustomMin] = useState(priceMin);
  const [customMax, setCustomMax] = useState(priceMax);

  const containerRef = useRef(null);

  // Close dropdown on click outside or Escape key
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleDropdown = (name) => {
    setActiveDropdown((prev) => (prev === name ? null : name));
  };

  // Group Categories logically according to specifications
  const categorizedGroups = useMemo(() => {
    const groups = {
      'BOOK TYPES': [],
      'KNOWLEDGE & INTERESTS': [],
      'GENRES': [],
      'OTHER CATEGORIES': [],
      'MORE CATEGORIES': [],
    };

    const bookTypeNames = [
      'Fiction', 'Non-Fiction', 'Comics & Manga', 'Academic & Textbooks',
      'Children & Young Adult', 'Indian Comics', 'Superhero Comics', 'Manga',
      'Manhwa', 'Manhua', 'Graphic Novels', 'Children\'s Comics', 'Picture Books',
      'Fairy Tales', 'Bedtime Stories', 'School Textbooks', 'College Textbooks'
    ];

    const knowledgeNames = [
      'Science & Technology', 'Business & Economics', 'History', 'Arts & Photography',
      'Self-Help', 'Computer Science', 'Programming', 'Artificial Intelligence',
      'Machine Learning', 'Mathematics', 'Science', 'Engineering', 'Travel',
      'Activity Books', 'Educational Stories'
    ];

    const genreNames = [
      'Novels', 'Romance', 'Mystery', 'Thriller', 'Horror', 'Fantasy',
      'Science Fiction', 'Historical Fiction', 'Short Stories', 'Adventure',
      'Crime Fiction', 'Young Adult Fiction'
    ];

    const otherNames = [
      'Biography', 'Autobiography', 'Personal Development', 'Psychology',
      'Philosophy', 'Politics', 'Finance', 'Entrepreneurship', 'Competitive Exams',
      'Government Exam Preparation', 'Language Learning', 'Hindu Philosophy',
      'Buddhist Literature', 'Islamic Literature', 'Christian Literature',
      'Spirituality', 'Mythology', 'Cultural Literature'
    ];

    categories.forEach((cat) => {
      const name = cat.name;
      if (bookTypeNames.includes(name)) {
        groups['BOOK TYPES'].push(cat);
      } else if (knowledgeNames.includes(name)) {
        groups['KNOWLEDGE & INTERESTS'].push(cat);
      } else if (genreNames.includes(name)) {
        groups['GENRES'].push(cat);
      } else if (otherNames.includes(name)) {
        groups['OTHER CATEGORIES'].push(cat);
      } else {
        groups['MORE CATEGORIES'].push(cat);
      }
    });

    return groups;
  }, [categories]);

  // Extract distinct genres from allBooks and category genres
  const availableGenres = useMemo(() => {
    const genreSet = new Set([
      'Fiction', 'Non-Fiction', 'Romance', 'Mystery', 'Thriller', 'Horror',
      'Fantasy', 'Science Fiction', 'Historical Fiction', 'Short Stories',
      'Adventure', 'Crime Fiction', 'Dystopian', 'Classic', 'Poetry',
      'Drama', 'Biography', 'Autobiography', 'Self-Help', 'Business',
      'Finance', 'Psychology', 'Philosophy', 'Science', 'Technology',
      'Manga', 'Superhero', 'Epic Fantasy'
    ]);

    allBooks.forEach((b) => {
      if (b.genre) {
        b.genre.split(/[,/]/).forEach((g) => {
          const clean = g.trim();
          if (clean) genreSet.add(clean);
        });
      }
    });

    return Array.from(genreSet).sort((a, b) => a.localeCompare(b));
  }, [allBooks]);

  // Dynamic language options
  const languageOptions = useMemo(() => {
    const list = [...languages];
    allBooks.forEach((b) => {
      if (b.language && !list.some((l) => l.name.toLowerCase() === b.language.toLowerCase())) {
        list.push({ id: b.language, name: b.language, nativeName: b.language });
      }
    });
    return list;
  }, [languages, allBooks]);

  const handleCategoryToggle = (id) => {
    setSelectedCategories((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleGenreToggle = (g) => {
    setSelectedGenres((prev) =>
      prev.includes(g) ? prev.filter((item) => item !== g) : [...prev, g]
    );
  };

  const activeCategoryCount = selectedCategories.length;
  const activeGenreCount = selectedGenres.length;
  const isLanguageActive = language && language !== 'all';
  const isPriceActive = Boolean(priceMin || priceMax);
  const isRatingActive = minRating > 0;
  const isAvailabilityActive = availability !== 'all';
  const moreFiltersCount =
    (formatFilter !== 'all' ? 1 : 0) +
    (isBestsellerOnly ? 1 : 0) +
    (isFeaturedOnly ? 1 : 0) +
    (isNewArrivalOnly ? 1 : 0);

  const hasAnyFilter =
    Boolean(searchQuery) ||
    activeCategoryCount > 0 ||
    activeGenreCount > 0 ||
    isLanguageActive ||
    isPriceActive ||
    isRatingActive ||
    isAvailabilityActive ||
    moreFiltersCount > 0;

  return (
    <div className="filter-toolbar-wrapper" ref={containerRef}>
      <div className="filter-toolbar">
        {/* Search Input Box */}
        <div className="filter-search-box">
          <Search size={16} />
          <input
            type="text"
            id="toolbarSearchInput"
            placeholder="Search books, authors, ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Buttons Group */}
        <div className="filter-items-group">
          {/* 1. All Categories Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'cat' ? 'is-open' : ''} ${activeCategoryCount > 0 ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('cat')}
              id="filterCategoriesBtn"
            >
              <span className="filter-btn-icon"><LayoutGrid size={15} /></span>
              <span>
                {activeCategoryCount > 0
                  ? `All Categories (${activeCategoryCount})`
                  : 'All Categories'}
              </span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'cat' && (
              <div className="filter-dropdown-portal categories-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <LayoutGrid size={16} /> Browse All Categories
                  </span>
                  {activeCategoryCount > 0 && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => setSelectedCategories([])}
                    >
                      Clear Selection ({activeCategoryCount})
                    </button>
                  )}
                </div>

                <div className="dropdown-inner-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search category..."
                    value={catSearch}
                    onChange={(e) => setCatSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="categories-groups-grid">
                  {Object.entries(categorizedGroups).map(([groupTitle, catList]) => {
                    const filteredList = catList.filter((c) =>
                      c.name.toLowerCase().includes(catSearch.toLowerCase())
                    );
                    if (filteredList.length === 0) return null;

                    return (
                      <div key={groupTitle} className="category-group-box">
                        <div className="category-group-title">{groupTitle}</div>
                        <div className="category-items-list">
                          {filteredList.map((cat) => {
                            const isChecked = selectedCategories.includes(cat.id);
                            return (
                              <div
                                key={cat.id}
                                className={`category-item-row ${isChecked ? 'is-selected' : ''}`}
                                onClick={() => handleCategoryToggle(cat.id)}
                              >
                                <div className="category-item-checkbox">
                                  {isChecked && <Check size={12} strokeWidth={3} />}
                                </div>
                                <span className="category-item-icon">
                                  <CategoryIcon name={cat.name} icon={cat.icon} size={14} />
                                </span>
                                <span className="category-item-name">{cat.name}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 2. Genre Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'genre' ? 'is-open' : ''} ${activeGenreCount > 0 ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('genre')}
              id="filterGenreBtn"
            >
              <span className="filter-btn-icon"><BookOpen size={15} /></span>
              <span>
                {activeGenreCount > 0 ? `Genre (${activeGenreCount})` : 'Genre'}
              </span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'genre' && (
              <div className="filter-dropdown-portal genre-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <BookOpen size={16} /> Filter by Genre
                  </span>
                  {activeGenreCount > 0 && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => setSelectedGenres([])}
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="dropdown-inner-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search genres..."
                    value={genreSearch}
                    onChange={(e) => setGenreSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="genre-scroll-list">
                  {availableGenres
                    .filter((g) => g.toLowerCase().includes(genreSearch.toLowerCase()))
                    .map((genre) => {
                      const isChecked = selectedGenres.includes(genre);
                      return (
                        <div
                          key={genre}
                          className={`category-item-row ${isChecked ? 'is-selected' : ''}`}
                          onClick={() => handleGenreToggle(genre)}
                        >
                          <div className="category-item-checkbox">
                            {isChecked && <Check size={12} strokeWidth={3} />}
                          </div>
                          <span className="category-item-name">{genre}</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 3. Language Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'lang' ? 'is-open' : ''} ${isLanguageActive ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('lang')}
              id="filterLanguageBtn"
            >
              <span className="filter-btn-icon"><Languages size={15} /></span>
              <span>{isLanguageActive ? `${language}` : 'Language'}</span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'lang' && (
              <div className="filter-dropdown-portal language-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <Languages size={16} /> Select Language
                  </span>
                  {isLanguageActive && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => setLanguage('all')}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="dropdown-inner-search">
                  <Search size={14} />
                  <input
                    type="text"
                    placeholder="Search language..."
                    value={langSearch}
                    onChange={(e) => setLangSearch(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="language-scroll-list">
                  <div
                    className={`language-item-row ${language === 'all' ? 'is-selected' : ''}`}
                    onClick={() => { setLanguage('all'); setActiveDropdown(null); }}
                  >
                    <span>All Languages</span>
                    {language === 'all' && <Check size={14} color="#8b5cf6" />}
                  </div>

                  {languageOptions
                    .filter((l) =>
                      l.name.toLowerCase().includes(langSearch.toLowerCase()) ||
                      (l.nativeName && l.nativeName.toLowerCase().includes(langSearch.toLowerCase()))
                    )
                    .map((l) => {
                      const isSelected = language.toLowerCase() === l.name.toLowerCase();
                      return (
                        <div
                          key={l.id || l.code || l.name}
                          className={`language-item-row ${isSelected ? 'is-selected' : ''}`}
                          onClick={() => { setLanguage(l.name); setActiveDropdown(null); }}
                        >
                          <div>
                            <span>{l.name}</span>
                            {l.nativeName && l.nativeName !== l.name && (
                              <span className="language-native-badge">({l.nativeName})</span>
                            )}
                          </div>
                          {isSelected && <Check size={14} color="#8b5cf6" />}
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* 4. Price Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'price' ? 'is-open' : ''} ${isPriceActive ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('price')}
              id="filterPriceBtn"
            >
              <span className="filter-btn-icon"><IndianRupee size={15} /></span>
              <span>
                {isPriceActive
                  ? priceMin && priceMax
                    ? `₹${priceMin} – ₹${priceMax}`
                    : priceMin
                    ? `> ₹${priceMin}`
                    : `< ₹${priceMax}`
                  : 'Price'}
              </span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'price' && (
              <div className="filter-dropdown-portal price-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <IndianRupee size={16} /> Filter by Price
                  </span>
                  {isPriceActive && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => {
                        setPriceMin('');
                        setPriceMax('');
                        setCustomMin('');
                        setCustomMax('');
                      }}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="price-presets-list">
                  {PRICE_PRESETS.map((p, idx) => {
                    const isPresetActive = priceMin === p.min && priceMax === p.max;
                    return (
                      <div
                        key={idx}
                        className={`price-preset-pill ${isPresetActive ? 'is-active' : ''}`}
                        onClick={() => {
                          setPriceMin(p.min);
                          setPriceMax(p.max);
                          setCustomMin(p.min);
                          setCustomMax(p.max);
                          setActiveDropdown(null);
                        }}
                      >
                        <span>{p.label}</span>
                        {isPresetActive && <Check size={14} color="#8b5cf6" />}
                      </div>
                    );
                  })}
                </div>

                <div className="price-custom-form">
                  <div className="price-custom-label">Custom Range</div>
                  <div className="price-inputs-row">
                    <div className="price-input-wrap">
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={customMin}
                        onChange={(e) => setCustomMin(e.target.value)}
                      />
                    </div>
                    <span style={{ color: '#64748b' }}>—</span>
                    <div className="price-input-wrap">
                      <span>₹</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={customMax}
                        onChange={(e) => setCustomMax(e.target.value)}
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    className="price-apply-btn"
                    onClick={() => {
                      setPriceMin(customMin);
                      setPriceMax(customMax);
                      setActiveDropdown(null);
                    }}
                  >
                    Apply Price
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 5. Rating Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'rating' ? 'is-open' : ''} ${isRatingActive ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('rating')}
              id="filterRatingBtn"
            >
              <span className="filter-btn-icon"><Star size={15} /></span>
              <span>{isRatingActive ? `${minRating}★ & Up` : 'Rating'}</span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'rating' && (
              <div className="filter-dropdown-portal rating-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <Star size={16} /> Customer Rating
                  </span>
                  {isRatingActive && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => setMinRating(0)}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="rating-options-list">
                  {RATING_OPTIONS.map((opt) => {
                    const isSelected = minRating === opt.value;
                    return (
                      <div
                        key={opt.value}
                        className={`rating-option-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => { setMinRating(opt.value); setActiveDropdown(null); }}
                      >
                        <div>
                          {opt.value > 0 ? (
                            <span>
                              <span className="rating-stars-yellow">
                                {'★'.repeat(opt.value)}
                              </span>
                              & Up
                            </span>
                          ) : (
                            <span>All Ratings</span>
                          )}
                        </div>
                        {isSelected && <Check size={14} color="#8b5cf6" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 6. Availability Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'avail' ? 'is-open' : ''} ${isAvailabilityActive ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('avail')}
              id="filterAvailabilityBtn"
            >
              <span className="filter-btn-icon"><PackageCheck size={15} /></span>
              <span>
                {availability === 'in-stock'
                  ? 'In Stock'
                  : availability === 'on-sale'
                  ? 'On Sale'
                  : availability === 'out-of-stock'
                  ? 'Out of Stock'
                  : 'Availability'}
              </span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'avail' && (
              <div className="filter-dropdown-portal availability-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <PackageCheck size={16} /> Availability
                  </span>
                  {isAvailabilityActive && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => setAvailability('all')}
                    >
                      Reset
                    </button>
                  )}
                </div>

                <div className="availability-options-list">
                  {AVAILABILITY_OPTIONS.map((opt) => {
                    const isSelected = availability === opt.value;
                    return (
                      <div
                        key={opt.value}
                        className={`availability-item ${isSelected ? 'is-selected' : ''}`}
                        onClick={() => { setAvailability(opt.value); setActiveDropdown(null); }}
                      >
                        <span>{opt.label}</span>
                        {isSelected && <Check size={14} color="#8b5cf6" />}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 7. More Filters Dropdown Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className={`filter-trigger-btn ${activeDropdown === 'more' ? 'is-open' : ''} ${moreFiltersCount > 0 ? 'is-active' : ''}`}
              onClick={() => toggleDropdown('more')}
              id="filterMoreBtn"
            >
              <span className="filter-btn-icon"><SlidersHorizontal size={15} /></span>
              <span>
                {moreFiltersCount > 0
                  ? `More Filters (${moreFiltersCount})`
                  : 'More Filters'}
              </span>
              <ChevronDown size={14} className="filter-btn-chevron" />
            </button>

            {activeDropdown === 'more' && (
              <div className="filter-dropdown-portal more-filters-panel">
                <div className="dropdown-header-bar">
                  <span className="dropdown-header-title">
                    <SlidersHorizontal size={16} /> Extra Filters
                  </span>
                  {moreFiltersCount > 0 && (
                    <button
                      type="button"
                      className="dropdown-header-action"
                      onClick={() => {
                        setFormatFilter('all');
                        setIsBestsellerOnly(false);
                        setIsFeaturedOnly(false);
                        setIsNewArrivalOnly(false);
                      }}
                    >
                      Clear
                    </button>
                  )}
                </div>

                {/* Format selection */}
                <div className="more-filters-section">
                  <div className="more-section-heading">Book Format</div>
                  <div className="format-pills-wrap">
                    {FORMAT_OPTIONS.map((fmt) => {
                      const isFmtActive =
                        (fmt === 'All' && formatFilter === 'all') ||
                        formatFilter.toLowerCase() === fmt.toLowerCase();
                      return (
                        <button
                          key={fmt}
                          type="button"
                          className={`format-pill-btn ${isFmtActive ? 'is-active' : ''}`}
                          onClick={() => setFormatFilter(fmt === 'All' ? 'all' : fmt)}
                        >
                          {fmt}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Badges / Curations */}
                <div className="more-filters-section">
                  <div className="more-section-heading">Collections & Status</div>
                  <label className="more-checkbox-row">
                    <input
                      type="checkbox"
                      checked={isBestsellerOnly}
                      onChange={(e) => setIsBestsellerOnly(e.target.checked)}
                    />
                    <span>🔥 Bestsellers Only</span>
                  </label>
                  <label className="more-checkbox-row">
                    <input
                      type="checkbox"
                      checked={isFeaturedOnly}
                      onChange={(e) => setIsFeaturedOnly(e.target.checked)}
                    />
                    <span>⭐ Featured Books</span>
                  </label>
                  <label className="more-checkbox-row">
                    <input
                      type="checkbox"
                      checked={isNewArrivalOnly}
                      onChange={(e) => setIsNewArrivalOnly(e.target.checked)}
                    />
                    <span>✨ New Arrivals</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Clear All button */}
          {hasAnyFilter && (
            <button
              type="button"
              className="filter-clear-all-btn"
              onClick={onClearAll}
              title="Reset all filters"
            >
              <RotateCcw size={13} />
              <span>Clear All</span>
            </button>
          )}
        </div>

        {/* Sort Select */}
        <div className="filter-sort-group">
          <select
            className="filter-sort-select"
            id="catalogSortSelect"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
          >
            <option value="default">Sort: Default</option>
            <option value="price-asc">Price: Low → High</option>
            <option value="price-desc">Price: High → Low</option>
            <option value="rating">Highest Rated</option>
            <option value="title">Title A–Z</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {/* Selected Filters Chips Bar */}
      {hasAnyFilter && (
        <div className="active-filter-chips-bar">
          <span className="chips-label">Active:</span>

          {searchQuery && (
            <div className="filter-chip-pill">
              <span>Query: "{searchQuery}"</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {selectedCategories.map((catId) => {
            const cat = categories.find((c) => c.id === catId);
            return (
              <div key={'cat-chip-' + catId} className="filter-chip-pill">
                <span>{cat?.name || 'Category'}</span>
                <button
                  type="button"
                  className="filter-chip-remove"
                  onClick={() => handleCategoryToggle(catId)}
                >
                  <X size={12} />
                </button>
              </div>
            );
          })}

          {selectedGenres.map((g) => (
            <div key={'genre-chip-' + g} className="filter-chip-pill">
              <span>Genre: {g}</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => handleGenreToggle(g)}
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {isLanguageActive && (
            <div className="filter-chip-pill">
              <span>Language: {language}</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setLanguage('all')}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isPriceActive && (
            <div className="filter-chip-pill">
              <span>
                Price: {priceMin ? `₹${priceMin}` : '₹0'} – {priceMax ? `₹${priceMax}` : 'Any'}
              </span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => { setPriceMin(''); setPriceMax(''); }}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isRatingActive && (
            <div className="filter-chip-pill">
              <span>Rating: {minRating}★+</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setMinRating(0)}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isAvailabilityActive && (
            <div className="filter-chip-pill">
              <span>
                {availability === 'in-stock'
                  ? 'In Stock'
                  : availability === 'on-sale'
                  ? 'On Sale'
                  : 'Out of Stock'}
              </span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setAvailability('all')}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {formatFilter !== 'all' && (
            <div className="filter-chip-pill">
              <span>Format: {formatFilter}</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setFormatFilter('all')}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isBestsellerOnly && (
            <div className="filter-chip-pill">
              <span>Bestsellers</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setIsBestsellerOnly(false)}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isFeaturedOnly && (
            <div className="filter-chip-pill">
              <span>Featured</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setIsFeaturedOnly(false)}
              >
                <X size={12} />
              </button>
            </div>
          )}

          {isNewArrivalOnly && (
            <div className="filter-chip-pill">
              <span>New Arrivals</span>
              <button
                type="button"
                className="filter-chip-remove"
                onClick={() => setIsNewArrivalOnly(false)}
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FilterMenuBar;

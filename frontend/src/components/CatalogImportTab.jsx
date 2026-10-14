import React, { useState, useEffect } from 'react';
import bookService from '../services/bookService';
import BookCover from './BookCover';
import { useToast } from '../context/ToastContext';

const CatalogImportTab = ({ categories = [], languages = [], onBooksUpdated }) => {
  const toast = useToast();

  // Search & filter state
  const [source, setSource] = useState('google'); // 'google' | 'openlibrary'
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [targetCount, setTargetCount] = useState(40);
  const [filterMissingCoversOnly, setFilterMissingCoversOnly] = useState(false);

  // Results & selection state
  const [candidates, setCandidates] = useState([]);
  const [selectedIndices, setSelectedIndices] = useState(new Set());
  const [isSearching, setIsSearching] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isAutoImporting, setIsAutoImporting] = useState(false);

  // Live Catalog Stats from MySQL
  const [stats, setStats] = useState({
    totalBooks: 0,
    booksWithCovers: 0,
    booksWithoutCovers: 0,
    coverAvailabilityRate: '0%',
  });

  // Last import report
  const [importReport, setImportReport] = useState(null);

  // Load real catalog stats on mount
  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await bookService.getCatalogStats();
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load catalog stats:', err);
    }
  };

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim() && selectedCategory === 'all') {
      toast.info('Please enter a search keyword, title, author, or select a category.');
      return;
    }

    setIsSearching(true);
    setCandidates([]);
    setSelectedIndices(new Set());
    setImportReport(null);

    try {
      const results = await bookService.searchCatalog({
        query: query.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        language: selectedLanguage !== 'all' ? selectedLanguage : undefined,
        startIndex: 0,
        limit: targetCount,
      });

      setCandidates(results);
      // Auto-select candidates that are not duplicates
      const newSelections = new Set();
      results.forEach((c, idx) => {
        if (!c.isDuplicate) {
          newSelections.add(idx);
        }
      });
      setSelectedIndices(newSelections);

      if (results.length === 0) {
        toast.info('No books found matching your query. Try broader keywords.');
      } else {
        toast.success(`Retrieved ${results.length} verified book candidates.`);
      }
    } catch (err) {
      console.error('External search error:', err);
      toast.error('Failed to retrieve external book candidates: ' + (err.message || 'Network error'));
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelectCandidate = (index) => {
    const next = new Set(selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedIndices(next);
  };

  const handleSelectAll = () => {
    if (selectedIndices.size === displayCandidates.length) {
      setSelectedIndices(new Set());
    } else {
      const next = new Set();
      displayCandidates.forEach((_, idx) => next.add(idx));
      setSelectedIndices(next);
    }
  };

  const handleImportSelected = async () => {
    const toImport = [];
    selectedIndices.forEach((idx) => {
      if (candidates[idx]) {
        toImport.push(candidates[idx]);
      }
    });

    if (toImport.length === 0) {
      toast.info('No candidate records selected for import.');
      return;
    }

    setIsImporting(true);
    try {
      const result = await bookService.importCatalogCandidates(toImport);
      setImportReport(result);
      toast.success(`Successfully imported ${result.importedCount || 0} books (${result.skippedCount || 0} duplicates skipped).`);
      await loadStats();
      if (onBooksUpdated) onBooksUpdated();

      // Refresh candidate duplicate markers
      setCandidates((prev) =>
        prev.map((c) => {
          if (toImport.some((t) => t.title === c.title && t.author === c.author)) {
            return { ...c, isDuplicate: true };
          }
          return c;
        })
      );
      setSelectedIndices(new Set());
    } catch (err) {
      console.error('Import error:', err);
      toast.error('Catalog import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsImporting(false);
    }
  };

  const handleQuickBatchAutoImport = async () => {
    const effectiveKeyword = query.trim() || undefined;
    const cat = selectedCategory !== 'all' ? selectedCategory : undefined;
    const lang = selectedLanguage !== 'all' ? selectedLanguage : undefined;

    setIsAutoImporting(true);
    setImportReport(null);
    try {
      const report = await bookService.autoImportCatalog({
        category: cat,
        language: lang,
        keyword: effectiveKeyword,
        targetCount,
      });

      setImportReport(report);
      toast.success(
        `Batch import finished: ${report.importedCount || 0} imported, ${report.skippedCount || 0} skipped duplicates.`
      );
      await loadStats();
      if (onBooksUpdated) onBooksUpdated();
    } catch (err) {
      console.error('Auto-import error:', err);
      toast.error('Automated batch import failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsAutoImporting(false);
    }
  };

  const exportCandidatesToCsv = () => {
    if (candidates.length === 0) {
      toast.info('No candidates available to export.');
      return;
    }

    const headers = ['Title', 'Author', 'Category', 'Language', 'ISBN', 'Publisher', 'Year', 'Has Cover', 'Is Duplicate', 'Cover URL'];
    const rows = candidates.map((c) => [
      `"${(c.title || '').replace(/"/g, '""')}"`,
      `"${(c.author || '').replace(/"/g, '""')}"`,
      `"${(c.category || '').replace(/"/g, '""')}"`,
      `"${(c.language || '').replace(/"/g, '""')}"`,
      `"${(c.isbn || '').replace(/"/g, '""')}"`,
      `"${(c.publisher || '').replace(/"/g, '""')}"`,
      `"${(c.publishDate || '').slice(0, 4)}"`,
      c.coverUrl ? 'Yes' : 'No',
      c.isDuplicate ? 'Yes' : 'No',
      `"${(c.coverUrl || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `bookverse_catalog_candidates_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const displayCandidates = filterMissingCoversOnly
    ? candidates.filter((c) => !c.coverUrl)
    : candidates;

  return (
    <div className="catalog-import-container animate-fade-up">
      {/* 1. Live Catalog Counter and Statistics Banner */}
      <div
        className="glass-card mb-4"
        style={{
          padding: '24px',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(139, 92, 246, 0.08) 100%)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '1.4rem' }}>🌐</span>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                Real Book Catalog Expansion Hub
              </h3>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: 0, maxWidth: '650px' }}>
              Connect directly to official book metadata sources (Google Books & Open Library) to scale the BookVerse catalog.
              All imports are authenticated, strictly deduplicated against MySQL, and verified with legitimate covers.
            </p>
          </div>
          <button
            className="btn btn-secondary btn-sm"
            onClick={loadStats}
            title="Refresh database statistics"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <span>🔄</span>
            <span>Refresh Stats</span>
          </button>
        </div>

        {/* Dynamic Metric Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '16px',
            marginTop: '20px',
          }}
        >
          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Total MySQL Books
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981', marginTop: '4px' }}>
              {stats.totalBooks.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Active in storefront & inventory
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Verified Covers
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#38bdf8', marginTop: '4px' }}>
              {stats.booksWithCovers.toLocaleString()}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              High-resolution cover art
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Cover Availability
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#fbbf24', marginTop: '4px' }}>
              {stats.coverAvailabilityRate}
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {stats.booksWithoutCovers} books using typography fallback
            </div>
          </div>

          <div
            style={{
              padding: '16px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Progress to 10k Target
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#a855f7', marginTop: '4px' }}>
              {((stats.totalBooks / 10000) * 100).toFixed(1)}%
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Toward full catalog scaling
            </div>
          </div>
        </div>
      </div>

      {/* 2. Provider & Filter Configuration Form */}
      <form onSubmit={handleSearch} className="glass-card mb-4" style={{ padding: '24px' }}>
        <h4 style={{ fontSize: '1.05rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🔎</span>
          <span>Search & Discovery Parameters</span>
        </h4>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {/* Metadata Provider */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem' }}>Metadata Source</label>
            <select
              className="form-input"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            >
              <option value="google">Google Books API (Primary)</option>
              <option value="openlibrary">Open Library Search (Fallback)</option>
            </select>
          </div>

          {/* Language Selection */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem' }}>Language</label>
            <select
              className="form-input"
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
            >
              <option value="all">All Languages</option>
              <optgroup label="Indian Languages">
                <option value="English">English</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Odia">Odia (ଓଡ଼ିଆ)</option>
                <option value="Assamese">Assamese (অসমীয়া)</option>
                <option value="Urdu">Urdu (اردو)</option>
                <option value="Sanskrit">Sanskrit (संस्कृतम्)</option>
                <option value="Nepali">Nepali (नेपाली)</option>
                <option value="Konkani">Konkani (कोंकणी)</option>
              </optgroup>
              <optgroup label="International Languages">
                <option value="Spanish">Spanish (Español)</option>
                <option value="French">French (Français)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Italian">Italian (Italiano)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Chinese">Chinese (中文)</option>
                <option value="Japanese">Japanese (日本語)</option>
                <option value="Korean">Korean (한국어)</option>
                <option value="Russian">Russian (Русский)</option>
              </optgroup>
            </select>
          </div>

          {/* Category Selection */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem' }}>Target Category</label>
            <select
              className="form-input"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Batch Target Count */}
          <div className="form-group">
            <label style={{ fontSize: '0.85rem' }}>Target Batch Count</label>
            <select
              className="form-input"
              value={targetCount}
              onChange={(e) => setTargetCount(Number(e.target.value))}
            >
              <option value={10}>10 Books (Quick Verification)</option>
              <option value={20}>20 Books</option>
              <option value={40}>40 Books (Single Page)</option>
              <option value={80}>80 Books (Multi-Page)</option>
              <option value={150}>150 Books (Large Batch)</option>
              <option value={300}>300 Books (Heavy Batch)</option>
            </select>
          </div>
        </div>

        {/* Keyword Search & Actions */}
        <div style={{ marginTop: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <input
            className="form-input"
            style={{ flex: 1, minWidth: '240px' }}
            placeholder="Search by book title, author, subject, or ISBN (e.g. 'Premchand', 'Artificial Intelligence', 'Murakami')..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSearching || isImporting || isAutoImporting}
            style={{ minWidth: '150px' }}
          >
            {isSearching ? '⏳ Searching...' : '🔍 Search Catalog'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleQuickBatchAutoImport}
            disabled={isSearching || isImporting || isAutoImporting}
            title="Automatically discover and import up to target count directly into MySQL"
            style={{ border: '1px solid #10b981', color: '#10b981' }}
          >
            {isAutoImporting ? '⚡ Importing Pipeline...' : '⚡ Direct Batch Auto-Import'}
          </button>
        </div>
      </form>

      {/* 3. Live Batch Report Banner */}
      {importReport && (
        <div
          className="glass-card mb-4 animate-fade-in"
          style={{
            padding: '18px 24px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid #10b981',
            borderRadius: '8px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 6px 0', color: '#10b981', fontWeight: 700 }}>
                ✓ Import Operation Completed
              </h4>
              <div style={{ display: 'flex', gap: '16px', fontSize: '0.88rem', flexWrap: 'wrap' }}>
                <span><strong>Imported:</strong> {importReport.importedCount ?? importReport.newlyImportedCount ?? 0}</span>
                <span><strong>Skipped (Duplicates):</strong> {importReport.skippedCount ?? 0}</span>
                <span><strong>Failed:</strong> {importReport.failedCount ?? 0}</span>
                {importReport.currentTotalDatabaseBooks && (
                  <span><strong>Total Catalog Size:</strong> {importReport.currentTotalDatabaseBooks} books</span>
                )}
              </div>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setImportReport(null)}
              style={{ fontSize: '0.75rem' }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* 4. Candidates Preview & Batch Selection Table */}
      {candidates.length > 0 && (
        <div className="glass-card" style={{ padding: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600 }}>
                Candidate Books ({displayCandidates.length})
              </h4>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={filterMissingCoversOnly}
                  onChange={(e) => setFilterMissingCoversOnly(e.target.checked)}
                />
                <span>Missing Covers Only</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleSelectAll}
                type="button"
              >
                {selectedIndices.size === displayCandidates.length ? 'Deselect All' : 'Select All Available'}
              </button>
              <button
                className="btn btn-secondary btn-sm"
                onClick={exportCandidatesToCsv}
                type="button"
                style={{ border: '1px solid #38bdf8', color: '#38bdf8' }}
              >
                📄 Export CSV
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleImportSelected}
                disabled={isImporting || selectedIndices.size === 0}
                type="button"
              >
                {isImporting ? '⏳ Importing...' : `📥 Import Selected (${selectedIndices.size})`}
              </button>
            </div>
          </div>

          {/* Candidate Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '16px',
              maxHeight: '650px',
              overflowY: 'auto',
              paddingRight: '6px',
            }}
          >
            {displayCandidates.map((c, idx) => {
              const isSelected = selectedIndices.has(idx);
              const isDup = c.isDuplicate;

              return (
                <div
                  key={c.isbn || `${c.title}-${c.author}-${idx}`}
                  style={{
                    display: 'flex',
                    gap: '14px',
                    padding: '14px',
                    background: isSelected ? 'rgba(16, 185, 129, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    borderRadius: '8px',
                    border: isSelected
                      ? '1px solid #10b981'
                      : isDup
                      ? '1px solid rgba(245, 158, 11, 0.3)'
                      : '1px solid rgba(255, 255, 255, 0.08)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                  }}
                >
                  {/* Selection Checkbox */}
                  <div style={{ paddingTop: '2px' }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      disabled={isDup}
                      onChange={() => toggleSelectCandidate(idx)}
                      style={{ cursor: isDup ? 'not-allowed' : 'pointer' }}
                    />
                  </div>

                  {/* Book Cover Thumbnail */}
                  <div style={{ width: '64px', minWidth: '64px', height: '96px', borderRadius: '4px', overflow: 'hidden' }}>
                    <BookCover
                      src={c.coverUrl}
                      title={c.title}
                      author={c.author}
                      category={c.category}
                      language={c.language}
                      size="sm"
                    />
                  </div>

                  {/* Metadata Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '6px' }}>
                      <h5
                        style={{
                          margin: '0 0 4px 0',
                          fontSize: '0.88rem',
                          fontWeight: 600,
                          lineHeight: '1.25',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}
                        title={c.title}
                      >
                        {c.title}
                      </h5>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                      by <strong>{c.author}</strong>
                    </div>

                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '6px' }}>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: '#ccc',
                        }}
                      >
                        {c.category || 'General'}
                      </span>
                      <span
                        style={{
                          fontSize: '0.7rem',
                          padding: '1px 6px',
                          borderRadius: '4px',
                          background: 'rgba(139, 92, 246, 0.15)',
                          color: '#c084fc',
                        }}
                      >
                        {c.language || 'English'}
                      </span>
                    </div>

                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      {c.isbn ? `ISBN: ${c.isbn}` : 'No ISBN'}
                      {c.publishDate && ` • ${c.publishDate.slice(0, 4)}`}
                    </div>

                    {/* Status Badge */}
                    <div style={{ marginTop: '8px' }}>
                      {isDup ? (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(245, 158, 11, 0.15)',
                            color: '#fbbf24',
                            border: '1px solid rgba(245, 158, 11, 0.3)',
                          }}
                        >
                          ⚠️ Already in Database
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#34d399',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          ✓ Ready to Import
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default CatalogImportTab;

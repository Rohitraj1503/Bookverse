import React, { useState } from 'react';
import Modal from './Modal';
import bookService from '../services/bookService';
import { useToast } from '../context/ToastContext';

export const ExternalLookupModal = ({ isOpen, onClose, onSelectBook }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const toast = useToast();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.warning('Please enter a book title, ISBN, or author to search');
      return;
    }

    try {
      setLoading(true);
      setSearched(true);
      const candidates = await bookService.externalLookup(query.trim());
      setResults(Array.isArray(candidates) ? candidates : []);
      if (candidates.length === 0) {
        toast.info('No matching books found in external catalog sources.');
      } else {
        toast.success(`Found ${candidates.length} matching candidate(s)!`);
      }
    } catch (err) {
      console.error('External lookup failed:', err);
      toast.error('External lookup failed: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCandidate = (candidate) => {
    if (onSelectBook) {
      onSelectBook(candidate);
    }
    toast.info(`Pre-filled "${candidate.title}". Review and confirm to save.`);
    onClose();
  };

  const handleClose = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🔍 External Catalog Book Lookup"
      maxWidth="850px"
      actions={
        <button className="btn btn-secondary" onClick={handleClose}>
          Close
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
          <input
            className="form-input"
            style={{ flex: 1 }}
            placeholder="Search external catalogs by Title, ISBN (e.g. 9780132350884), or Author..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? '🔍 Searching...' : 'Search'}
          </button>
        </form>

        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Powered by Open Library and Google Books API feeds. Select any result to review, edit, and save into MySQL.
        </p>

        {/* Results Container */}
        <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔄</div>
              <p>Searching external book catalogs...</p>
            </div>
          ) : results.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {results.map((b, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '14px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-color)',
                    alignItems: 'center',
                  }}
                >
                  <img
                    src={b.coverUrl}
                    alt={b.title}
                    style={{
                      width: '60px',
                      height: '85px',
                      borderRadius: '6px',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/60x85?text=No+Cover';
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                        {b.source || 'Catalog'}
                      </span>
                      {b.language && (
                        <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                          {b.language}
                        </span>
                      )}
                      {b.category && (
                        <span className="badge badge-secondary" style={{ fontSize: '0.7rem' }}>
                          {b.category}
                        </span>
                      )}
                    </div>
                    <h4
                      style={{
                        margin: '6px 0 2px 0',
                        fontSize: '1rem',
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={b.title}
                    >
                      {b.title}
                    </h4>
                    {b.subtitle && (
                      <p
                        style={{
                          margin: 0,
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {b.subtitle}
                      </p>
                    )}
                    <p style={{ margin: '2px 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      by <strong>{b.author}</strong>
                      {b.publishDate && ` (${b.publishDate})`}
                    </p>
                    <div style={{ display: 'flex', gap: '14px', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {b.isbn && <span>ISBN: {b.isbn}</span>}
                      {b.publisher && <span>Pub: {b.publisher}</span>}
                      {b.pages && <span>{b.pages} pages</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    style={{ flexShrink: 0 }}
                    onClick={() => handleSelectCandidate(b)}
                  >
                    Select & Pre-fill ➔
                  </button>
                </div>
              ))}
            </div>
          ) : searched ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📭</div>
              <h4>No matching books found</h4>
              <p style={{ fontSize: '0.85rem' }}>Try searching by specific ISBN (e.g. 9780132350884) or title.</p>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Enter a search keyword, title, or ISBN above to look up metadata.
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExternalLookupModal;

import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import bookService from '../services/bookService';
import BookCover from './BookCover';
import { useToast } from '../context/ToastContext';
import { Search, Upload, Image, Check, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

export const CoverSelectorModal = ({
  isOpen,
  onClose,
  initialQuery = '',
  currentCoverUrl = '',
  bookTitle = '',
  bookAuthor = '',
  onSelectCover,
}) => {
  const [activeTab, setActiveTab] = useState('search'); // 'search' | 'upload' | 'url'
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCover, setSelectedCover] = useState(currentCoverUrl);
  const [customUrl, setCustomUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen) {
      const q = initialQuery || (bookTitle ? `${bookTitle} ${bookAuthor}`.trim() : '');
      setQuery(q);
      setSelectedCover(currentCoverUrl);
      if (q.trim()) {
        executeSearch(q.trim());
      }
    }
  }, [isOpen, initialQuery, bookTitle, bookAuthor, currentCoverUrl]);

  const executeSearch = async (searchTerm) => {
    if (!searchTerm.trim()) return;
    try {
      setLoading(true);
      const candidates = await bookService.externalLookup(searchTerm.trim());
      // Filter candidates that have a valid coverUrl
      const withCovers = (candidates || []).filter((c) => c.coverUrl && !c.coverUrl.includes('placeholder.com'));
      setResults(withCovers);
      if (withCovers.length === 0) {
        toast.info('No candidate covers found from external catalogs. You can upload an image or enter a URL.');
      }
    } catch (err) {
      console.error('Failed to lookup covers:', err);
      toast.error('Lookup failed: ' + (err.message || 'Network error'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      toast.warning('Please enter a book title, author, or ISBN to search');
      return;
    }
    executeSearch(query.trim());
  };

  const handlePickCandidate = (candidate) => {
    setSelectedCover(candidate.coverUrl);
    if (onSelectCover) {
      onSelectCover(candidate.coverUrl, candidate);
    }
    toast.success('Cover selected! Preview updated.');
    onClose();
  };

  const handleApplyCustomUrl = () => {
    if (!customUrl.trim()) {
      toast.warning('Please enter an image URL');
      return;
    }
    setSelectedCover(customUrl.trim());
    if (onSelectCover) {
      onSelectCover(customUrl.trim());
    }
    toast.success('Cover URL applied!');
    onClose();
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files (JPG, PNG, WebP) are allowed');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be under 5MB');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      const response = await api.post('/books/upload-cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const uploadedUrl = response.data?.url;
      if (uploadedUrl) {
        setSelectedCover(uploadedUrl);
        if (onSelectCover) {
          onSelectCover(uploadedUrl);
        }
        toast.success('Cover image uploaded successfully!');
        onClose();
      }
    } catch (err) {
      console.error('Image upload failed:', err);
      toast.error('Upload failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="🖼️ Book Cover Selection & Lookup"
      maxWidth="820px"
      actions={
        <button className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Navigation Tabs */}
        <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-glass)', paddingBottom: '12px' }}>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('search')}
          >
            <Search size={14} /> Search Online (Google / OpenLibrary)
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'upload' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('upload')}
          >
            <Upload size={14} /> Upload Image File
          </button>
          <button
            type="button"
            className={`btn btn-sm ${activeTab === 'url' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab('url')}
          >
            <Image size={14} /> Custom Image URL
          </button>
        </div>

        {/* Tab 1: Search Online */}
        {activeTab === 'search' && (
          <div>
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                placeholder="Search by Title, Author, or ISBN (e.g. 9780132350884)..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Searching...' : 'Find Covers'}
              </button>
            </form>

            <div style={{ maxHeight: '420px', overflowY: 'auto', paddingRight: '4px' }}>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔄</div>
                  <p>Searching Google Books & Open Library catalogs...</p>
                </div>
              ) : results.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {results.map((candidate, idx) => (
                    <div
                      key={idx}
                      style={{
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: '10px',
                        padding: '12px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '10px',
                        position: 'relative',
                        transition: 'transform 0.2s ease, border-color 0.2s ease',
                      }}
                      className="cover-candidate-card"
                    >
                      <div style={{ width: '120px', height: '170px' }}>
                        <BookCover
                          src={candidate.coverUrl}
                          title={candidate.title}
                          author={candidate.author}
                          fit="contain"
                          size="sm"
                        />
                      </div>
                      <div style={{ textAlign: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '4px', marginBottom: '4px' }}>
                          <span className="badge badge-purple" style={{ fontSize: '0.65rem' }}>
                            {candidate.source || 'Online'}
                          </span>
                          {candidate.language && (
                            <span className="badge badge-secondary" style={{ fontSize: '0.65rem' }}>
                              {candidate.language}
                            </span>
                          )}
                        </div>
                        <h5
                          style={{
                            margin: '4px 0 2px',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={candidate.title}
                        >
                          {candidate.title}
                        </h5>
                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {candidate.author} {candidate.publishDate ? `(${candidate.publishDate})` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        style={{ width: '100%', marginTop: 'auto', padding: '6px 10px', fontSize: '0.78rem' }}
                        onClick={() => handlePickCandidate(candidate)}
                      >
                        ✓ Select This Cover
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  <Search size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                  <p>Enter title, author, or ISBN above to look up candidate covers.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Upload File */}
        {activeTab === 'upload' && (
          <div style={{ padding: '20px 0' }}>
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              style={{
                border: `2px dashed ${dragOver ? 'var(--accent, #8b5cf6)' : 'var(--border-color, #2a3142)'}`,
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                background: dragOver ? 'rgba(139, 92, 246, 0.05)' : 'rgba(255, 255, 255, 0.02)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => document.getElementById('coverFileInput').click()}
            >
              <input
                id="coverFileInput"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                style={{ display: 'none' }}
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <Upload size={40} style={{ color: 'var(--accent, #8b5cf6)', marginBottom: '12px' }} />
              <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 600 }}>
                {uploading ? 'Uploading Cover Image...' : 'Click or Drag & Drop Cover Image'}
              </h4>
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Supports JPG, PNG, and WebP (Max size: 5MB). File will be stored securely on the backend server.
              </p>
            </div>
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeTab === 'url' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label>Direct Image URL</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  className="form-input"
                  placeholder="https://example.com/images/book-cover.jpg"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                />
                <button type="button" className="btn btn-primary" onClick={handleApplyCustomUrl}>
                  Apply URL
                </button>
              </div>
            </div>

            {customUrl && (
              <div style={{ textAlign: 'center', padding: '10px' }}>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Preview:</p>
                <div style={{ width: '130px', height: '185px', margin: '0 auto' }}>
                  <BookCover src={customUrl} title={bookTitle || 'Preview'} author={bookAuthor || ''} fit="contain" />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default CoverSelectorModal;

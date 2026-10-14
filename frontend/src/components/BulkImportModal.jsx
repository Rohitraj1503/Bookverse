import React, { useState, useRef } from 'react';
import Modal from './Modal';
import bookService from '../services/bookService';
import { useToast } from '../context/ToastContext';

export const BulkImportModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [parsedRows, setParsedRows] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const fileInputRef = useRef(null);
  const toast = useToast();

  const resetState = () => {
    setFile(null);
    setFileName('');
    setParsedRows([]);
    setValidationErrors([]);
    setIsImporting(false);
    setImportSummary(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const parseCSV = (text) => {
    const lines = [];
    let row = [''];
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      const next = text[i + 1];

      if (c === '"') {
        if (inQuotes && next === '"') {
          row[row.length - 1] += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === ',' && !inQuotes) {
        row.push('');
      } else if ((c === '\r' || c === '\n') && !inQuotes) {
        if (c === '\r' && next === '\n') i++;
        lines.push(row);
        row = [''];
      } else {
        row[row.length - 1] += c;
      }
    }
    if (row.length > 1 || row[0] !== '') lines.push(row);
    if (lines.length === 0) return [];

    const rawHeaders = lines[0];
    const headers = rawHeaders.map((h) =>
      h.trim().toLowerCase().replace(/[\s-]+/g, '_').replace(/^[^a-z0-9_]+|[^a-z0-9_]+$/g, '')
    );

    const rows = [];
    const clientErrors = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.every((cell) => !cell || cell.trim() === '')) continue;

      const obj = {};
      headers.forEach((h, idx) => {
        obj[h] = (line[idx] || '').trim();
      });

      // Basic client validation
      const rowNum = i;
      const issues = [];
      if (!obj.title) issues.push('Missing Title');
      if (!obj.author) issues.push('Missing Author');
      if (!obj.selling_price && !obj.price) issues.push('Missing Price');

      obj._rowNumber = rowNum;
      obj._issues = issues;
      obj._isValid = issues.length === 0;

      rows.push(obj);
      if (issues.length > 0) {
        clientErrors.push(`Row ${rowNum}: ${issues.join(', ')}`);
      }
    }

    return { rows, clientErrors };
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a valid .csv file');
      return;
    }

    setFileName(selectedFile.name);
    setFile(selectedFile);
    setImportSummary(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        if (!text) {
          toast.error('File appears to be empty');
          return;
        }
        const { rows, clientErrors } = parseCSV(text);
        if (rows.length === 0) {
          toast.warning('No valid data rows detected in CSV file');
        } else {
          toast.info(`Parsed ${rows.length} rows from CSV`);
        }
        setParsedRows(rows);
        setValidationErrors(clientErrors);
      } catch (err) {
        console.error('Error parsing CSV:', err);
        toast.error('Failed to parse CSV file: ' + err.message);
      }
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleDownloadTemplate = () => {
    const headers = [
      'title',
      'subtitle',
      'author',
      'short_description',
      'full_description',
      'language',
      'isbn',
      'publisher',
      'publication_date',
      'edition',
      'page_count',
      'format',
      'category',
      'cover_image_url',
      'original_price',
      'selling_price',
      'stock_quantity',
      'series_name',
      'volume_number',
    ];

    const sampleRows = [
      [
        'Godan',
        'Classic Hindi Novel',
        'Munshi Premchand',
        'The epic story of rural Indian peasant life and sacrifice',
        'Godan is widely considered one of the greatest Hindi novels of modern Indian literature...',
        'Hindi',
        '9788171820028',
        'Rajkamal Prakashan',
        '1936-01-01',
        'Collector Edition',
        '384',
        'Paperback',
        'Fiction',
        'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=600',
        '399.00',
        '299.00',
        '60',
        '',
        '',
      ],
      [
        'Ponniyin Selvan Volume 1',
        'The First Flood',
        'Kalki Krishnamurthy',
        'Historical fiction masterpiece depicting the Chola dynasty',
        'Ponniyin Selvan narrates the intriguing tales and political conspiracies of the Chola empire...',
        'Tamil',
        '9789386224101',
        'Vanathi Pathipagam',
        '1954-01-01',
        '1st Edition',
        '420',
        'Hardcover',
        'Historical Fiction',
        'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&q=80&w=600',
        '550.00',
        '450.00',
        '45',
        'Ponniyin Selvan',
        '1',
      ],
      [
        'Attack on Titan Vol. 1',
        'The Battle for Humanity',
        'Hajime Isayama',
        'Humanity fights for survival against terrifying colossal Titans',
        'Centuries ago mankind was slaughtered nearly to extinction by monstrous humanoid creatures...',
        'Japanese',
        '9781612620244',
        'Kodansha Comics',
        '2012-06-19',
        'Standard Manga',
        '192',
        'Manga',
        'Manga',
        'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&q=80&w=600',
        '699.00',
        '599.00',
        '35',
        'Attack on Titan',
        '1',
      ],
    ];

    const csvContent = [
      headers.join(','),
      ...sampleRows.map((r) => r.map((c) => `"${(c || '').replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'bookverse_catalog_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloaded CSV template');
  };

  const handleExecuteImport = async () => {
    if (!parsedRows || parsedRows.length === 0) {
      toast.error('No rows to import. Please select a valid CSV file.');
      return;
    }

    try {
      setIsImporting(true);
      const cleanedRows = parsedRows.map(({ _rowNumber, _issues, _isValid, ...rest }) => rest);
      const summary = await bookService.bulkImport(cleanedRows);
      setImportSummary(summary);

      if (summary.importedCount > 0) {
        toast.success(`Successfully imported ${summary.importedCount} books into MySQL!`);
        if (onImportSuccess) onImportSuccess();
      } else if (summary.skippedDuplicatesCount > 0 && summary.failedValidationCount === 0) {
        toast.info('No new books were added (all rows were existing duplicates).');
      } else {
        toast.warning('Import completed with validation warnings.');
      }
    } catch (err) {
      console.error('Bulk import failed:', err);
      toast.error('Failed to execute bulk import: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="📥 Bulk Book Import (CSV)"
      maxWidth="900px"
      actions={
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', width: '100%' }}>
          <button className="btn btn-secondary" onClick={handleClose} disabled={isImporting}>
            {importSummary ? 'Done' : 'Cancel'}
          </button>
          {!importSummary && (
            <button
              className="btn btn-primary"
              onClick={handleExecuteImport}
              disabled={isImporting || parsedRows.length === 0}
            >
              {isImporting ? '⏳ Importing to MySQL...' : `Execute Import (${parsedRows.length} Rows)`}
            </button>
          )}
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Upload & Template Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            background: 'rgba(99, 102, 241, 0.08)',
            padding: '16px',
            borderRadius: '12px',
            border: '1px solid rgba(99, 102, 241, 0.2)',
          }}
        >
          <div>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>
              Upload Book Catalog (.csv)
            </h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Supports Indian & International languages, standard books, comics, manga, and textbooks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleDownloadTemplate}
              title="Download standard CSV template with sample multilingual & manga rows"
            >
              ⬇️ Download CSV Template
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,text/csv"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => fileInputRef.current?.click()}
            >
              📂 Choose File
            </button>
          </div>
        </div>

        {/* Selected file banner */}
        {fileName && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 16px',
              background: 'rgba(255, 255, 255, 0.04)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📄</span>
              <strong style={{ fontSize: '0.9rem' }}>{fileName}</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({parsedRows.length} rows loaded)
              </span>
            </div>
            {validationErrors.length > 0 && (
              <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                ⚠️ {validationErrors.length} format warning{validationErrors.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
        )}

        {/* Real Summary Metrics from Backend */}
        {importSummary && (
          <div
            style={{
              padding: '16px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
            }}
          >
            <h4 style={{ margin: '0 0 12px 0', color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
              ✅ Database Import Execution Summary
            </h4>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
                gap: '12px',
                textAlign: 'center',
              }}
            >
              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Rows</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700 }}>{importSummary.totalRows}</div>
              </div>
              <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#10b981' }}>Successfully Imported</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#10b981' }}>
                  {importSummary.importedCount}
                </div>
              </div>
              <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#f59e0b' }}>Skipped Duplicates</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#f59e0b' }}>
                  {importSummary.skippedDuplicatesCount}
                </div>
              </div>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '8px' }}>
                <div style={{ fontSize: '0.75rem', color: '#ef4444' }}>Failed Validation</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ef4444' }}>
                  {importSummary.failedValidationCount}
                </div>
              </div>
            </div>

            {/* Error & Warning Details */}
            {importSummary.errors && importSummary.errors.length > 0 && (
              <div style={{ marginTop: '14px' }}>
                <h5 style={{ margin: '0 0 6px 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                  Detailed Row Notifications:
                </h5>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: '20px',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)',
                    maxHeight: '120px',
                    overflowY: 'auto',
                  }}
                >
                  {importSummary.errors.map((err, idx) => (
                    <li key={idx} style={{ marginBottom: '2px' }}>
                      {err}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Client Preview Table */}
        {parsedRows.length > 0 && !importSummary && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <h5 style={{ margin: 0, fontSize: '0.9rem' }}>
                Preview Parsed Records ({parsedRows.length})
              </h5>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Inspect columns and status before committing to MySQL
              </span>
            </div>
            <div
              style={{
                maxHeight: '260px',
                overflow: 'auto',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                background: 'rgba(0,0,0,0.2)',
              }}
            >
              <table className="data-table" style={{ fontSize: '0.8rem', width: '100%' }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Status</th>
                    <th>Title</th>
                    <th>Author</th>
                    <th>Language</th>
                    <th>Category</th>
                    <th>Format</th>
                    <th>Price</th>
                    <th>ISBN</th>
                    <th>Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedRows.slice(0, 50).map((r, i) => (
                    <tr key={i} style={{ opacity: r._isValid ? 1 : 0.75 }}>
                      <td>{r._rowNumber}</td>
                      <td>
                        {r._isValid ? (
                          <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                            ✓ Valid
                          </span>
                        ) : (
                          <span
                            className="badge badge-danger"
                            style={{ fontSize: '0.7rem' }}
                            title={r._issues?.join(', ')}
                          >
                            ⚠️ Issues
                          </span>
                        )}
                      </td>
                      <td>
                        <strong>{r.title || '—'}</strong>
                        {r.subtitle && (
                          <span style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            {r.subtitle}
                          </span>
                        )}
                      </td>
                      <td>{r.author || '—'}</td>
                      <td>
                        <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                          {r.language || 'English'}
                        </span>
                      </td>
                      <td>{r.category || 'General'}</td>
                      <td>{r.format || 'Paperback'}</td>
                      <td>₹{r.selling_price || r.price || '0.00'}</td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{r.isbn || '—'}</td>
                      <td>{r.stock_quantity || r.stock || '50'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {parsedRows.length > 50 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
                Showing first 50 rows of {parsedRows.length} total rows.
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default BulkImportModal;

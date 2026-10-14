import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Caught render error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 20px',
            color: '#fff',
          }}
        >
          <div
            className="glass-card"
            style={{
              maxWidth: '600px',
              width: '100%',
              padding: '32px',
              background: 'rgba(20, 20, 22, 0.95)',
              border: '1px solid rgba(240, 185, 11, 0.3)',
              borderRadius: '16px',
              textAlign: 'center',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '8px' }}>
              Dashboard View Recovery
            </h3>
            <p style={{ color: 'var(--text-secondary, #a1a1aa)', fontSize: '0.9rem', marginBottom: '24px' }}>
              A rendering issue occurred while loading this view. The system caught it safely so the rest of the application remains intact.
            </p>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={this.handleRetry}
                style={{
                  background: 'var(--gradient-gold, linear-gradient(135deg, #F0B90B 0%, #D4AF37 50%, #B8860B 100%))',
                  color: '#000',
                  fontWeight: 700,
                  border: 'none',
                }}
              >
                🔄 Retry View
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => window.location.reload()}
              >
                Reload Dashboard
              </button>
              <a href="/" className="btn btn-secondary">
                Return Home
              </a>
            </div>

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details style={{ textAlign: 'left', marginTop: '20px', fontSize: '0.8rem', color: '#fbbf24' }}>
                <summary style={{ cursor: 'pointer', marginBottom: '8px' }}>Diagnostic Details</summary>
                <pre
                  style={{
                    background: 'rgba(0, 0, 0, 0.5)',
                    padding: '12px',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    whiteSpace: 'pre-wrap',
                    color: '#f87171',
                  }}
                >
                  {this.state.error.toString()}
                  {'\n\n'}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

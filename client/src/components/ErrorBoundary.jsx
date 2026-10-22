import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          maxWidth: '600px',
          margin: '60px auto',
          padding: '32px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          fontFamily: 'Inter, -apple-system, sans-serif'
        }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>⚠️</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', marginBottom: '8px' }}>
            Something went wrong loading this section
          </h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '24px' }}>
            {this.state.error?.message || 'An unexpected error occurred while rendering this page.'}
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Reload Page
            </button>
            <button
              onClick={() => {
                window.location.href = '/';
              }}
              style={{
                padding: '10px 20px',
                background: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Go to Home
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

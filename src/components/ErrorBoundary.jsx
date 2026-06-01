import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("PromptPilot ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '24px',
          background: 'var(--bg-primary, #1e1e2e)',
          color: 'var(--text-primary, #cdd6f4)',
          borderRadius: '12px',
          border: '1.5px dashed var(--accent-red, #f38ba8)',
          margin: '16px',
          textAlign: 'center',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <h2 style={{ color: 'var(--accent-red, #f38ba8)', fontSize: '18px', marginBottom: '8px' }}>Something went wrong</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted, #a6adc8)', marginBottom: '16px' }}>
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: '8px 16px',
              background: 'var(--accent-light, #cba6f7)',
              border: 'none',
              borderRadius: '8px',
              color: '#11111b',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

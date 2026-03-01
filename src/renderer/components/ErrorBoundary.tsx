import React from 'react';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          data-testid="error-boundary"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            backgroundColor: '#000000',
            color: '#CCCCCC',
            fontFamily: 'sans-serif',
            padding: '40px',
            textAlign: 'center',
          }}
        >
          <h1 style={{ color: '#FF4444', fontSize: '32px', marginBottom: '16px' }}>
            Something went wrong
          </h1>
          <p style={{ fontSize: '16px', color: '#999999', maxWidth: '500px', marginBottom: '32px' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <button
            data-testid="button-error-reset"
            onClick={this.handleReset}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#333333',
              color: '#CCCCCC',
              border: '1px solid #555555',
              cursor: 'pointer',
            }}
          >
            Return to Menu
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

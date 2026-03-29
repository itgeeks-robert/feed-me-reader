import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="error-boundary-container">
          <div className="error-card">
            <h1 className="error-title">SIGNAL LOST</h1>
            <p className="error-message">
              {this.state.error?.message || 'An unexpected error occurred.'}
            </p>
            <button className="retry-button" onClick={this.handleRetry}>
              RETRY
            </button>
          </div>

          <style>{`
            .error-boundary-container {
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 24px;
              width: 100%;
              height: 100%;
              min-height: 200px;
              background: transparent;
            }

            .error-card {
              background: var(--c-surface);
              border: 1px solid var(--c-border);
              border-radius: var(--r-card);
              padding: 32px;
              max-width: 400px;
              width: 100%;
              text-align: center;
              box-shadow: 0 12px 32px rgba(0,0,0,0.3);
              animation: error-shake 500ms ease;
            }

            @keyframes error-shake {
              0%, 100% { transform: translateX(0); }
              25% { transform: translateX(-5px); }
              75% { transform: translateX(5px); }
            }

            .error-title {
              font-family: 'Syne', sans-serif;
              font-size: 24px;
              font-weight: 800;
              color: var(--c-accent);
              margin-bottom: 12px;
              letter-spacing: -0.02em;
            }

            .error-message {
              font-family: 'DM Sans', sans-serif;
              font-size: 14px;
              color: var(--c-muted);
              margin-bottom: 24px;
              line-height: 1.5;
            }

            .retry-button {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              padding: 10px 24px;
              background: var(--c-accent);
              color: #fff;
              border: none;
              border-radius: 8px;
              font-family: 'DM Sans', sans-serif;
              font-size: 13px;
              font-weight: 700;
              letter-spacing: 0.05em;
              cursor: pointer;
              transition: all 200ms ease;
            }

            .retry-button:hover {
              filter: brightness(1.1);
              transform: translateY(-1px);
            }

            .retry-button:active {
              transform: translateY(0);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * HOC wrapper for ErrorBoundary
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `WithErrorBoundary(${Component.displayName || Component.name || 'Component'})`;
  return WrappedComponent;
}

import React, { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: string;
}

export class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: '' };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[Web3ErrorBoundary] Caught error:', error, errorInfo);
    this.setState({
      errorInfo: errorInfo.componentStack || '',
    });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: '' });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="glass-card p-8 max-w-lg w-full text-center animate-scale-in">
            {/* Error Icon */}
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-error/10 border border-error/20 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-error" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-400 mb-6">
              A Web3 error occurred. This may be due to a network issue or wallet disconnection.
            </p>

            {/* Error Details */}
            {this.state.error && (
              <div className="mb-6 p-4 rounded-xl bg-background/80 border border-border text-left">
                <p className="text-sm font-mono text-error/80 break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 rounded-xl bg-surface border border-border text-white font-medium
                           hover:border-primary/30 transition-all duration-300 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="gradient-button px-6 py-3"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

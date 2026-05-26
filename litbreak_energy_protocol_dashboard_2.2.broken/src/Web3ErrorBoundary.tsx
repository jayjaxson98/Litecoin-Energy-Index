// ISOLATED ERROR BOUNDARY — lives at src/ root, NOT inside src/components/.
//
// WHY THIS LOCATION MATTERS:
//   Vite builds a module graph where every file in src/components/ is
//   co-located with context-consuming components. When any component in
//   that folder changes, Vite walks the entire folder's import graph to
//   find what to invalidate. If Web3ErrorBoundary.tsx lives there, it gets
//   caught in that walk even though it has zero context imports — because
//   Vite's invalidation is graph-edge-based, not import-content-based.
//
//   By moving this file to src/ root and importing it ONLY from main.tsx
//   (which is the module graph root), we guarantee it has exactly ONE
//   incoming edge in the graph: main.tsx → Web3ErrorBoundary.
//   No component, no context, no hook can ever invalidate it.
//
// ZERO EXTERNAL DEPENDENCIES — intentional:
//   No lucide-react, no Tailwind, no context imports.
//   This component must be resolvable before any provider initializes.
import React, { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class Web3ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[Web3ErrorBoundary]', error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#171717',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⚠️</div>
          <h2
            style={{
              color: '#fff',
              fontSize: '1.125rem',
              fontWeight: 700,
              marginBottom: '0.5rem',
            }}
          >
            Something went wrong
          </h2>
          <p
            style={{
              color: '#a3a3a3',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
            }}
          >
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              borderRadius: '0.75rem',
              background: '#9E7FFF',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 600,
              border: 'none',
              cursor: 'pointer',
            }}
          >
            ↺ Try Again
          </button>
        </div>
      </div>
    );
  }
}

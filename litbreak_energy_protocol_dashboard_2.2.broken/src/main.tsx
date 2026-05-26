// main.tsx — module graph root.
//
// Web3ErrorBoundary is imported HERE (not in App.tsx) so that it has
// exactly one incoming graph edge: main.tsx → Web3ErrorBoundary.
// This means no component HMR invalidation can ever reach it.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Web3ErrorBoundary } from './Web3ErrorBoundary';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Web3ErrorBoundary>
      <App />
    </Web3ErrorBoundary>
  </StrictMode>
);

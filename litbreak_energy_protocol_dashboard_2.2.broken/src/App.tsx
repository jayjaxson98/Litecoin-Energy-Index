// App.tsx — provider + layout composition.
//
// Web3ErrorBoundary is intentionally NOT imported here.
// It lives in src/Web3ErrorBoundary.tsx and is mounted in main.tsx
// so it sits outside the component HMR invalidation graph entirely.
//
// Import order (one-way dependency chain, no cycles):
//   1. Web3Provider    — no deps
//   2. WalletProvider  — depends on Web3Context only
//   3. UI components   — consume contexts via hooks
import { Web3Provider }   from './contexts/Web3Context';
import { WalletProvider } from './contexts/WalletContext';
import { NetworkGuard }   from './components/NetworkGuard';
import { TransactionToast } from './components/TransactionToast';
import { SimulationBadge }  from './components/SimulationBadge';
import Dashboard            from './components/Dashboard';

export default function App() {
  return (
    <Web3Provider>
      <WalletProvider>
        <NetworkGuard />
        <Dashboard />
        <TransactionToast />
        <SimulationBadge />
      </WalletProvider>
    </Web3Provider>
  );
}

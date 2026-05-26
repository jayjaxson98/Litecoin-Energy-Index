import { Web3Provider } from './contexts/Web3Context';
import { WalletProvider } from './contexts/WalletContext';
import { Web3ErrorBoundary } from './components/Web3ErrorBoundary';
import { NetworkGuard } from './components/NetworkGuard';
import { TransactionToast } from './components/TransactionToast';
import { SimulationBadge } from './components/SimulationBadge';
import Dashboard from './components/Dashboard';

export default function App() {
  return (
    <Web3Provider>
      <WalletProvider>
        <Web3ErrorBoundary>
          <NetworkGuard />
          <Dashboard />
          <TransactionToast />
          <SimulationBadge />
        </Web3ErrorBoundary>
      </WalletProvider>
    </Web3Provider>
  );
}

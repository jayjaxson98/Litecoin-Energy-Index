/**
 * Litbreak Wallet Module — Barrel Export
 */

// Context & Provider
export { WalletProvider, useWalletContext } from '../context/WalletContext';

// Hook
export { useWallet } from '../hooks/useWallet';

// Components
export { WalletConnectButton } from './WalletConnectButton';
export { WalletModal } from './WalletModal';
export { WalletPanel } from './WalletPanel';
export { WalletBalance } from './WalletBalance';
export { TransactionHistory } from './TransactionHistory';
export { SendReceive } from './SendReceive';
export { NetworkBadge } from './NetworkBadge';

// Types (re-export for convenience)
export type {
  WalletType,
  WalletAccount,
  TokenBalance,
  Transaction,
  TransactionRequest,
  ChainNetwork,
  WalletState,
  WalletContextValue,
  ConnectionStatus,
  TxStatus,
  TxDirection,
} from '../types/wallet';

export {
  LITECOIN_NETWORK,
  ETHEREUM_NETWORK,
  SEPOLIA_NETWORK,
  SUPPORTED_NETWORKS,
  WALLET_OPTIONS,
  truncateAddress,
  formatBalance,
  formatUsd,
  generateMockAddress,
  generateTxHash,
} from '../types/wallet';

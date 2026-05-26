// Legacy barrel re-export — some files import from 'context/WalletContext'.
// Canonical implementation lives at 'contexts/WalletContext'.
export { WalletProvider, useWallet, WalletContext } from '../contexts/WalletContext';
export type { WalletContextValue, WalletStatus } from '../contexts/WalletContext';

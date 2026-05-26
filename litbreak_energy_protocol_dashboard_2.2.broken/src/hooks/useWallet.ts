/**
 * Re-export useWallet from WalletContext for convenience.
 * Some components import from hooks/useWallet instead of contexts/WalletContext.
 */
export { useWallet } from '../contexts/WalletContext';
export type { WalletContextValue } from '../contexts/WalletContext';

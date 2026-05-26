/**
 * Re-export useWallet as useWalletContext for backward compatibility.
 * Some components may import useWalletContext instead of useWallet.
 */
export { useWallet as useWalletContext } from '../contexts/WalletContext';
export type { WalletContextValue as WalletContextReturn } from '../contexts/WalletContext';

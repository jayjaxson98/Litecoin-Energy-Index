/**
 * Legacy re-export — some components import from 'context/WalletContext'
 * instead of 'contexts/WalletContext'. This barrel file ensures both paths work.
 */
export { WalletContext, WalletProvider, useWallet } from '../contexts/WalletContext';
export type { WalletContextValue } from '../contexts/WalletContext';

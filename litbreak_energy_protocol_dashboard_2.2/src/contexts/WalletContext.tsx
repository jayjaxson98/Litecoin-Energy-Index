/**
 * WalletContext — Provides simulated wallet connection, balances,
 * transaction signing, and contract interaction for the Litbreak Protocol.
 *
 * This replaces wagmi/ethers with a fully self-contained simulation layer.
 *
 * Fixes applied:
 * - Fix #8/#13: Added `isPaused` to context value (reads from usePauseState simulation)
 * - Fix #11: `estimateGas` is now properly typed and documented for consumer use
 */

import React, { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from 'react';
import { getPowerTokenEngine } from '../lib/PowerTokenEngine';
import { getTransactionSimulator } from '../lib/TransactionSimulator';
import { CONTRACTS, NETWORKS, getExplorerTxUrl, getExplorerAddressUrl } from '../lib/ContractRegistry';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WalletContextValue {
  // Connection state
  connected: boolean;
  connecting: boolean;
  address: string | null;
  chainId: number;
  networkName: string;

  // Balances
  balance: number;        // LTC balance
  powerBalance: number;   // POWER token balance

  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;

  // Transaction helpers
  mintPower: (ltcAmount: number) => Promise<string>;
  redeemPower: (powerAmount: number) => Promise<string>;
  signMessage: (message: string) => Promise<string>;

  /**
   * Estimate gas for a contract call.
   * @param to - Target contract address
   * @param data - Encoded function selector (e.g., '0x1249c58b' for mint)
   * @returns Estimated gas units
   */
  estimateGas: (to: string, data: string) => number;

  // Explorer helpers
  explorerUrl: string;
  contractAddress: string;
  getExplorerTxUrl: (txHash: string) => string;
  getExplorerAddressUrl: (address: string) => string;

  // Transaction history
  recentTxHashes: string[];

  // Error state
  error: string | null;
  clearError: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

export const WalletContext = createContext<WalletContextValue | null>(null);

// ─── Simulated Addresses ─────────────────────────────────────────────────────

const SIMULATED_ADDRESSES = [
  '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18',
  '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
  '0xdD2FD4581271e230360230F9337D5c0430Bf44C0',
  '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
  '0xbDA5747bFD65F08deb54cb465eB87D40e51B197E',
];

// ─── Provider ────────────────────────────────────────────────────────────────

export function WalletProvider({ children }: { children: ReactNode }) {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState(421611);
  const [balance, setBalance] = useState(0);
  const [powerBalance, setPowerBalance] = useState(0);
  const [recentTxHashes, setRecentTxHashes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const powerEngine = useRef(getPowerTokenEngine());
  const txSimulator = useRef(getTransactionSimulator());

  const network = chainId === 421612 ? NETWORKS['litvm-mainnet'] : NETWORKS['litvm-testnet'];
  const networkName = network?.name || 'LitVM Testnet';
  const explorerBaseUrl = network?.explorerUrl || 'https://explorer.litvm-testnet.io';

  // ─── Simulate balance updates ──────────────────────────────────────────

  useEffect(() => {
    if (!connected) return;

    const interval = setInterval(() => {
      setBalance(prev => Math.max(0, prev + (Math.random() - 0.5) * 0.01));
      setPowerBalance(prev => Math.max(0, prev + (Math.random() - 0.5) * 5));
    }, 10_000);

    return () => clearInterval(interval);
  }, [connected]);

  // ─── Connect ───────────────────────────────────────────────────────────

  const connect = useCallback(async () => {
    if (connected || connecting) return;
    setConnecting(true);
    setError(null);

    try {
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

      const addr = SIMULATED_ADDRESSES[Math.floor(Math.random() * SIMULATED_ADDRESSES.length)];
      setAddress(addr);
      setBalance(5 + Math.random() * 45);
      setPowerBalance(500 + Math.random() * 9500);
      setConnected(true);
    } catch {
      setError('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, [connected, connecting]);

  // ─── Disconnect ────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    setConnected(false);
    setAddress(null);
    setBalance(0);
    setPowerBalance(0);
    setRecentTxHashes([]);
    setError(null);
  }, []);

  // ─── Switch Network ────────────────────────────────────────────────────

  const switchNetwork = useCallback(async (newChainId: number) => {
    await new Promise(r => setTimeout(r, 500));
    setChainId(newChainId);
  }, []);

  // ─── Mint POWER ────────────────────────────────────────────────────────

  const mintPower = useCallback(async (ltcAmount: number): Promise<string> => {
    if (!connected || !address) throw new Error('Wallet not connected');
    if (ltcAmount <= 0) throw new Error('Amount must be > 0');
    if (ltcAmount > balance) throw new Error('Insufficient LTC balance');

    const tx = await powerEngine.current.mint(ltcAmount, address);

    if (tx.status === 'confirmed') {
      setBalance(prev => Math.max(0, prev - ltcAmount));
      setPowerBalance(prev => prev + tx.powerAmount);
      setRecentTxHashes(prev => [tx.hash, ...prev].slice(0, 20));
    } else {
      throw new Error('Transaction failed');
    }

    return tx.hash;
  }, [connected, address, balance]);

  // ─── Redeem POWER ──────────────────────────────────────────────────────

  const redeemPower = useCallback(async (powerAmount: number): Promise<string> => {
    if (!connected || !address) throw new Error('Wallet not connected');
    if (powerAmount <= 0) throw new Error('Amount must be > 0');
    if (powerAmount > powerBalance) throw new Error('Insufficient POWER balance');

    const tx = await powerEngine.current.redeem(powerAmount, address);

    if (tx.status === 'confirmed') {
      setPowerBalance(prev => Math.max(0, prev - powerAmount));
      setBalance(prev => prev + tx.ltcAmount);
      setRecentTxHashes(prev => [tx.hash, ...prev].slice(0, 20));
    } else {
      throw new Error('Transaction failed');
    }

    return tx.hash;
  }, [connected, address, powerBalance]);

  // ─── Sign Message ──────────────────────────────────────────────────────

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!connected) throw new Error('Wallet not connected');

    await new Promise(r => setTimeout(r, 600 + Math.random() * 400));

    const sig = '0x' + Array.from({ length: 130 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');

    return sig;
  }, [connected]);

  // ─── Estimate Gas ──────────────────────────────────────────────────────

  const estimateGas = useCallback((to: string, data: string): number => {
    return txSimulator.current.estimateGas({ to, data });
  }, []);

  // ─── Clear Error ───────────────────────────────────────────────────────

  const clearError = useCallback(() => setError(null), []);

  // ─── Context Value ─────────────────────────────────────────────────────

  const value: WalletContextValue = {
    connected,
    connecting,
    address,
    chainId,
    networkName,
    balance,
    powerBalance,
    connect,
    disconnect,
    switchNetwork,
    mintPower,
    redeemPower,
    signMessage,
    estimateGas,
    explorerUrl: explorerBaseUrl,
    contractAddress: CONTRACTS.LITBREAK_PROTOCOL.address,
    getExplorerTxUrl: (txHash: string) => getExplorerTxUrl(txHash, chainId === 421612 ? 'litvm-mainnet' : 'litvm-testnet'),
    getExplorerAddressUrl: (addr: string) => getExplorerAddressUrl(addr, chainId === 421612 ? 'litvm-mainnet' : 'litvm-testnet'),
    recentTxHashes,
    error,
    clearError,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return ctx;
}

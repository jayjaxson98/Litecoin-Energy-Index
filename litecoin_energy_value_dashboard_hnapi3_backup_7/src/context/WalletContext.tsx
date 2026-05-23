import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { WalletContextValue, WalletState, WalletNetwork, WalletTransaction, NetworkId } from '../types/wallet';
import { SUPPORTED_NETWORKS } from '../types/wallet';

const defaultState: WalletState = {
  status: 'disconnected',
  address: null,
  network: null,
  balances: [],
  transactions: [],
  isLoading: false,
  error: null,
};

const WalletContext = createContext<WalletContextValue | null>(null);

function randomAddress(): string {
  return '0x' + Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

function randomHash(): string {
  return '0x' + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>(defaultState);
  const addressRef = useRef<string | null>(null);

  const connect = useCallback(async (_walletType?: string) => {
    setState((s) => ({ ...s, status: 'connecting', isLoading: true, error: null }));
    await new Promise((r) => setTimeout(r, 1200));
    const address = randomAddress();
    addressRef.current = address;
    const network: WalletNetwork = SUPPORTED_NETWORKS[0];
    setState((_s) => ({
      ..._s,
      status: 'connected',
      address,
      network,
      isLoading: false,
      balances: [
        { symbol: 'LTC',  amount: (Math.random() * 10 + 0.5).toFixed(6), usdValue: 82.45, decimals: 8 },
        { symbol: 'WLTC', amount: (Math.random() * 5).toFixed(6),         usdValue: 82.45, decimals: 18, contractAddress: '0xWLTC' },
        { symbol: 'USDT', amount: (Math.random() * 500 + 50).toFixed(2),  usdValue: 1.0,   decimals: 6,  contractAddress: '0xUSDT' },
      ],
      transactions: [],
    }));
  }, []);

  const disconnect = useCallback(() => {
    addressRef.current = null;
    setState(defaultState);
  }, []);

  const switchNetwork = useCallback(async (networkId: NetworkId) => {
    const network = SUPPORTED_NETWORKS.find((n) => n.id === networkId);
    if (!network) return;
    setState((s) => ({ ...s, isLoading: true }));
    await new Promise((r) => setTimeout(r, 600));
    setState((s) => ({ ...s, network, isLoading: false }));
  }, []);

  const sendTransaction = useCallback(async (to: string, amount: string, symbol: string): Promise<string> => {
    const hash = randomHash();
    const tx: WalletTransaction = {
      hash, type: 'send', status: 'pending', amount, symbol,
      toAddress: to, fromAddress: addressRef.current ?? '', timestamp: Date.now(),
    };
    setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
    await new Promise((r) => setTimeout(r, 2000));
    setState((s) => ({
      ...s,
      transactions: s.transactions.map((t) =>
        t.hash === hash ? { ...t, status: 'confirmed', blockNumber: 2_800_000 + Math.floor(Math.random() * 1000) } : t
      ),
    }));
    return hash;
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 500));
    return '0xSIG_' + btoa(message).slice(0, 32);
  }, []);

  const refreshBalances = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true }));
    await new Promise((r) => setTimeout(r, 800));
    setState((s) => ({
      ...s, isLoading: false,
      balances: s.balances.map((b) => ({
        ...b,
        amount: (parseFloat(b.amount) * (0.98 + Math.random() * 0.04)).toFixed(b.decimals === 8 ? 6 : 2),
      })),
    }));
  }, []);

  const addTransaction = useCallback((tx: WalletTransaction) => {
    setState((s) => ({ ...s, transactions: [tx, ...s.transactions] }));
  }, []);

  const value: WalletContextValue = {
    ...state, connect, disconnect, switchNetwork,
    sendTransaction, signMessage, refreshBalances, addTransaction,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export function useWalletContext(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}

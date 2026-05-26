// ─── WalletContext ─── v3.2.0
//
// Dependency: Web3Context (one-way)
// Provides: wallet state, connect/disconnect, simulation mode, balances, transactions
// Consumed by: components (leaf nodes)

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import { BrowserProvider } from 'ethers';
import { useWeb3 } from './Web3Context';
import type { WalletStatus, TransactionRecord, ToastNotification } from '../types';

export type { WalletStatus };

export interface WalletContextValue {
  /** Current wallet address or null */
  address: string | null;
  /** Connection status */
  status: WalletStatus;
  /** Convenience boolean: status === 'connected' */
  isConnected: boolean;
  /** Legacy alias for isConnected */
  connected: boolean;
  /** Whether simulation mode is active (no real wallet) */
  isSimulation: boolean;
  /** Native balance (LTC) as formatted string */
  balance: string;
  /** LBT token balance as formatted string */
  tokenBalance: string;
  /** Connect wallet via MetaMask */
  connect: () => Promise<void>;
  /** Disconnect wallet */
  disconnect: () => void;
  /** Toggle simulation mode */
  toggleSimulation: () => void;
  /** Transaction history */
  transactions: TransactionRecord[];
  /** Add a transaction to history */
  addTransaction: (tx: TransactionRecord) => void;
  /** Toast notifications */
  toasts: ToastNotification[];
  /** Add a toast */
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  /** Remove a toast by id */
  removeToast: (id: string) => void;
}

export const WalletContext = createContext<WalletContextValue | null>(null);

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within <WalletProvider>');
  return ctx;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { setProvider, setChainId } = useWeb3();

  const [address, setAddress] = useState<string | null>(null);
  const [status, setStatus] = useState<WalletStatus>('idle');
  const [simulationActive, setSimulationActive] = useState(true); // default to simulation
  const [balance, setBalance] = useState('0.00');
  const [tokenBalance, setTokenBalance] = useState('0.00');
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const isConnected = status === 'connected';
  const isSimulation = simulationActive;

  // ── Connect ──
  const connect = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string }) => Promise<string[]> } }).ethereum;

    if (!eth) {
      // No MetaMask — enter simulation
      setSimulationActive(true);
      setAddress('0xSIM...1234');
      setStatus('connected');
      setBalance('12.4500');
      setTokenBalance('2,450.00');
      return;
    }

    try {
      setStatus('connecting');
      const accounts = await eth.request({ method: 'eth_requestAccounts' });
      if (accounts.length === 0) {
        setStatus('disconnected');
        return;
      }

      const browserProvider = new BrowserProvider(eth as unknown as import('ethers').Eip1193Provider);
      setProvider(browserProvider);

      const network = await browserProvider.getNetwork();
      setChainId(Number(network.chainId));

      setAddress(accounts[0]);
      setStatus('connected');
      setSimulationActive(false);

      // Fetch real balance
      const bal = await browserProvider.getBalance(accounts[0]);
      setBalance((parseFloat(bal.toString()) / 1e18).toFixed(4));
    } catch {
      setStatus('disconnected');
    }
  }, [setProvider, setChainId]);

  // ── Disconnect ──
  const disconnect = useCallback(() => {
    setAddress(null);
    setStatus('disconnected');
    setProvider(null);
    setBalance('0.00');
    setTokenBalance('0.00');
    setSimulationActive(true);
  }, [setProvider]);

  // ── Toggle Simulation ──
  const toggleSimulation = useCallback(() => {
    setSimulationActive((prev) => {
      if (!prev) {
        // Entering simulation
        setAddress('0xSIM...1234');
        setStatus('connected');
        setBalance('12.4500');
        setTokenBalance('2,450.00');
        setProvider(null);
      } else {
        // Exiting simulation
        setAddress(null);
        setStatus('idle');
        setBalance('0.00');
        setTokenBalance('0.00');
      }
      return !prev;
    });
  }, [setProvider]);

  // ── Transactions ──
  const addTransaction = useCallback((tx: TransactionRecord) => {
    setTransactions((prev) => [tx, ...prev].slice(0, 50));
  }, []);

  // ── Toasts ──
  const addToast = useCallback((toast: Omit<ToastNotification, 'id'>) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    const newToast: ToastNotification = { ...toast, id };
    setToasts((prev) => [...prev, newToast]);

    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // ── Listen for account changes ──
  useEffect(() => {
    const eth = (window as unknown as { ethereum?: { on: (e: string, cb: (accounts: string[]) => void) => void; removeListener: (e: string, cb: (accounts: string[]) => void) => void } }).ethereum;
    if (!eth) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    eth.on('accountsChanged', handleAccountsChanged);
    return () => eth.removeListener('accountsChanged', handleAccountsChanged);
  }, [disconnect]);

  const value: WalletContextValue = {
    address,
    status,
    isConnected,
    connected: isConnected,
    isSimulation,
    balance,
    tokenBalance,
    connect,
    disconnect,
    toggleSimulation,
    transactions,
    addTransaction,
    toasts,
    addToast,
    removeToast,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

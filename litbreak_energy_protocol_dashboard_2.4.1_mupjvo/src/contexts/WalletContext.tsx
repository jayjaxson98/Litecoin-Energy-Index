import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { useWeb3 } from './Web3Context';

// 1 LTC = 100,000,000 Litoshi
const LITOSHI_PER_LTC = 100_000_000;

interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  balanceLitoshi: bigint;
  usdValue: number;
}

interface Transaction {
  id: string;
  type: 'mint' | 'burn' | 'transfer' | 'stake' | 'unstake' | 'claim';
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
  hash: string;
}

interface WalletState {
  address: string | null;
  shortAddress: string | null;
  ltcBalance: string;
  litbreakBalance: TokenBalance;
  isSimulation: boolean;
  transactions: Transaction[];
  guardianAddress: string | null;
  isGuardianEnabled: boolean;
}

interface WalletContextType extends WalletState {
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp'>) => void;
  updateTransactionStatus: (id: string, status: Transaction['status']) => void;
  formatLTC: (litoshi: bigint) => string;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function useWallet(): WalletContextType {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}

// Generate a realistic mock address
function generateMockAddress(): string {
  const chars = '0123456789abcdef';
  let addr = '0x';
  for (let i = 0; i < 40; i++) {
    addr += chars[Math.floor(Math.random() * chars.length)];
  }
  return addr;
}

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function generateMockTxHash(): string {
  const chars = '0123456789abcdef';
  let hash = '0x';
  for (let i = 0; i < 64; i++) {
    hash += chars[Math.floor(Math.random() * chars.length)];
  }
  return hash;
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const { provider, connect, disconnect } = useWeb3();

  const [state, setState] = useState<WalletState>({
    address: null,
    shortAddress: null,
    ltcBalance: '0.00',
    litbreakBalance: {
      symbol: 'LBRK',
      name: 'Litbreak Token',
      balance: '0.00',
      balanceLitoshi: 0n,
      usdValue: 0,
    },
    isSimulation: true,
    transactions: [],
    guardianAddress: null,
    isGuardianEnabled: false,
  });

  const formatLTC = useCallback((litoshi: bigint): string => {
    const ltc = Number(litoshi) / LITOSHI_PER_LTC;
    return ltc.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  }, []);

  const connectWallet = useCallback(async () => {
    await connect();

    // Simulate wallet data
    const mockAddress = generateMockAddress();
    const mockLtcBalance = (Math.random() * 50 + 5).toFixed(4);
    const mockLbrkBalance = (Math.random() * 100000 + 1000).toFixed(2);
    const mockLbrkLitoshi = BigInt(Math.floor(parseFloat(mockLbrkBalance) * LITOSHI_PER_LTC));

    // Generate some mock transaction history
    const mockTxs: Transaction[] = [
      {
        id: '1',
        type: 'mint',
        amount: '5,000 LBRK',
        status: 'confirmed',
        timestamp: Date.now() - 86400000 * 2,
        hash: generateMockTxHash(),
      },
      {
        id: '2',
        type: 'stake',
        amount: '2,500 LBRK',
        status: 'confirmed',
        timestamp: Date.now() - 86400000,
        hash: generateMockTxHash(),
      },
      {
        id: '3',
        type: 'claim',
        amount: '125.50 LBRK',
        status: 'confirmed',
        timestamp: Date.now() - 3600000 * 4,
        hash: generateMockTxHash(),
      },
    ];

    setState({
      address: mockAddress,
      shortAddress: shortenAddress(mockAddress),
      ltcBalance: mockLtcBalance,
      litbreakBalance: {
        symbol: 'LBRK',
        name: 'Litbreak Token',
        balance: parseFloat(mockLbrkBalance).toLocaleString(),
        balanceLitoshi: mockLbrkLitoshi,
        usdValue: parseFloat(mockLbrkBalance) * 0.042,
      },
      isSimulation: true,
      transactions: mockTxs,
      guardianAddress: null,
      isGuardianEnabled: false,
    });
  }, [connect]);

  const disconnectWallet = useCallback(() => {
    disconnect();
    setState({
      address: null,
      shortAddress: null,
      ltcBalance: '0.00',
      litbreakBalance: {
        symbol: 'LBRK',
        name: 'Litbreak Token',
        balance: '0.00',
        balanceLitoshi: 0n,
        usdValue: 0,
      },
      isSimulation: true,
      transactions: [],
      guardianAddress: null,
      isGuardianEnabled: false,
    });
  }, [disconnect]);

  const addTransaction = useCallback((tx: Omit<Transaction, 'id' | 'timestamp'>) => {
    const newTx: Transaction = {
      ...tx,
      id: Math.random().toString(36).slice(2, 10),
      timestamp: Date.now(),
    };
    setState(prev => ({
      ...prev,
      transactions: [newTx, ...prev.transactions],
    }));
  }, []);

  const updateTransactionStatus = useCallback((id: string, status: Transaction['status']) => {
    setState(prev => ({
      ...prev,
      transactions: prev.transactions.map(tx =>
        tx.id === id ? { ...tx, status } : tx
      ),
    }));
  }, []);

  // Auto-disconnect if provider is lost
  useEffect(() => {
    if (!provider && state.address) {
      disconnectWallet();
    }
  }, [provider, state.address, disconnectWallet]);

  return (
    <WalletContext.Provider value={{
      ...state,
      connectWallet,
      disconnectWallet,
      addTransaction,
      updateTransactionStatus,
      formatLTC,
    }}>
      {children}
    </WalletContext.Provider>
  );
}

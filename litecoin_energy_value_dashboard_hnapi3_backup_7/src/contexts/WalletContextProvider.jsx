import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// ─── Context ──────────────────────────────────────────────────────────────────

const WalletContext = createContext(null);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomAddress() {
  return '0x' + Array.from({ length: 40 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

function randomHash() {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

const SUPPORTED_NETWORKS = [
  { id: 'litecoin-mainnet', name: 'Litecoin Mainnet', symbol: 'LTC', chainId: 1 },
  { id: 'litecoin-testnet', name: 'Litecoin Testnet', symbol: 'tLTC', chainId: 2 },
  { id: 'ethereum-mainnet', name: 'Ethereum Mainnet', symbol: 'ETH', chainId: 1 },
];

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WalletContextProvider({ children }) {
  const [status, setStatus]           = useState('disconnected'); // 'disconnected' | 'connecting' | 'connected'
  const [address, setAddress]         = useState(null);
  const [network, setNetwork]         = useState(null);
  const [balances, setBalances]       = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading]     = useState(false);
  const [error, setError]             = useState(null);

  const addressRef = useRef(null);

  // ── connect ────────────────────────────────────────────────────────────────

  const connect = useCallback(async (_walletType) => {
    setStatus('connecting');
    setIsLoading(true);
    setError(null);

    await new Promise((r) => setTimeout(r, 1200));

    const addr = randomAddress();
    addressRef.current = addr;

    setAddress(addr);
    setNetwork(SUPPORTED_NETWORKS[0]);
    setStatus('connected');
    setIsLoading(false);
    setBalances([
      { symbol: 'LTC',  amount: (Math.random() * 10 + 0.5).toFixed(6), usdValue: 82.45, decimals: 8 },
      { symbol: 'WLTC', amount: (Math.random() * 5).toFixed(6),         usdValue: 82.45, decimals: 18, contractAddress: '0xWLTC' },
      { symbol: 'USDT', amount: (Math.random() * 500 + 50).toFixed(2),  usdValue: 1.0,   decimals: 6,  contractAddress: '0xUSDT' },
    ]);
    setTransactions([]);
  }, []);

  // ── disconnect ─────────────────────────────────────────────────────────────

  const disconnect = useCallback(() => {
    addressRef.current = null;
    setStatus('disconnected');
    setAddress(null);
    setNetwork(null);
    setBalances([]);
    setTransactions([]);
    setError(null);
  }, []);

  // ── switchNetwork ──────────────────────────────────────────────────────────

  const switchNetwork = useCallback(async (networkId) => {
    const net = SUPPORTED_NETWORKS.find((n) => n.id === networkId);
    if (!net) return;
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setNetwork(net);
    setIsLoading(false);
  }, []);

  // ── sendTransaction ────────────────────────────────────────────────────────

  const sendTransaction = useCallback(async (to, amount, symbol) => {
    const hash = randomHash();
    const tx = {
      hash,
      type: 'send',
      status: 'pending',
      amount,
      symbol,
      toAddress: to,
      fromAddress: addressRef.current ?? '',
      timestamp: Date.now(),
    };
    setTransactions((prev) => [tx, ...prev]);

    await new Promise((r) => setTimeout(r, 2000));

    setTransactions((prev) =>
      prev.map((t) =>
        t.hash === hash
          ? { ...t, status: 'confirmed', blockNumber: 2_800_000 + Math.floor(Math.random() * 1000) }
          : t
      )
    );
    return hash;
  }, []);

  // ── signMessage ────────────────────────────────────────────────────────────

  const signMessage = useCallback(async (message) => {
    await new Promise((r) => setTimeout(r, 500));
    return '0xSIG_' + btoa(message).slice(0, 32);
  }, []);

  // ── refreshBalances ────────────────────────────────────────────────────────

  const refreshBalances = useCallback(async () => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setBalances((prev) =>
      prev.map((b) => ({
        ...b,
        amount: (parseFloat(b.amount) * (0.98 + Math.random() * 0.04)).toFixed(
          b.decimals === 8 ? 6 : 2
        ),
      }))
    );
    setIsLoading(false);
  }, []);

  // ── addTransaction ─────────────────────────────────────────────────────────

  const addTransaction = useCallback((tx) => {
    setTransactions((prev) => [tx, ...prev]);
  }, []);

  // ── context value ──────────────────────────────────────────────────────────

  const value = {
    status,
    address,
    network,
    balances,
    transactions,
    isLoading,
    error,
    connect,
    disconnect,
    switchNetwork,
    sendTransaction,
    signMessage,
    refreshBalances,
    addTransaction,
    supportedNetworks: SUPPORTED_NETWORKS,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletContextProvider');
  return ctx;
}

export default WalletContextProvider;

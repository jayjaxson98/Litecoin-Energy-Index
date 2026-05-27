import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';

interface WalletState {
  connected: boolean;
  address: string;
  network: string;
  chainId: number;
  ltcBalance: number; // in litoshi
  lbtBalance: number; // in LBT base units
  connecting: boolean;
  error: string | null;
}

interface WalletContextType extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (chainId: number) => Promise<void>;
  refreshBalances: () => void;
}

const initialState: WalletState = {
  connected: false,
  address: '',
  network: '',
  chainId: 0,
  ltcBalance: 0,
  lbtBalance: 0,
  connecting: false,
  error: null,
};

const WalletContext = createContext<WalletContextType>({
  ...initialState,
  connect: async () => {},
  disconnect: () => {},
  switchNetwork: async () => {},
  refreshBalances: () => {},
});

export const useWallet = () => useContext(WalletContext);

const LITVM_TESTNET = {
  chainId: 7331,
  name: 'LitVM Testnet',
  rpcUrl: 'https://testnet-rpc.litvm.org',
  explorer: 'https://testnet-explorer.litvm.org',
};

// Simulated wallet addresses
const MOCK_ADDRESSES = [
  '0x7a3B...9f2E',
  '0x4c1D...8a3F',
  '0x9e5A...2b7C',
];

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<WalletState>(initialState);

  const generateMockBalances = useCallback(() => {
    return {
      ltcBalance: Math.round((2.5 + Math.random() * 10) * 1e8), // 2.5-12.5 LTC in litoshi
      lbtBalance: Math.round((100 + Math.random() * 5000) * 1e8), // 100-5100 LBT
    };
  }, []);

  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, connecting: true, error: null }));

    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const address = MOCK_ADDRESSES[Math.floor(Math.random() * MOCK_ADDRESSES.length)];
      const balances = generateMockBalances();

      setState({
        connected: true,
        address,
        network: LITVM_TESTNET.name,
        chainId: LITVM_TESTNET.chainId,
        ltcBalance: balances.ltcBalance,
        lbtBalance: balances.lbtBalance,
        connecting: false,
        error: null,
      });
    } catch {
      setState(prev => ({
        ...prev,
        connecting: false,
        error: 'Failed to connect wallet',
      }));
    }
  }, [generateMockBalances]);

  const disconnect = useCallback(() => {
    setState(initialState);
  }, []);

  const switchNetwork = useCallback(async (chainId: number) => {
    if (chainId === LITVM_TESTNET.chainId) {
      setState(prev => ({
        ...prev,
        network: LITVM_TESTNET.name,
        chainId: LITVM_TESTNET.chainId,
      }));
    }
  }, []);

  const refreshBalances = useCallback(() => {
    if (state.connected) {
      const balances = generateMockBalances();
      setState(prev => ({
        ...prev,
        ltcBalance: balances.ltcBalance,
        lbtBalance: balances.lbtBalance,
      }));
    }
  }, [state.connected, generateMockBalances]);

  // Auto-refresh balances every 30 seconds
  useEffect(() => {
    if (!state.connected) return;
    const interval = setInterval(refreshBalances, 30000);
    return () => clearInterval(interval);
  }, [state.connected, refreshBalances]);

  return (
    <WalletContext.Provider value={{ ...state, connect, disconnect, switchNetwork, refreshBalances }}>
      {children}
    </WalletContext.Provider>
  );
};

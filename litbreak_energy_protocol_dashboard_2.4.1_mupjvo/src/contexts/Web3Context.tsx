import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

// LitVM Testnet configuration
const LITVM_TESTNET = {
  chainId: 12345,
  chainIdHex: '0x3039',
  name: 'LitVM Testnet',
  rpcUrl: 'https://rpc.litvm.test',
  blockExplorer: 'https://explorer.litvm.test',
  nativeCurrency: {
    name: 'Litecoin',
    symbol: 'LTC',
    decimals: 8,
  },
};

interface Web3State {
  provider: unknown | null;
  signer: unknown | null;
  chainId: number | null;
  isCorrectNetwork: boolean;
  isConnecting: boolean;
  error: string | null;
  network: typeof LITVM_TESTNET;
}

interface Web3ContextType extends Web3State {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: () => Promise<void>;
  clearError: () => void;
}

const Web3Context = createContext<Web3ContextType | null>(null);

export function useWeb3(): Web3ContextType {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within Web3Provider');
  return ctx;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Web3State>({
    provider: null,
    signer: null,
    chainId: null,
    isCorrectNetwork: false,
    isConnecting: false,
    error: null,
    network: LITVM_TESTNET,
  });

  // Simulated connection — mock Web3 provider
  const connect = useCallback(async () => {
    setState(prev => ({ ...prev, isConnecting: true, error: null }));

    try {
      // Simulate connection delay
      await new Promise(resolve => setTimeout(resolve, 1200));

      // Check if MetaMask-like provider exists
      const ethereum = (window as Record<string, unknown>).ethereum;

      if (ethereum) {
        // Real provider detected — attempt connection
        try {
          const { BrowserProvider } = await import('ethers');
          const provider = new BrowserProvider(ethereum as never);
          const signer = await provider.getSigner();
          const network = await provider.getNetwork();
          const chainId = Number(network.chainId);

          setState(prev => ({
            ...prev,
            provider,
            signer,
            chainId,
            isCorrectNetwork: chainId === LITVM_TESTNET.chainId,
            isConnecting: false,
          }));
          return;
        } catch {
          // Fall through to simulation mode
        }
      }

      // Simulation mode — no real provider
      setState(prev => ({
        ...prev,
        provider: { _isSimulated: true },
        signer: { _isSimulated: true },
        chainId: LITVM_TESTNET.chainId,
        isCorrectNetwork: true,
        isConnecting: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isConnecting: false,
        error: err instanceof Error ? err.message : 'Connection failed',
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    setState({
      provider: null,
      signer: null,
      chainId: null,
      isCorrectNetwork: false,
      isConnecting: false,
      error: null,
      network: LITVM_TESTNET,
    });
  }, []);

  const switchNetwork = useCallback(async () => {
    const ethereum = (window as Record<string, unknown>).ethereum as {
      request: (args: { method: string; params: unknown[] }) => Promise<unknown>;
    } | undefined;

    if (!ethereum) {
      // In simulation mode, just set correct network
      setState(prev => ({
        ...prev,
        chainId: LITVM_TESTNET.chainId,
        isCorrectNetwork: true,
      }));
      return;
    }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: LITVM_TESTNET.chainIdHex }],
      });
    } catch (switchError: unknown) {
      const err = switchError as { code?: number };
      if (err.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: LITVM_TESTNET.chainIdHex,
              chainName: LITVM_TESTNET.name,
              rpcUrls: [LITVM_TESTNET.rpcUrl],
              blockExplorerUrls: [LITVM_TESTNET.blockExplorer],
              nativeCurrency: LITVM_TESTNET.nativeCurrency,
            }],
          });
        } catch {
          setState(prev => ({ ...prev, error: 'Failed to add LitVM network' }));
        }
      }
    }
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Listen for chain/account changes
  useEffect(() => {
    const ethereum = (window as Record<string, unknown>).ethereum as {
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
    } | undefined;

    if (!ethereum?.on) return;

    const handleChainChanged = (chainIdHex: unknown) => {
      const newChainId = parseInt(chainIdHex as string, 16);
      setState(prev => ({
        ...prev,
        chainId: newChainId,
        isCorrectNetwork: newChainId === LITVM_TESTNET.chainId,
      }));
    };

    const handleAccountsChanged = (accounts: unknown) => {
      const accts = accounts as string[];
      if (accts.length === 0) {
        // Disconnected
        setState(prev => ({
          ...prev,
          provider: null,
          signer: null,
          chainId: null,
          isCorrectNetwork: false,
        }));
      }
    };

    ethereum.on('chainChanged', handleChainChanged);
    ethereum.on('accountsChanged', handleAccountsChanged);

    return () => {
      ethereum.removeListener?.('chainChanged', handleChainChanged);
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
    };
  }, []);

  return (
    <Web3Context.Provider value={{ ...state, connect, disconnect, switchNetwork, clearError }}>
      {children}
    </Web3Context.Provider>
  );
}

// ─── Web3Context ─── v3.2.0
//
// Dependency: NONE (leaf context)
// Provides: provider, chainId, network config, connection helpers
// Consumed by: WalletContext, components

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import { BrowserProvider, JsonRpcProvider } from 'ethers';
import type { NetworkInfo } from '../types';

// ── LitVM Testnet Configuration ──
const LITVM_TESTNET: NetworkInfo = {
  chainId: 1856,
  name: 'LitVM Testnet',
  rpcUrl: 'https://rpc.litvm-testnet.io',
  explorerUrl: 'https://explorer.litvm-testnet.io',
  currency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
};

const SUPPORTED_NETWORKS: NetworkInfo[] = [LITVM_TESTNET];

export interface Web3ContextValue {
  /** ethers BrowserProvider when wallet connected, null otherwise */
  provider: BrowserProvider | null;
  /** Read-only JSON-RPC provider (always available) */
  readProvider: JsonRpcProvider;
  /** Current chain ID (0 if unknown) */
  chainId: number;
  /** Whether the current chain is supported */
  isCorrectNetwork: boolean;
  /** Active network info */
  network: NetworkInfo;
  /** All supported networks */
  supportedNetworks: NetworkInfo[];
  /** Request MetaMask to switch to the correct chain */
  switchNetwork: () => Promise<void>;
  /** Set the browser provider (called by WalletContext on connect) */
  setProvider: (p: BrowserProvider | null) => void;
  /** Set the current chain ID */
  setChainId: (id: number) => void;
}

export const Web3Context = createContext<Web3ContextValue | null>(null);

export function useWeb3(): Web3ContextValue {
  const ctx = useContext(Web3Context);
  if (!ctx) throw new Error('useWeb3 must be used within <Web3Provider>');
  return ctx;
}

export function Web3Provider({ children }: { children: ReactNode }) {
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [chainId, setChainId] = useState<number>(0);

  const readProvider = new JsonRpcProvider(LITVM_TESTNET.rpcUrl);
  const isCorrectNetwork = chainId === LITVM_TESTNET.chainId;
  const network = LITVM_TESTNET;

  // Listen for chain changes
  useEffect(() => {
    const eth = (window as unknown as { ethereum?: { on: (e: string, cb: (id: string) => void) => void; removeListener: (e: string, cb: (id: string) => void) => void } }).ethereum;
    if (!eth) return;

    const handleChainChanged = (id: string) => {
      setChainId(parseInt(id, 16));
    };

    eth.on('chainChanged', handleChainChanged);
    return () => eth.removeListener('chainChanged', handleChainChanged);
  }, []);

  const switchNetwork = useCallback(async () => {
    const eth = (window as unknown as { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!eth) return;

    const hexChainId = '0x' + LITVM_TESTNET.chainId.toString(16);

    try {
      await eth.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: hexChainId }] });
    } catch (err: unknown) {
      const switchErr = err as { code?: number };
      // Chain not added — add it
      if (switchErr.code === 4902) {
        await eth.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: hexChainId,
            chainName: LITVM_TESTNET.name,
            rpcUrls: [LITVM_TESTNET.rpcUrl],
            blockExplorerUrls: [LITVM_TESTNET.explorerUrl],
            nativeCurrency: LITVM_TESTNET.currency,
          }],
        });
      }
    }
  }, []);

  const value: Web3ContextValue = {
    provider,
    readProvider,
    chainId,
    isCorrectNetwork,
    network,
    supportedNetworks: SUPPORTED_NETWORKS,
    switchNetwork,
    setProvider,
    setChainId,
  };

  return <Web3Context.Provider value={value}>{children}</Web3Context.Provider>;
}

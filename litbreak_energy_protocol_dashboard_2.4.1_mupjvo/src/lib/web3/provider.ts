/**
 * Web3 Provider — Singleton provider wrapper.
 * Minimal module — imports only from ./config (no circular deps).
 */

import { ethers } from 'ethers';
import { getWeb3Config, isContractConfigured } from './config';

export interface Web3ProviderState {
  provider: ethers.BrowserProvider | ethers.JsonRpcProvider | null;
  isConnected: boolean;
  chainId: number | null;
  account: string | null;
}

let _providerState: Web3ProviderState = {
  provider: null,
  isConnected: false,
  chainId: null,
  account: null,
};

/**
 * Get or create the Web3 provider singleton.
 * Returns a state object — never throws.
 */
export function getWeb3Provider(): Web3ProviderState {
  if (_providerState.provider) return _providerState;

  if (!isContractConfigured()) {
    return _providerState;
  }

  try {
    const config = getWeb3Config();

    // Try browser wallet first
    if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).ethereum) {
      const ethereum = (window as unknown as Record<string, unknown>).ethereum as ethers.Eip1193Provider;
      _providerState = {
        provider: new ethers.BrowserProvider(ethereum),
        isConnected: true,
        chainId: config.chainId,
        account: null,
      };
      return _providerState;
    }

    // Fallback to JSON-RPC (read-only)
    if (config.rpcUrl) {
      _providerState = {
        provider: new ethers.JsonRpcProvider(config.rpcUrl, config.chainId),
        isConnected: true,
        chainId: config.chainId,
        account: null,
      };
      return _providerState;
    }
  } catch (err) {
    console.warn('[Web3Provider] Failed to initialize:', err);
  }

  return _providerState;
}

/**
 * Reset provider state (for disconnect/network switch).
 */
export function resetWeb3Provider(): void {
  _providerState = {
    provider: null,
    isConnected: false,
    chainId: null,
    account: null,
  };
}

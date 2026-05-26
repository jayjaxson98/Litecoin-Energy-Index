/**
 * useTokenData — Hook for token lookup, custom token management, and balance queries.
 *
 * Provides:
 *   - lookupToken(address): resolve on-chain token metadata (simulated in dev)
 *   - addCustomToken(token): persist a user-imported token to localStorage
 *   - removeCustomToken(address): remove a previously added token
 *   - customTokens: list of all user-added tokens
 *   - loading / error state
 */

import { useState, useCallback, useEffect } from 'react';
import type { TokenInfo } from '@/types/token';

const STORAGE_KEY = 'litbreak:custom_tokens';

// ─── Simulated on-chain token registry ────────────────────────────────────────
// In production this would call eth_call → name()/symbol()/decimals() on the
// provided contract address via ethers.js.

const KNOWN_TOKENS: Record<string, Omit<TokenInfo, 'address'>> = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48': {
    name: 'USD Coin',
    symbol: 'USDC',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/usd-coin-usdc-logo.png',
  },
  '0xdac17f958d2ee523a2206206994597c13d831ec7': {
    name: 'Tether USD',
    symbol: 'USDT',
    decimals: 6,
    logoURI: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  '0x6b175474e89094c44da98b954eedeac495271d0f': {
    name: 'Dai Stablecoin',
    symbol: 'DAI',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/multi-collateral-dai-dai-logo.png',
  },
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599': {
    name: 'Wrapped Bitcoin',
    symbol: 'WBTC',
    decimals: 8,
    logoURI: 'https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.png',
  },
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2': {
    name: 'Wrapped Ether',
    symbol: 'WETH',
    decimals: 18,
    logoURI: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
  },
};

function isValidAddress(addr: string): boolean {
  return /^0x[0-9a-fA-F]{40}$/.test(addr);
}

function loadFromStorage(): TokenInfo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as TokenInfo[]) : [];
  } catch {
    return [];
  }
}

function saveToStorage(tokens: TokenInfo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
  } catch {
    // Storage quota exceeded — silently ignore
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UseTokenDataReturn {
  customTokens: TokenInfo[];
  loading: boolean;
  error: string | null;
  lookupToken: (address: string) => Promise<TokenInfo | null>;
  addCustomToken: (token: TokenInfo) => void;
  removeCustomToken: (address: string) => void;
}

export function useTokenData(): UseTokenDataReturn {
  const [customTokens, setCustomTokens] = useState<TokenInfo[]>(loadFromStorage);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist whenever the list changes
  useEffect(() => {
    saveToStorage(customTokens);
  }, [customTokens]);

  const lookupToken = useCallback(async (address: string): Promise<TokenInfo | null> => {
    setLoading(true);
    setError(null);

    try {
      if (!isValidAddress(address)) {
        throw new Error('Invalid contract address. Must be a 42-character hex string starting with 0x.');
      }

      const normalised = address.toLowerCase();

      // Simulate network latency
      await new Promise(r => setTimeout(r, 600));

      const known = KNOWN_TOKENS[normalised];
      if (known) {
        return { address, ...known, isCustom: true };
      }

      // Simulate a generic unknown token (in production: eth_call)
      const shortHex = address.slice(2, 6).toUpperCase();
      return {
        address,
        name: `Unknown Token (${shortHex})`,
        symbol: shortHex,
        decimals: 18,
        isCustom: true,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Token lookup failed';
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const addCustomToken = useCallback((token: TokenInfo) => {
    setCustomTokens(prev => {
      const exists = prev.some(
        t => t.address.toLowerCase() === token.address.toLowerCase()
      );
      if (exists) return prev;
      return [...prev, { ...token, isCustom: true }];
    });
  }, []);

  const removeCustomToken = useCallback((address: string) => {
    setCustomTokens(prev =>
      prev.filter(t => t.address.toLowerCase() !== address.toLowerCase())
    );
  }, []);

  return { customTokens, loading, error, lookupToken, addCustomToken, removeCustomToken };
}

import { useState, useEffect, useCallback } from 'react';

export interface TokenData {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  price: number;
  priceChange24h: number;
  volume24h: number;
  marketCap: number;
  logoUrl?: string;
}

const MOCK_TOKENS: Record<string, TokenData> = {
  '0xLTC': {
    address: '0xLTC',
    symbol: 'LTC',
    name: 'Litecoin',
    decimals: 8,
    price: 87.42,
    priceChange24h: 2.34,
    volume24h: 412_000_000,
    marketCap: 6_500_000_000,
  },
  '0xWBTC': {
    address: '0xWBTC',
    symbol: 'WBTC',
    name: 'Wrapped Bitcoin',
    decimals: 8,
    price: 67_200,
    priceChange24h: -0.82,
    volume24h: 890_000_000,
    marketCap: 14_200_000_000,
  },
  '0xUSDC': {
    address: '0xUSDC',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    price: 1.0,
    priceChange24h: 0.01,
    volume24h: 5_200_000_000,
    marketCap: 32_000_000_000,
  },
  '0xETH': {
    address: '0xETH',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    price: 3_450,
    priceChange24h: 1.12,
    volume24h: 2_100_000_000,
    marketCap: 415_000_000_000,
  },
};

/** Fetch a token by its contract address (mock implementation) */
export async function fetchTokenByContract(address: string): Promise<TokenData | null> {
  await new Promise((r) => setTimeout(r, 600));
  const key = Object.keys(MOCK_TOKENS).find(
    (k) => k.toLowerCase() === address.toLowerCase()
  );
  return key ? MOCK_TOKENS[key] : null;
}

export function useTokenData(address?: string) {
  const [token, setToken] = useState<TokenData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (addr: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTokenByContract(addr);
      if (!data) setError('Token not found');
      else setToken(data);
    } catch {
      setError('Failed to fetch token data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (address) load(address);
  }, [address, load]);

  return { token, isLoading, error, refetch: () => address && load(address) };
}

export function useAllTokens() {
  const [tokens] = useState<TokenData[]>(Object.values(MOCK_TOKENS));
  return { tokens, isLoading: false };
}

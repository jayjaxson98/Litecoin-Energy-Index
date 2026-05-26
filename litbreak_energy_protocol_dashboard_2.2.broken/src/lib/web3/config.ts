import type { NetworkInfo } from '../../types';

export const NETWORKS: Record<string, NetworkInfo> = {
  'litvm-testnet': {
    id:          'litvm-testnet',
    chainId:     1856,
    name:        'LitVM Testnet',
    rpcUrl:      'https://rpc.litvm-testnet.io',
    explorerUrl: 'https://explorer.litvm-testnet.io',
    nativeCurrency: {
      name:     'Litecoin',
      symbol:   'LTC',
      decimals: 18,
    },
    isTestnet: true,
    color:     '#9E7FFF',
  },
  'litvm-mainnet': {
    id:          'litvm-mainnet',
    chainId:     1857,
    name:        'LitVM Mainnet',
    rpcUrl:      'https://rpc.litvm.io',
    explorerUrl: 'https://explorer.litvm.io',
    nativeCurrency: {
      name:     'Litecoin',
      symbol:   'LTC',
      decimals: 18,
    },
    isTestnet: false,
    color:     '#38bdf8',
  },
};

export const DEFAULT_NETWORK = NETWORKS['litvm-testnet'];

export const CONTRACT_ADDRESS =
  (import.meta.env.VITE_CONTRACT_ADDRESS as string | undefined) ?? '';

export const POLLING_INTERVAL = 4_000; // ms — matches LitVM ~2.5 s block time

export const CACHE_TTL = {
  PRICE:    30_000,  // 30 s
  STATS:    60_000,  // 60 s
  BALANCE:  15_000,  // 15 s
} as const;

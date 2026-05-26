/**
 * ContractRegistry — Canonical addresses, network configs, and protocol constants.
 *
 * Single source of truth for all contract addresses and helper utilities.
 */

import type { NetworkInfo } from '../types/index';

// ─── Contract Addresses ──────────────────────────────────────────────────────

export const LITBREAK_PROTOCOL_ADDRESS = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D';

export const CONTRACTS = {
  LITBREAK_PROTOCOL: {
    address: LITBREAK_PROTOCOL_ADDRESS,
    name: 'LitbreakProtocol',
    version: '1.0.0',
  },
  POWER_TOKEN: {
    address: LITBREAK_PROTOCOL_ADDRESS, // POWER is minted by the protocol contract itself
    name: 'POWER Token',
    version: '1.0.0',
  },
  WLTC: {
    address: '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6', // Wrapped LTC placeholder
    name: 'Wrapped Litecoin',
    version: '1.0.0',
  },
} as const;

// ─── Protocol Constants ──────────────────────────────────────────────────────

export const PROTOCOL_CONSTANTS = {
  HARD_CAP: 21_000_000,
  BASE_MONTHLY_RELEASE: 175_000,
  MAX_FEE_BPS: 500,
  BPS_DENOMINATOR: 10_000,
  DEFAULT_EXCHANGE_RATE: 125,
  DEFAULT_FEE_BPS: 30,
  MIN_ENERGY_PRICE: 10_000,
  MAX_ENERGY_PRICE: 1_000_000,
} as const;

// ─── Networks ────────────────────────────────────────────────────────────────

export const NETWORKS: Record<string, NetworkInfo> = {
  'litvm-testnet': {
    id: 'litvm-testnet',
    name: 'LitVM Testnet',
    chainId: 421611,
    rpcUrl: 'https://rpc.litvm-testnet.io',
    explorerUrl: 'https://explorer.litvm-testnet.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: true,
    color: '#9E7FFF',
  },
  'litvm-mainnet': {
    id: 'litvm-mainnet',
    name: 'LitVM Mainnet',
    chainId: 421612,
    rpcUrl: 'https://rpc.litvm.io',
    explorerUrl: 'https://explorer.litvm.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: false,
    color: '#10b981',
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}…${address.slice(-chars)}`;
}

export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}…${hash.slice(-chars)}`;
}

export function getExplorerTxUrl(txHash: string, networkId: string = 'litvm-testnet'): string {
  const network = NETWORKS[networkId];
  return `${network?.explorerUrl || 'https://explorer.litvm-testnet.io'}/tx/${txHash}`;
}

export function getExplorerAddressUrl(address: string, networkId: string = 'litvm-testnet'): string {
  const network = NETWORKS[networkId];
  return `${network?.explorerUrl || 'https://explorer.litvm-testnet.io'}/address/${address}`;
}

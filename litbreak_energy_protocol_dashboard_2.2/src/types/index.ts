/**
 * Central type exports for the Litbreak Energy Protocol.
 * All shared types are re-exported from here for convenient imports.
 */

// Re-export everything from sub-modules
export * from './utx';
export * from './token';

// ─── Network Types ───────────────────────────────────────────────────────────

export type NetworkId = 'litvm-testnet' | 'litvm-mainnet' | 'ethereum' | 'arbitrum' | 'polygon' | string;

export interface NetworkInfo {
  id: NetworkId;
  name: string;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
  iconUrl?: string;
  color?: string;
}

// ─── Chart / Time Types ──────────────────────────────────────────────────────

export type TimeFrame = '1H' | '6H' | '24H' | '7D' | '30D' | '90D' | '1Y' | 'ALL';

export interface ChartDataPoint {
  timestamp: number;
  value: number;
  volume?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
}

// ─── Collection Stats (alias for backward compat) ────────────────────────────

export type CollectionStats = Collection;

// ─── Wallet Types ────────────────────────────────────────────────────────────

export type WalletStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface WalletState {
  status: WalletStatus;
  address: string | null;
  balance: number;
  powerBalance: number;
  chainId: number | null;
  error: string | null;
}

// ─── Transaction Types ───────────────────────────────────────────────────────

export type TransactionStatus = 'pending' | 'confirming' | 'confirmed' | 'failed' | 'cancelled';

export interface TransactionRecord {
  hash: string;
  type: 'mint' | 'redeem' | 'transfer' | 'approve' | 'swap';
  status: TransactionStatus;
  from: string;
  to: string;
  amount: number;
  token: string;
  timestamp: number;
  blockNumber?: number;
  gasUsed?: number;
  fee?: number;
}

// ─── UI Types ────────────────────────────────────────────────────────────────

export interface TabItem {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  disabled?: boolean;
}

export interface SelectOption<T = string> {
  value: T;
  label: string;
  icon?: string;
  description?: string;
  disabled?: boolean;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
}

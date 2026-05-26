// ─── Canonical Type Definitions ─── v3.2.0
// All shared types live here. Components and contexts import from this file.

/** Wallet connection status union */
export type WalletStatus = 'idle' | 'connecting' | 'connected' | 'disconnected';

/** Network configuration */
export interface NetworkInfo {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  currency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

/** Agent configuration from contract */
export interface AgentConfig {
  id: string;
  name: string;
  strategy: string;
  isActive: boolean;
  performance: number;
  totalStaked: string;
  rewardRate: string;
  lastUpdate: number;
}

/** Protocol statistics */
export interface ProtocolStats {
  totalSupply: string;
  totalStaked: string;
  energyIndex: number;
  hashRate: string;
  difficulty: string;
  blockReward: string;
  activeAgents: number;
  totalValueLocked: string;
  mintRate: string;
  redeemRate: string;
  oraclePrice: string;
  lastOracleUpdate: number;
}

/** Oracle state from contract */
export interface OracleState {
  currentPrice: string;
  lastUpdate: number;
  isStale: boolean;
  deviation: number;
}

/** Oracle price cache */
export interface OraclePriceCache {
  price: string;
  timestamp: number;
  blockNumber: number;
}

/** Oracle cache refresh result */
export interface OracleCacheRefreshResult {
  success: boolean;
  newPrice: string;
  previousPrice: string;
  timestamp: number;
}

/** Transaction record */
export interface TransactionRecord {
  hash: string;
  type: 'mint' | 'redeem' | 'stake' | 'unstake' | 'claim';
  amount: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: number;
}

/** Toast notification */
export interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
  txHash?: string;
  duration?: number;
}

/**
 * Web3 Module — Barrel export for all blockchain integration utilities.
 */

// Configuration
export { web3Config, getNetworkByChainId, isSupportedChain, isContractConfigured } from './config';
export type { NetworkMode, NetworkConfig, Web3Config } from './config';

// Provider & Wallet
export { getWeb3Provider, Web3ProviderManager } from './provider';
export type { ConnectionState, WalletInfo, ProviderEvent, ProviderEventCallback } from './provider';

// Contract Service
export { getContractService, ContractService } from './contract';
export type {
  ProtocolStats,
  OracleHealthStatus,
  OracleStatus,
  TWAPInfo,
  FreshnessInfo,
  MintEstimate,
  RedeemEstimate,
  TransactionResult,
} from './contract';

// Transaction Manager
export { getTransactionManager, TransactionManager } from './transactions';
export type { TransactionStatus, TrackedTransaction, TransactionEventCallback } from './transactions';

// Event Listener
export { getEventListener, OnChainEventListener } from './events';
export type { PollingState, StateChangeCallback } from './events';

// Error Handling
export { decodeWeb3Error, isUserRejection } from './errors';
export type { DecodedError } from './errors';

// Cache
export { getRpcCache } from './cache';

// Explorer URL helpers (re-export from config)
export { getExplorerTxUrl, getExplorerAddressUrl } from './config';

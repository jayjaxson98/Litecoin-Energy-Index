/**
 * Web3 barrel export — re-exports all web3 utilities from direct module paths.
 * 
 * IMPORTANT: Uses direct file imports (not a barrel index.ts) to avoid
 * circular dependencies that caused the Vite HMR reload loop.
 */

export { getWeb3Config, isContractConfigured } from './web3/config';
export type { Web3Config } from './web3/config';

export { getWeb3Provider, resetWeb3Provider } from './web3/provider';
export type { Web3ProviderState } from './web3/provider';

export { getContractService, resetContractService } from './web3/contract';
export type { ProtocolStatsRaw, ContractServiceInstance } from './web3/contract';

export {
  decodeWeb3Error,
  isUserRejection,
  isContractNotDeployed,
  isPausedError,
  isReentrancyError,
} from './web3/errors';
export type { DecodedError } from './web3/errors';

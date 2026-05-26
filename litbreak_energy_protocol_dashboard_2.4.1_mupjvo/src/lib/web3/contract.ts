/**
 * Web3 Contract Service — Singleton contract interaction layer.
 * Imports only from ./config and ./provider (no circular deps).
 *
 * Pass 11 fix (A-3, A-6):
 *   - Removed `accumulatedFees` from getProtocolStats() — no such function
 *     exists in the contract. The contract tracks fees implicitly via the
 *     difference between totalCollateral and totalSupply/exchangeRate.
 *   - Added `feeBps` read (was missing, used `protocolFeeBps` which doesn't exist).
 *   - ProtocolStatsRaw now matches actual contract interface exactly.
 */

import { ethers } from 'ethers';
import { getWeb3Config, isContractConfigured } from './config';
import { getWeb3Provider } from './provider';
import { LITBREAK_PROTOCOL_ABI } from '../ContractABI';

export interface ProtocolStatsRaw {
  totalSupply: bigint;
  hardCap: bigint;
  totalCollateral: bigint;
  exchangeRate: bigint;
  feeBps: bigint;
  energyPriceUsd: bigint;
  isPaused: boolean;
}

export interface ContractServiceInstance {
  contract: ethers.Contract;
  provider: ethers.Provider;
  contractAddress: string;
  getProtocolStats: () => Promise<ProtocolStatsRaw>;
  balanceOf: (address: string) => Promise<bigint>;
}

let _service: ContractServiceInstance | null = null;

/**
 * Get or create the contract service singleton.
 * Throws if contract is not configured or provider unavailable.
 */
export function getContractService(): ContractServiceInstance {
  if (_service) return _service;

  if (!isContractConfigured()) {
    throw new Error('Contract is not configured. Set VITE_CONTRACT_ADDRESS, VITE_RPC_URL, and VITE_CHAIN_ID.');
  }

  const providerState = getWeb3Provider();
  if (!providerState.provider) {
    throw new Error('Web3 provider is not available.');
  }

  const config = getWeb3Config();
  const contract = new ethers.Contract(
    config.contractAddress,
    LITBREAK_PROTOCOL_ABI,
    providerState.provider,
  );

  _service = {
    contract,
    provider: providerState.provider,
    contractAddress: config.contractAddress,

    /**
     * Read all protocol stats in a single multicall-style batch.
     * Pass 11 (A-6): Removed accumulatedFees — not a contract function.
     * The contract's fee is tracked via `feeBps` (basis points applied per tx).
     */
    async getProtocolStats(): Promise<ProtocolStatsRaw> {
      const [
        totalSupply,
        hardCap,
        totalCollateral,
        exchangeRate,
        feeBps,
        energyPriceUsd,
        isPaused,
      ] = await Promise.all([
        contract.totalSupply() as Promise<bigint>,
        contract.HARD_CAP() as Promise<bigint>,
        contract.getLtcBalance() as Promise<bigint>,
        contract.exchangeRate() as Promise<bigint>,
        contract.feeBps() as Promise<bigint>,
        contract.energyPriceUsd() as Promise<bigint>,
        contract.paused() as Promise<boolean>,
      ]);

      return {
        totalSupply,
        hardCap,
        totalCollateral,
        exchangeRate,
        feeBps,
        energyPriceUsd,
        isPaused,
      };
    },

    async balanceOf(address: string): Promise<bigint> {
      return contract.balanceOf(address) as Promise<bigint>;
    },
  };

  return _service;
}

/**
 * Reset the contract service (for network switch / disconnect).
 */
export function resetContractService(): void {
  _service = null;
}

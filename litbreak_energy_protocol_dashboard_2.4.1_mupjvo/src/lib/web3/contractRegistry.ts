/**
 * contractRegistry.ts — Network configuration and contract address registry
 *
 * Pass 11: Created to resolve A-1/A-5 — Web3Context imports from this file
 * but it didn't exist. Provides centralized network config for LitVM.
 *
 * This is the SINGLE SOURCE OF TRUTH for:
 *   - Supported network definitions (chainId, name, RPC, explorer)
 *   - Contract addresses per network
 *   - Network validation utilities
 */

export interface NetworkConfig {
  chainId: number;
  name: string;
  shortName: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

/**
 * LitVM network definitions.
 * Chain IDs are placeholders — update when LitVM mainnet/testnet launch.
 */
export const NETWORKS: Record<number, NetworkConfig> = {
  // LitVM Testnet
  1001: {
    chainId: 1001,
    name: 'LitVM Testnet',
    shortName: 'litvm-test',
    rpcUrl: import.meta.env.VITE_RPC_URL || 'https://testnet-rpc.litvm.io',
    explorerUrl: 'https://testnet-explorer.litvm.io',
    nativeCurrency: {
      name: 'Litecoin',
      symbol: 'LTC',
      decimals: 18,
    },
    isTestnet: true,
  },
  // LitVM Mainnet (future)
  1000: {
    chainId: 1000,
    name: 'LitVM Mainnet',
    shortName: 'litvm',
    rpcUrl: 'https://rpc.litvm.io',
    explorerUrl: 'https://explorer.litvm.io',
    nativeCurrency: {
      name: 'Litecoin',
      symbol: 'LTC',
      decimals: 18,
    },
    isTestnet: false,
  },
};

/**
 * Contract addresses per chain ID.
 * Empty string = not deployed on that network.
 */
const CONTRACT_ADDRESSES: Record<number, string> = {
  1001: import.meta.env.VITE_CONTRACT_ADDRESS || '',
  1000: '', // Not yet deployed
};

/**
 * Default chain ID for simulation mode.
 */
export const DEFAULT_SIMULATION_CHAIN_ID = 1001;

/**
 * Check if a chain ID is in our supported networks list.
 */
export function isSupportedNetwork(chainId: number): boolean {
  return chainId in NETWORKS;
}

/**
 * Get the contract address for a given chain ID.
 * Returns empty string if not deployed.
 */
export function getContractAddress(chainId: number): string {
  return CONTRACT_ADDRESSES[chainId] || '';
}

/**
 * Get the full network config for a chain ID, or null if unsupported.
 */
export function getNetworkConfig(chainId: number): NetworkConfig | null {
  return NETWORKS[chainId] || null;
}

/**
 * Validate that a contract is properly configured for a given chain.
 * Returns null if valid, or an error message string if not.
 */
export function validateContractConfig(chainId: number): string | null {
  if (!isSupportedNetwork(chainId)) {
    const supported = Object.values(NETWORKS)
      .map(n => `${n.name} (${n.chainId})`)
      .join(', ');
    return `Unsupported network (chainId: ${chainId}). Supported: ${supported}`;
  }

  const address = getContractAddress(chainId);
  if (!address || address.length !== 42 || !address.startsWith('0x')) {
    const network = NETWORKS[chainId];
    return `LitbreakProtocol contract not deployed on ${network.name}. Contract address not configured.`;
  }

  return null;
}

/**
 * Get all supported networks as an array (for UI dropdowns).
 */
export function getSupportedNetworks(): NetworkConfig[] {
  return Object.values(NETWORKS);
}

/**
 * Web3 Config — Contract configuration and validation.
 * Minimal module — no circular imports.
 */

const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || '';
const RPC_URL = import.meta.env.VITE_RPC_URL || '';
const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID || '0', 10);

export interface Web3Config {
  contractAddress: string;
  rpcUrl: string;
  chainId: number;
}

export function getWeb3Config(): Web3Config {
  return {
    contractAddress: CONTRACT_ADDRESS,
    rpcUrl: RPC_URL,
    chainId: CHAIN_ID,
  };
}

/**
 * Returns true only if a valid contract address and RPC URL are configured
 * via environment variables.
 */
export function isContractConfigured(): boolean {
  return (
    CONTRACT_ADDRESS.length === 42 &&
    CONTRACT_ADDRESS.startsWith('0x') &&
    RPC_URL.length > 0 &&
    CHAIN_ID > 0
  );
}

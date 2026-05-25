/**
 * ContractRegistry — Centralized registry for all contract addresses, ABIs, and configuration.
 * Single source of truth for the frontend to reference contract details.
 *
 * Fix #12: POWER_TOKEN previously had a separate address from LITBREAK_PROTOCOL,
 * which was misleading since POWER is the ERC-20 built into the LitbreakProtocol
 * contract itself. Now aliased to the same address with a clarifying comment.
 */

export interface ContractInfo {
  address: string;
  name: string;
  symbol?: string;
  decimals?: number;
  chainId: number;
  deployedAt?: number;
  explorerUrl: string;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  explorerUrl: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
  isTestnet: boolean;
}

// ─── Network Configurations ──────────────────────────────────────────────────

export const NETWORKS: Record<string, NetworkConfig> = {
  'litvm-testnet': {
    chainId: 421611,
    name: 'LitVM Testnet',
    rpcUrl: 'https://rpc.litvm-testnet.io',
    explorerUrl: 'https://explorer.litvm-testnet.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: true,
  },
  'litvm-mainnet': {
    chainId: 421612,
    name: 'LitVM Mainnet',
    rpcUrl: 'https://rpc.litvm.io',
    explorerUrl: 'https://explorer.litvm.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: false,
  },
};

// ─── Canonical Protocol Address ──────────────────────────────────────────────
// The LitbreakProtocol contract IS the POWER token (ERC-20 built-in).
// There is no separate token contract — both share the same address.

const LITBREAK_PROTOCOL_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd';

// ─── Contract Addresses ──────────────────────────────────────────────────────

export const CONTRACTS: Record<string, ContractInfo> = {
  /**
   * POWER Token — The ERC-20 token interface of the LitbreakProtocol contract.
   * NOTE: This is the SAME contract as LITBREAK_PROTOCOL. The POWER token is
   * built directly into the protocol contract (not a separate deployment).
   * Both entries share the same address for clarity.
   */
  POWER_TOKEN: {
    address: LITBREAK_PROTOCOL_ADDRESS,
    name: 'POWER Token',
    symbol: 'POWER',
    decimals: 18,
    chainId: 421611,
    explorerUrl: `https://explorer.litvm-testnet.io/address/${LITBREAK_PROTOCOL_ADDRESS}`,
  },
  LITBREAK_PROTOCOL: {
    address: LITBREAK_PROTOCOL_ADDRESS,
    name: 'Litbreak Protocol',
    chainId: 421611,
    explorerUrl: `https://explorer.litvm-testnet.io/address/${LITBREAK_PROTOCOL_ADDRESS}`,
  },
  PRICE_FEED: {
    address: '0x9876543210fedcba9876543210fedcba98765432',
    name: 'Electricity Price Feed',
    chainId: 421611,
    explorerUrl: 'https://explorer.litvm-testnet.io/address/0x9876543210fedcba9876543210fedcba98765432',
  },
  WLTC: {
    address: '0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
    name: 'Wrapped Litecoin',
    symbol: 'wLTC',
    decimals: 18,
    chainId: 421611,
    explorerUrl: 'https://explorer.litvm-testnet.io/address/0xfedcbafedcbafedcbafedcbafedcbafedcbafedc',
  },
};

// ─── Protocol Constants ──────────────────────────────────────────────────────

export const PROTOCOL_CONSTANTS = {
  HARD_CAP: 84_000_000,
  BASE_MONTHLY_RELEASE: 4_605,
  MIN_ESCALATOR_BPS: 0,
  MAX_ESCALATOR_BPS: 2000,
  ORACLE_TIMELOCK_DELAY: 48 * 60 * 60, // 48 hours in seconds
  MAX_CATCHUP_MONTHS: 3,
  DEFAULT_STALENESS_THRESHOLD: 30 * 24 * 60 * 60, // 30 days in seconds
  TOKEN_DECIMALS: 18,
  DEFAULT_EXCHANGE_RATE: 102.37,
  DEFAULT_PROTOCOL_FEE_BPS: 50,
} as const;

// ─── Helper Functions ────────────────────────────────────────────────────────

export function getExplorerTxUrl(txHash: string, networkKey: string = 'litvm-testnet'): string {
  const network = NETWORKS[networkKey];
  return network ? `${network.explorerUrl}/tx/${txHash}` : `#tx-${txHash}`;
}

export function getExplorerAddressUrl(address: string, networkKey: string = 'litvm-testnet'): string {
  const network = NETWORKS[networkKey];
  return network ? `${network.explorerUrl}/address/${address}` : `#addr-${address}`;
}

export function getExplorerBlockUrl(blockNumber: number, networkKey: string = 'litvm-testnet'): string {
  const network = NETWORKS[networkKey];
  return network ? `${network.explorerUrl}/block/${blockNumber}` : `#block-${blockNumber}`;
}

export function shortenAddress(address: string, chars: number = 4): string {
  if (!address) return '';
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

export function shortenTxHash(hash: string, chars: number = 6): string {
  if (!hash) return '';
  return `${hash.slice(0, chars + 2)}...${hash.slice(-chars)}`;
}

export function getDefaultNetwork(): NetworkConfig {
  return NETWORKS['litvm-testnet'];
}

export function getContractBySymbol(symbol: string): ContractInfo | undefined {
  return Object.values(CONTRACTS).find(c => c.symbol === symbol);
}

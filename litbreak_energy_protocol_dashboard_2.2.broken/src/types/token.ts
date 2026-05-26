/**
 * Token type definitions for the Litbreak Protocol frontend.
 */

export interface TokenInfo {
  /** ERC-20 contract address (checksummed) */
  address: string;
  /** Token name, e.g. "Litbreak Energy Token" */
  name: string;
  /** Ticker symbol, e.g. "LBT" */
  symbol: string;
  /** Decimal places (typically 18) */
  decimals: number;
  /** Optional logo URI */
  logoURI?: string;
  /** Whether this token was added by the user */
  isCustom?: boolean;
  /** Chain ID this token belongs to */
  chainId?: number;
}

export interface TokenBalance {
  token: TokenInfo;
  /** Raw balance as bigint (wei-denominated) */
  rawBalance: bigint;
  /** Human-readable balance string */
  formatted: string;
  /** USD value if price data is available */
  usdValue?: number;
}

export interface TokenPrice {
  address: string;
  priceUsd: number;
  priceChange24h: number;
  lastUpdated: number;
}

export interface TokenAllowance {
  token: TokenInfo;
  owner: string;
  spender: string;
  /** Raw allowance as bigint */
  rawAllowance: bigint;
  /** Human-readable allowance */
  formatted: string;
}

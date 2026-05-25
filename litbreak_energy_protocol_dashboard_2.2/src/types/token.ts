/**
 * Token-related types for the Litbreak Energy Protocol.
 * Covers POWER token data, escalator state, and mint/redeem quotes.
 */

// ─── Token Data ──────────────────────────────────────────────────────────────

export interface TokenData {
  symbol: string;
  name: string;
  decimals: number;
  totalSupply: number;
  price: number;
  priceChange24h: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  maxSupply: number;
}

// ─── Exchange Rate ───────────────────────────────────────────────────────────

export interface ExchangeRateData {
  rate: number;
  inverseRate: number;
  lastUpdated: number;
  source: string;
}

// ─── Mint / Redeem Quotes ────────────────────────────────────────────────────

export interface MintQuote {
  ltcAmount: number;
  powerAmount: number;
  fee: number;
  rate: number;
  slippage: number;
  estimatedGas: number;
}

export interface RedeemQuote {
  powerAmount: number;
  ltcAmount: number;
  fee: number;
  rate: number;
  slippage: number;
  estimatedGas: number;
}

// ─── Escalator State ─────────────────────────────────────────────────────────

export interface EscalatorState {
  currentYear: number;
  escalatorBps: number;
  isSet: boolean;
  totalSupply: number;
  monthlyRate: number;
  nextEscalatorDate?: number;
}

// ─── Protocol Stats ──────────────────────────────────────────────────────────

export interface ProtocolStats {
  totalSupply: number;
  hardCap: number;
  totalCollateral: number;
  exchangeRate: number;
  protocolFeeBps: number;
  accumulatedFees: number;
  isPaused: boolean;
  contractYear: number;
  monthlyRate: number;
  holders: number;
  totalTransactions: number;
}

// ─── Energy Rate ─────────────────────────────────────────────────────────────

export interface EnergyRate {
  country: string;
  countryCode: string;
  rate: number;          // USD per kWh
  change24h: number;     // percentage
  source: string;
  lastUpdated: number;
}

// ─── Mining Stats ────────────────────────────────────────────────────────────

export interface MiningStatsData {
  hashRate: number;
  difficulty: number;
  blockHeight: number;
  blockTime: number;
  networkPower: number;
  energyCost: number;
  profitability: number;
  lastBlockTime: number;
}

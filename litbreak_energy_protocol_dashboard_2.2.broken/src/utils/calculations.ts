/**
 * Utility functions for the Litbreak Energy Protocol frontend.
 */

/**
 * Format a wallet address to abbreviated form: 0x1234...abcd
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address || '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Format a token amount with appropriate decimal places.
 */
export function formatTokenAmount(amount: number, decimals: number = 4): string {
  if (amount === 0) return '0.00';
  if (amount < 0.0001) return '<0.0001';
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toFixed(2)}M`;
  }
  if (amount >= 1_000) {
    return `${(amount / 1_000).toFixed(2)}K`;
  }
  return amount.toFixed(decimals);
}

/**
 * Format USD value.
 */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format a percentage change with + or - prefix.
 */
export function formatPercentChange(change: number): string {
  const prefix = change >= 0 ? '+' : '';
  return `${prefix}${change.toFixed(2)}%`;
}

/**
 * Convert Litoshi to LTC.
 */
export function litoshiToLtc(litoshi: number): number {
  return litoshi / 1e8;
}

/**
 * Convert LTC to Litoshi.
 */
export function ltcToLitoshi(ltc: number): number {
  return Math.floor(ltc * 1e8);
}

/**
 * Calculate kWh cost in LTC given energy rate (USD/kWh) and LTC/USD price.
 */
export function kwhToLtc(kwhRate: number, ltcUsdPrice: number): number {
  if (ltcUsdPrice <= 0) return 0;
  return kwhRate / ltcUsdPrice;
}

/**
 * Calculate how many kWh you can buy with a given LTC amount.
 */
export function ltcToKwh(ltcAmount: number, kwhRate: number, ltcUsdPrice: number): number {
  if (kwhRate <= 0) return 0;
  return (ltcAmount * ltcUsdPrice) / kwhRate;
}

/**
 * Format a timestamp to relative time string.
 */
export function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Truncate a transaction hash for display.
 */
export function formatTxHash(hash: string): string {
  if (!hash || hash.length < 12) return hash || '';
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`;
}

/**
 * Contract helper utilities for Litbreak v2.
 * Includes formatting, gas estimation, and oracle-aware calculations.
 */

/**
 * Format a number with locale-aware separators and fixed decimals.
 */
export function formatNumber(value: number, decimals: number = 2): string {
  if (value === 0) return '0';
  if (Math.abs(value) < 0.0001) return '< 0.0001';

  return value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as a USD currency string.
 * Examples: $87.42, $2,150.75, $0.00, < $0.01
 */
export function formatUSD(value: number): string {
  if (value === 0) return '$0.00';
  if (Math.abs(value) < 0.01) return '< $0.01';

  return '$' + value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format a wallet address with ellipsis.
 */
export function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Alias for formatAddress — shortens a hex address or hash with ellipsis.
 */
export const shortenAddress = formatAddress;

/**
 * Simulate gas estimate for transactions.
 * Returns mock gas data for UI display.
 */
export function simulateGasEstimate(): {
  gasLimit: number;
  gasPrice: number;
  totalGwei: number;
  totalUSD: number;
} {
  const gasLimit = 150000 + Math.floor(Math.random() * 50000);
  const gasPrice = 20 + Math.floor(Math.random() * 30);
  const totalGwei = gasLimit * gasPrice;
  const totalUSD = (totalGwei / 1e9) * 87;

  return { gasLimit, gasPrice, totalGwei, totalUSD };
}

/**
 * Calculate LBT output from WLTC input.
 * Formula: lbtOut = wltcAmount × ltcPrice × gei
 */
export function calculateMintOutput(
  wltcAmount: number,
  gei: number,
  ltcPrice: number
): number {
  if (wltcAmount <= 0 || gei <= 0 || ltcPrice <= 0) return 0;
  return wltcAmount * ltcPrice * gei;
}

/**
 * Calculate WLTC output from LBT input (with 0.3% fee).
 * Formula: wltcOut = (lbtAmount / (ltcPrice × gei)) × 0.997
 */
export function calculateRedeemOutput(
  lbtAmount: number,
  gei: number,
  ltcPrice: number
): number {
  if (lbtAmount <= 0 || gei <= 0 || ltcPrice <= 0) return 0;
  return (lbtAmount / (ltcPrice * gei)) * 0.997;
}

/**
 * Format a timestamp as relative time (e.g., "2m ago", "1h ago").
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

/**
 * Get oracle health color for UI display.
 */
export function getOracleHealthColor(
  health: 'healthy' | 'stale' | 'error' | 'standby' | 'deviation'
): string {
  switch (health) {
    case 'healthy':
      return 'text-emerald-400';
    case 'stale':
      return 'text-amber-400';
    case 'error':
      return 'text-red-400';
    case 'deviation':
      return 'text-orange-400';
    case 'standby':
      return 'text-neutral-500';
    default:
      return 'text-neutral-400';
  }
}

/**
 * Get oracle health background color for badges.
 */
export function getOracleHealthBg(
  health: 'healthy' | 'stale' | 'error' | 'standby' | 'deviation'
): string {
  switch (health) {
    case 'healthy':
      return 'bg-emerald-400/10 border-emerald-400/20';
    case 'stale':
      return 'bg-amber-400/10 border-amber-400/20';
    case 'error':
      return 'bg-red-400/10 border-red-400/20';
    case 'deviation':
      return 'bg-orange-400/10 border-orange-400/20';
    case 'standby':
      return 'bg-neutral-500/10 border-neutral-500/20';
    default:
      return 'bg-neutral-400/10 border-neutral-400/20';
  }
}

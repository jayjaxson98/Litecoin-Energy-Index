/**
 * priceUtils.ts — Energy price scaling conversion utilities
 *
 * Resolves: [MEDIUM] Energy price scaling mismatch (dApp Integration Finding)
 *
 * The contract expects energy prices scaled by 1e6 (e.g., 142000 = $0.142/kWh)
 * but countries.ts stores rates as decimal values (e.g., 0.082, 0.159).
 * This module provides bidirectional conversion at every boundary.
 */

/** Contract price scaling factor: 1e6 */
export const PRICE_SCALE_FACTOR = 1_000_000;

/**
 * Convert a human-readable energy price (e.g., 0.142) to contract-scaled uint256.
 * @param rate Decimal energy price in USD/kWh (e.g., 0.142)
 * @returns BigInt suitable for contract calls (e.g., 142000n)
 * @throws If rate is negative or not a finite number
 */
export function toContractPrice(rate: number): bigint {
  if (!Number.isFinite(rate) || rate < 0) {
    throw new Error(`Invalid energy price: ${rate}`);
  }
  return BigInt(Math.floor(rate * PRICE_SCALE_FACTOR));
}

/**
 * Convert a contract-scaled energy price to human-readable decimal.
 * @param contractPrice Contract-scaled price (e.g., 142000n or 142000)
 * @returns Decimal energy price in USD/kWh (e.g., 0.142)
 */
export function fromContractPrice(contractPrice: bigint | number): number {
  const value = typeof contractPrice === 'bigint' ? Number(contractPrice) : contractPrice;
  return value / PRICE_SCALE_FACTOR;
}

/**
 * Format a contract-scaled energy price for display.
 * @param contractPrice Contract-scaled price
 * @param decimals Number of decimal places (default: 4)
 * @returns Formatted string (e.g., "$0.1420/kWh")
 */
export function formatEnergyPrice(contractPrice: bigint | number, decimals: number = 4): string {
  const price = fromContractPrice(contractPrice);
  return `$${price.toFixed(decimals)}/kWh`;
}

/**
 * Validate that a contract price is within the protocol's accepted range.
 * @param contractPrice Price to validate
 * @returns True if within MIN_ENERGY_PRICE..MAX_ENERGY_PRICE
 */
export function isValidContractPrice(contractPrice: bigint | number): boolean {
  const value = typeof contractPrice === 'bigint' ? Number(contractPrice) : contractPrice;
  return value >= 10_000 && value <= 1_000_000;
}

/**
 * Validate that a human-readable price converts to a valid contract price.
 * @param rate Decimal energy price in USD/kWh
 * @returns True if the converted value is within protocol bounds
 */
export function isValidEnergyRate(rate: number): boolean {
  if (!Number.isFinite(rate) || rate < 0) return false;
  const contractPrice = Math.floor(rate * PRICE_SCALE_FACTOR);
  return contractPrice >= 10_000 && contractPrice <= 1_000_000;
}

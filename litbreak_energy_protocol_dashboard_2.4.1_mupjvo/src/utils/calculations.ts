import { PROTOCOL_CONSTANTS } from '@/lib/ContractRegistry';

const LITOSHI_PER_LTC = PROTOCOL_CONSTANTS.LITOSHI_PER_LTC; // 100,000,000

/**
 * Convert Litoshi to kWh
 * Formula: litoshi → LTC → USD → kWh
 *   ltcAmount = litoshi / 100_000_000
 *   usdValue = ltcAmount × ltcPriceUsd
 *   kWh = usdValue / energyPricePerKwh
 */
export function litoshiToKwh(
  litoshi: number,
  ltcPriceUsd: number,
  energyPricePerKwh: number
): number {
  if (litoshi <= 0 || ltcPriceUsd <= 0 || energyPricePerKwh <= 0) return 0;
  const ltcAmount = litoshi / LITOSHI_PER_LTC;
  const usdValue = ltcAmount * ltcPriceUsd;
  return usdValue / energyPricePerKwh;
}

/**
 * Convert kWh to Litoshi
 * Formula: kWh → USD → LTC → litoshi
 */
export function kwhToLitoshi(
  kwh: number,
  ltcPriceUsd: number,
  energyPricePerKwh: number
): number {
  if (kwh <= 0 || ltcPriceUsd <= 0 || energyPricePerKwh <= 0) return 0;
  const usdValue = kwh * energyPricePerKwh;
  const ltcAmount = usdValue / ltcPriceUsd;
  return Math.round(ltcAmount * LITOSHI_PER_LTC);
}

/**
 * Convert LTC to Litoshi
 */
export function ltcToLitoshi(ltc: number): number {
  return Math.round(ltc * LITOSHI_PER_LTC);
}

/**
 * Convert Litoshi to LTC
 */
export function litoshiToLtc(litoshi: number): number {
  return litoshi / LITOSHI_PER_LTC;
}

/**
 * Format large numbers with commas
 */
export function formatWithCommas(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0 });
}

/**
 * Format LTC with appropriate precision
 */
export function formatLtc(ltc: number): string {
  if (ltc >= 1) return ltc.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 8 });
  return ltc.toFixed(8);
}

/**
 * Format USD currency
 */
export function formatUsd(usd: number): string {
  if (usd >= 1_000_000_000) return `$${(usd / 1_000_000_000).toFixed(2)}B`;
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(2)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(2)}K`;
  return `$${usd.toFixed(2)}`;
}

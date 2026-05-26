/**
 * countries.ts — Global electricity rate data with protocol oracle integration.
 *
 * Each country's residential electricity rate feeds into the protocol's
 * energy index calculation. The oracle uses a consumption-weighted average
 * of these rates to derive the global energy price that adjusts the
 * POWER/LTC exchange rate on-chain.
 *
 * Contract integration:
 *   - energyPriceUsd (oracle) = weighted average of country rates × 1e6
 *   - updateEnergyPrice() is called by the oracle with the computed index
 *   - The exchange rate adjusts inversely: higher energy → fewer POWER per LTC
 */

import { PROTOCOL_CONSTANTS } from '../lib/ContractRegistry';
import { getOracleSimulator } from '../lib/OracleSimulator';
import type { OracleRoundData } from '../lib/OracleSimulator';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CountryData {
  code: string;
  name: string;
  flag: string;
  rate: number;         // USD/kWh residential electricity price
  consumption: number;  // TWh annual consumption (for weighting)
  region: string;
}

export interface EnergyIndexResult {
  /** Consumption-weighted global average (USD/kWh) */
  weightedAverage: number;
  /** Scaled for on-chain oracle (×1e6) */
  oracleValue: number;
  /** Whether the value is within oracle bounds */
  withinBounds: boolean;
  /** Current oracle round data */
  oracleRound: OracleRoundData;
  /** Energy factor: ratio of current price to baseline */
  energyFactor: number;
  /** Implied exchange rate adjustment multiplier */
  exchangeRateMultiplier: number;
  /** Timestamp of computation */
  timestamp: number;
}

export interface RegionBreakdown {
  region: string;
  avgRate: number;
  totalConsumption: number;
  weight: number;
  countryCount: number;
}

// ─── Country Data ────────────────────────────────────────────────────────────
// Top 30 countries by electricity consumption with residential rates (2024)

export const countries: CountryData[] = [
  { code: 'CHN', name: 'China', flag: '🇨🇳', rate: 0.082, consumption: 7538, region: 'Asia-Pacific' },
  { code: 'USA', name: 'United States', flag: '🇺🇸', rate: 0.159, consumption: 3902, region: 'Americas' },
  { code: 'IND', name: 'India', flag: '🇮🇳', rate: 0.080, consumption: 1490, region: 'Asia-Pacific' },
  { code: 'RUS', name: 'Russia', flag: '🇷🇺', rate: 0.071, consumption: 1023, region: 'Europe' },
  { code: 'JPN', name: 'Japan', flag: '🇯🇵', rate: 0.256, consumption: 936, region: 'Asia-Pacific' },
  { code: 'BRA', name: 'Brazil', flag: '🇧🇷', rate: 0.141, consumption: 605, region: 'Americas' },
  { code: 'KOR', name: 'South Korea', flag: '🇰🇷', rate: 0.114, consumption: 577, region: 'Asia-Pacific' },
  { code: 'CAN', name: 'Canada', flag: '🇨🇦', rate: 0.117, consumption: 564, region: 'Americas' },
  { code: 'DEU', name: 'Germany', flag: '🇩🇪', rate: 0.374, consumption: 536, region: 'Europe' },
  { code: 'SAU', name: 'Saudi Arabia', flag: '🇸🇦', rate: 0.051, consumption: 353, region: 'Middle East' },
  { code: 'FRA', name: 'France', flag: '🇫🇷', rate: 0.206, consumption: 450, region: 'Europe' },
  { code: 'GBR', name: 'United Kingdom', flag: '🇬🇧', rate: 0.287, consumption: 314, region: 'Europe' },
  { code: 'ITA', name: 'Italy', flag: '🇮🇹', rate: 0.303, consumption: 298, region: 'Europe' },
  { code: 'AUS', name: 'Australia', flag: '🇦🇺', rate: 0.254, consumption: 263, region: 'Asia-Pacific' },
  { code: 'MEX', name: 'Mexico', flag: '🇲🇽', rate: 0.096, consumption: 310, region: 'Americas' },
  { code: 'TUR', name: 'Turkey', flag: '🇹🇷', rate: 0.103, consumption: 308, region: 'Europe' },
  { code: 'IDN', name: 'Indonesia', flag: '🇮🇩', rate: 0.094, consumption: 285, region: 'Asia-Pacific' },
  { code: 'ESP', name: 'Spain', flag: '🇪🇸', rate: 0.265, consumption: 253, region: 'Europe' },
  { code: 'THA', name: 'Thailand', flag: '🇹🇭', rate: 0.107, consumption: 202, region: 'Asia-Pacific' },
  { code: 'ZAF', name: 'South Africa', flag: '🇿🇦', rate: 0.116, consumption: 215, region: 'Africa' },
  { code: 'SWE', name: 'Sweden', flag: '🇸🇪', rate: 0.195, consumption: 139, region: 'Europe' },
  { code: 'POL', name: 'Poland', flag: '🇵🇱', rate: 0.188, consumption: 170, region: 'Europe' },
  { code: 'ARG', name: 'Argentina', flag: '🇦🇷', rate: 0.076, consumption: 149, region: 'Americas' },
  { code: 'NOR', name: 'Norway', flag: '🇳🇴', rate: 0.128, consumption: 131, region: 'Europe' },
  { code: 'EGY', name: 'Egypt', flag: '🇪🇬', rate: 0.042, consumption: 201, region: 'Africa' },
  { code: 'VNM', name: 'Vietnam', flag: '🇻🇳', rate: 0.092, consumption: 228, region: 'Asia-Pacific' },
  { code: 'ARE', name: 'UAE', flag: '🇦🇪', rate: 0.078, consumption: 159, region: 'Middle East' },
  { code: 'COL', name: 'Colombia', flag: '🇨🇴', rate: 0.104, consumption: 80, region: 'Americas' },
  { code: 'CHL', name: 'Chile', flag: '🇨🇱', rate: 0.168, consumption: 82, region: 'Americas' },
  { code: 'MYS', name: 'Malaysia', flag: '🇲🇾', rate: 0.089, consumption: 167, region: 'Asia-Pacific' },
];

// ─── Baseline Energy Price ───────────────────────────────────────────────────
// The protocol's initial energy price: $0.142/kWh (142,000 in oracle scale)

const BASELINE_ENERGY_PRICE = 0.142;

// ─── Computation Functions ───────────────────────────────────────────────────

/**
 * Compute the consumption-weighted global energy price index.
 *
 * This is the off-chain computation that the oracle performs before
 * calling `updateEnergyPrice(newPriceUsd)` on the smart contract.
 *
 * @returns EnergyIndexResult with weighted average, oracle value, and metadata
 */
export function computeEnergyIndex(): EnergyIndexResult {
  const oracle = getOracleSimulator();
  const oracleRound = oracle.latestRoundData();

  const totalConsumption = countries.reduce((sum, c) => sum + c.consumption, 0);
  const weightedSum = countries.reduce((sum, c) => sum + c.rate * c.consumption, 0);
  const weightedAverage = weightedSum / totalConsumption;

  // Scale to oracle format (×1e6)
  const oracleValue = Math.round(weightedAverage * 1_000_000);

  // Check against contract bounds
  const withinBounds =
    oracleValue >= PROTOCOL_CONSTANTS.MIN_ENERGY_PRICE &&
    oracleValue <= PROTOCOL_CONSTANTS.MAX_ENERGY_PRICE;

  // Energy factor: how current price compares to baseline
  const energyFactor = weightedAverage / BASELINE_ENERGY_PRICE;

  // Exchange rate multiplier: inverse of energy factor
  // Higher energy → lower multiplier → fewer POWER per LTC
  const exchangeRateMultiplier = 1 / energyFactor;

  return {
    weightedAverage,
    oracleValue,
    withinBounds,
    oracleRound,
    energyFactor,
    exchangeRateMultiplier,
    timestamp: Date.now(),
  };
}

/**
 * Get regional breakdown of energy rates.
 * Used by the CountryRates component for regional analysis.
 */
export function getRegionBreakdown(): RegionBreakdown[] {
  const regionMap = new Map<string, { rates: number[]; consumptions: number[] }>();

  for (const c of countries) {
    if (!regionMap.has(c.region)) {
      regionMap.set(c.region, { rates: [], consumptions: [] });
    }
    const r = regionMap.get(c.region)!;
    r.rates.push(c.rate);
    r.consumptions.push(c.consumption);
  }

  const totalGlobalConsumption = countries.reduce((s, c) => s + c.consumption, 0);

  const breakdowns: RegionBreakdown[] = [];
  for (const [region, data] of regionMap) {
    const totalConsumption = data.consumptions.reduce((s, v) => s + v, 0);
    const weightedRate = data.rates.reduce(
      (s, r, i) => s + r * data.consumptions[i], 0
    ) / totalConsumption;

    breakdowns.push({
      region,
      avgRate: weightedRate,
      totalConsumption,
      weight: totalConsumption / totalGlobalConsumption,
      countryCount: data.rates.length,
    });
  }

  return breakdowns.sort((a, b) => b.weight - a.weight);
}

/**
 * Simulate what the oracle would submit to the contract.
 *
 * Returns the parameters that would be passed to:
 *   contract.updateEnergyPrice(newPriceUsd)
 *
 * Includes validation against contract bounds (MIN_ENERGY_PRICE, MAX_ENERGY_PRICE)
 * and rate-of-change limits (MAX_PRICE_CHANGE_RATIO = 200%).
 */
export function simulateOracleSubmission(): {
  newPriceUsd: number;
  wouldSucceed: boolean;
  reason: string | null;
  currentOnChainPrice: number;
  maxAllowed: number;
  minAllowed: number;
} {
  const index = computeEnergyIndex();
  const currentOnChainPrice = index.oracleRound.answer;

  // Simulate contract-side validation
  const maxAllowed = Math.round((currentOnChainPrice * 200) / 100);
  const minAllowed = Math.round((currentOnChainPrice * 100) / 200);

  let wouldSucceed = true;
  let reason: string | null = null;

  if (index.oracleValue < PROTOCOL_CONSTANTS.MIN_ENERGY_PRICE) {
    wouldSucceed = false;
    reason = `Price ${index.oracleValue} below MIN_ENERGY_PRICE (${PROTOCOL_CONSTANTS.MIN_ENERGY_PRICE})`;
  } else if (index.oracleValue > PROTOCOL_CONSTANTS.MAX_ENERGY_PRICE) {
    wouldSucceed = false;
    reason = `Price ${index.oracleValue} above MAX_ENERGY_PRICE (${PROTOCOL_CONSTANTS.MAX_ENERGY_PRICE})`;
  } else if (currentOnChainPrice > 0) {
    if (index.oracleValue > maxAllowed) {
      wouldSucceed = false;
      reason = `Price change too large: ${index.oracleValue} > max ${maxAllowed}`;
    } else if (index.oracleValue < minAllowed) {
      wouldSucceed = false;
      reason = `Price change too large: ${index.oracleValue} < min ${minAllowed}`;
    }
  }

  return {
    newPriceUsd: index.oracleValue,
    wouldSucceed,
    reason,
    currentOnChainPrice,
    maxAllowed,
    minAllowed,
  };
}

/**
 * Generate historical energy index data for charts.
 * Simulates 24 hours of index values with realistic drift.
 */
export function generateHistoricalIndex(
  hours: number = 24
): { time: string; index: number; factor: number }[] {
  const data: { time: string; index: number; factor: number }[] = [];
  const baseIndex = computeEnergyIndex().weightedAverage;
  const baseFactor = baseIndex / BASELINE_ENERGY_PRICE;
  const now = new Date();

  for (let i = hours; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 3600000);
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const noise = (Math.random() - 0.5) * 0.02;
    const trend = Math.sin(i / 6) * 0.01;
    data.push({
      time: timeStr,
      index: parseFloat((baseIndex + noise + trend).toFixed(4)),
      factor: parseFloat((baseFactor + (noise * 5) + (trend * 3)).toFixed(4)),
    });
  }

  return data;
}

/**
 * LTC mining efficiency data — used by MiningStats component.
 * Relates energy costs to mining profitability.
 */
export const ltcMiningData = {
  currentEfficiency: 0.1123,
  networkHashrate: 923,
  blockReward: 12.5,
  blockTime: 150,
  difficulty: 76_432_198,
  energyPerLTC: 0.1123,
};

/**
 * Protocol stats snapshot — derived from contract state.
 * Used as initial/fallback values before live data loads.
 */
export function getProtocolStatsSnapshot() {
  const index = computeEnergyIndex();

  return {
    totalPowerMinted: 2_450_000,
    hardCap: PROTOCOL_CONSTANTS.HARD_CAP,
    wLTCReserve: 19_600,
    currentRatio: index.exchangeRateMultiplier * PROTOCOL_CONSTANTS.DEFAULT_EXCHANGE_RATE,
    energyFactor: index.energyFactor,
    globalIndex: index.weightedAverage,
    totalHolders: 4_821,
    totalTransactions: 128_493,
    mintFeeBps: PROTOCOL_CONSTANTS.DEFAULT_FEE_BPS,
    redeemFeeBps: PROTOCOL_CONSTANTS.DEFAULT_FEE_BPS,
    lastUpdateTime: Date.now(),
  };
}

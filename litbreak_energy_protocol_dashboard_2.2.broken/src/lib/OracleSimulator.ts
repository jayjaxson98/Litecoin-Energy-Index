/**
 * OracleSimulator — Simulates a multi-oracle energy price system.
 *
 * Models multiple independent oracle sources submitting prices,
 * with median aggregation, TWAP smoothing, staleness detection,
 * and per-oracle submission cooldown.
 * Mirrors the on-chain multi-oracle system in LitbreakProtocol.sol.
 *
 * Singleton pattern — use getOracleSimulator().
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OracleRoundData {
  roundId: number;
  answer: number;        // Aggregated energy price USD ×1e6
  startedAt: number;     // Unix timestamp
  updatedAt: number;     // Unix timestamp
  answeredInRound: number;
  formattedPrice: string; // Human-readable USD/kWh
}

export interface OracleSource {
  id: string;
  name: string;
  address: string;
  lastPrice: number;
  lastUpdate: number;
  isFresh: boolean;
  deviation: number;     // Deviation from median in bps
  cooldownRemaining: number; // Seconds until next submission allowed
}

export interface OracleHealthStatus {
  totalOracles: number;
  freshOracles: number;
  quorum: number;
  quorumMet: boolean;
  isStale: boolean;
  stalePaused: boolean;
  lastUpdate: number;
  secondsSinceUpdate: number;
}

export interface OracleDataFreshness {
  fresh: boolean;
  dataAge: number;
  maxStaleness: number;
}

export interface TWAPInfo {
  twapValue: number;
  dataPoints: number;
  windowSize: number;
  buffer: number[];
}

export interface AggregationResult {
  medianPrice: number;
  twapPrice: number;
  validOracles: number;
  sources: OracleSource[];
}

// ─── Constants (mirror contract) ─────────────────────────────────────────────

const MAX_ORACLES = 5;
const MAX_STALENESS = 3600; // 1 hour — mirrors contract MAX_STALENESS
const ORACLE_STALENESS_THRESHOLD = MAX_STALENESS; // Alias
const TWAP_WINDOW = 6;
const MAX_ORACLE_DEVIATION_BPS = 1000; // 10%
const ORACLE_SUBMISSION_COOLDOWN = 60; // 60 seconds

// ─── Engine ──────────────────────────────────────────────────────────────────

class OracleSimulator {
  private currentRound = 1847;
  private aggregatedPrice = 142_000; // $0.142 / kWh
  private history: OracleRoundData[] = [];
  private twapBuffer: number[] = [142_000];
  private twapIndex = 0;
  private stalePaused = false;
  private lastAggregation: number;

  // Multiple oracle sources
  private sources: OracleSource[] = [
    {
      id: 'chainlink-energy',
      name: 'Chainlink Energy Feed',
      address: '0x1111111111111111111111111111111111111111',
      lastPrice: 142_000,
      lastUpdate: Math.floor(Date.now() / 1000),
      isFresh: true,
      deviation: 0,
      cooldownRemaining: 0,
    },
    {
      id: 'band-protocol',
      name: 'Band Protocol',
      address: '0x2222222222222222222222222222222222222222',
      lastPrice: 141_500,
      lastUpdate: Math.floor(Date.now() / 1000),
      isFresh: true,
      deviation: 0,
      cooldownRemaining: 0,
    },
    {
      id: 'litbreak-oracle',
      name: 'Litbreak Oracle Node',
      address: '0x3333333333333333333333333333333333333333',
      lastPrice: 142_800,
      lastUpdate: Math.floor(Date.now() / 1000),
      isFresh: true,
      deviation: 0,
      cooldownRemaining: 0,
    },
  ];

  constructor() {
    this.lastAggregation = Math.floor(Date.now() / 1000);
    const now = Math.floor(Date.now() / 1000);

    // Generate 48 hours of historical aggregated data
    for (let i = 96; i >= 0; i--) {
      const ts = now - i * 1800;
      const noise = (Math.random() - 0.5) * 4000;
      const trend = Math.sin(i / 12) * 2000;
      const price = Math.max(10_000, Math.min(1_000_000,
        Math.round(this.aggregatedPrice + noise + trend)
      ));

      this.history.push({
        roundId: this.currentRound - i,
        answer: price,
        startedAt: ts - 10,
        updatedAt: ts,
        answeredInRound: this.currentRound - i,
        formattedPrice: `$${(price / 1_000_000).toFixed(4)}`,
      });
    }
  }

  // ─── Multi-Oracle Simulation ───────────────────────────────────────

  /**
   * Simulate each oracle source submitting a new price.
   * Each source has independent noise and respects cooldown.
   */
  private _simulateOracleSubmissions(): void {
    const now = Math.floor(Date.now() / 1000);
    const basePrice = this.aggregatedPrice;

    for (const source of this.sources) {
      // Check cooldown
      const elapsed = now - source.lastUpdate;
      if (elapsed < ORACLE_SUBMISSION_COOLDOWN) {
        source.cooldownRemaining = ORACLE_SUBMISSION_COOLDOWN - elapsed;
        continue; // Skip — cooldown active
      }
      source.cooldownRemaining = 0;

      // Each oracle has its own noise profile
      const noise = (Math.random() - 0.5) * 3000;
      const sourceSpecificBias = (Math.random() - 0.5) * 1000;
      const newPrice = Math.max(10_000, Math.min(1_000_000,
        Math.round(basePrice + noise + sourceSpecificBias)
      ));

      source.lastPrice = newPrice;
      source.lastUpdate = now - Math.floor(Math.random() * 30); // 0-30 sec ago
      source.isFresh = (now - source.lastUpdate) <= MAX_STALENESS;
    }
  }

  /**
   * Compute median of oracle submissions (mirrors _computeMedian in contract)
   */
  private _computeMedian(prices: number[]): number {
    const sorted = [...prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) return sorted[mid];
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  }

  /**
   * Compute TWAP from buffer (mirrors _computeTWAP in contract)
   */
  private _computeTWAP(): number {
    if (this.twapBuffer.length === 0) return this.aggregatedPrice;
    const sum = this.twapBuffer.reduce((s, v) => s + v, 0);
    return Math.round(sum / this.twapBuffer.length);
  }

  /**
   * Compute deviation of each source from median (in bps)
   */
  private _computeDeviations(median: number): void {
    for (const source of this.sources) {
      if (!source.isFresh) {
        source.deviation = -1; // Stale
        continue;
      }
      const diff = Math.abs(source.lastPrice - median);
      source.deviation = Math.round((diff * 10_000) / median);
    }
  }

  // ─── Public API ────────────────────────────────────────────────────

  /**
   * Simulate a full oracle round: submissions → median → TWAP → aggregation.
   * Mirrors the on-chain flow: submitOraclePrice() → _tryAggregatePrice()
   */
  latestRoundData(): OracleRoundData {
    this._simulateOracleSubmissions();

    // Collect fresh prices
    const freshPrices = this.sources
      .filter(s => s.isFresh)
      .map(s => s.lastPrice);

    if (freshPrices.length >= 2) { // Quorum check
      const median = this._computeMedian(freshPrices);
      this._computeDeviations(median);

      // Check for majority outliers (mirrors contract logic)
      let outlierCount = 0;
      for (const source of this.sources) {
        if (source.isFresh && source.deviation > MAX_ORACLE_DEVIATION_BPS) {
          outlierCount++;
        }
      }

      // Only update if majority are NOT outliers
      if (outlierCount <= freshPrices.length / 2) {
        // Update TWAP buffer
        if (this.twapBuffer.length >= TWAP_WINDOW) {
          this.twapBuffer[this.twapIndex % TWAP_WINDOW] = median;
        } else {
          this.twapBuffer.push(median);
        }
        this.twapIndex++;

        this.aggregatedPrice = this._computeTWAP();
        this.lastAggregation = Math.floor(Date.now() / 1000);
        this.stalePaused = false;
      }
    } else {
      // Not enough fresh oracles — check staleness
      const now = Math.floor(Date.now() / 1000);
      if (now - this.lastAggregation > MAX_STALENESS) {
        this.stalePaused = true;
      }
    }

    this.currentRound++;
    const now = Math.floor(Date.now() / 1000);

    const round: OracleRoundData = {
      roundId: this.currentRound,
      answer: this.aggregatedPrice,
      startedAt: now - 5,
      updatedAt: now,
      answeredInRound: this.currentRound,
      formattedPrice: `$${(this.aggregatedPrice / 1_000_000).toFixed(4)}`,
    };

    this.history.push(round);
    if (this.history.length > 200) {
      this.history = this.history.slice(-200);
    }

    return round;
  }

  getHistory(rounds: number = 48): OracleRoundData[] {
    return this.history.slice(-rounds);
  }

  getCurrentPrice(): number {
    return this.aggregatedPrice;
  }

  getFormattedPrice(): string {
    return `$${(this.aggregatedPrice / 1_000_000).toFixed(4)}/kWh`;
  }

  /**
   * Get all oracle sources with their current status.
   * Mirrors getOracleStatus() on-chain.
   */
  getSources(): OracleSource[] {
    return this.sources.map(s => ({ ...s }));
  }

  /**
   * Get oracle health status.
   * Mirrors getOracleHealth() on-chain.
   */
  getHealth(): OracleHealthStatus {
    const now = Math.floor(Date.now() / 1000);
    const freshCount = this.sources.filter(s => s.isFresh).length;
    const secondsSinceUpdate = now - this.lastAggregation;

    return {
      totalOracles: this.sources.length,
      freshOracles: freshCount,
      quorum: 2,
      quorumMet: freshCount >= 2,
      isStale: secondsSinceUpdate > MAX_STALENESS,
      stalePaused: this.stalePaused,
      lastUpdate: this.lastAggregation,
      secondsSinceUpdate,
    };
  }

  /**
   * Check if oracle data is fresh.
   * Mirrors isOracleDataFresh() on-chain.
   */
  isDataFresh(): OracleDataFreshness {
    const now = Math.floor(Date.now() / 1000);
    const dataAge = now - this.lastAggregation;

    return {
      fresh: dataAge <= MAX_STALENESS && !this.stalePaused,
      dataAge,
      maxStaleness: MAX_STALENESS,
    };
  }

  /**
   * Get TWAP information.
   * Mirrors getTWAPInfo() on-chain.
   */
  getTWAPInfo(): TWAPInfo {
    return {
      twapValue: this._computeTWAP(),
      dataPoints: this.twapBuffer.length,
      windowSize: TWAP_WINDOW,
      buffer: [...this.twapBuffer],
    };
  }

  /**
   * Get the latest aggregation result with all source details.
   */
  getAggregationResult(): AggregationResult {
    const freshPrices = this.sources.filter(s => s.isFresh).map(s => s.lastPrice);
    const median = freshPrices.length > 0 ? this._computeMedian(freshPrices) : this.aggregatedPrice;

    return {
      medianPrice: median,
      twapPrice: this._computeTWAP(),
      validOracles: this.sources.filter(s => s.isFresh).length,
      sources: this.getSources(),
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: OracleSimulator | null = null;

export function getOracleSimulator(): OracleSimulator {
  if (!instance) instance = new OracleSimulator();
  return instance;
}

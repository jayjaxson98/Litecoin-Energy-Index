/**
 * OracleSimulator — Simulates a Chainlink-style AggregatorV3 price feed.
 *
 * Provides latestRoundData() and historical round data for the
 * electricity price oracle used by the Litbreak Protocol.
 *
 * Singleton pattern — use getOracleSimulator() to get the instance.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface OracleRoundData {
  roundId: number;
  answer: number;        // Price in 8-decimal format (e.g., 10500000000 = $105.00)
  startedAt: number;     // Unix timestamp
  updatedAt: number;     // Unix timestamp
  answeredInRound: number;
  formattedPrice: number; // Human-readable price
  decimals: number;
}

export interface OracleHistoryEntry {
  roundId: number;
  price: number;
  timestamp: number;
}

// ─── Engine Implementation ───────────────────────────────────────────────────

class OracleSimulator {
  private currentRound: number;
  private currentPrice: number;
  private history: OracleHistoryEntry[] = [];
  private decimals = 8;
  private updateInterval: ReturnType<typeof setInterval>;

  constructor() {
    this.currentRound = 1000 + Math.floor(Math.random() * 5000);
    this.currentPrice = 95 + Math.random() * 20; // $95 - $115 per MWh

    // Generate historical data
    this.generateHistory();

    // Simulate periodic oracle updates
    this.updateInterval = setInterval(() => {
      this.updatePrice();
    }, 15_000); // Every 15 seconds
  }

  // ─── Public API ──────────────────────────────────────────────────────────

  latestRoundData(): OracleRoundData {
    const now = Math.floor(Date.now() / 1000);
    const answer = Math.round(this.currentPrice * 10 ** this.decimals);

    return {
      roundId: this.currentRound,
      answer,
      startedAt: now - 10,
      updatedAt: now,
      answeredInRound: this.currentRound,
      formattedPrice: this.currentPrice,
      decimals: this.decimals,
    };
  }

  getRoundData(roundId: number): OracleRoundData | null {
    const entry = this.history.find(h => h.roundId === roundId);
    if (!entry) return null;

    return {
      roundId: entry.roundId,
      answer: Math.round(entry.price * 10 ** this.decimals),
      startedAt: entry.timestamp - 10,
      updatedAt: entry.timestamp,
      answeredInRound: entry.roundId,
      formattedPrice: entry.price,
      decimals: this.decimals,
    };
  }

  getHistory(count: number = 100): OracleHistoryEntry[] {
    return this.history.slice(-count);
  }

  getCurrentPrice(): number {
    return this.currentPrice;
  }

  getDecimals(): number {
    return this.decimals;
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  private updatePrice() {
    // Random walk with mean reversion toward $105
    const meanPrice = 105;
    const drift = (meanPrice - this.currentPrice) * 0.01;
    const noise = (Math.random() - 0.5) * 2;
    this.currentPrice = Math.max(50, Math.min(200, this.currentPrice + drift + noise));
    this.currentRound += 1;

    this.history.push({
      roundId: this.currentRound,
      price: this.currentPrice,
      timestamp: Math.floor(Date.now() / 1000),
    });

    // Keep history bounded
    if (this.history.length > 10_000) {
      this.history = this.history.slice(-5_000);
    }
  }

  private generateHistory() {
    const now = Math.floor(Date.now() / 1000);
    let price = 90 + Math.random() * 20;

    for (let i = 500; i > 0; i--) {
      const drift = (105 - price) * 0.005;
      const noise = (Math.random() - 0.5) * 3;
      price = Math.max(50, Math.min(200, price + drift + noise));

      this.history.push({
        roundId: this.currentRound - i,
        price,
        timestamp: now - i * 60, // 1 minute intervals
      });
    }
  }

  destroy() {
    clearInterval(this.updateInterval);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: OracleSimulator | null = null;

export function getOracleSimulator(): OracleSimulator {
  if (!instance) {
    instance = new OracleSimulator();
  }
  return instance;
}

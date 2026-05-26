/**
 * EscalatorEngine — Simulates the token release escalator mechanism.
 *
 * Manages monthly token releases with yearly escalation rates.
 * Singleton pattern — use getEscalatorEngine().
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EscalatorState {
  totalSupply: number;
  currentYear: number;
  currentMonth: number;
  escalatorBps: number;
  monthlyRate: number;
  releasedThisMonth: number;
  totalReleased: number;
  isPaused: boolean;
}

export interface ReleaseRecord {
  year: number;
  month: number;
  amount: number;
  timestamp: number;
  txHash: string;
}

export interface ProjectedRelease {
  year: number;
  month: number;
  amount: number;
  cumulativeTotal: number;
  escalatorBps: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// ─── Engine ──────────────────────────────────────────────────────────────────

class EscalatorEngine {
  private baseMonthlyRelease = 175_000;
  private totalSupply = 2_450_000;
  private totalReleased = 2_450_000;
  private currentYear = 1;
  private currentMonth = 1;
  private escalatorBps = 250; // 2.5% yearly escalation
  private releaseHistory: ReleaseRecord[] = [];

  constructor() {
    // Generate some historical releases
    const now = Date.now();
    for (let i = 14; i > 0; i--) {
      const year = i <= 12 ? 1 : 2;
      const month = i <= 12 ? i : i - 12;
      const escalator = year === 1 ? 1 : 1 + this.escalatorBps / 10000;
      const amount = this.baseMonthlyRelease * escalator;

      this.releaseHistory.push({
        year,
        month,
        amount,
        timestamp: now - i * 30 * 24 * 60 * 60 * 1000,
        txHash: generateTxHash(),
      });
    }

    this.currentMonth = new Date().getMonth() + 1;
  }

  // ─── Public API ────────────────────────────────────────────────────────

  getState(): EscalatorState {
    const escalatorMultiplier = 1 + (this.escalatorBps / 10000);
    const monthlyRate = this.baseMonthlyRelease * (this.currentYear > 1 ? escalatorMultiplier : 1);

    return {
      totalSupply: this.totalSupply,
      currentYear: this.currentYear,
      currentMonth: this.currentMonth,
      escalatorBps: this.escalatorBps,
      monthlyRate,
      releasedThisMonth: monthlyRate,
      totalReleased: this.totalReleased,
      isPaused: false,
    };
  }

  async releaseTokens(): Promise<ReleaseRecord[]> {
    await new Promise(r => setTimeout(r, 1200));

    const escalatorMultiplier = this.currentYear > 1 ? 1 + (this.escalatorBps / 10000) : 1;
    const amount = this.baseMonthlyRelease * escalatorMultiplier;

    const record: ReleaseRecord = {
      year: this.currentYear,
      month: this.currentMonth,
      amount,
      timestamp: Date.now(),
      txHash: generateTxHash(),
    };

    this.totalSupply += amount;
    this.totalReleased += amount;
    this.releaseHistory.push(record);

    // Advance month
    this.currentMonth++;
    if (this.currentMonth > 12) {
      this.currentMonth = 1;
      this.currentYear++;
    }

    return [record];
  }

  getProjectedReleases(monthsAhead: number): ProjectedRelease[] {
    const projections: ProjectedRelease[] = [];
    let cumulative = this.totalSupply;
    let year = this.currentYear;
    let month = this.currentMonth;

    for (let i = 0; i < monthsAhead; i++) {
      const escalator = year > 1 ? this.escalatorBps : 0;
      const multiplier = 1 + (escalator / 10000);
      const amount = this.baseMonthlyRelease * multiplier;
      cumulative += amount;

      projections.push({
        year,
        month,
        amount,
        cumulativeTotal: cumulative,
        escalatorBps: escalator,
      });

      month++;
      if (month > 12) {
        month = 1;
        year++;
      }
    }

    return projections;
  }

  getReleaseHistory(): ReleaseRecord[] {
    return [...this.releaseHistory];
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: EscalatorEngine | null = null;

export function getEscalatorEngine(): EscalatorEngine {
  if (!instance) instance = new EscalatorEngine();
  return instance;
}

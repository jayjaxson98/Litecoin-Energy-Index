/**
 * OracleSimulator.ts — Simulates oracle round data for the energy index
 */

export interface OracleRoundData {
  roundId: number;
  answer: number;
  startedAt: number;
  updatedAt: number;
  answeredInRound: number;
}

class OracleSimulator {
  private currentRound: number = 1;
  private currentAnswer: number = 142_000; // $0.142/kWh scaled ×1e6

  latestRoundData(): OracleRoundData {
    const now = Math.floor(Date.now() / 1000);
    // Add slight drift
    const drift = (Math.random() - 0.5) * 2000;
    this.currentAnswer = Math.max(10_000, Math.min(1_000_000, this.currentAnswer + drift));
    this.currentRound++;

    return {
      roundId: this.currentRound,
      answer: Math.round(this.currentAnswer),
      startedAt: now - 60,
      updatedAt: now,
      answeredInRound: this.currentRound,
    };
  }
}

let instance: OracleSimulator | null = null;

export function getOracleSimulator(): OracleSimulator {
  if (!instance) instance = new OracleSimulator();
  return instance;
}

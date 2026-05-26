/**
 * TransactionSimulator — Simulates gas estimation and transaction lifecycle.
 *
 * Provides gas estimates for contract method calls and simulates
 * transaction confirmation delays.
 * Singleton pattern — use getTransactionSimulator().
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GasEstimateParams {
  to: string;
  data: string;
  value?: number;
}

export interface SimulatedReceipt {
  txHash: string;
  status: 'success' | 'reverted';
  gasUsed: number;
  blockNumber: number;
  blockTimestamp: number;
  confirmations: number;
}

// ─── Known Gas Costs (by method selector) ────────────────────────────────────

const GAS_COSTS: Record<string, { base: number; variance: number }> = {
  '0x1249c58b': { base: 85_000, variance: 15_000 },   // mint()
  '0xdb006a75': { base: 95_000, variance: 20_000 },   // redeem()
  '0x095ea7b3': { base: 46_000, variance: 5_000 },    // approve()
  '0xa9059cbb': { base: 52_000, variance: 8_000 },    // transfer()
  '0x23b872dd': { base: 65_000, variance: 10_000 },   // transferFrom()
};

const DEFAULT_GAS = { base: 50_000, variance: 10_000 };

// ─── Engine ──────────────────────────────────────────────────────────────────

class TransactionSimulator {
  private blockNumber = 1_847_293;
  private gasPrice = 25; // gwei

  estimateGas(params: GasEstimateParams): number {
    const selector = params.data.slice(0, 10);
    const cost = GAS_COSTS[selector] || DEFAULT_GAS;
    return cost.base + Math.floor(Math.random() * cost.variance);
  }

  getGasPrice(): number {
    // Simulate slight gas price fluctuation
    return this.gasPrice + (Math.random() - 0.5) * 5;
  }

  getBlockNumber(): number {
    return this.blockNumber + Math.floor(Math.random() * 10);
  }

  async simulateTransaction(params: GasEstimateParams): Promise<SimulatedReceipt> {
    const gasUsed = this.estimateGas(params);

    // Simulate confirmation delay
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200));

    this.blockNumber += 1;

    return {
      txHash: '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      status: Math.random() > 0.03 ? 'success' : 'reverted',
      gasUsed,
      blockNumber: this.blockNumber,
      blockTimestamp: Math.floor(Date.now() / 1000),
      confirmations: 1,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: TransactionSimulator | null = null;

export function getTransactionSimulator(): TransactionSimulator {
  if (!instance) instance = new TransactionSimulator();
  return instance;
}

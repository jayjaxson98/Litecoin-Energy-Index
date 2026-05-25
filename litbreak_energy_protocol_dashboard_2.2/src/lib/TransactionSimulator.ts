/**
 * TransactionSimulator — Simulates blockchain transaction submission,
 * gas estimation, and confirmation tracking.
 *
 * Singleton pattern — use getTransactionSimulator() to get the instance.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface GasEstimateParams {
  to: string;
  data: string;
  value?: number;
}

export interface SimulatedReceipt {
  transactionHash: string;
  blockNumber: number;
  blockHash: string;
  gasUsed: number;
  effectiveGasPrice: number;
  status: 1 | 0;
  confirmations: number;
  from: string;
  to: string;
}

// ─── Engine Implementation ───────────────────────────────────────────────────

class TransactionSimulator {
  private baseFee: number = 25; // gwei
  private blockNumber: number = 1_000_000 + Math.floor(Math.random() * 100_000);

  constructor() {
    // Simulate block production
    setInterval(() => {
      this.blockNumber += 1;
      this.baseFee += (Math.random() - 0.5) * 2;
      this.baseFee = Math.max(10, Math.min(100, this.baseFee));
    }, 12_000); // ~12 second blocks
  }

  // ─── Gas Estimation ──────────────────────────────────────────────────────

  estimateGas(params: GasEstimateParams): number {
    // Base gas costs by function selector
    const selector = params.data?.slice(0, 10) || '0x';
    const gasMap: Record<string, number> = {
      '0x1249c58b': 120_000,  // mint()
      '0xdb006a75': 95_000,   // redeem(uint256)
      '0x095ea7b3': 46_000,   // approve(address,uint256)
      '0xa9059cbb': 65_000,   // transfer(address,uint256)
      '0x23b872dd': 78_000,   // transferFrom(address,address,uint256)
    };

    const baseGas = gasMap[selector] || 21_000;
    // Add some variance
    return baseGas + Math.floor(Math.random() * baseGas * 0.1);
  }

  // ─── Fee Estimation ──────────────────────────────────────────────────────

  getBaseFee(): number {
    return this.baseFee;
  }

  getPriorityFee(): number {
    return 1.5 + Math.random() * 1;
  }

  getMaxFee(): number {
    return this.baseFee * 2 + this.getPriorityFee();
  }

  estimateFeeInLtc(gasUsed: number): number {
    const feeGwei = gasUsed * (this.baseFee + this.getPriorityFee());
    return feeGwei / 1e9; // Convert gwei to LTC
  }

  // ─── Block Info ──────────────────────────────────────────────────────────

  getBlockNumber(): number {
    return this.blockNumber;
  }

  // ─── Transaction Simulation ──────────────────────────────────────────────

  async simulateTransaction(
    from: string,
    to: string,
    data: string,
    value: number = 0
  ): Promise<SimulatedReceipt> {
    const gasUsed = this.estimateGas({ to, data, value });

    // Simulate network delay
    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));

    const success = Math.random() > 0.03; // 97% success rate

    return {
      transactionHash: '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      blockNumber: this.blockNumber,
      blockHash: '0x' + Array.from({ length: 64 }, () =>
        Math.floor(Math.random() * 16).toString(16)
      ).join(''),
      gasUsed,
      effectiveGasPrice: Math.round((this.baseFee + this.getPriorityFee()) * 1e9),
      status: success ? 1 : 0,
      confirmations: success ? 1 : 0,
      from,
      to,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: TransactionSimulator | null = null;

export function getTransactionSimulator(): TransactionSimulator {
  if (!instance) {
    instance = new TransactionSimulator();
  }
  return instance;
}

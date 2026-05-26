/**
 * PowerTokenEngine — Simulates the POWER token minting/redemption engine.
 *
 * Singleton pattern. Provides mint, redeem, quotes, state, and transaction history.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PowerTransaction {
  hash: string;
  type: 'mint' | 'redeem';
  status: 'pending' | 'confirmed' | 'failed';
  ltcAmount: number;
  powerAmount: number;
  fee: number;
  rate: number;
  timestamp: number;
  from: string;
  gasUsed?: number;
}

export interface MintQuote {
  ltcAmount: number;
  powerAmount: number;
  fee: number;
  rate: number;
  netLtc: number;
}

export interface RedeemQuote {
  powerAmount: number;
  ltcGross: number;
  fee: number;
  netLtc: number;
  rate: number;
}

export interface PowerEngineState {
  totalSupply: number;
  totalCollateral: number;
  exchangeRate: number;
  protocolFeeBps: number;
  accumulatedFees: number;
  isPaused: boolean;
  holders: number;
  totalTransactions: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateTxHash(): string {
  return '0x' + Array.from({ length: 64 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// ─── Engine ──────────────────────────────────────────────────────────────────

class PowerTokenEngine {
  private exchangeRate = 125.0;
  private protocolFeeBps = 30;
  private totalSupply = 2_450_000;
  private totalCollateral = 19_600;
  private accumulatedFees = 1247.83;
  private txHistory: PowerTransaction[] = [];
  private listeners: Array<() => void> = [];

  // ─── Event System ──────────────────────────────────────────────────────

  onChange(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(l => l());
  }

  // ─── Quotes ────────────────────────────────────────────────────────────

  getMintQuote(ltcAmount: number): MintQuote {
    const fee = ltcAmount * (this.protocolFeeBps / 10000);
    const netLtc = ltcAmount - fee;
    const powerAmount = netLtc * this.exchangeRate;
    return { ltcAmount, powerAmount, fee, rate: this.exchangeRate, netLtc };
  }

  getRedeemQuote(powerAmount: number): RedeemQuote {
    const ltcGross = powerAmount / this.exchangeRate;
    const fee = ltcGross * (this.protocolFeeBps / 10000);
    const netLtc = ltcGross - fee;
    return { powerAmount, ltcGross, fee, netLtc, rate: this.exchangeRate };
  }

  // ─── Transactions ──────────────────────────────────────────────────────

  async mint(ltcAmount: number, from: string): Promise<PowerTransaction> {
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const quote = this.getMintQuote(ltcAmount);
    const success = Math.random() > 0.05;
    const gasUsed = 85_000 + Math.floor(Math.random() * 15_000);

    const tx: PowerTransaction = {
      hash: generateTxHash(),
      type: 'mint',
      status: success ? 'confirmed' : 'failed',
      ltcAmount,
      powerAmount: success ? quote.powerAmount : 0,
      fee: quote.fee,
      rate: this.exchangeRate,
      timestamp: Date.now(),
      from,
      gasUsed,
    };

    if (success) {
      this.totalSupply += quote.powerAmount;
      this.totalCollateral += quote.netLtc;
      this.accumulatedFees += quote.fee;
    }

    this.txHistory.unshift(tx);
    if (this.txHistory.length > 100) this.txHistory = this.txHistory.slice(0, 100);
    this.notify();

    return tx;
  }

  async redeem(powerAmount: number, from: string): Promise<PowerTransaction> {
    await new Promise(r => setTimeout(r, 1500 + Math.random() * 1000));

    const quote = this.getRedeemQuote(powerAmount);
    const success = Math.random() > 0.05;
    const gasUsed = 95_000 + Math.floor(Math.random() * 20_000);

    const tx: PowerTransaction = {
      hash: generateTxHash(),
      type: 'redeem',
      status: success ? 'confirmed' : 'failed',
      ltcAmount: success ? quote.netLtc : 0,
      powerAmount,
      fee: quote.fee,
      rate: this.exchangeRate,
      timestamp: Date.now(),
      from,
      gasUsed,
    };

    if (success) {
      this.totalSupply -= powerAmount;
      this.totalCollateral -= quote.netLtc;
      this.accumulatedFees += quote.fee;
    }

    this.txHistory.unshift(tx);
    if (this.txHistory.length > 100) this.txHistory = this.txHistory.slice(0, 100);
    this.notify();

    return tx;
  }

  // ─── Getters ───────────────────────────────────────────────────────────

  getExchangeRate(): number {
    return this.exchangeRate;
  }

  getProtocolFeeBps(): number {
    return this.protocolFeeBps;
  }

  getTransactionHistory(): PowerTransaction[] {
    return [...this.txHistory];
  }

  getState(): PowerEngineState {
    return {
      totalSupply: this.totalSupply,
      totalCollateral: this.totalCollateral,
      exchangeRate: this.exchangeRate,
      protocolFeeBps: this.protocolFeeBps,
      accumulatedFees: this.accumulatedFees,
      isPaused: false,
      holders: 4_821,
      totalTransactions: 128_493 + this.txHistory.length,
    };
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: PowerTokenEngine | null = null;

export function getPowerTokenEngine(): PowerTokenEngine {
  if (!instance) instance = new PowerTokenEngine();
  return instance;
}

export interface SimulatedTx {
  hash: string;
  status: 'pending' | 'confirmed' | 'failed';
  confirmations: number;
  gasUsed: string;
  blockNumber: number;
  timestamp: number;
}

type TxListener = (tx: SimulatedTx) => void;

export class SimulationEngine {
  private static instance: SimulationEngine;
  private readonly txQueue   = new Map<string, SimulatedTx>();
  private readonly listeners = new Map<string, TxListener[]>();

  static getInstance(): SimulationEngine {
    if (!SimulationEngine.instance) {
      SimulationEngine.instance = new SimulationEngine();
    }
    return SimulationEngine.instance;
  }

  generateTxHash(): string {
    return '0x' + Array.from(
      { length: 64 },
      () => Math.floor(Math.random() * 16).toString(16),
    ).join('');
  }

  async simulateTransaction(
    _type: string,
    _params: Record<string, unknown>,
  ): Promise<SimulatedTx> {
    const hash = this.generateTxHash();
    const tx: SimulatedTx = {
      hash,
      status:        'pending',
      confirmations: 0,
      gasUsed:       (Math.random() * 0.005 + 0.001).toFixed(6),
      blockNumber:   18_000_000 + Math.floor(Math.random() * 100_000),
      timestamp:     Date.now(),
    };

    this.txQueue.set(hash, tx);

    // Simulate confirmation after 2–4 s; 5 % failure rate
    setTimeout(() => {
      const failed = Math.random() < 0.05;
      const updated: SimulatedTx = {
        ...tx,
        status:        failed ? 'failed' : 'confirmed',
        confirmations: failed ? 0 : 1,
      };
      this.txQueue.set(hash, updated);
      this.notifyListeners(hash, updated);
    }, 2000 + Math.random() * 2000);

    return tx;
  }

  onTxUpdate(hash: string, callback: TxListener): () => void {
    if (!this.listeners.has(hash)) this.listeners.set(hash, []);
    this.listeners.get(hash)!.push(callback);
    return () => {
      const cbs = this.listeners.get(hash) ?? [];
      this.listeners.set(hash, cbs.filter(cb => cb !== callback));
    };
  }

  getTx(hash: string): SimulatedTx | undefined {
    return this.txQueue.get(hash);
  }

  private notifyListeners(hash: string, tx: SimulatedTx): void {
    (this.listeners.get(hash) ?? []).forEach(cb => cb(tx));
  }
}

export const simulationEngine = SimulationEngine.getInstance();

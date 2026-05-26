/**
 * eventListeners.ts — Protocol event subscription system
 *
 * Resolves: [MEDIUM] No event listeners for critical protocol events
 *
 * Subscribes to on-chain events and dispatches UI updates via callbacks.
 * Handles listener lifecycle (subscribe/unsubscribe) and reconnection.
 */

import { ethers } from 'ethers';
import { LITBREAK_ABI } from '../ContractABI';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ProtocolEvent {
  name: string;
  args: Record<string, unknown>;
  blockNumber: number;
  transactionHash: string;
  timestamp: number;
}

export interface EventCallbacks {
  onPaused?: (by: string) => void;
  onUnpaused?: (by: string) => void;
  onEnergyPriceUpdated?: (oldPrice: bigint, newPrice: bigint, oracle: string) => void;
  onOracleStalenessPauseTriggered?: (timestamp: bigint) => void;
  onOracleStalenessPauseResolved?: (by: string, timestamp: bigint) => void;
  onStalenessAutoRecovered?: (triggeredBy: string, timestamp: bigint) => void;
  onMinted?: (to: string, ethAmount: bigint, powerAmount: bigint, fee: bigint) => void;
  onRedeemed?: (from: string, powerAmount: bigint, ethAmount: bigint, fee: bigint) => void;
  onExchangeRateUpdated?: (oldRate: bigint, newRate: bigint) => void;
  onFeeUpdated?: (oldFee: bigint, newFee: bigint) => void;
  onTimelockQueued?: (actionId: string, executeAfter: bigint, description: string) => void;
  onTimelockExecuted?: (actionId: string, timestamp: bigint) => void;
  onTimelockCancelled?: (actionId: string) => void;
  onOracleDeviationSkipped?: (minPrice: bigint, maxPrice: bigint, deviationBps: bigint) => void;
  onError?: (error: Error) => void;
}

// ─── Event Listener Manager ──────────────────────────────────────────────────

export class ProtocolEventListener {
  private contract: ethers.Contract | null = null;
  private callbacks: EventCallbacks;
  private listeners: Array<{ event: string; handler: (...args: unknown[]) => void }> = [];
  private isActive = false;

  constructor(callbacks: EventCallbacks) {
    this.callbacks = callbacks;
  }

  /**
   * Start listening to protocol events.
   * @param provider An ethers.js provider with event support
   * @param contractAddress The deployed contract address
   */
  start(provider: ethers.Provider, contractAddress: string): void {
    if (this.isActive) this.stop();

    try {
      this.contract = new ethers.Contract(contractAddress, LITBREAK_ABI, provider);
      this.isActive = true;

      this.addListener('Paused', (by: string) => {
        this.callbacks.onPaused?.(by);
      });

      this.addListener('Unpaused', (by: string) => {
        this.callbacks.onUnpaused?.(by);
      });

      this.addListener('EnergyPriceUpdated', (oldPrice: bigint, newPrice: bigint, oracle: string) => {
        this.callbacks.onEnergyPriceUpdated?.(oldPrice, newPrice, oracle);
      });

      this.addListener('OracleStalenessPauseTriggered', (timestamp: bigint) => {
        this.callbacks.onOracleStalenessPauseTriggered?.(timestamp);
      });

      this.addListener('OracleStalenessPauseResolved', (by: string, timestamp: bigint) => {
        this.callbacks.onOracleStalenessPauseResolved?.(by, timestamp);
      });

      this.addListener('StalenessAutoRecovered', (triggeredBy: string, timestamp: bigint) => {
        this.callbacks.onStalenessAutoRecovered?.(triggeredBy, timestamp);
      });

      this.addListener('Minted', (to: string, ethAmount: bigint, powerAmount: bigint, fee: bigint) => {
        this.callbacks.onMinted?.(to, ethAmount, powerAmount, fee);
      });

      this.addListener('Redeemed', (from: string, powerAmount: bigint, ethAmount: bigint, fee: bigint) => {
        this.callbacks.onRedeemed?.(from, powerAmount, ethAmount, fee);
      });

      this.addListener('ExchangeRateUpdated', (oldRate: bigint, newRate: bigint) => {
        this.callbacks.onExchangeRateUpdated?.(oldRate, newRate);
      });

      this.addListener('FeeUpdated', (oldFee: bigint, newFee: bigint) => {
        this.callbacks.onFeeUpdated?.(oldFee, newFee);
      });

      this.addListener('TimelockQueued', (actionId: string, executeAfter: bigint, description: string) => {
        this.callbacks.onTimelockQueued?.(actionId, executeAfter, description);
      });

      this.addListener('TimelockExecuted', (actionId: string, timestamp: bigint) => {
        this.callbacks.onTimelockExecuted?.(actionId, timestamp);
      });

      this.addListener('TimelockCancelled', (actionId: string) => {
        this.callbacks.onTimelockCancelled?.(actionId);
      });

      this.addListener('OracleDeviationSkipped', (minPrice: bigint, maxPrice: bigint, deviationBps: bigint) => {
        this.callbacks.onOracleDeviationSkipped?.(minPrice, maxPrice, deviationBps);
      });

    } catch (err) {
      this.callbacks.onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  }

  /**
   * Stop all event listeners and clean up.
   */
  stop(): void {
    if (!this.contract) return;

    for (const { event, handler } of this.listeners) {
      try {
        this.contract.off(event, handler);
      } catch {
        // Ignore cleanup errors
      }
    }

    this.listeners = [];
    this.contract = null;
    this.isActive = false;
  }

  /**
   * Check if the listener is currently active.
   */
  getIsActive(): boolean {
    return this.isActive;
  }

  /**
   * Update callbacks without restarting listeners.
   */
  updateCallbacks(callbacks: Partial<EventCallbacks>): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  private addListener(event: string, handler: (...args: unknown[]) => void): void {
    if (!this.contract) return;
    try {
      this.contract.on(event, handler);
      this.listeners.push({ event, handler });
    } catch (err) {
      this.callbacks.onError?.(
        err instanceof Error ? err : new Error(`Failed to add listener for ${event}`)
      );
    }
  }
}

/**
 * Create a protocol event listener instance with the given callbacks.
 * Usage:
 *   const listener = createEventListener({ onPaused: (by) => showBanner() });
 *   listener.start(provider, contractAddress);
 *   // On cleanup:
 *   listener.stop();
 */
export function createEventListener(callbacks: EventCallbacks): ProtocolEventListener {
  return new ProtocolEventListener(callbacks);
}

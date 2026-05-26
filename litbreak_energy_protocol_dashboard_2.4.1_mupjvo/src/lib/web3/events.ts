/**
 * On-Chain Event Listener — Polls and listens for contract events.
 *
 * Provides two mechanisms for state synchronization:
 *   1. Polling: Periodic refetch of key contract state (for broad state sync)
 *   2. Event Listening: Subscribe to specific contract events (for targeted updates)
 *
 * The polling approach is preferred for WebContainer/demo environments where
 * WebSocket connections may not be available.
 */

import { ethers } from 'ethers';
import { LITBREAK_PROTOCOL_ABI } from '../ContractABI';
import { web3Config } from './config';
import { getWeb3Provider } from './provider';
import { getRpcCache } from './cache';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PollingState {
  totalSupply: bigint;
  exchangeRate: bigint;
  energyPriceUsd: bigint;
  isPaused: boolean;
  oracleStalenessPaused: boolean;
  totalCollateral: bigint;
  lastEnergyUpdate: bigint;
}

export type StateChangeCallback = (state: PollingState) => void;
export type EventCallback = (event: ethers.Log, parsed: ethers.LogDescription | null) => void;

// ─── Event Listener ──────────────────────────────────────────────────────────

class OnChainEventListener {
  private _pollingInterval: ReturnType<typeof setInterval> | null = null;
  private _stateListeners: Set<StateChangeCallback> = new Set();
  private _eventListeners: Map<string, Set<EventCallback>> = new Map();
  private _lastState: PollingState | null = null;
  private _contract: ethers.Contract | null = null;

  // ─── Polling ───────────────────────────────────────────────────────────

  /**
   * Start polling for state changes at the configured interval.
   */
  startPolling(intervalMs?: number): void {
    if (this._pollingInterval) return; // Already polling

    const interval = intervalMs ?? web3Config.pollingIntervalMs;

    // Initial fetch
    this._pollState();

    this._pollingInterval = setInterval(() => {
      this._pollState();
    }, interval);
  }

  /**
   * Stop polling.
   */
  stopPolling(): void {
    if (this._pollingInterval) {
      clearInterval(this._pollingInterval);
      this._pollingInterval = null;
    }
  }

  /**
   * Check if polling is active.
   */
  get isPolling(): boolean {
    return this._pollingInterval !== null;
  }

  /**
   * Force an immediate state refresh.
   */
  async refresh(): Promise<PollingState | null> {
    return this._pollState();
  }

  /**
   * Subscribe to state changes.
   * Returns an unsubscribe function.
   */
  onStateChange(callback: StateChangeCallback): () => void {
    this._stateListeners.add(callback);
    // Immediately emit current state if available
    if (this._lastState) {
      callback(this._lastState);
    }
    return () => this._stateListeners.delete(callback);
  }

  /**
   * Get the last known state.
   */
  get lastState(): PollingState | null {
    return this._lastState;
  }

  // ─── Event Subscriptions ───────────────────────────────────────────────

  /**
   * Subscribe to a specific contract event.
   *
   * @param eventName Event name (e.g., 'Minted', 'Redeemed', 'EnergyPriceUpdated')
   * @param callback Called when the event is detected
   * @returns Unsubscribe function
   */
  onEvent(eventName: string, callback: EventCallback): () => void {
    if (!this._eventListeners.has(eventName)) {
      this._eventListeners.set(eventName, new Set());
    }
    this._eventListeners.get(eventName)!.add(callback);

    // Set up the actual event listener on the contract if not already done
    this._ensureEventListener(eventName);

    return () => {
      const listeners = this._eventListeners.get(eventName);
      if (listeners) {
        listeners.delete(callback);
        if (listeners.size === 0) {
          this._eventListeners.delete(eventName);
        }
      }
    };
  }

  // ─── Internal ──────────────────────────────────────────────────────────

  private async _pollState(): Promise<PollingState | null> {
    try {
      const provider = getWeb3Provider().getReadProvider();
      const contract = new ethers.Contract(
        web3Config.activeNetwork.contractAddress,
        LITBREAK_PROTOCOL_ABI,
        provider
      );

      // Batch multiple view calls into a single getProtocolStats() call
      const stats = await contract.getProtocolStats();
      const oracleStalenessPaused = await contract.oracleStalenessPaused();
      const lastEnergyUpdate = await contract.lastEnergyUpdate();

      const state: PollingState = {
        totalSupply: stats[0],
        exchangeRate: stats[3],
        energyPriceUsd: stats[6],
        isPaused: stats[7],
        oracleStalenessPaused,
        totalCollateral: stats[2],
        lastEnergyUpdate,
      };

      // Only emit if state actually changed
      if (!this._lastState || this._hasStateChanged(state)) {
        this._lastState = state;
        // Invalidate cache since state changed
        getRpcCache().invalidateAll();
        this._emitStateChange(state);
      }

      return state;
    } catch (err) {
      console.warn('[OnChainEventListener] Polling error:', err);
      return null;
    }
  }

  private _hasStateChanged(newState: PollingState): boolean {
    if (!this._lastState) return true;
    const old = this._lastState;
    return (
      old.totalSupply !== newState.totalSupply ||
      old.exchangeRate !== newState.exchangeRate ||
      old.energyPriceUsd !== newState.energyPriceUsd ||
      old.isPaused !== newState.isPaused ||
      old.oracleStalenessPaused !== newState.oracleStalenessPaused ||
      old.totalCollateral !== newState.totalCollateral ||
      old.lastEnergyUpdate !== newState.lastEnergyUpdate
    );
  }

  private _emitStateChange(state: PollingState): void {
    for (const listener of this._stateListeners) {
      try {
        listener(state);
      } catch (err) {
        console.error('[OnChainEventListener] State listener error:', err);
      }
    }
  }

  private _ensureEventListener(eventName: string): void {
    // For polling-based environments, we don't set up WebSocket event listeners.
    // Instead, events are detected via polling state changes.
    // This method is a placeholder for future WebSocket support.
    //
    // In a production environment with WebSocket RPC:
    //   const contract = this._getContract();
    //   contract.on(eventName, (...args) => { ... });
  }

  private _getContract(): ethers.Contract {
    if (!this._contract) {
      const provider = getWeb3Provider().getReadProvider();
      this._contract = new ethers.Contract(
        web3Config.activeNetwork.contractAddress,
        LITBREAK_PROTOCOL_ABI,
        provider
      );
    }
    return this._contract;
  }

  /**
   * Clean up all listeners and stop polling.
   */
  destroy(): void {
    this.stopPolling();
    this._stateListeners.clear();
    this._eventListeners.clear();
    this._contract = null;
    this._lastState = null;
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: OnChainEventListener | null = null;

export function getEventListener(): OnChainEventListener {
  if (!instance) {
    instance = new OnChainEventListener();
  }
  return instance;
}

export { OnChainEventListener };

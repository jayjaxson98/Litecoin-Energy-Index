/**
 * Transaction Manager — Lifecycle management for blockchain transactions.
 *
 * Tracks transactions through their lifecycle:
 *   submitted → pending → confirmed | failed
 *
 * Features:
 *   - Transaction history with persistent storage (localStorage)
 *   - Real-time status updates via callbacks
 *   - Gas cost tracking
 *   - Block explorer link generation
 *   - Automatic cleanup of old transactions
 */

import { ethers } from 'ethers';
import { getWeb3Provider } from './provider';
import { getExplorerTxUrl } from './config';
import { decodeWeb3Error, type DecodedError } from './errors';

// ─── Types ───────────────────────────────────────────────────────────────────

export type TransactionStatus = 'submitted' | 'pending' | 'confirmed' | 'failed';

export interface TrackedTransaction {
  hash: string;
  method: string; // e.g., 'mint', 'redeem', 'transfer', 'approve'
  status: TransactionStatus;
  from: string;
  to: string;
  value: string; // LTC amount in ether units (for display)
  timestamp: number;
  blockNumber: number | null;
  gasUsed: string | null; // gas units
  gasCost: string | null; // total cost in LTC wei
  explorerUrl: string;
  error: DecodedError | null;
  // Method-specific metadata
  metadata?: Record<string, string>;
}

export type TransactionEventCallback = (tx: TrackedTransaction) => void;

// ─── Storage Key ─────────────────────────────────────────────────────────────

const STORAGE_KEY = 'litbreak_tx_history';
const MAX_STORED_TXS = 50;

// ─── Transaction Manager ─────────────────────────────────────────────────────

class TransactionManager {
  private _transactions: Map<string, TrackedTransaction> = new Map();
  private _listeners: Set<TransactionEventCallback> = new Set();

  constructor() {
    this._loadFromStorage();
  }

  // ─── Track a New Transaction ───────────────────────────────────────────

  /**
   * Start tracking a transaction.
   * Call this immediately after tx.wait() returns or after sending a tx.
   *
   * @param hash Transaction hash
   * @param method Contract method name (e.g., 'mint')
   * @param from Sender address
   * @param value LTC value in ether units (for display)
   * @param metadata Additional method-specific data
   */
  track(
    hash: string,
    method: string,
    from: string,
    value: string = '0',
    metadata?: Record<string, string>
  ): TrackedTransaction {
    const tx: TrackedTransaction = {
      hash,
      method,
      status: 'submitted',
      from,
      to: '', // Will be filled from receipt
      value,
      timestamp: Date.now(),
      blockNumber: null,
      gasUsed: null,
      gasCost: null,
      explorerUrl: getExplorerTxUrl(hash),
      error: null,
      metadata,
    };

    this._transactions.set(hash, tx);
    this._emit(tx);
    this._saveToStorage();

    // Start watching for confirmation
    this._watchTransaction(hash);

    return tx;
  }

  /**
   * Track a transaction that already has a receipt (post-confirmation).
   */
  trackConfirmed(
    hash: string,
    method: string,
    from: string,
    receipt: ethers.TransactionReceipt,
    value: string = '0',
    metadata?: Record<string, string>
  ): TrackedTransaction {
    const tx: TrackedTransaction = {
      hash,
      method,
      status: receipt.status === 1 ? 'confirmed' : 'failed',
      from,
      to: receipt.to ?? '',
      value,
      timestamp: Date.now(),
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed.toString(),
      gasCost: (receipt.gasUsed * receipt.gasPrice).toString(),
      explorerUrl: getExplorerTxUrl(hash),
      error: receipt.status === 0 ? { message: 'Transaction reverted', code: 'REVERTED', recoverable: false, suggestion: 'Check the transaction on the block explorer.', original: null } : null,
      metadata,
    };

    this._transactions.set(hash, tx);
    this._emit(tx);
    this._saveToStorage();

    return tx;
  }

  /**
   * Track a failed transaction (error before submission or during estimation).
   */
  trackFailed(
    method: string,
    from: string,
    error: unknown,
    value: string = '0',
    metadata?: Record<string, string>
  ): TrackedTransaction {
    const decoded = decodeWeb3Error(error);
    const fakeHash = `0x_failed_${Date.now()}_${Math.random().toString(36).slice(2)}`;

    const tx: TrackedTransaction = {
      hash: fakeHash,
      method,
      status: 'failed',
      from,
      to: '',
      value,
      timestamp: Date.now(),
      blockNumber: null,
      gasUsed: null,
      gasCost: null,
      explorerUrl: '',
      error: decoded,
      metadata,
    };

    this._transactions.set(fakeHash, tx);
    this._emit(tx);
    this._saveToStorage();

    return tx;
  }

  // ─── Watch Transaction ─────────────────────────────────────────────────

  private async _watchTransaction(hash: string): Promise<void> {
    const provider = getWeb3Provider().getReadProvider();
    const tx = this._transactions.get(hash);
    if (!tx) return;

    // Update to pending
    tx.status = 'pending';
    this._emit(tx);

    try {
      const receipt = await provider.waitForTransaction(hash, 1, 120_000); // 1 confirmation, 2min timeout

      if (receipt) {
        tx.status = receipt.status === 1 ? 'confirmed' : 'failed';
        tx.blockNumber = receipt.blockNumber;
        tx.to = receipt.to ?? '';
        tx.gasUsed = receipt.gasUsed.toString();
        tx.gasCost = (receipt.gasUsed * receipt.gasPrice).toString();

        if (receipt.status === 0) {
          tx.error = {
            message: 'Transaction reverted on-chain.',
            code: 'REVERTED',
            recoverable: false,
            suggestion: 'Check the transaction on the block explorer for details.',
            original: null,
          };
        }
      } else {
        // Timeout
        tx.status = 'failed';
        tx.error = {
          message: 'Transaction confirmation timed out.',
          code: 'TIMEOUT',
          recoverable: true,
          suggestion: 'The transaction may still be pending. Check the block explorer.',
          original: null,
        };
      }
    } catch (err) {
      tx.status = 'failed';
      tx.error = decodeWeb3Error(err);
    }

    this._emit(tx);
    this._saveToStorage();
  }

  // ─── Query ─────────────────────────────────────────────────────────────

  /**
   * Get a transaction by hash.
   */
  get(hash: string): TrackedTransaction | undefined {
    return this._transactions.get(hash);
  }

  /**
   * Get all tracked transactions, newest first.
   */
  getAll(): TrackedTransaction[] {
    return Array.from(this._transactions.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get transactions filtered by status.
   */
  getByStatus(status: TransactionStatus): TrackedTransaction[] {
    return this.getAll().filter(tx => tx.status === status);
  }

  /**
   * Get the most recent transaction.
   */
  getLatest(): TrackedTransaction | null {
    const all = this.getAll();
    return all.length > 0 ? all[0] : null;
  }

  /**
   * Check if there are any pending transactions.
   */
  hasPending(): boolean {
    return this.getByStatus('pending').length > 0 || this.getByStatus('submitted').length > 0;
  }

  /**
   * Clear all transaction history.
   */
  clear(): void {
    this._transactions.clear();
    localStorage.removeItem(STORAGE_KEY);
  }

  // ─── Events ────────────────────────────────────────────────────────────

  /**
   * Subscribe to transaction updates.
   * Returns an unsubscribe function.
   */
  on(callback: TransactionEventCallback): () => void {
    this._listeners.add(callback);
    return () => this._listeners.delete(callback);
  }

  private _emit(tx: TrackedTransaction): void {
    for (const listener of this._listeners) {
      try {
        listener(tx);
      } catch (err) {
        console.error('[TransactionManager] Listener error:', err);
      }
    }
  }

  // ─── Persistence ───────────────────────────────────────────────────────

  private _saveToStorage(): void {
    try {
      const txs = this.getAll().slice(0, MAX_STORED_TXS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(txs));
    } catch {}
  }

  private _loadFromStorage(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;

      const txs: TrackedTransaction[] = JSON.parse(raw);
      for (const tx of txs) {
        // Don't restore pending/submitted — they're stale after page reload
        if (tx.status === 'pending' || tx.status === 'submitted') {
          tx.status = 'failed';
          tx.error = {
            message: 'Transaction status unknown after page reload.',
            code: 'STALE',
            recoverable: false,
            suggestion: 'Check the block explorer for the final status.',
            original: null,
          };
        }
        this._transactions.set(tx.hash, tx);
      }
    } catch {}
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

let instance: TransactionManager | null = null;

export function getTransactionManager(): TransactionManager {
  if (!instance) {
    instance = new TransactionManager();
  }
  return instance;
}

export { TransactionManager };

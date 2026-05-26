/**
 * useTransactions — React hook for transaction history and status tracking.
 *
 * Provides:
 *   - Real-time transaction list from TransactionManager
 *   - Pending transaction count
 *   - Latest transaction status
 *   - Transaction filtering by method/status
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getTransactionManager, type TrackedTransaction, type TransactionStatus } from '../lib/web3/transactions';

export interface UseTransactionsReturn {
  transactions: TrackedTransaction[];
  pendingCount: number;
  latestTx: TrackedTransaction | null;
  hasPending: boolean;
  getByMethod: (method: string) => TrackedTransaction[];
  getByStatus: (status: TransactionStatus) => TrackedTransaction[];
  clear: () => void;
}

export function useTransactions(): UseTransactionsReturn {
  const [transactions, setTransactions] = useState<TrackedTransaction[]>([]);

  useEffect(() => {
    const manager = getTransactionManager();
    setTransactions(manager.getAll());

    const unsub = manager.on(() => {
      setTransactions(manager.getAll());
    });

    return unsub;
  }, []);

  const pendingCount = useMemo(() => {
    return transactions.filter(tx => tx.status === 'pending' || tx.status === 'submitted').length;
  }, [transactions]);

  const latestTx = useMemo(() => {
    return transactions.length > 0 ? transactions[0] : null;
  }, [transactions]);

  const hasPending = pendingCount > 0;

  const getByMethod = useCallback((method: string) => {
    return transactions.filter(tx => tx.method === method);
  }, [transactions]);

  const getByStatus = useCallback((status: TransactionStatus) => {
    return transactions.filter(tx => tx.status === status);
  }, [transactions]);

  const clear = useCallback(() => {
    getTransactionManager().clear();
    setTransactions([]);
  }, []);

  return {
    transactions,
    pendingCount,
    latestTx,
    hasPending,
    getByMethod,
    getByStatus,
    clear,
  };
}

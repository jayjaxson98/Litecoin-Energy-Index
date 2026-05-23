import React, { useState, useMemo } from 'react';
import { useWallet } from '../hooks/useWallet';
import type { Transaction } from '../types/wallet';
import './wallet.css';

const PAGE_SIZE = 6;

function formatRelativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

function TxIcon({ type }: { type: Transaction['type'] }) {
  const icons = { send: '↑', receive: '↓', swap: '⇄' };
  return (
    <div className={`tx-type-icon ${type}`}>
      {icons[type]}
    </div>
  );
}

interface TransactionHistoryProps {
  maxItems?: number;
  showPagination?: boolean;
}

export function TransactionHistory({ maxItems, showPagination = true }: TransactionHistoryProps) {
  const { transactions, isConnected } = useWallet();
  const [page, setPage] = useState(0);

  const displayTxs = useMemo(() => {
    if (maxItems !== undefined) return transactions.slice(0, maxItems);
    return transactions;
  }, [transactions, maxItems]);

  const totalPages = Math.ceil(displayTxs.length / PAGE_SIZE);
  const pageTxs = displayTxs.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  if (!isConnected) {
    return (
      <div className="tx-history">
        <div className="tx-history-header">
          <span className="tx-history-title">Transactions</span>
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="tx-item">
            <div className="skeleton" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div className="skeleton skeleton-text" style={{ width: '50%' }} />
              <div className="skeleton skeleton-text sm" style={{ width: '30%' }} />
            </div>
            <div>
              <div className="skeleton skeleton-text" style={{ width: 60 }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (displayTxs.length === 0) {
    return (
      <div className="tx-history">
        <div className="tx-history-header">
          <span className="tx-history-title">Transactions</span>
          <span className="tx-history-count">0 transactions</span>
        </div>
        <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--wallet-text-muted)', fontSize: '0.85rem' }}>
          No transactions yet
        </div>
      </div>
    );
  }

  return (
    <div className="tx-history">
      <div className="tx-history-header">
        <span className="tx-history-title">Transactions</span>
        <span className="tx-history-count">{displayTxs.length} total</span>
      </div>

      {pageTxs.map((tx) => (
        <div key={tx.id} className="tx-item">
          <TxIcon type={tx.type} />
          <div className="tx-info">
            <div className="tx-type-label">{tx.type}</div>
            <div className="tx-time">{formatRelativeTime(tx.timestamp)}</div>
          </div>
          <div className="tx-amounts">
            <div className={`tx-amount ${tx.type}`}>
              {tx.type === 'send' ? '−' : tx.type === 'receive' ? '+' : '⇄'}
              {parseFloat(tx.amount).toFixed(6)} {tx.symbol}
            </div>
            <div>
              <span className={`tx-status-badge ${tx.status}`}>{tx.status}</span>
            </div>
          </div>
        </div>
      ))}

      {showPagination && totalPages > 1 && (
        <div className="tx-pagination">
          <button
            className="tx-page-btn"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className="tx-page-info">
            {page + 1} / {totalPages}
          </span>
          <button
            className="tx-page-btn"
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

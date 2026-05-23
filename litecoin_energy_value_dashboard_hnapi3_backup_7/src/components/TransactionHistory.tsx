import React, { useState } from 'react';
import type { WalletTransaction } from '../types/wallet';

interface TransactionHistoryProps {
  transactions: WalletTransaction[];
  explorerUrl?: string;
}

const TYPE_LABELS: Record<WalletTransaction['type'], string> = {
  send: 'Send',
  receive: 'Receive',
  swap: 'Swap',
  approve: 'Approve',
  stake: 'Stake',
  unstake: 'Unstake',
};

const TYPE_COLORS: Record<WalletTransaction['type'], string> = {
  send: '#f472b6',
  receive: '#10b981',
  swap: '#9E7FFF',
  approve: '#38bdf8',
  stake: '#f59e0b',
  unstake: '#A3A3A3',
};

const STATUS_COLORS: Record<WalletTransaction['status'], string> = {
  pending: '#f59e0b',
  confirmed: '#10b981',
  failed: '#ef4444',
};

function shortHash(hash: string): string {
  return hash.slice(0, 8) + '…' + hash.slice(-6);
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export const TransactionHistory: React.FC<TransactionHistoryProps> = ({
  transactions,
  explorerUrl = 'https://blockchair.com/litecoin/transaction',
}) => {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (transactions.length === 0) {
    return (
      <div style={emptyStyle}>
        <div style={{ fontSize: '2rem', marginBottom: 8 }}>📭</div>
        <div style={{ color: '#A3A3A3', fontSize: '0.9rem' }}>No transactions yet</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {transactions.map((tx) => {
        const isOpen = expanded === tx.hash;
        return (
          <div
            key={tx.hash}
            style={{
              ...rowStyle,
              borderColor: isOpen ? TYPE_COLORS[tx.type] + '44' : '#2F2F2F',
            }}
          >
            {/* Header row */}
            <button
              type="button"
              onClick={() => setExpanded(isOpen ? null : tx.hash)}
              style={rowHeaderStyle}
            >
              <span
                style={{
                  ...typeBadgeStyle,
                  backgroundColor: TYPE_COLORS[tx.type] + '22',
                  color: TYPE_COLORS[tx.type],
                  borderColor: TYPE_COLORS[tx.type] + '44',
                }}
              >
                {TYPE_LABELS[tx.type]}
              </span>

              <span style={{ flex: 1, textAlign: 'left', color: '#fff', fontSize: '0.9rem' }}>
                {tx.amount} {tx.symbol}
              </span>

              <span
                style={{
                  ...statusDotStyle,
                  backgroundColor: STATUS_COLORS[tx.status],
                }}
              />
              <span style={{ color: STATUS_COLORS[tx.status], fontSize: '0.75rem', marginRight: 8 }}>
                {tx.status}
              </span>

              <span style={{ color: '#A3A3A3', fontSize: '0.75rem' }}>
                {isOpen ? '▲' : '▼'}
              </span>
            </button>

            {/* Expanded detail */}
            {isOpen && (
              <div style={detailStyle}>
                <DetailRow label="Hash">
                  <a
                    href={`${explorerUrl}/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#38bdf8', fontFamily: 'monospace', fontSize: '0.8rem' }}
                  >
                    {shortHash(tx.hash)}
                  </a>
                </DetailRow>
                {tx.toAddress && (
                  <DetailRow label="To">
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#A3A3A3' }}>
                      {tx.toAddress.slice(0, 10)}…{tx.toAddress.slice(-8)}
                    </span>
                  </DetailRow>
                )}
                {tx.fromAddress && (
                  <DetailRow label="From">
                    <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: '#A3A3A3' }}>
                      {tx.fromAddress.slice(0, 10)}…{tx.fromAddress.slice(-8)}
                    </span>
                  </DetailRow>
                )}
                {tx.blockNumber && (
                  <DetailRow label="Block">
                    <span style={{ color: '#A3A3A3', fontSize: '0.8rem' }}>#{tx.blockNumber.toLocaleString()}</span>
                  </DetailRow>
                )}
                {tx.usdValue !== undefined && (
                  <DetailRow label="USD Value">
                    <span style={{ color: '#10b981', fontSize: '0.8rem' }}>${tx.usdValue.toFixed(2)}</span>
                  </DetailRow>
                )}
                <DetailRow label="Time">
                  <span style={{ color: '#A3A3A3', fontSize: '0.8rem' }}>{formatTime(tx.timestamp)}</span>
                </DetailRow>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const DetailRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
    <span style={{ color: '#A3A3A3', fontSize: '0.78rem' }}>{label}</span>
    {children}
  </div>
);

// ─── Styles ──────────────────────────────────────────────────────────────────

const containerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '32px 16px',
  color: '#A3A3A3',
};

const rowStyle: React.CSSProperties = {
  borderRadius: 10,
  border: '1px solid #2F2F2F',
  background: '#1a1a1a',
  overflow: 'hidden',
  transition: 'border-color 0.2s ease',
};

const rowHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '10px 12px',
  background: 'transparent',
  border: 'none',
  cursor: 'pointer',
};

const typeBadgeStyle: React.CSSProperties = {
  padding: '2px 8px',
  borderRadius: 4,
  border: '1px solid',
  fontSize: '0.72rem',
  fontWeight: 600,
  letterSpacing: '0.03em',
  whiteSpace: 'nowrap',
};

const statusDotStyle: React.CSSProperties = {
  width: 7,
  height: 7,
  borderRadius: '50%',
  flexShrink: 0,
};

const detailStyle: React.CSSProperties = {
  padding: '8px 12px 12px',
  borderTop: '1px solid #2F2F2F',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

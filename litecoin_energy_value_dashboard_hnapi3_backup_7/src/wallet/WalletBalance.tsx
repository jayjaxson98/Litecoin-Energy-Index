import React, { useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { NetworkBadge } from './NetworkBadge';
import { formatBalance, formatUsd } from '../types/wallet';
import './wallet.css';

interface WalletBalanceProps {
  showTokenList?: boolean;
  compact?: boolean;
}

export function WalletBalance({ showTokenList = true, compact = false }: WalletBalanceProps) {
  const {
    account,
    isConnected,
    primaryBalance,
    totalUsdValue,
    allBalances,
    network,
    lastBalanceRefresh,
    refreshBalance,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleCopy = useCallback(() => {
    if (!account?.address) return;
    navigator.clipboard.writeText(account.address).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [account?.address]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refreshBalance();
    setIsRefreshing(false);
  }, [refreshBalance]);

  if (!isConnected || !account) {
    return (
      <div className="wallet-balance-card">
        <div className="wallet-balance-label">Portfolio</div>
        <div className="skeleton skeleton-text lg" style={{ width: '60%', marginTop: 8 }} />
        <div className="skeleton skeleton-text sm" style={{ width: '40%', marginTop: 8 }} />
      </div>
    );
  }

  const lastRefreshLabel = lastBalanceRefresh
    ? new Date(lastBalanceRefresh).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div>
      <div className="wallet-balance-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div className="wallet-balance-label">Total Portfolio</div>
          <NetworkBadge network={network} size="sm" />
        </div>

        <div className="wallet-balance-primary">
          {primaryBalance
            ? `${formatBalance(primaryBalance.amount, 6)} ${primaryBalance.symbol}`
            : '—'}
        </div>
        <div className="wallet-balance-usd">{formatUsd(totalUsdValue)}</div>

        <div className="wallet-balance-address">
          <code title={account.address}>{account.address}</code>
          <button
            className={`wallet-copy-btn ${copied ? 'copied' : ''}`}
            onClick={handleCopy}
            title="Copy address"
          >
            {copied ? '✓ Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {showTokenList && !compact && (
        <div style={{ marginTop: 12 }}>
          <div className="wallet-section-header">
            <span className="wallet-section-title">Assets</span>
            <button
              className={`wallet-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={`Last updated: ${lastRefreshLabel}`}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M23 4v6h-6M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
              </svg>
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>

          <div className="wallet-token-list">
            {allBalances.map((token) => (
              <div key={token.symbol} className="wallet-token-item">
                <div
                  className="wallet-token-icon"
                  style={{
                    background: token.symbol === 'LTC'
                      ? 'rgba(191,187,187,0.15)'
                      : token.symbol === 'ETH'
                      ? 'rgba(98,126,234,0.15)'
                      : 'rgba(56,189,248,0.15)',
                    color: token.symbol === 'LTC' ? '#bfbbbb' : token.symbol === 'ETH' ? '#627EEA' : '#38bdf8',
                  }}
                >
                  {token.icon ?? token.symbol[0]}
                </div>
                <div className="wallet-token-info">
                  <div className="wallet-token-name">{token.name}</div>
                  <div className="wallet-token-symbol">{token.symbol}</div>
                </div>
                <div className="wallet-token-amounts">
                  <div className="wallet-token-amount">{formatBalance(token.amount, 6)}</div>
                  <div className="wallet-token-usd">{formatUsd(token.usdValue)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

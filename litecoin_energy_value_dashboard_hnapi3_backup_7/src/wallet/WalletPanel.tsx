import React, { useState, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { WalletBalance } from './WalletBalance';
import { TransactionHistory } from './TransactionHistory';
import { SendReceive } from './SendReceive';
import { NetworkBadge } from './NetworkBadge';
import { SUPPORTED_NETWORKS } from '../types/wallet';
import type { ChainNetwork } from '../types/wallet';
import './wallet.css';

type PanelTab = 'overview' | 'send' | 'history';

export function WalletPanel() {
  const {
    disconnect,
    isConnected,
    account,
    network,
    switchNetwork,
    pendingTxCount,
    openModal,
  } = useWallet();

  const [activeTab, setActiveTab] = useState<PanelTab>('overview');
  const [showNetworkMenu, setShowNetworkMenu] = useState(false);

  const handleNetworkSwitch = useCallback(
    (net: ChainNetwork) => {
      switchNetwork(net);
      setShowNetworkMenu(false);
    },
    [switchNetwork]
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
  }, [disconnect]);

  const evmNetworks = SUPPORTED_NETWORKS.filter((n) => n.id !== 'ltc-mainnet');
  const availableNetworks =
    account?.type === 'evm'
      ? evmNetworks
      : SUPPORTED_NETWORKS.filter((n) => n.id === 'ltc-mainnet');

  return (
    <aside className="wallet-panel-inline" aria-label="Wallet Panel">
      {/* ── Header ── */}
      <div className="wallet-panel-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
            My Wallet
          </h2>
          {pendingTxCount > 0 && (
            <span
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#f59e0b',
                fontSize: '0.68rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: 50,
                border: '1px solid rgba(245,158,11,0.3)',
              }}
            >
              {pendingTxCount} pending
            </span>
          )}
        </div>

        {/* Status pill */}
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 600,
            padding: '3px 9px',
            borderRadius: 50,
            background: isConnected
              ? 'rgba(16,185,129,0.12)'
              : 'rgba(163,163,163,0.1)',
            color: isConnected ? '#10b981' : '#6b7280',
            border: `1px solid ${isConnected ? 'rgba(16,185,129,0.25)' : 'rgba(163,163,163,0.15)'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: isConnected ? '#10b981' : '#4b5563',
              display: 'inline-block',
              ...(isConnected
                ? {
                    boxShadow: '0 0 0 2px rgba(16,185,129,0.3)',
                    animation: 'walletPulse 2s infinite',
                  }
                : {}),
            }}
          />
          {isConnected ? 'Connected' : 'Not Connected'}
        </span>
      </div>

      {/* ── Body ── */}
      <div className="wallet-panel-body">
        {isConnected && account ? (
          <>
            {/* Network selector */}
            <div style={{ position: 'relative' }}>
              <div className="wallet-section-header">
                <span className="wallet-section-title">Network</span>
                {availableNetworks.length > 1 && (
                  <button
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--wallet-primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                    onClick={() => setShowNetworkMenu((v) => !v)}
                  >
                    Switch ▾
                  </button>
                )}
              </div>
              <NetworkBadge network={network} />

              {showNetworkMenu && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: 6,
                    background: 'var(--wallet-surface-2)',
                    border: '1px solid var(--wallet-border)',
                    borderRadius: 10,
                    overflow: 'hidden',
                    zIndex: 10,
                    minWidth: 200,
                    boxShadow: 'var(--wallet-shadow)',
                  }}
                >
                  {availableNetworks.map((net) => (
                    <button
                      key={net.id}
                      onClick={() => handleNetworkSwitch(net)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        width: '100%',
                        padding: '10px 14px',
                        background:
                          net.id === network.id
                            ? 'rgba(158,127,255,0.08)'
                            : 'transparent',
                        border: 'none',
                        color:
                          net.id === network.id
                            ? 'var(--wallet-primary)'
                            : 'var(--wallet-text)',
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          'rgba(158,127,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.background =
                          net.id === network.id
                            ? 'rgba(158,127,255,0.08)'
                            : 'transparent';
                      }}
                    >
                      <span style={{ color: net.color, fontWeight: 700 }}>
                        {net.icon}
                      </span>
                      {net.name}
                      {net.id === network.id && (
                        <span style={{ marginLeft: 'auto', fontSize: '0.7rem' }}>
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="wallet-tabs">
              {(['overview', 'send', 'history'] as PanelTab[]).map((tab) => (
                <button
                  key={tab}
                  className={`wallet-tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'send' && 'Send / Receive'}
                  {tab === 'history' && (
                    <>
                      History
                      {pendingTxCount > 0 && (
                        <span style={{ marginLeft: 4, color: '#f59e0b' }}>
                          ({pendingTxCount})
                        </span>
                      )}
                    </>
                  )}
                </button>
              ))}
            </div>

            {/* Tab content */}
            {activeTab === 'overview' && (
              <WalletBalance showTokenList compact={false} />
            )}
            {activeTab === 'send' && <SendReceive />}
            {activeTab === 'history' && <TransactionHistory showPagination />}
          </>
        ) : (
          <GuestState onConnect={openModal} />
        )}
      </div>

      {/* ── Footer ── */}
      {isConnected && (
        <div className="wallet-panel-footer">
          <button className="wallet-disconnect-btn" onClick={handleDisconnect}>
            Disconnect Wallet
          </button>
        </div>
      )}
    </aside>
  );
}

/* ─── Guest / Disconnected State ─────────────────────────────────────────── */

function GuestState({ onConnect }: { onConnect: () => void }) {
  return (
    <div className="wallet-guest-state">
      {/* Decorative icon */}
      <div className="wallet-guest-icon">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <rect
            x="3"
            y="9"
            width="30"
            height="20"
            rx="4"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
          <rect
            x="3"
            y="14"
            width="30"
            height="5"
            fill="currentColor"
            opacity="0.15"
          />
          <circle cx="26" cy="21" r="3" fill="currentColor" opacity="0.5" />
        </svg>
      </div>

      <h3 className="wallet-guest-title">No Wallet Connected</h3>
      <p className="wallet-guest-desc">
        Connect your Litecoin or EVM wallet to view balances, send transactions,
        and track your history in real-time.
      </p>

      {/* Skeleton preview rows */}
      <div className="wallet-guest-skeleton">
        <div className="wallet-skeleton-label">Balance</div>
        <div className="wallet-skeleton-row wide" />
        <div className="wallet-skeleton-row medium" />

        <div className="wallet-skeleton-label" style={{ marginTop: 16 }}>
          Recent Transactions
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="wallet-skeleton-tx-row">
            <div className="wallet-skeleton-circle" />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div className="wallet-skeleton-row" style={{ width: '60%' }} />
              <div className="wallet-skeleton-row" style={{ width: '40%' }} />
            </div>
            <div className="wallet-skeleton-row" style={{ width: 56 }} />
          </div>
        ))}
      </div>

      {/* CTA */}
      <button className="wallet-guest-cta" onClick={onConnect}>
        <span>Connect Wallet</span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M2 7h10M8 3l4 4-4 4"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Supported wallets hint */}
      <div className="wallet-guest-hints">
        <span className="wallet-hint-chip">Ł Litecoin</span>
        <span className="wallet-hint-chip">Ξ EVM / MetaMask</span>
      </div>
    </div>
  );
}

import React, { useEffect, useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import { WALLET_OPTIONS } from '../types/wallet';
import type { WalletType } from '../types/wallet';
import './wallet.css';

export function WalletModal() {
  const { isModalOpen, closeModal, connect, isConnecting, hasError, error, clearError } = useWallet();

  // Close on Escape
  useEffect(() => {
    if (!isModalOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isModalOpen, closeModal]);

  // Prevent body scroll
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isModalOpen]);

  const handleConnect = useCallback((type: WalletType) => {
    clearError();
    connect(type);
  }, [connect, clearError]);

  if (!isModalOpen) return null;

  return (
    <div
      className="wallet-modal-overlay"
      onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet"
    >
      <div className="wallet-modal">
        <div className="wallet-modal-header">
          <div>
            <h2>Connect Wallet</h2>
            <p>Choose your wallet to get started</p>
          </div>
          <button
            className="wallet-modal-close"
            onClick={closeModal}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <div className="wallet-modal-body">
          {isConnecting ? (
            <ConnectingState />
          ) : hasError ? (
            <ErrorState error={error} onRetry={() => clearError()} />
          ) : (
            WALLET_OPTIONS.map((opt) => (
              <button
                key={opt.id}
                className={`wallet-option-card ${isConnecting ? 'loading' : ''}`}
                onClick={() => handleConnect(opt.id as WalletType)}
                disabled={!opt.available || isConnecting}
              >
                <div
                  className="wallet-option-icon"
                  style={{
                    background: `${opt.color}18`,
                    color: opt.color,
                  }}
                >
                  {opt.icon}
                </div>
                <div className="wallet-option-info">
                  <h3>{opt.name}</h3>
                  <p>{opt.description}</p>
                </div>
                <span className="wallet-option-arrow">→</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ConnectingState() {
  return (
    <div className="wallet-connecting-state">
      <div
        className="wallet-connecting-icon"
        style={{ background: 'rgba(158,127,255,0.12)', color: '#9e7fff' }}
      >
        ⚡
      </div>
      <h3>Connecting…</h3>
      <p>Waiting for wallet confirmation</p>
    </div>
  );
}

function ErrorState({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="wallet-error-state">
      <div className="wallet-error-icon">⚠️</div>
      <h3>Connection Failed</h3>
      <p>{error ?? 'An unexpected error occurred. Please try again.'}</p>
      <button className="wallet-error-retry" onClick={onRetry}>
        Try Again
      </button>
    </div>
  );
}

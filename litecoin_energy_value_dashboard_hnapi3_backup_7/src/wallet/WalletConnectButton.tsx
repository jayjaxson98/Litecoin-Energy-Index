import React, { useCallback } from 'react';
import { useWallet } from '../hooks/useWallet';
import './wallet.css';

interface WalletConnectButtonProps {
  className?: string;
}

export function WalletConnectButton({ className = '' }: WalletConnectButtonProps) {
  const {
    isConnected,
    isConnecting,
    displayAddress,
    walletType,
    pendingTxCount,
    openModal,
    openPanel,
  } = useWallet();

  const handleClick = useCallback(() => {
    if (isConnected) {
      openPanel();
    } else {
      openModal();
    }
  }, [isConnected, openModal, openPanel]);

  if (isConnecting) {
    return (
      <button
        className={`wallet-connect-btn connecting ${className}`}
        disabled
        aria-label="Connecting wallet"
      >
        <div className="wallet-spinner" />
        Connecting…
      </button>
    );
  }

  if (isConnected && displayAddress) {
    const icon = walletType === 'litecoin' ? 'Ł' : 'Ξ';
    return (
      <button
        className={`wallet-connect-btn connected ${className}`}
        onClick={handleClick}
        aria-label={`Wallet connected: ${displayAddress}. Click to open wallet panel.`}
      >
        <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{icon}</span>
        <span>{displayAddress}</span>
        {pendingTxCount > 0 && (
          <span className="pending-badge">{pendingTxCount}</span>
        )}
        <span className="btn-dot pulse" />
      </button>
    );
  }

  return (
    <button
      className={`wallet-connect-btn ${className}`}
      onClick={handleClick}
      aria-label="Connect wallet"
    >
      <span className="btn-dot" />
      Connect Wallet
    </button>
  );
}

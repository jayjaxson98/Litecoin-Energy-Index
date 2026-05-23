import React from 'react';
import type { ChainNetwork } from '../types/wallet';
import './wallet.css';

interface NetworkBadgeProps {
  network: ChainNetwork;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

export function NetworkBadge({ network, size = 'md', showDot = true }: NetworkBadgeProps) {
  const fontSize = size === 'sm' ? '0.68rem' : '0.75rem';

  return (
    <span
      className="network-badge"
      style={{
        color: network.color,
        borderColor: `${network.color}33`,
        background: `${network.color}12`,
        fontSize,
      }}
    >
      {showDot && <span className="network-dot" />}
      <span>{network.icon}</span>
      <span>{network.name}</span>
    </span>
  );
}

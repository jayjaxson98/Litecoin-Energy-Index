import React from 'react';
import { useWallet } from '../contexts/WalletContext';

const CHAIN_NAMES: Record<number, string> = {
  1: 'Mainnet',
  11155111: 'Sepolia',
  137: 'Polygon',
};

const CHAIN_COLORS: Record<number, string> = {
  1: 'text-success border-success/30 bg-success/10',
  11155111: 'text-secondary border-secondary/30 bg-secondary/10',
  137: 'text-primary border-primary/30 bg-primary/10',
};

export function NetworkBadge() {
  const { chainId, isConnected } = useWallet();

  if (!isConnected || !chainId) return null;

  const name = CHAIN_NAMES[chainId] || `Chain ${chainId}`;
  const color = CHAIN_COLORS[chainId] || 'text-neutral-400 border-neutral-600 bg-neutral-800';

  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${color}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      {name}
    </span>
  );
}

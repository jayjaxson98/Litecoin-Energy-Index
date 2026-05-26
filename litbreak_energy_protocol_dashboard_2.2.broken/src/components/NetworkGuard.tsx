// ─── NetworkGuard ─── Shows a banner when on wrong network

import { AlertTriangle } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';
import { useWallet } from '../contexts/WalletContext';
import { GlowButton } from './GlowButton';

export function NetworkGuard() {
  const { isCorrectNetwork, network, switchNetwork, chainId } = useWeb3();
  const { isConnected, isSimulation } = useWallet();

  // Don't show if not connected, in simulation, or on correct network
  if (!isConnected || isSimulation || isCorrectNetwork || chainId === 0) return null;

  return (
    <div className="fixed top-16 left-0 right-0 z-40 bg-red-500/10 border-b border-red-500/20 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-400" />
          <div>
            <p className="text-sm font-semibold text-red-400">Wrong Network</p>
            <p className="text-xs text-red-400/60">Please switch to {network.name}</p>
          </div>
        </div>
        <GlowButton onClick={switchNetwork} variant="accent" size="sm">
          Switch Network
        </GlowButton>
      </div>
    </div>
  );
}

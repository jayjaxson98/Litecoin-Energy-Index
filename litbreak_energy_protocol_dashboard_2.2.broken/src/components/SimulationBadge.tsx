// ─── SimulationBadge ─── Shows when in simulation mode
// ONLY consumes WalletContext — no Web3Context import (leaf component rule)

import { FlaskConical } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export function SimulationBadge() {
  const { isSimulation } = useWallet();

  if (!isSimulation) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-md">
        <FlaskConical className="w-4 h-4 text-amber-400" />
        <div>
          <p className="text-xs font-semibold text-amber-400">Simulation Mode</p>
          <p className="text-[10px] text-amber-400/50">No real transactions</p>
        </div>
      </div>
    </div>
  );
}

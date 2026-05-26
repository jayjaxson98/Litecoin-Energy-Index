import { Play, Pause, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import type { AgentConfig } from '../types';
import { timeAgo } from '../lib/format';

interface Props {
  agent: AgentConfig;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const STRATEGY_COLORS: Record<AgentConfig['strategy'], string> = {
  momentum: 'bg-primary/20 text-primary',
  'mean-reversion': 'bg-secondary/20 text-secondary',
  arbitrage: 'bg-success/20 text-success',
  grid: 'bg-warning/20 text-warning',
};

export function AgentCard({ agent, onToggle, onDelete }: Props) {
  const isActive = agent.status === 'active';

  return (
    <div className="glass rounded-2xl p-4 hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h4 className="text-sm font-semibold text-white">{agent.name}</h4>
          <span className={`inline-block mt-1 px-2 py-0.5 rounded-md text-[10px] font-medium ${STRATEGY_COLORS[agent.strategy]}`}>
            {agent.strategy}
          </span>
        </div>
        <span className={`flex items-center gap-1 text-[10px] font-medium ${isActive ? 'text-success' : 'text-neutral-400'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-success animate-pulse' : 'bg-neutral-500'}`} />
          {agent.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-[10px] text-neutral-400">PnL</p>
          <p className={`text-sm font-bold flex items-center gap-1 ${agent.pnl >= 0 ? 'text-success' : 'text-error'}`}>
            {agent.pnl >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {agent.pnl >= 0 ? '+' : ''}{agent.pnl}%
          </p>
        </div>
        <div className="bg-white/5 rounded-lg p-2">
          <p className="text-[10px] text-neutral-400">Trades</p>
          <p className="text-sm font-bold text-white">{agent.trades.toLocaleString()}</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-neutral-400 mb-3">
        <span>Allocation: ${agent.allocation.toLocaleString()}</span>
        <span>Created {timeAgo(agent.createdAt)}</span>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => onToggle(agent.id)}
          className={`flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-colors ${
            isActive ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-success/10 text-success hover:bg-success/20'
          }`}
        >
          {isActive ? <><Pause className="w-3 h-3" /> Pause</> : <><Play className="w-3 h-3" /> Resume</>}
        </button>
        <button
          onClick={() => onDelete(agent.id)}
          className="px-3 py-2 rounded-lg bg-error/10 text-error hover:bg-error/20 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

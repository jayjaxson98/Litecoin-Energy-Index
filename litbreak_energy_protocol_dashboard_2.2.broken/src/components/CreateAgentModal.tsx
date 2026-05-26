import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import type { AgentConfig } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (config: Omit<AgentConfig, 'id' | 'pnl' | 'trades' | 'uptime' | 'createdAt'>) => Promise<AgentConfig>;
  isCreating: boolean;
}

export function CreateAgentModal({ onClose, onCreate, isCreating }: Props) {
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState<AgentConfig['strategy']>('momentum');
  const [riskLevel, setRiskLevel] = useState<AgentConfig['riskLevel']>('medium');
  const [allocation, setAllocation] = useState('1000');

  const handleCreate = async () => {
    if (!name.trim()) return;
    await onCreate({
      name: name.trim(),
      strategy,
      status: 'active',
      allocation: parseFloat(allocation) || 1000,
      riskLevel,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">Create Agent</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/5 text-neutral-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Agent Name</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="My Trading Agent"
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50 placeholder:text-neutral-600"
            />
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Strategy</label>
            <select
              value={strategy}
              onChange={e => setStrategy(e.target.value as AgentConfig['strategy'])}
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50"
            >
              <option value="momentum">Momentum</option>
              <option value="mean-reversion">Mean Reversion</option>
              <option value="arbitrage">Arbitrage</option>
              <option value="grid">Grid Trading</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Risk Level</label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setRiskLevel(level)}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium capitalize transition-colors ${
                    riskLevel === level ? 'bg-primary text-white' : 'bg-white/5 text-neutral-400 hover:text-white'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 mb-1 block">Allocation (USD)</label>
            <input
              type="number"
              value={allocation}
              onChange={e => setAllocation(e.target.value)}
              className="w-full bg-white/5 border border-border rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-primary/50"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl bg-white/5 text-neutral-300 text-sm font-medium hover:bg-white/10 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating || !name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/80 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isCreating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : 'Create Agent'}
          </button>
        </div>
      </div>
    </div>
  );
}

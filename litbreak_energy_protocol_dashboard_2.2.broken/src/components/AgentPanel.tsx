// ─── AgentPanel ─── Agent management and staking

import { useState, useEffect } from 'react';
import { Bot, Shield, TrendingUp, TrendingDown, Zap } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { formatTokenBalance, formatTimeAgo } from '../lib/format';
import type { AgentConfig } from '../types';

export function AgentPanel() {
  const { getAgents } = useContract();
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getAgents();
        if (mounted) {
          setAgents(data);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => { mounted = false; };
  }, [getAgents]);

  const strategyIcons: Record<string, typeof Bot> = {
    'Aggressive Mining': Zap,
    'Yield Optimization': TrendingUp,
    'Risk Hedging': Shield,
    'Arbitrage': TrendingUp,
  };

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(158,127,255,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">AI Agents</h3>
          <p className="text-xs text-white/25 mt-0.5">{agents.filter((a) => a.isActive).length} active</p>
        </div>
        <Bot className="w-5 h-5 text-primary/50" />
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-white/[0.02] animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {agents.map((agent) => {
            const Icon = strategyIcons[agent.strategy] ?? Bot;
            const isSelected = selectedAgent === agent.id;

            return (
              <button
                key={agent.id}
                onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all duration-300
                  ${isSelected
                    ? 'bg-primary/10 border border-primary/30 shadow-[0_0_20px_rgba(158,127,255,0.1)]'
                    : 'bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                  }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center
                      ${agent.isActive ? 'bg-primary/15 text-primary' : 'bg-white/5 text-white/20'}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{agent.name}</span>
                        <div className={`w-1.5 h-1.5 rounded-full ${agent.isActive ? 'bg-emerald-400' : 'bg-white/20'}`} />
                      </div>
                      <span className="text-[10px] text-white/30">{agent.strategy}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`flex items-center gap-1 text-sm font-semibold
                      ${agent.performance >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {agent.performance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {agent.performance >= 0 ? '+' : ''}{agent.performance.toFixed(1)}%
                    </div>
                    <span className="text-[10px] text-white/20">{formatTimeAgo(agent.lastUpdate)}</span>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-3 pt-3 border-t border-white/5 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] text-white/25 uppercase">Staked</p>
                      <p className="text-xs font-semibold text-white">{formatTokenBalance(agent.totalStaked, 0)} LBT</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-white/25 uppercase">Reward Rate</p>
                      <p className="text-xs font-semibold text-secondary">{agent.rewardRate}% APY</p>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

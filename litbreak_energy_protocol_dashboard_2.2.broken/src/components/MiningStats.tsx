// ─── MiningStats ─── Mining statistics grid

import { useState, useEffect } from 'react';
import { Cpu, HardDrive, Pickaxe, Layers } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { formatNumber, formatCompact } from '../lib/format';
import { StatsCard } from './StatsCard';

export function MiningStats() {
  const { getProtocolStats } = useContract();
  const [stats, setStats] = useState<{
    hashRate: string;
    difficulty: string;
    blockReward: string;
    activeAgents: number;
    totalValueLocked: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const data = await getProtocolStats();
        if (mounted) {
          setStats({
            hashRate: data.hashRate,
            difficulty: data.difficulty,
            blockReward: data.blockReward,
            activeAgents: data.activeAgents,
            totalValueLocked: data.totalValueLocked,
          });
        }
      } catch {
        // silent
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => { mounted = false; clearInterval(interval); };
  }, [getProtocolStats]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Mining Statistics</h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-white/30">Live</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <StatsCard
          title="Hash Rate"
          value={stats ? `${formatNumber(parseFloat(stats.hashRate), 1)} TH/s` : '—'}
          icon={<Cpu className="w-4 h-4" />}
          trend={{ value: 3.2, label: '24h' }}
          glowColor="primary"
        />
        <StatsCard
          title="Difficulty"
          value={stats ? formatNumber(parseFloat(stats.difficulty), 2) : '—'}
          icon={<HardDrive className="w-4 h-4" />}
          trend={{ value: 1.5, label: '24h' }}
          glowColor="secondary"
        />
        <StatsCard
          title="Block Reward"
          value={stats ? `${stats.blockReward} LTC` : '—'}
          icon={<Pickaxe className="w-4 h-4" />}
          subtitle="Per block"
          glowColor="accent"
        />
        <StatsCard
          title="TVL"
          value={stats ? `$${formatCompact(parseFloat(stats.totalValueLocked) / 1e18)}` : '—'}
          icon={<Layers className="w-4 h-4" />}
          trend={{ value: 5.8, label: '7d' }}
          glowColor="primary"
        />
      </div>
    </div>
  );
}

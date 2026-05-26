import { TrendingUp, Coins, Flame, Zap } from 'lucide-react';
import { formatCompact, formatNumber } from '../lib/format';

interface StatCard {
  label: string;
  value: string;
  change: number;
  icon: typeof TrendingUp;
  color: string;
}

const STATS: StatCard[] = [
  { label: 'Total Value Locked', value: formatCompact(14_250_000), change: 5.2, icon: TrendingUp, color: 'text-primary' },
  { label: 'LBT Minted', value: formatCompact(8_420_000), change: 12.8, icon: Coins, color: 'text-secondary' },
  { label: 'LBT Burned', value: formatCompact(2_150_000), change: -3.1, icon: Flame, color: 'text-accent' },
  { label: 'Energy Index', value: formatNumber(0.0847, 4), change: 1.4, icon: Zap, color: 'text-success' },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {STATS.map(stat => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.label}
            className="glass rounded-2xl p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-neutral-400">{stat.label}</span>
              <Icon className={`w-4 h-4 ${stat.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
            </div>
            <p className="text-xl font-bold text-white mb-1">{stat.value}</p>
            <span className={`text-xs font-medium ${stat.change >= 0 ? 'text-success' : 'text-error'}`}>
              {stat.change >= 0 ? '+' : ''}{stat.change}%
              <span className="text-neutral-500 ml-1">24h</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, DollarSign, Users, Activity, Layers, Globe, Zap } from 'lucide-react';
import { useLtcPrice } from '@/hooks/useLtcPrice';
import { useEnergyIndex } from '@/hooks/useEnergyIndex';
import type { StatsData } from '@/types';

interface StatsPanelProps {
  stats: StatsData;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl glass p-5 animate-pulse">
      <div className="h-4 w-24 bg-white/5 rounded mb-3" />
      <div className="h-7 w-32 bg-white/5 rounded mb-2" />
      <div className="h-3 w-16 bg-white/5 rounded" />
    </div>
  );
}

export function StatsPanel({ stats, isLoading }: StatsPanelProps) {
  const { data: ltcData } = useLtcPrice();
  const { globalIndex, kwhPerLtc } = useEnergyIndex();

  const statCards = [
    {
      label: 'LTC Price',
      value: `$${ltcData.price.toFixed(2)}`,
      change: ltcData.changePercent24h,
      icon: Activity,
      color: 'from-blue-500/20 to-blue-600/5',
    },
    {
      label: 'Total Value Locked',
      value: `$${stats.totalValueLocked}`,
      subtitle: '+12.4% this week',
      icon: DollarSign,
      color: 'from-primary/20 to-primary/5',
    },
    {
      label: 'Energy Index',
      value: `$${globalIndex.toFixed(3)}/kWh`,
      subtitle: `1 LTC = ${kwhPerLtc.toFixed(0)} kWh`,
      icon: Zap,
      color: 'from-amber-500/20 to-amber-600/5',
    },
    {
      label: 'Holders',
      value: stats.holders.toLocaleString(),
      subtitle: `${stats.transactions.toLocaleString()} txns`,
      icon: Users,
      color: 'from-emerald-500/20 to-emerald-500/5',
    },
  ];

  return (
    <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto mb-12 sm:mb-16">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((card, i) => {
          if (isLoading) return <SkeletonCard key={i} />;
          const Icon = card.icon;
          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              whileHover={{ y: -4, scale: 1.02 }}
              className="rounded-2xl glass p-4 sm:p-5 group cursor-default"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] sm:text-xs text-gray-500 font-medium">{card.label}</span>
                <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                  <Icon className="w-4 h-4 text-white/80" />
                </div>
              </div>
              <div className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 font-mono">
                {card.value}
              </div>
              {card.change !== undefined && (
                <div className={`flex items-center gap-1 text-xs font-medium ${card.change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {card.change >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.change >= 0 ? '+' : ''}{card.change.toFixed(2)}% (24h)
                </div>
              )}
              {card.subtitle && !card.change && (
                <div className="text-xs text-emerald-400 font-medium">{card.subtitle}</div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

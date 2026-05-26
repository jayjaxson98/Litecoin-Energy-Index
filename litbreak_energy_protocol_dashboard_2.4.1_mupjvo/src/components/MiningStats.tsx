import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Gauge, Box, Clock, Zap, DollarSign } from 'lucide-react';

interface StatItem {
  label: string;
  value: string;
  icon: typeof Cpu;
  color: string;
}

export function MiningStats() {
  const [stats, setStats] = useState<StatItem[]>([]);

  useEffect(() => {
    const update = () =>
      setStats([
        {
          label: 'Hash Rate',
          value: `${(1.24 + Math.random() * 0.1).toFixed(2)} PH/s`,
          icon: Cpu,
          color: 'text-primary',
        },
        {
          label: 'Difficulty',
          value: `${(42.7 + Math.random() * 0.5).toFixed(1)}T`,
          icon: Gauge,
          color: 'text-secondary',
        },
        {
          label: 'Block Height',
          value: `#${(2_847_293 + Math.floor(Math.random() * 10)).toLocaleString()}`,
          icon: Box,
          color: 'text-emerald-400',
        },
        {
          label: 'Block Time',
          value: `${(2.4 + Math.random() * 0.3).toFixed(1)}m`,
          icon: Clock,
          color: 'text-amber-400',
        },
        {
          label: 'Energy Cost',
          value: `$${(0.042 + Math.random() * 0.005).toFixed(3)}/kWh`,
          icon: Zap,
          color: 'text-accent',
        },
        {
          label: 'Profitability',
          value: `$${(12.4 + Math.random() * 2).toFixed(2)}/day`,
          icon: DollarSign,
          color: 'text-emerald-400',
        },
      ]);
    update();
    const id = setInterval(update, 8000);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="rounded-2xl glass border border-white/5 p-6"
    >
      <h2 className="text-lg font-bold mb-4">Mining Statistics</h2>
      <div className="space-y-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${s.color}`} />
                <span className="text-sm text-neutral-400">{s.label}</span>
              </div>
              <span className="text-sm font-mono font-medium">{s.value}</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

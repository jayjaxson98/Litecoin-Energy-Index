import { motion } from 'framer-motion';
import { Cpu, Pickaxe, Timer, Hash } from 'lucide-react';

const stats = [
  { label: 'Hashrate', value: '1.21 TH/s', icon: Hash, color: 'text-primary' },
  { label: 'Difficulty', value: '32.45M', icon: Cpu, color: 'text-secondary' },
  { label: 'Block Time', value: '2.5 min', icon: Timer, color: 'text-success' },
  { label: 'Block Reward', value: '6.25 LTC', icon: Pickaxe, color: 'text-warning' },
];

export function MiningStats() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Litecoin Mining Stats</h3>
      <div className="space-y-3">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 + i * 0.08 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2.5">
              <stat.icon className={`w-4 h-4 ${stat.color}`} />
              <span className="text-xs text-textSecondary">{stat.label}</span>
            </div>
            <span className="text-xs font-mono text-white">{stat.value}</span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

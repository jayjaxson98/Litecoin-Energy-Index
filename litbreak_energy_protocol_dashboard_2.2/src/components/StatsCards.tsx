import { motion } from 'framer-motion';
import { TrendingUp, Coins, Zap, Users } from 'lucide-react';

const stats = [
  {
    label: 'POWER Price',
    value: '$0.0847',
    change: '+3.2%',
    positive: true,
    icon: TrendingUp,
    color: 'from-primary to-secondary',
  },
  {
    label: 'Total Minted',
    value: '47.8M',
    change: '+1.4M today',
    positive: true,
    icon: Coins,
    color: 'from-success to-emerald-400',
  },
  {
    label: 'Energy Index',
    value: '142.7',
    change: '-0.8%',
    positive: false,
    icon: Zap,
    color: 'from-warning to-orange-400',
  },
  {
    label: 'Active Minters',
    value: '12,847',
    change: '+284',
    positive: true,
    icon: Users,
    color: 'from-accent to-pink-400',
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.5 }}
          whileHover={{ y: -2, scale: 1.01 }}
          className="glass-card p-4 group cursor-default"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center opacity-80 group-hover:opacity-100 transition-opacity`}>
              <stat.icon className="w-4.5 h-4.5 text-white" />
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              stat.positive
                ? 'text-success bg-success/10'
                : 'text-error bg-error/10'
            }`}>
              {stat.change}
            </span>
          </div>
          <p className="text-xs text-textSecondary mb-1">{stat.label}</p>
          <p className="text-xl font-bold text-white">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}

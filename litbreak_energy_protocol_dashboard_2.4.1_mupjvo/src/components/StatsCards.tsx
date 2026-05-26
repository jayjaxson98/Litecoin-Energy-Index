import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, Users, Activity, Shield } from 'lucide-react';

const stats = [
  {
    label: 'POWER Price',
    value: '$0.0847',
    change: 3.24,
    icon: Coins,
    color: 'from-primary to-purple-400',
  },
  {
    label: 'Total Supply',
    value: '21,000,000',
    change: 0,
    icon: Shield,
    color: 'from-secondary to-cyan-400',
  },
  {
    label: 'Holders',
    value: '4,821',
    change: 2.1,
    icon: Users,
    color: 'from-emerald-500 to-green-400',
  },
  {
    label: 'Energy Index',
    value: '$0.142/kWh',
    change: -1.8,
    icon: Activity,
    color: 'from-accent to-pink-400',
  },
];

export function StatsCards() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative rounded-2xl glass border border-white/5 p-5 hover:border-white/10 transition-all overflow-hidden"
          >
            <div
              className={`absolute -top-8 -right-8 w-24 h-24 rounded-full bg-gradient-to-br ${s.color} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
            />
            <div className="relative">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-xl bg-gradient-to-br ${s.color} bg-opacity-10`}>
                  <Icon className="w-5 h-5 text-white/80" />
                </div>
                {s.change !== 0 && (
                  <div
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      s.change > 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {s.change > 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(s.change)}%
                  </div>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 uppercase tracking-wider font-medium mb-1">
                {s.label}
              </p>
              <p className="text-xl font-bold font-mono tracking-tight">{s.value}</p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

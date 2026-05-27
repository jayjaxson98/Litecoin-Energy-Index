import { motion } from 'framer-motion';
import { Flame, TrendingUp, ArrowUpRight, ArrowDownRight, Coins } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { formatNumber } from '../utils/contractHelpers';

export default function EmissionsPanel() {
  const { emissions } = useMockContract();

  const metrics = [
    {
      label: 'Daily Minted',
      value: formatNumber(emissions.dailyMinted),
      icon: Coins,
      color: 'text-primary',
      trend: '+12%',
      trendUp: true,
    },
    {
      label: 'Daily Burned',
      value: formatNumber(emissions.dailyBurned),
      icon: Flame,
      color: 'text-accent',
      trend: '+8%',
      trendUp: true,
    },
    {
      label: 'Net Emissions',
      value: formatNumber(emissions.dailyMinted - emissions.dailyBurned),
      icon: TrendingUp,
      color: emissions.dailyMinted > emissions.dailyBurned ? 'text-emerald-400' : 'text-red-400',
      trend: emissions.dailyMinted > emissions.dailyBurned ? 'Inflationary' : 'Deflationary',
      trendUp: emissions.dailyMinted > emissions.dailyBurned,
    },
  ];

  return (
    /* p reduced from 5→4 */
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="glass-card rounded-2xl p-4"
    >
      {/* Header — mb from 5→3 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-accent/10">
            <Flame className="w-4 h-4 text-accent" />
          </div>
          <h3 className="font-semibold text-sm">Emissions</h3>
        </div>
        <span className="text-[10px] text-neutral-500 font-mono">24h</span>
      </div>

      {/* Metrics — gap from 3→2 */}
      <div className="space-y-2">
        {metrics.map((metric) => (
          <div key={metric.label} className="glass rounded-xl p-2.5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <metric.icon className={`w-3.5 h-3.5 ${metric.color}`} />
              <div>
                <p className="text-[10px] text-neutral-500">{metric.label}</p>
                <p className="text-sm font-bold font-mono">{metric.value} <span className="text-[10px] text-neutral-500">LBT</span></p>
              </div>
            </div>
            <div className={`flex items-center gap-0.5 text-[10px] font-semibold ${
              metric.trendUp ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {metric.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {metric.trend}
            </div>
          </div>
        ))}
      </div>

      {/* Backing bar — mt from 4→3 */}
      <div className="mt-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] text-neutral-500">Backing Ratio</span>
          <span className="text-xs font-mono font-bold text-emerald-400">
            {(emissions.backingRatio * 100).toFixed(1)}%
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-neutral-800 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: 'linear-gradient(90deg, #10b981, #38bdf8)',
            }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(emissions.backingRatio * 100, 100)}%` }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[9px] text-neutral-600">0%</span>
          <span className="text-[9px] text-neutral-600">100%</span>
        </div>
      </div>
    </motion.div>
  );
}

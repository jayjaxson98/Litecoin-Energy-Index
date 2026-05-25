import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PricePoint, TimeRange } from '../types/utx';
import { ltcPriceHistory30d, ltcPriceHistory90d, ltcPriceHistory365d } from '../data/ltcPriceHistory';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: '24H', value: '24H' },
  { label: '7D', value: '7D' },
  { label: '30D', value: '30D' },
  { label: '90D', value: '90D' },
  { label: '1Y', value: '1Y' },
];

function getDataForRange(range: TimeRange): PricePoint[] {
  const now = Date.now();
  const msMap: Record<TimeRange, number> = {
    '1H': 3_600_000,
    '6H': 21_600_000,
    '24H': 86_400_000,
    '7D': 604_800_000,
    '30D': 2_592_000_000,
    '90D': 7_776_000_000,
    '1Y': 31_536_000_000,
  };

  let source: PricePoint[];
  if (range === '1Y') {
    source = ltcPriceHistory365d;
  } else if (range === '90D') {
    source = ltcPriceHistory90d;
  } else {
    source = ltcPriceHistory30d;
  }

  const cutoff = now - msMap[range];
  return source.filter(p => p.timestamp >= cutoff);
}

export function DeFiChartsView() {
  const [timeRange, setTimeRange] = useState<TimeRange>('30D');

  const chartData = useMemo(() => {
    const points = getDataForRange(timeRange);
    return points.map(p => ({
      time: new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: p.price,
      volume: p.volume ?? 0,
      timestamp: p.timestamp,
    }));
  }, [timeRange]);

  const currentPrice = chartData.length > 0 ? chartData[chartData.length - 1].price : 0;
  const firstPrice = chartData.length > 0 ? chartData[0].price : 0;
  const priceChange = firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-secondary to-transparent" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 border border-secondary/20 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">LTC Price Chart</h2>
              <p className="text-xs text-textSecondary">Litecoin market data</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold font-mono text-white">
              ${currentPrice.toFixed(2)}
            </div>
            <div className={`flex items-center gap-1 text-sm font-mono justify-end ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-4">
          {TIME_RANGES.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setTimeRange(value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                timeRange === value
                  ? 'bg-secondary/20 text-secondary border border-secondary/30'
                  : 'text-textSecondary hover:text-white hover:bg-white/5'
              }`}
            >
              {label}
            </button>
          ))}
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-xs text-textSecondary">
            <Clock className="w-3 h-3" />
            <span>{chartData.length} data points</span>
          </div>
        </div>

        {/* Chart */}
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="ltcPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A3A3A3', fontSize: 10 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A3A3A3', fontSize: 10 }}
                domain={['auto', 'auto']}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '8px 12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#A3A3A3', fontSize: 11 }}
                itemStyle={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: 13, fontFamily: 'JetBrains Mono' }}
                formatter={(value: number) => [`$${value.toFixed(2)}`, 'LTC Price']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                strokeWidth={2}
                fill="url(#ltcPriceGradient)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: isPositive ? '#10b981' : '#ef4444',
                  stroke: '#0f172a',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bottom Stats */}
        <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-white/5">
          <div>
            <div className="text-xs text-textSecondary mb-1">High</div>
            <div className="text-sm font-bold font-mono text-success">
              ${chartData.length > 0 ? Math.max(...chartData.map(d => d.price)).toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-textSecondary mb-1">Low</div>
            <div className="text-sm font-bold font-mono text-error">
              ${chartData.length > 0 ? Math.min(...chartData.map(d => d.price)).toFixed(2) : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-textSecondary mb-1">Avg Volume</div>
            <div className="text-sm font-bold font-mono text-white">
              ${chartData.length > 0
                ? (chartData.reduce((s, d) => s + d.volume, 0) / chartData.length / 1_000_000).toFixed(1) + 'M'
                : '—'}
            </div>
          </div>
          <div>
            <div className="text-xs text-textSecondary mb-1">Period Change</div>
            <div className={`text-sm font-bold font-mono ${isPositive ? 'text-success' : 'text-error'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

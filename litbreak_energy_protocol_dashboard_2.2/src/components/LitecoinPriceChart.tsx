import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Loader2 } from 'lucide-react';
import { useLtcPriceHistory } from '../hooks/useEnergyIndex';

type TimeRange = '7d' | '30d' | '90d' | '1y';

function PriceTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div className="text-xs text-textSecondary mb-1">{label}</div>
      <div className="text-sm font-mono font-semibold text-white">
        ${payload[0].value.toFixed(2)}
      </div>
    </div>
  );
}

export function LitecoinPriceChart() {
  const [range, setRange] = useState<TimeRange>('30d');
  const { data: priceData, isLoading } = useLtcPriceHistory(range);

  const ranges: { label: string; value: TimeRange }[] = [
    { label: '7D', value: '7d' },
    { label: '30D', value: '30d' },
    { label: '90D', value: '90d' },
    { label: '1Y', value: '1y' },
  ];

  const currentPrice = priceData?.[priceData.length - 1]?.price ?? 0;
  const startPrice = priceData?.[0]?.price ?? 0;
  const priceChange = startPrice > 0 ? ((currentPrice - startPrice) / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-warning" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Litecoin Price</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-mono text-white">
                ${currentPrice.toFixed(2)}
              </span>
              <span className={`text-sm font-semibold ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex rounded-lg bg-navy-800/80 border border-white/5 p-0.5">
          {ranges.map(r => (
            <button
              key={r.value}
              onClick={() => setRange(r.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                range === r.value
                  ? 'bg-warning/20 text-warning'
                  : 'text-textSecondary hover:text-white'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[220px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="ltcPriceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(158,127,255,0.06)" />
              <XAxis
                dataKey="date"
                stroke="rgba(255,255,255,0.2)"
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="rgba(255,255,255,0.2)"
                tick={{ fontSize: 10, fill: '#a3a3a3' }}
                domain={['dataMin - 5', 'dataMax + 5']}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
              />
              <Tooltip content={<PriceTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke={isPositive ? '#10b981' : '#ef4444'}
                fill="url(#ltcPriceGradient)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

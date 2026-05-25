import { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, TrendingUp, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data7d = [
  { time: 'Mon', value: 138.2 },
  { time: 'Tue', value: 141.5 },
  { time: 'Wed', value: 139.8 },
  { time: 'Thu', value: 144.2 },
  { time: 'Fri', value: 142.1 },
  { time: 'Sat', value: 140.6 },
  { time: 'Sun', value: 142.7 },
];

const data30d = [
  { time: 'W1', value: 132.4 },
  { time: 'W2', value: 136.8 },
  { time: 'W3', value: 140.1 },
  { time: 'W4', value: 142.7 },
];

const data24h = [
  { time: '00:00', value: 141.2 },
  { time: '04:00', value: 140.8 },
  { time: '08:00', value: 142.1 },
  { time: '12:00', value: 143.5 },
  { time: '16:00', value: 141.9 },
  { time: '20:00', value: 142.7 },
  { time: 'Now', value: 142.7 },
];

const timeframes = ['24H', '7D', '30D'] as const;
type Timeframe = typeof timeframes[number];

const dataMap: Record<Timeframe, typeof data7d> = {
  '24H': data24h,
  '7D': data7d,
  '30D': data30d,
};

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 !rounded-lg">
      <p className="text-[10px] text-textSecondary">{label}</p>
      <p className="text-sm font-bold text-white">{payload[0].value.toFixed(1)}</p>
    </div>
  );
}

export function EnergyIndex() {
  const [timeframe, setTimeframe] = useState<Timeframe>('7D');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="glass-card p-5"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warning to-orange-400 flex items-center justify-center">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Global Energy Index</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-2xl font-bold text-white">142.7</span>
              <span className="text-xs text-success flex items-center gap-0.5">
                <TrendingUp className="w-3 h-3" /> +2.4%
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 bg-surface/60 rounded-lg p-0.5">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-primary/20 text-primary'
                  : 'text-textSecondary hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={dataMap[timeframe]} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A3A3A3', fontSize: 11 }}
            />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#A3A3A3', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#energyGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center gap-2 mt-3 text-[10px] text-textSecondary">
        <Clock className="w-3 h-3" />
        Last updated: 2 minutes ago · Aggregating 30 countries
      </div>
    </motion.div>
  );
}

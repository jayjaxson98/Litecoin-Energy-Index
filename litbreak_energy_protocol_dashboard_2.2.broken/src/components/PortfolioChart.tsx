// ─── PortfolioChart ─── Portfolio value chart using recharts

import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { BarChart3 } from 'lucide-react';

type TimeRange = '24h' | '7d' | '30d' | '90d';

function generateData(range: TimeRange) {
  const points = range === '24h' ? 24 : range === '7d' ? 7 : range === '30d' ? 30 : 90;
  const baseValue = 4200;
  const data = [];
  let value = baseValue;

  for (let i = 0; i < points; i++) {
    value += (Math.random() - 0.45) * 150;
    value = Math.max(3000, Math.min(6000, value));
    data.push({
      time: range === '24h' ? `${i}:00` : `Day ${i + 1}`,
      value: Math.round(value * 100) / 100,
    });
  }
  return data;
}

export function PortfolioChart() {
  const [range, setRange] = useState<TimeRange>('7d');
  const data = useMemo(() => generateData(range), [range]);

  const startVal = data[0]?.value ?? 0;
  const endVal = data[data.length - 1]?.value ?? 0;
  const change = endVal - startVal;
  const changePercent = startVal > 0 ? (change / startVal) * 100 : 0;
  const isPositive = change >= 0;

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(158,127,255,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Portfolio Value</h3>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white">${endVal.toLocaleString()}</span>
            <span className={`text-xs font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{changePercent.toFixed(2)}%
            </span>
          </div>
        </div>
        <BarChart3 className="w-5 h-5 text-primary/50" />
      </div>

      {/* Time range selector */}
      <div className="flex gap-1 mb-4">
        {(['24h', '7d', '30d', '90d'] as TimeRange[]).map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all
              ${range === r
                ? 'bg-primary/20 text-primary border border-primary/30'
                : 'text-white/20 hover:text-white/40'
              }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0.3} />
                <stop offset="100%" stopColor={isPositive ? '#10b981' : '#ef4444'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10 }}
              domain={['auto', 'auto']}
              width={50}
            />
            <Tooltip
              contentStyle={{
                background: 'rgba(38,38,38,0.95)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '0.75rem',
                fontSize: '0.75rem',
                color: '#fff',
              }}
              formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={isPositive ? '#10b981' : '#ef4444'}
              strokeWidth={2}
              fill="url(#portfolioGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

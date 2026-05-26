import { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

type Range = '1D' | '1W' | '1M' | '3M';

function generateData(range: Range) {
  const points = range === '1D' ? 24 : range === '1W' ? 7 : range === '1M' ? 30 : 90;
  const base = 84.5;
  const data = [];
  let price = base;
  for (let i = 0; i < points; i++) {
    price += (Math.random() - 0.48) * 2;
    data.push({
      time: range === '1D' ? `${i}:00` : `Day ${i + 1}`,
      price: Math.max(0, parseFloat(price.toFixed(2))),
      volume: Math.floor(Math.random() * 500000 + 100000),
    });
  }
  return data;
}

export function ChartViewer() {
  const [range, setRange] = useState<Range>('1W');
  const data = useMemo(() => generateData(range), [range]);

  const currentPrice = data[data.length - 1]?.price ?? 0;
  const startPrice = data[0]?.price ?? 0;
  const change = ((currentPrice - startPrice) / startPrice) * 100;

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-medium text-neutral-400">LTC / USD</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">${currentPrice.toFixed(2)}</span>
            <span className={`text-sm font-medium ${change >= 0 ? 'text-success' : 'text-error'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(2)}%
            </span>
          </div>
        </div>
        <div className="flex gap-1">
          {(['1D', '1W', '1M', '3M'] as Range[]).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                range === r ? 'bg-primary text-white' : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9E7FFF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#9E7FFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="time" tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} />
            <YAxis domain={['auto', 'auto']} tick={{ fill: '#525252', fontSize: 10 }} axisLine={false} tickLine={false} width={50} />
            <Tooltip
              contentStyle={{ background: '#262626', border: '1px solid #2F2F2F', borderRadius: '0.75rem', fontSize: '0.75rem' }}
              labelStyle={{ color: '#a3a3a3' }}
              itemStyle={{ color: '#9E7FFF' }}
            />
            <Area type="monotone" dataKey="price" stroke="#9E7FFF" strokeWidth={2} fill="url(#priceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

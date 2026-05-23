import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import type { PricePoint, TimeRange } from '../types/utx';

interface Props {
  priceHistory: PricePoint[];
  ltcPrice: number;
  isLoading: boolean;
  onRangeChange: (r: TimeRange) => void;
  currentRange: TimeRange;
  regionRate: number;
}

const RANGES: TimeRange[] = ['1H', '4H', '24H', '7D', '30D', '90D'];
const card: React.CSSProperties = { background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: '20px 24px' };

export const DeFiChartsView: React.FC<Props> = ({ priceHistory, ltcPrice, isLoading, onRangeChange, currentRange }) => {
  const chartData = priceHistory.map((p) => ({
    time: new Date(p.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    price: p.price,
    volume: parseFloat(((p.volume ?? 0) / 1000).toFixed(1)),
  }));

  const priceChange = priceHistory.length > 1
    ? ((priceHistory[priceHistory.length - 1].price - priceHistory[0].price) / priceHistory[0].price * 100)
    : 0;

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>📈 DeFi Charts</h1>
      <p style={{ color: '#A3A3A3', marginBottom: 24 }}>LTC price history and volume analytics</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'LTC Price', value: `$${ltcPrice.toFixed(2)}`, color: '#9E7FFF' },
          { label: `${currentRange} Change`, value: `${priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)}%`, color: priceChange >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Data Points', value: priceHistory.length.toString(), color: '#38bdf8' },
        ].map((s) => (
          <div key={s.label} style={card}>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{isLoading ? '—' : s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ color: '#fff', fontWeight: 600 }}>LTC / USD Price</span>
            <div style={{ display: 'flex', gap: 6 }}>
              {RANGES.map((r) => (
                <button key={r} type="button" onClick={() => onRangeChange(r)}
                  style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
                    background: currentRange === r ? '#9E7FFF' : '#2F2F2F', color: currentRange === r ? '#fff' : '#A3A3A3' }}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          {isLoading ? (
            <div style={{ height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3A3A3' }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9E7FFF" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#9E7FFF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="time" tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 8, color: '#fff' }} />
                <Area type="monotone" dataKey="price" stroke="#9E7FFF" strokeWidth={2} fill="url(#priceGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={card}>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: 20 }}>Volume (K USD)</div>
          {isLoading ? (
            <div style={{ height: 180, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3A3A3' }}>Loading…</div>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
                <XAxis dataKey="time" tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 8, color: '#fff' }} />
                <Bar dataKey="volume" fill="#38bdf8" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

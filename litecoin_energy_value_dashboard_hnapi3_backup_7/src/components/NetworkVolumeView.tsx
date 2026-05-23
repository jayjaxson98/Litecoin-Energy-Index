import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import type { TimeRange } from '../types/utx';

interface Props {
  externalRange: TimeRange;
  onRangeChange: (r: TimeRange) => void;
}

const RANGES: TimeRange[] = ['1H', '4H', '24H', '7D', '30D', '90D'];
const card: React.CSSProperties = { background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: '20px 24px' };

function genVolumeData(range: TimeRange) {
  const counts: Record<TimeRange, number> = { '1H': 60, '4H': 96, '24H': 144, '7D': 168, '30D': 180, '90D': 180 };
  const n = counts[range];
  let vol = 500_000;
  return Array.from({ length: n }, (_, i) => {
    vol = Math.max(100_000, vol + (Math.random() - 0.48) * 50_000);
    return {
      i,
      volume: parseFloat((vol / 1000).toFixed(1)),
      txCount: Math.floor(1000 + Math.random() * 3000),
    };
  });
}

export const NetworkVolumeView: React.FC<Props> = ({ externalRange, onRangeChange }) => {
  const [data, setData] = useState(() => genVolumeData(externalRange));

  useEffect(() => { setData(genVolumeData(externalRange)); }, [externalRange]);

  const totalVol = data.reduce((s, d) => s + d.volume, 0);
  const avgTx = Math.floor(data.reduce((s, d) => s + d.txCount, 0) / data.length);

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>📊 Network Volume</h1>
      <p style={{ color: '#A3A3A3', marginBottom: 24 }}>On-chain transaction volume and activity</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Volume', value: `${(totalVol / 1000).toFixed(1)}M USD`, color: '#9E7FFF' },
          { label: 'Avg Tx/Block', value: avgTx.toLocaleString(), color: '#38bdf8' },
          { label: 'Data Points', value: data.length.toString(), color: '#f472b6' },
        ].map((s) => (
          <div key={s.label} style={card}>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginBottom: 16 }}>
        {RANGES.map((r) => (
          <button key={r} type="button" onClick={() => onRangeChange(r)}
            style={{ padding: '4px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600,
              background: externalRange === r ? '#9E7FFF' : '#2F2F2F', color: externalRange === r ? '#fff' : '#A3A3A3' }}>
            {r}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
        <div style={card}>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: 20 }}>Volume (K USD)</div>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#9E7FFF" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#9E7FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="i" tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 8, color: '#fff' }} />
              <Area type="monotone" dataKey="volume" stroke="#9E7FFF" strokeWidth={2} fill="url(#volGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div style={card}>
          <div style={{ color: '#fff', fontWeight: 600, marginBottom: 20 }}>Transaction Count</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis dataKey="i" tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#A3A3A3', fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 8, color: '#fff' }} />
              <Bar dataKey="txCount" fill="#38bdf8" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

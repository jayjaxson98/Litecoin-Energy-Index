import React, { useState } from 'react';

interface Rank {
  position: number;
  address: string;
  evi: number;
  volume: number;
  badge: string;
}

function genRanks(): Rank[] {
  const badges = ['👑', '🥇', '🥈', '🥉', '⭐', '⭐', '⭐', '⭐', '⭐', '⭐'];
  return Array.from({ length: 10 }, (_, i) => ({
    position: i + 1,
    address: '0x' + Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join('') + '…',
    evi: parseFloat((95 - i * 7 + Math.random() * 5).toFixed(2)),
    volume: parseFloat((500_000 - i * 40_000 + Math.random() * 20_000).toFixed(0)),
    badge: badges[i],
  }));
}

const card: React.CSSProperties = { background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: '20px 24px' };

const RankSystem: React.FC = () => {
  const [ranks] = useState<Rank[]>(genRanks);
  const [tab, setTab] = useState<'evi' | 'volume'>('evi');

  const sorted = [...ranks].sort((a, b) => tab === 'evi' ? b.evi - a.evi : b.volume - a.volume);

  return (
    <div style={{ padding: 32, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 4 }}>🏆 Rank System</h1>
      <p style={{ color: '#A3A3A3', marginBottom: 24 }}>Top participants by Energy Value Index and volume</p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['evi', 'volume'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem',
              background: tab === t ? '#9E7FFF' : '#2F2F2F', color: tab === t ? '#fff' : '#A3A3A3' }}>
            {t === 'evi' ? '⚡ EVI Score' : '📊 Volume'}
          </button>
        ))}
      </div>

      <div style={card}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2F2F2F' }}>
              {['Rank', 'Address', 'EVI Score', 'Volume (USD)'].map((h) => (
                <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#A3A3A3', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={r.address} style={{ borderBottom: '1px solid #262626' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#262626')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '12px', color: '#fff', fontWeight: 700 }}>
                  <span style={{ marginRight: 8 }}>{r.badge}</span>{i + 1}
                </td>
                <td style={{ padding: '12px', color: '#A3A3A3', fontFamily: 'monospace', fontSize: '0.85rem' }}>{r.address}</td>
                <td style={{ padding: '12px', color: '#9E7FFF', fontWeight: 600 }}>{r.evi.toFixed(2)}</td>
                <td style={{ padding: '12px', color: '#38bdf8' }}>${Number(r.volume).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RankSystem;

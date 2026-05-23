import React from 'react';
import type { EnergyIndex } from '../types/utx';

interface Props {
  energyIndex: EnergyIndex;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  walletConnected: boolean;
}

const card: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid #2F2F2F',
  borderRadius: 12,
  padding: '20px 24px',
};

export const HomeView: React.FC<Props> = ({ energyIndex, isLoading, onNavigate, walletConnected }) => {
  const stats = [
    { label: 'Energy Index', value: isLoading ? '—' : energyIndex.value.toFixed(2), unit: 'EVI', color: '#9E7FFF' },
    { label: '24h Change', value: isLoading ? '—' : `${energyIndex.change24h >= 0 ? '+' : ''}${energyIndex.change24h.toFixed(2)}`, unit: '%', color: energyIndex.change24h >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Hash Rate', value: isLoading ? '—' : energyIndex.hashRate.toFixed(0), unit: 'TH/s', color: '#38bdf8' },
    { label: 'Energy Cost', value: isLoading ? '—' : `$${energyIndex.energyCost.toFixed(3)}`, unit: '/kWh', color: '#f472b6' },
  ];

  const quickLinks = [
    { id: 'energy-index', label: 'Energy Index', icon: '⚡', desc: 'Track real-time energy value metrics' },
    { id: 'defi-charts', label: 'DeFi Charts', icon: '📈', desc: 'Price history and market analysis' },
    { id: 'energy-swaps', label: 'Energy Swaps', icon: '🔄', desc: 'Swap tokens using energy pricing' },
    { id: 'regional-markets', label: 'Regional Markets', icon: '🌍', desc: 'Global energy market data' },
    { id: 'network-volume', label: 'Network Volume', icon: '📊', desc: 'On-chain volume analytics' },
    { id: 'rank-system', label: 'Rank System', icon: '🏆', desc: 'Leaderboard and user rankings' },
  ];

  return (
    <div style={{ padding: 32, maxWidth: 1100, margin: '0 auto' }}>
      {/* Hero */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <span style={{ fontSize: '2rem' }}>⚡</span>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff' }}>Litbreak Dashboard</h1>
        </div>
        <p style={{ color: '#A3A3A3', fontSize: '1rem' }}>
          Litecoin Energy Protocol — Real-time energy value indexing for the Litecoin network
        </p>
        {!walletConnected && (
          <div style={{ marginTop: 12, padding: '10px 16px', background: 'rgba(158,127,255,0.1)', border: '1px solid rgba(158,127,255,0.3)', borderRadius: 8, color: '#9E7FFF', fontSize: '0.85rem', display: 'inline-block' }}>
            💡 Connect your wallet to access swaps and personalized data
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        {stats.map((s) => (
          <div key={s.label} style={card}>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ color: '#A3A3A3', fontSize: '0.75rem', marginTop: 2 }}>{s.unit}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <h2 style={{ color: '#fff', fontSize: '1.1rem', fontWeight: 700, marginBottom: 16 }}>Quick Access</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {quickLinks.map((link) => (
          <button
            key={link.id}
            type="button"
            onClick={() => onNavigate(link.id)}
            style={{ ...card, cursor: 'pointer', textAlign: 'left', border: '1px solid #2F2F2F', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#9E7FFF')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#2F2F2F')}
          >
            <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{link.icon}</div>
            <div style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{link.label}</div>
            <div style={{ color: '#A3A3A3', fontSize: '0.8rem' }}>{link.desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

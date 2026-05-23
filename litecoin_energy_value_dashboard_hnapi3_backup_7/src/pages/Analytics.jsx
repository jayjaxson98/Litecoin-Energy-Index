import React, { useState, useEffect } from 'react';

// ============================================
// Analytics Page — Litecoin Energy Dashboard
// ============================================

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_METRICS = [
  { label: 'Total Volume (24h)',  value: '$4,821,300', change: '+12.4%', up: true  },
  { label: 'Active Swaps',        value: '1,204',      change: '+5.1%',  up: true  },
  { label: 'Avg Energy Rate',     value: '0.1142 $/kWh', change: '-0.8%', up: false },
  { label: 'Network Nodes',       value: '3,891',      change: '+2.3%',  up: true  },
];

const MOCK_CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  volume: Math.floor(Math.random() * 5_000_000 + 1_000_000),
  swaps:  Math.floor(Math.random() * 2_000 + 500),
  rate:   +(0.09 + Math.random() * 0.06).toFixed(4),
}));

const MOCK_TOP_REGIONS = [
  { region: 'US Average',     volume: '$1,204,500', share: '24.9%' },
  { region: 'EU Average',     volume: '$980,200',   share: '20.3%' },
  { region: 'Asia Average',   volume: '$870,100',   share: '18.0%' },
  { region: 'Germany',        volume: '$540,000',   share: '11.2%' },
  { region: 'Japan',          volume: '$420,300',   share: '8.7%'  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatVolume(v) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v / 1_000).toFixed(1)}K`;
  return `$${v}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function MetricCard({ label, value, change, up }) {
  return (
    <div style={styles.metricCard}>
      <div style={styles.metricLabel}>{label}</div>
      <div style={styles.metricValue}>{value}</div>
      <div style={{ ...styles.metricChange, color: up ? '#10b981' : '#ef4444' }}>
        {up ? '▲' : '▼'} {change}
      </div>
    </div>
  );
}

function VolumeBar({ day, volume, maxVolume }) {
  const pct = (volume / maxVolume) * 100;
  return (
    <div style={styles.barWrapper} title={`Day ${day}: ${formatVolume(volume)}`}>
      <div style={{ ...styles.bar, height: `${pct}%` }} />
    </div>
  );
}

function RegionRow({ region, volume, share, rank }) {
  return (
    <tr style={styles.tableRow}>
      <td style={styles.td}>{rank}</td>
      <td style={styles.td}>{region}</td>
      <td style={styles.td}>{volume}</td>
      <td style={styles.td}>
        <div style={styles.shareBarOuter}>
          <div style={{ ...styles.shareBarInner, width: share }} />
        </div>
        <span style={{ marginLeft: 6, fontSize: '0.75rem', color: '#A3A3A3' }}>{share}</span>
      </td>
    </tr>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function Analytics() {
  const [activeMetric, setActiveMetric] = useState('volume');
  const [chartData]                     = useState(MOCK_CHART_DATA);

  const maxVolume = Math.max(...chartData.map((d) => d.volume));

  // Simulate live refresh badge
  const [lastUpdated, setLastUpdated] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setLastUpdated(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={styles.page}>
      {/* ── Header ── */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Analytics</h1>
          <p style={styles.subtitle}>
            Litecoin Energy Protocol — 30-day performance overview
          </p>
        </div>
        <div style={styles.badge}>
          Live · Updated {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div style={styles.metricsGrid}>
        {MOCK_METRICS.map((m) => (
          <MetricCard key={m.label} {...m} />
        ))}
      </div>

      {/* ── Chart section ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>30-Day Volume Chart</span>
          <div style={styles.tabGroup}>
            {['volume', 'swaps', 'rate'].map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveMetric(key)}
                style={{
                  ...styles.tab,
                  background: activeMetric === key ? '#9E7FFF' : 'transparent',
                  color:      activeMetric === key ? '#fff'    : '#A3A3A3',
                }}
              >
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div style={styles.chartArea}>
          {chartData.map((d) => (
            <VolumeBar
              key={d.day}
              day={d.day}
              volume={activeMetric === 'volume' ? d.volume
                    : activeMetric === 'swaps'  ? d.swaps * 1000
                    : d.rate * 10_000_000}
              maxVolume={
                activeMetric === 'volume' ? maxVolume
                : activeMetric === 'swaps'  ? Math.max(...chartData.map((x) => x.swaps)) * 1000
                : Math.max(...chartData.map((x) => x.rate)) * 10_000_000
              }
            />
          ))}
        </div>

        <div style={styles.chartLegend}>
          {chartData.filter((_, i) => i % 5 === 0).map((d) => (
            <span key={d.day} style={styles.legendLabel}>Day {d.day}</span>
          ))}
        </div>
      </div>

      {/* ── Top regions table ── */}
      <div style={styles.card}>
        <div style={styles.cardHeader}>
          <span style={styles.cardTitle}>Top Regions by Volume</span>
        </div>
        <table style={styles.table}>
          <thead>
            <tr>
              {['#', 'Region', 'Volume', 'Share'].map((h) => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MOCK_TOP_REGIONS.map((r, i) => (
              <RegionRow key={r.region} rank={i + 1} {...r} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = {
  page: {
    padding: '24px',
    color: '#fff',
    fontFamily: 'sans-serif',
    maxWidth: 1100,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: 700,
    color: '#fff',
  },
  subtitle: {
    margin: '4px 0 0',
    fontSize: '0.85rem',
    color: '#A3A3A3',
  },
  badge: {
    background: 'rgba(16,185,129,0.12)',
    border: '1px solid rgba(16,185,129,0.3)',
    color: '#10b981',
    borderRadius: 20,
    padding: '4px 12px',
    fontSize: '0.75rem',
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: 16,
    marginBottom: 24,
  },
  metricCard: {
    background: '#262626',
    border: '1px solid #2F2F2F',
    borderRadius: 12,
    padding: '16px 20px',
  },
  metricLabel: {
    fontSize: '0.75rem',
    color: '#A3A3A3',
    marginBottom: 6,
  },
  metricValue: {
    fontSize: '1.4rem',
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4,
  },
  metricChange: {
    fontSize: '0.8rem',
    fontWeight: 600,
  },
  card: {
    background: '#262626',
    border: '1px solid #2F2F2F',
    borderRadius: 12,
    padding: '20px',
    marginBottom: 24,
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#fff',
  },
  tabGroup: {
    display: 'flex',
    gap: 4,
  },
  tab: {
    border: '1px solid #2F2F2F',
    borderRadius: 6,
    padding: '4px 12px',
    fontSize: '0.78rem',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  chartArea: {
    display: 'flex',
    alignItems: 'flex-end',
    gap: 3,
    height: 160,
    padding: '0 4px',
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    cursor: 'pointer',
  },
  bar: {
    width: '100%',
    background: 'linear-gradient(to top, #9E7FFF, #38bdf8)',
    borderRadius: '3px 3px 0 0',
    transition: 'height 0.3s ease',
    minHeight: 4,
  },
  chartLegend: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTop: '1px solid #2F2F2F',
  },
  legendLabel: {
    fontSize: '0.7rem',
    color: '#A3A3A3',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    textAlign: 'left',
    padding: '8px 12px',
    fontSize: '0.75rem',
    color: '#A3A3A3',
    borderBottom: '1px solid #2F2F2F',
    fontWeight: 600,
  },
  tableRow: {
    borderBottom: '1px solid #2F2F2F',
  },
  td: {
    padding: '10px 12px',
    fontSize: '0.85rem',
    color: '#fff',
    verticalAlign: 'middle',
  },
  shareBarOuter: {
    display: 'inline-block',
    width: 80,
    height: 6,
    background: '#2F2F2F',
    borderRadius: 3,
    verticalAlign: 'middle',
  },
  shareBarInner: {
    height: '100%',
    background: 'linear-gradient(to right, #9E7FFF, #38bdf8)',
    borderRadius: 3,
  },
};

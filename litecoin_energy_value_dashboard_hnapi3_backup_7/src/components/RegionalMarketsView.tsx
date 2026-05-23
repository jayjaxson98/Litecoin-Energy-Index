import React, { useState, useMemo } from 'react';
import type { EnergyIndex } from '../types/utx';
import { useRegionContext } from '../context/RegionContext';

interface Props { energyIndex: EnergyIndex; }

export interface Region {
  id: string;
  name: string;
  flag: string;
  rate: number;
  prevRate: number;
  share: number;
  color: string;
  lastUpdated: Date;
  currency: string;
}

type SortKey = 'name' | 'rate' | 'change';
type SortDir = 'asc' | 'desc';

export const BASE_REGIONS: Region[] = [
  { id: 'na', name: 'North America', flag: '🇺🇸', rate: 0.1243, prevRate: 0.1198, share: 34, color: '#9E7FFF', lastUpdated: new Date(), currency: 'USD' },
  { id: 'eu', name: 'Europe',        flag: '🇪🇺', rate: 0.1821, prevRate: 0.1756, share: 22, color: '#38bdf8', lastUpdated: new Date(), currency: 'EUR' },
  { id: 'ap', name: 'Asia Pacific',  flag: '🌏',  rate: 0.0934, prevRate: 0.0971, share: 28, color: '#f472b6', lastUpdated: new Date(), currency: 'USD' },
  { id: 'me', name: 'Middle East',   flag: '🌍',  rate: 0.0612, prevRate: 0.0598, share: 10, color: '#10b981', lastUpdated: new Date(), currency: 'USD' },
  { id: 'la', name: 'Latin America', flag: '🌎',  rate: 0.0789, prevRate: 0.0812, share: 6,  color: '#f59e0b', lastUpdated: new Date(), currency: 'USD' },
  { id: 'af', name: 'Africa',        flag: '🌍',  rate: 0.0521, prevRate: 0.0509, share: 4,  color: '#ef4444', lastUpdated: new Date(), currency: 'USD' },
  { id: 'sa', name: 'South Asia',    flag: '🇮🇳', rate: 0.0712, prevRate: 0.0698, share: 8,  color: '#a78bfa', lastUpdated: new Date(), currency: 'USD' },
  { id: 'oc', name: 'Oceania',       flag: '🇦🇺', rate: 0.1456, prevRate: 0.1489, share: 3,  color: '#34d399', lastUpdated: new Date(), currency: 'AUD' },
];

function pctChange(current: number, prev: number) {
  return ((current - prev) / prev) * 100;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

const card: React.CSSProperties = {
  background: '#1e1e1e',
  border: '1px solid #2F2F2F',
  borderRadius: 12,
  padding: '20px 22px',
  transition: 'border-color 0.2s, transform 0.15s',
  cursor: 'default',
};

export const RegionalMarketsView: React.FC<Props> = ({ energyIndex }) => {
  const { selectedRegion, setSelectedRegion } = useRegionContext();

  const [search, setSearch]   = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('share');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [regions, setRegions] = useState<Region[]>(BASE_REGIONS);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [refreshing, setRefreshing]   = useState(false);

  /* Live price drift every 8 s */
  React.useEffect(() => {
    const id = setInterval(() => {
      setRegions((prev) =>
        prev.map((r) => {
          const drift = 1 + (Math.random() - 0.5) * 0.012;
          const newRate = parseFloat((r.rate * drift).toFixed(4));
          /* Keep RegionContext in sync if this region is selected */
          if (selectedRegion?.id === r.id) {
            setSelectedRegion({ id: r.id, name: r.name, flag: r.flag, rate: newRate, color: r.color });
          }
          return { ...r, prevRate: r.rate, rate: newRate, lastUpdated: new Date() };
        })
      );
    }, 8000);
    return () => clearInterval(id);
  }, [selectedRegion, setSelectedRegion]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 900));
    setRegions((prev) =>
      prev.map((r) => {
        const drift = 1 + (Math.random() - 0.5) * 0.02;
        return { ...r, prevRate: r.rate, rate: parseFloat((r.rate * drift).toFixed(4)), lastUpdated: new Date() };
      })
    );
    setLastRefresh(new Date());
    setRefreshing(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleSelectRegion = (region: Region) => {
    setSelectedRegion({ id: region.id, name: region.name, flag: region.flag, rate: region.rate, color: region.color });
  };

  const filtered = useMemo(() => {
    let list = regions.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));
    list = [...list].sort((a, b) => {
      if (sortKey === 'name')   { const v = a.name.localeCompare(b.name); return sortDir === 'asc' ? v : -v; }
      let av = 0, bv = 0;
      if (sortKey === 'rate')   { av = a.rate; bv = b.rate; }
      if (sortKey === 'change') { av = pctChange(a.rate, a.prevRate); bv = pctChange(b.rate, b.prevRate); }
      if (sortKey === 'share')  { av = a.share; bv = b.share; }
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return list;
  }, [regions, search, sortKey, sortDir]);

  const avgRate  = regions.reduce((s, r) => s + r.rate, 0) / regions.length;
  const cheapest = [...regions].sort((a, b) => a.rate - b.rate)[0];
  const priciest = [...regions].sort((a, b) => b.rate - a.rate)[0];

  const SortBtn: React.FC<{ k: SortKey; label: string }> = ({ k, label }) => (
    <button
      type="button"
      onClick={() => handleSort(k)}
      aria-label={`Sort by ${label}`}
      style={{
        padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
        fontSize: '0.78rem', fontWeight: 600, transition: 'all 0.15s',
        background: sortKey === k ? '#9E7FFF' : '#2a2a2a',
        color: sortKey === k ? '#fff' : '#A3A3A3',
      }}
    >
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </button>
  );

  return (
    <div style={{ padding: '28px 32px', maxWidth: 1140, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: '1.55rem', fontWeight: 800, color: '#fff', margin: 0 }}>🌍 Regional Energy Markets</h1>
          <p style={{ color: '#A3A3A3', margin: '4px 0 0', fontSize: '0.85rem' }}>
            Live KWH electricity prices by geographic region · Last refresh: {formatTime(lastRefresh)}
          </p>
          {selectedRegion && (
            <div style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: `${selectedRegion.color}18`, border: `1px solid ${selectedRegion.color}44` }}>
              <span style={{ fontSize: '0.9rem' }}>{selectedRegion.flag}</span>
              <span style={{ color: selectedRegion.color, fontSize: '0.75rem', fontWeight: 600 }}>
                {selectedRegion.name} selected for Energy Index chart
              </span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          aria-label="Refresh prices"
          style={{
            padding: '8px 18px', borderRadius: 10, border: '1px solid #2F2F2F',
            cursor: refreshing ? 'not-allowed' : 'pointer',
            background: '#1e1e1e', color: refreshing ? '#555' : '#9E7FFF',
            fontWeight: 600, fontSize: '0.82rem',
            display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          }}
        >
          <span style={{ display: 'inline-block', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>⟳</span>
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Summary strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Global Avg Rate', value: `$${avgRate.toFixed(4)}/kWh`, color: '#9E7FFF' },
          { label: `Cheapest · ${cheapest.flag} ${cheapest.name}`, value: `$${cheapest.rate.toFixed(4)}/kWh`, color: '#10b981' },
          { label: `Priciest · ${priciest.flag} ${priciest.name}`, value: `$${priciest.rate.toFixed(4)}/kWh`, color: '#ef4444' },
        ].map((s) => (
          <div key={s.label} style={{ ...card, padding: '14px 18px' }}>
            <div style={{ color: '#A3A3A3', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{s.label}</div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Search region…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search regions"
          style={{
            flex: '1 1 180px', padding: '8px 14px', borderRadius: 10, border: '1px solid #2F2F2F',
            background: '#1e1e1e', color: '#fff', fontSize: '0.85rem', outline: 'none',
          }}
        />
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ color: '#A3A3A3', fontSize: '0.78rem', alignSelf: 'center' }}>Sort:</span>
          <SortBtn k="name"   label="Name"   />
          <SortBtn k="rate"   label="Price"  />
          <SortBtn k="change" label="Change" />
        </div>
      </div>

      {/* Hint */}
      <div style={{ color: '#555', fontSize: '0.72rem', marginBottom: 14 }}>
        💡 Click a region card to pin it to the Energy Index trend chart
      </div>

      {/* Region grid */}
      <div
        role="list"
        aria-label="Regional energy prices"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}
      >
        {filtered.map((region) => {
          const chg    = pctChange(region.rate, region.prevRate);
          const isUp   = chg >= 0;
          const chgColor = isUp ? '#ef4444' : '#10b981';
          const chgBg   = isUp ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)';
          const isActive = selectedRegion?.id === region.id;

          return (
            <article
              key={region.id}
              role="listitem"
              tabIndex={0}
              aria-label={`${region.name}: $${region.rate.toFixed(4)} per kWh, ${chg >= 0 ? '+' : ''}${chg.toFixed(2)}% change${isActive ? ', currently selected for chart' : ''}`}
              aria-pressed={isActive}
              onClick={() => handleSelectRegion(region)}
              onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleSelectRegion(region)}
              style={{
                ...card,
                borderColor: isActive ? region.color : '#2F2F2F',
                outline: 'none',
                cursor: 'pointer',
                boxShadow: isActive ? `0 0 0 1px ${region.color}44, 0 4px 20px ${region.color}18` : 'none',
              }}
              onFocus={(e)      => (e.currentTarget.style.borderColor = region.color)}
              onBlur={(e)       => (e.currentTarget.style.borderColor = isActive ? region.color : '#2F2F2F')}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = region.color; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = isActive ? region.color : '#2F2F2F'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              {/* Top row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.4rem' }} role="img" aria-hidden="true">{region.flag}</span>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {region.name}
                      {isActive && (
                        <span style={{ fontSize: '0.6rem', padding: '1px 6px', borderRadius: 10, background: `${region.color}22`, color: region.color, fontWeight: 700, letterSpacing: '0.04em' }}>
                          CHART
                        </span>
                      )}
                    </div>
                    <div style={{ color: '#A3A3A3', fontSize: '0.68rem' }}>{region.share}% global share</div>
                  </div>
                </div>
                <div
                  style={{ padding: '3px 9px', borderRadius: 20, background: chgBg, color: chgColor, fontSize: '0.75rem', fontWeight: 700 }}
                  aria-label={`Price ${isUp ? 'increased' : 'decreased'} by ${Math.abs(chg).toFixed(2)}%`}
                >
                  {isUp ? '▲' : '▼'} {Math.abs(chg).toFixed(2)}%
                </div>
              </div>

              {/* Price */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ color: '#A3A3A3', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Current Rate</div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, color: region.color, fontVariantNumeric: 'tabular-nums' }}>
                  ${region.rate.toFixed(4)}
                  <span style={{ fontSize: '0.75rem', color: '#A3A3A3', fontWeight: 400, marginLeft: 4 }}>/kWh</span>
                </div>
              </div>

              {/* Mini bar */}
              <div style={{ height: 3, borderRadius: 2, background: '#2F2F2F', marginBottom: 10, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${region.share * 2.5}%`, background: region.color, borderRadius: 2, transition: 'width 0.4s' }} />
              </div>

              {/* Footer */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ color: '#555', fontSize: '0.68rem' }}>
                  EVI: <span style={{ color: '#A3A3A3' }}>{(energyIndex.value * region.share / 100).toFixed(2)}</span>
                </div>
                <div style={{ color: '#555', fontSize: '0.65rem' }}>Updated {formatTime(region.lastUpdated)}</div>
              </div>
            </article>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: 'center', color: '#A3A3A3', padding: '48px 0', fontSize: '0.9rem' }}>
          No regions match "<strong style={{ color: '#fff' }}>{search}</strong>"
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        article:focus-visible { outline: 2px solid #9E7FFF; outline-offset: 2px; }
        input[type="search"]:focus { border-color: #9E7FFF !important; }
      `}</style>
    </div>
  );
};

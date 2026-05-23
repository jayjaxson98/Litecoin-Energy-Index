import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Legend, ReferenceLine, ComposedChart, Bar,
} from 'recharts';
import type { EnergyIndex, PricePoint, TimeRange } from '../types/utx';
import { useRegionContext } from '../context/RegionContext';
import { BASE_REGIONS } from './RegionalMarketsView';

interface Props {
  energyIndex: EnergyIndex;
  priceHistory: PricePoint[];
  isLoading: boolean;
  onRangeChange: (r: TimeRange) => void;
  currentRange: TimeRange;
}

type CalcMode = 'litoshi-to-kwh' | 'kwh-to-litoshi';
type LtcCalcMode = 'litoshi-to-ltc' | 'ltc-to-litoshi';
type ChartInterval = '1H' | '24H' | '7D';
type ChartView = 'trend' | 'comparative';

const RANGES: TimeRange[] = ['1H', '4H', '24H', '7D', '30D', '90D'];
const CHART_INTERVALS: ChartInterval[] = ['1H', '24H', '7D'];
const LITOSHI_PER_LTC = 1e8;

const LITOSHI_SCALE  = [1, 10, 100, 1_000, 10_000, 100_000, 1_000_000];
const LITOSHI_LABELS = ['1', '10', '100', '1K', '10K', '100K', '1M'];

function floorTo(value: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.floor(value * factor) / factor;
}
function formatKwh8(value: number): string {
  return floorTo(value, 8).toFixed(8);
}
function litoshiToKwh(litoshi: number, energyCost: number, ltcPrice: number): number {
  if (energyCost <= 0 || ltcPrice <= 0) return 0;
  return (litoshi * 1e-8 * ltcPrice) / energyCost;
}
function kwhToLitoshi(kwh: number, energyCost: number, ltcPrice: number): number {
  if (ltcPrice <= 0) return 0;
  return (kwh * energyCost / ltcPrice) * 1e8;
}
function litoshiToUsd(litoshi: number, ltcPrice: number): number {
  return litoshi * 1e-8 * ltcPrice;
}

interface TrendPoint { time: string; ts: number; regional: number; global: number; }

function generateDualTrendData(
  regionalEnergyCost: number, globalEnergyCost: number,
  ltcPrice: number, interval: ChartInterval,
): TrendPoint[] {
  const now = Date.now();
  const msMap:     Record<ChartInterval, number> = { '1H': 3_600_000, '24H': 86_400_000, '7D': 604_800_000 };
  const pointsMap: Record<ChartInterval, number> = { '1H': 60, '24H': 48, '7D': 56 };
  const ms = msMap[interval]; const points = pointsMap[interval]; const step = ms / points;
  return Array.from({ length: points }, (_, i): TrendPoint => {
    const t = now - ms + i * step;
    const progress = i / (points - 1);
    const divergence = (1 - progress) * 0.18;
    const rNoise = 1 + Math.sin(i * 0.35) * 0.06 + (Math.random() - 0.5) * 0.03;
    const gNoise = 1 + Math.sin(i * 0.28 + 1) * 0.05 + (Math.random() - 0.5) * 0.025;
    const rEc = regionalEnergyCost * rNoise * (1 + divergence);
    const gEc = globalEnergyCost * gNoise;
    const lp  = ltcPrice * (1 + (Math.random() - 0.5) * 0.015);
    const label =
      interval === '7D' ? new Date(t).toLocaleDateString([], { month: 'short', day: 'numeric' })
                        : new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return { time: label, ts: t, regional: floorTo(litoshiToKwh(1, rEc, lp), 8), global: floorTo(litoshiToKwh(1, gEc, lp), 8) };
  });
}

interface ComparativePoint { label: string; litoshi: number; kwh: number; usdValue: number; [key: string]: number | string; }

function generateComparativeData(ltcPrice: number, activeRegionIds: string[], manualRate: number | null): ComparativePoint[] {
  return LITOSHI_SCALE.map((litoshi, i) => {
    const usdValue = litoshiToUsd(litoshi, ltcPrice);
    const point: ComparativePoint = { label: LITOSHI_LABELS[i], litoshi, kwh: 0, usdValue };
    BASE_REGIONS.forEach((r) => {
      const rate = manualRate !== null ? manualRate : r.rate;
      const kwh  = litoshiToKwh(litoshi, rate, ltcPrice);
      point[`kwh_${r.id}`]  = floorTo(kwh, 8);
      point[`cost_${r.id}`] = floorTo(kwh * rate, 8);
    });
    if (manualRate !== null) {
      const mKwh = litoshiToKwh(litoshi, manualRate, ltcPrice);
      point['kwh_manual']  = floorTo(mKwh, 8);
      point['cost_manual'] = floorTo(mKwh * manualRate, 8);
    }
    return point;
  });
}

const card: React.CSSProperties = {
  background: '#1e1e1e', border: '1px solid #2F2F2F', borderRadius: 12, padding: '20px 22px',
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 13px', borderRadius: 10, border: '1px solid #2F2F2F',
  background: '#141414', color: '#fff', fontSize: '0.88rem', outline: 'none',
  fontVariantNumeric: 'tabular-nums', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

/* ── Trend tooltip ── */
interface TrendTooltipProps { active?: boolean; payload?: any[]; label?: string; regionName: string; regionColor: string; }
const TrendTooltip: React.FC<TrendTooltipProps> = ({ active, payload, label, regionName, regionColor }) => {
  if (!active || !payload?.length) return null;
  const regional = payload.find((p) => p.dataKey === 'regional');
  const global   = payload.find((p) => p.dataKey === 'global');
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2F2F2F', borderRadius: 10, padding: '12px 16px', fontSize: '0.8rem', minWidth: 230 }}>
      <div style={{ color: '#A3A3A3', marginBottom: 8, fontWeight: 600 }}>{label}</div>
      {regional && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 4 }}>
          <span style={{ color: regionColor }}>● {regionName}</span>
          <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatKwh8(regional.value)} kWh/Ł</span>
        </div>
      )}
      {global && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span style={{ color: '#38bdf8' }}>● Global Avg</span>
          <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.75rem' }}>{formatKwh8(global.value)} kWh/Ł</span>
        </div>
      )}
      {regional && global && (
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #2F2F2F', color: '#555', fontSize: '0.72rem' }}>
          Δ {formatKwh8(Math.abs(regional.value - global.value))} kWh/Ł spread
        </div>
      )}
    </div>
  );
};

/* ── Comparative tooltip ── */
interface CompTooltipProps { active?: boolean; payload?: any[]; label?: string; activeRegionIds: string[]; showCost: boolean; manualRate: number | null; }
const ComparativeTooltip: React.FC<CompTooltipProps> = ({ active, payload, label, activeRegionIds, showCost, manualRate }) => {
  if (!active || !payload?.length) return null;
  const dataPoint = payload[0]?.payload as ComparativePoint | undefined;
  if (!dataPoint) return null;
  return (
    <div style={{ background: '#1a1a1a', border: '1px solid #2F2F2F', borderRadius: 10, padding: '12px 16px', fontSize: '0.78rem', minWidth: 240, maxWidth: 300 }}>
      <div style={{ color: '#A3A3A3', marginBottom: 8, fontWeight: 700 }}>
        {label} Litoshi
        <span style={{ color: '#555', fontWeight: 400, marginLeft: 6 }}>= ${floorTo(dataPoint.usdValue, 8).toFixed(8)} USD</span>
      </div>
      {activeRegionIds.map((id) => {
        const region = BASE_REGIONS.find((r) => r.id === id);
        if (!region) return null;
        const kwh  = dataPoint[`kwh_${id}`]  as number;
        const cost = dataPoint[`cost_${id}`] as number;
        return (
          <div key={id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginBottom: 5, alignItems: 'flex-start' }}>
            <span style={{ color: region.color, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span>{region.flag}</span><span>{region.name.split(' ')[0]}</span>
            </span>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#fff', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.73rem' }}>{kwh.toFixed(8)} kWh</div>
              {showCost && <div style={{ color: '#A3A3A3', fontSize: '0.68rem' }}>${cost.toFixed(8)} USD</div>}
            </div>
          </div>
        );
      })}
      {manualRate !== null && (
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, marginTop: 6, paddingTop: 6, borderTop: '1px solid #2F2F2F', alignItems: 'flex-start' }}>
          <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚙ Custom</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ color: '#f59e0b', fontWeight: 700, fontFamily: 'monospace', fontSize: '0.73rem' }}>{(dataPoint['kwh_manual'] as number).toFixed(8)} kWh</div>
            {showCost && <div style={{ color: '#A3A3A3', fontSize: '0.68rem' }}>${(dataPoint['cost_manual'] as number).toFixed(8)} USD</div>}
          </div>
        </div>
      )}
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   LITOSHI ↔ LTC CALCULATOR
   ══════════════════════════════════════════════════════════════════════════════ */
interface LtcCalcProps { ltcPrice: number; }
const LitoshiLtcCalculator: React.FC<LtcCalcProps> = ({ ltcPrice }) => {
  const [ltcMode, setLtcMode]                 = useState<LtcCalcMode>('litoshi-to-ltc');
  const [ltcLitoshiInput, setLtcLitoshiInput] = useState('100000000');
  const [ltcLtcInput, setLtcLtcInput]         = useState('');
  const [ltcError, setLtcError]               = useState('');

  const handleLtcLitoshiChange = useCallback((raw: string) => {
    setLtcLitoshiInput(raw); setLtcError('');
    if (raw === '' || raw === '-') { setLtcLtcInput(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n))   { setLtcError('Please enter a valid number.'); setLtcLtcInput(''); return; }
    if (n < 0)      { setLtcError('Value must be zero or positive.'); setLtcLtcInput(''); return; }
    if (n > 8.4e15) { setLtcError('Value exceeds maximum Litoshi supply.'); setLtcLtcInput(''); return; }
    if (n === 0)    { setLtcLtcInput('0.00000000'); return; }
    setLtcLtcInput(floorTo(n / LITOSHI_PER_LTC, 8).toFixed(8));
  }, []);

  const handleLtcLtcChange = useCallback((raw: string) => {
    setLtcLtcInput(raw); setLtcError('');
    if (raw === '' || raw === '-') { setLtcLitoshiInput(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) { setLtcError('Please enter a valid number.'); setLtcLitoshiInput(''); return; }
    if (n < 0)    { setLtcError('Value must be zero or positive.'); setLtcLitoshiInput(''); return; }
    if (n === 0)  { setLtcLitoshiInput('0'); return; }
    setLtcLitoshiInput(Math.floor(n * LITOSHI_PER_LTC).toFixed(0));
  }, []);

  const swapLtcMode = () => { setLtcMode((m) => m === 'litoshi-to-ltc' ? 'ltc-to-litoshi' : 'litoshi-to-ltc'); setLtcError(''); };

  const usdEquiv = (() => {
    const litoshi = ltcMode === 'litoshi-to-ltc'
      ? parseFloat(ltcLitoshiInput)
      : Math.floor(parseFloat(ltcLtcInput) * LITOSHI_PER_LTC);
    if (isNaN(litoshi) || litoshi <= 0) return null;
    return floorTo(litoshiToUsd(litoshi, ltcPrice), 8).toFixed(8);
  })();

  const ltcEquiv = (() => {
    const litoshi = parseFloat(ltcLitoshiInput);
    if (isNaN(litoshi) || litoshi <= 0) return null;
    return floorTo(litoshi / LITOSHI_PER_LTC, 8).toFixed(8);
  })();

  useEffect(() => { handleLtcLitoshiChange('100000000'); }, []);

  return (
    <section aria-labelledby="ltc-calc-heading" style={{ ...card, display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 3, gap: 8 }}>
        <h2 id="ltc-calc-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0, lineHeight: 1.3 }}>
          Ł Litoshi ↔ LTC
        </h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, background: 'rgba(158,127,255,0.08)', border: '1px solid rgba(158,127,255,0.2)', flexShrink: 0 }}>
          <span style={{ color: '#9E7FFF', fontSize: '0.62rem', fontWeight: 600 }}>1 LTC = 10⁸ Ł</span>
        </div>
      </div>
      <p style={{ color: '#A3A3A3', fontSize: '0.7rem', margin: '0 0 12px', lineHeight: 1.4 }}>
        Fixed-rate · 1 Litoshi = 10<sup>−8</sup> LTC
        {ltcPrice > 0 && <span style={{ color: '#38bdf8', marginLeft: 5 }}>≈ ${ltcPrice.toFixed(2)}</span>}
      </p>

      <div role="group" aria-label="Litoshi/LTC conversion direction"
        style={{ display: 'flex', background: '#141414', borderRadius: 10, padding: 3, marginBottom: 14, border: '1px solid #2F2F2F' }}>
        {(['litoshi-to-ltc', 'ltc-to-litoshi'] as LtcCalcMode[]).map((m) => (
          <button key={m} type="button" role="radio" aria-checked={ltcMode === m}
            onClick={() => { setLtcMode(m); setLtcError(''); }}
            style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s', background: ltcMode === m ? '#38bdf8' : 'transparent', color: ltcMode === m ? '#0f172a' : '#A3A3A3' }}>
            {m === 'litoshi-to-ltc' ? 'Ł → LTC' : 'LTC → Ł'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div>
          <label htmlFor={ltcMode === 'litoshi-to-ltc' ? 'ltc-litoshi-input' : 'ltc-ltc-input'}
            style={{ display: 'block', color: '#A3A3A3', fontSize: '0.68rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {ltcMode === 'litoshi-to-ltc' ? 'Litoshi Amount' : 'LTC Amount'}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id={ltcMode === 'litoshi-to-ltc' ? 'ltc-litoshi-input' : 'ltc-ltc-input'}
              type="number" min="0" step="any"
              value={ltcMode === 'litoshi-to-ltc' ? ltcLitoshiInput : ltcLtcInput}
              onChange={(e) => ltcMode === 'litoshi-to-ltc' ? handleLtcLitoshiChange(e.target.value) : handleLtcLtcChange(e.target.value)}
              placeholder={ltcMode === 'litoshi-to-ltc' ? 'e.g. 100000000' : 'e.g. 1.0'}
              aria-describedby={ltcError ? 'ltc-calc-error' : undefined}
              aria-invalid={!!ltcError}
              style={{ ...inputStyle, paddingRight: 48, borderColor: ltcError ? '#ef4444' : '#2F2F2F' }}
              onFocus={(e) => (e.target.style.borderColor = ltcError ? '#ef4444' : '#38bdf8')}
              onBlur={(e)  => (e.target.style.borderColor = ltcError ? '#ef4444' : '#2F2F2F')}
            />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '0.68rem', pointerEvents: 'none', fontWeight: 600 }}>
              {ltcMode === 'litoshi-to-ltc' ? 'Ł' : 'LTC'}
            </span>
          </div>
          {ltcError && <div id="ltc-calc-error" role="alert" style={{ color: '#ef4444', fontSize: '0.68rem', marginTop: 3 }}>{ltcError}</div>}
        </div>

        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button type="button" onClick={swapLtcMode} aria-label="Swap Litoshi/LTC conversion direction"
            style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #2F2F2F', background: '#141414', color: '#38bdf8', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#38bdf8'; e.currentTarget.style.color = '#0f172a'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = '#141414'; e.currentTarget.style.color = '#38bdf8'; }}>
            ⇅
          </button>
        </div>

        <div>
          <label htmlFor="ltc-calc-output"
            style={{ display: 'block', color: '#A3A3A3', fontSize: '0.68rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {ltcMode === 'litoshi-to-ltc' ? 'LTC Equivalent' : 'Litoshi Equivalent'}
          </label>
          <div id="ltc-calc-output" role="status" aria-live="polite"
            style={{ ...inputStyle, background: '#0f0f0f', border: '1px solid #1a1a1a', color: '#38bdf8', fontWeight: 700, minHeight: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontFamily: 'monospace' }}>
            <span style={{ fontSize: '0.82rem' }}>
              {ltcMode === 'litoshi-to-ltc' ? (ltcLtcInput || '—') : (ltcLitoshiInput || '—')}
            </span>
            {(ltcMode === 'litoshi-to-ltc' ? ltcLtcInput : ltcLitoshiInput) && (
              <span style={{ color: '#555', fontWeight: 400, fontSize: '0.72rem' }}>
                {ltcMode === 'litoshi-to-ltc' ? 'LTC' : 'Ł'}
              </span>
            )}
          </div>
          {ltcMode === 'litoshi-to-ltc' && ltcLtcInput && (
            <div style={{ color: '#3F3F3F', fontSize: '0.6rem', marginTop: 2, paddingLeft: 2 }}>↳ floored 8 dp</div>
          )}
        </div>

        {usdEquiv && !ltcError && (
          <div style={{ padding: '8px 12px', background: '#141414', borderRadius: 10, border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#A3A3A3', fontSize: '0.68rem' }}>USD Equiv.</span>
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}>${usdEquiv}</span>
          </div>
        )}
      </div>

      {/* Quick reference grid */}
      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 5 }}>
        {[
          { litoshi: 1,           ltc: '0.00000001', label: '1 Ł' },
          { litoshi: 1_000,       ltc: '0.00001000', label: '1K Ł' },
          { litoshi: 1_000_000,   ltc: '0.01000000', label: '1M Ł' },
          { litoshi: 10_000_000,  ltc: '0.10000000', label: '10M Ł' },
          { litoshi: 50_000_000,  ltc: '0.50000000', label: '50M Ł' },
          { litoshi: 100_000_000, ltc: '1.00000000', label: '1 LTC' },
        ].map((row) => (
          <button key={row.litoshi} type="button"
            onClick={() => { setLtcMode('litoshi-to-ltc'); handleLtcLitoshiChange(String(row.litoshi)); }}
            title={`${row.litoshi.toLocaleString()} Litoshi = ${row.ltc} LTC`}
            style={{ padding: '6px 4px', background: '#141414', borderRadius: 7, border: '1px solid #1a1a1a', cursor: 'pointer', textAlign: 'center', transition: 'border-color 0.15s' }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1a1a1a')}>
            <div style={{ color: '#38bdf8', fontSize: '0.65rem', fontWeight: 700 }}>{row.label}</div>
            <div style={{ color: '#555', fontSize: '0.57rem', fontFamily: 'monospace', marginTop: 1 }}>{row.ltc}</div>
          </button>
        ))}
      </div>

      {/* Breakdown */}
      {ltcEquiv && !ltcError && (
        <div style={{ marginTop: 12, padding: '10px 12px', background: '#141414', borderRadius: 10, border: '1px solid #1a1a1a' }}>
          <div style={{ color: '#555', fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Breakdown</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { label: 'Litoshi', value: parseFloat(ltcLitoshiInput) > 0 ? parseFloat(ltcLitoshiInput).toLocaleString() : '—', color: '#A3A3A3' },
              { label: 'LTC',     value: ltcEquiv,                                                                               color: '#38bdf8' },
              { label: 'mLTC',    value: parseFloat(ltcLitoshiInput) > 0 ? floorTo(parseFloat(ltcLitoshiInput) / 1e5, 8).toFixed(8) : '—', color: '#9E7FFF' },
              { label: 'USD ≈',   value: usdEquiv ? `$${usdEquiv}` : '—',                                                       color: '#10b981' },
            ].map((r) => (
              <div key={r.label} style={{ padding: '5px 8px', background: '#0f0f0f', borderRadius: 7, border: '1px solid #1a1a1a' }}>
                <div style={{ color: '#555', fontSize: '0.57rem', textTransform: 'uppercase' }}>{r.label}</div>
                <div style={{ color: r.color, fontSize: '0.67rem', fontWeight: 700, marginTop: 2, fontFamily: 'monospace', wordBreak: 'break-all' }}>{r.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginTop: 10, color: '#3F3F3F', fontSize: '0.6rem', lineHeight: 1.5 }}>
        Fixed protocol constant · 1 LTC = 10<sup>8</sup> Litoshi
      </div>
    </section>
  );
};

/* ══════════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════════════════════ */
export const EnergyIndexView: React.FC<Props> = ({
  energyIndex, priceHistory, isLoading, onRangeChange, currentRange,
}) => {
  const { selectedRegion, setSelectedRegion } = useRegionContext();

  const [mode, setMode]                 = useState<CalcMode>('litoshi-to-kwh');
  const [litoshiInput, setLitoshiInput] = useState('1000000');
  const [kwhInput, setKwhInput]         = useState('');
  const [calcError, setCalcError]       = useState('');
  const [rateTs, setRateTs]             = useState(new Date());

  const [manualRateInput, setManualRateInput]   = useState('');
  const [manualRateError, setManualRateError]   = useState('');
  const [manualRateActive, setManualRateActive] = useState(false);

  const [chartView, setChartView]         = useState<ChartView>('trend');
  const [chartInterval, setChartInterval] = useState<ChartInterval>('24H');
  const [trendData, setTrendData]         = useState<TrendPoint[]>([]);
  const [chartLoading, setChartLoading]   = useState(false);
  const [chartError, setChartError]       = useState('');
  const prevRegionId = useRef<string | null>(null);

  const [activeRegionIds, setActiveRegionIds] = useState<string[]>(['na', 'eu', 'ap']);
  const [showCostOverlay, setShowCostOverlay] = useState(false);
  const [compMetric, setCompMetric]           = useState<'kwh' | 'cost'>('kwh');

  const ltcPrice      = energyIndex.value > 0 ? energyIndex.value * 0.9 + 10 : 82.45;
  const energyCost    = energyIndex.energyCost > 0 ? energyIndex.energyCost : 0.12;
  const globalAvgCost = BASE_REGIONS.reduce((s, r) => s + r.rate, 0) / BASE_REGIONS.length;

  const manualRate     = manualRateActive && manualRateInput !== '' ? parseFloat(manualRateInput) : null;
  const effectiveRate  = manualRate !== null ? manualRate : (selectedRegion ? selectedRegion.rate : energyCost);
  const ratePerLitoshi = litoshiToKwh(1, effectiveRate, ltcPrice);

  const comparativeData = useMemo(
    () => generateComparativeData(ltcPrice, activeRegionIds, manualRate),
    [ltcPrice, activeRegionIds, manualRate],
  );

  useEffect(() => {
    const regionChanged = selectedRegion?.id !== prevRegionId.current;
    prevRegionId.current = selectedRegion?.id ?? null;
    if (regionChanged && selectedRegion) {
      setChartLoading(true); setChartError('');
      const timer = setTimeout(() => {
        try {
          setTrendData(generateDualTrendData(selectedRegion.rate, globalAvgCost, ltcPrice, chartInterval));
          setChartLoading(false);
        } catch {
          setChartError('Failed to load regional data. Please try again.');
          setChartLoading(false);
        }
      }, 600);
      return () => clearTimeout(timer);
    } else {
      setTrendData(generateDualTrendData(effectiveRate, globalAvgCost, ltcPrice, chartInterval));
    }
  }, [chartInterval, effectiveRate, globalAvgCost, ltcPrice, selectedRegion?.id]);

  useEffect(() => {
    const id = setInterval(() => setRateTs(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const handleLitoshiChange = useCallback((raw: string) => {
    setLitoshiInput(raw); setCalcError('');
    if (raw === '' || raw === '-') { setKwhInput(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n))   { setCalcError('Please enter a valid number.'); setKwhInput(''); return; }
    if (n < 0)      { setCalcError('Value must be zero or positive.'); setKwhInput(''); return; }
    if (n > 8.4e15) { setCalcError('Value exceeds maximum Litoshi supply.'); setKwhInput(''); return; }
    if (n === 0)    { setKwhInput('0.00000000'); return; }
    setKwhInput(formatKwh8(litoshiToKwh(n, effectiveRate, ltcPrice)));
  }, [effectiveRate, ltcPrice]);

  const handleKwhChange = useCallback((raw: string) => {
    setKwhInput(raw); setCalcError('');
    if (raw === '' || raw === '-') { setLitoshiInput(''); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) { setCalcError('Please enter a valid number.'); setLitoshiInput(''); return; }
    if (n < 0)    { setCalcError('Value must be zero or positive.'); setLitoshiInput(''); return; }
    if (n === 0)  { setLitoshiInput('0'); return; }
    setLitoshiInput(kwhToLitoshi(n, effectiveRate, ltcPrice).toFixed(0));
  }, [effectiveRate, ltcPrice]);

  const handleManualRateChange = (raw: string) => {
    setManualRateInput(raw); setManualRateError('');
    if (raw === '') { setManualRateActive(false); return; }
    const n = parseFloat(raw);
    if (isNaN(n)) { setManualRateError('Enter a valid number (e.g. 0.12).'); return; }
    if (n <= 0)   { setManualRateError('Rate must be greater than zero.'); return; }
    if (n > 10)   { setManualRateError('Rate seems too high. Max $10.00/kWh.'); return; }
    setManualRateActive(true);
  };

  const clearManualRate = () => { setManualRateInput(''); setManualRateActive(false); setManualRateError(''); };
  const swapMode = () => { setMode((m) => m === 'litoshi-to-kwh' ? 'kwh-to-litoshi' : 'litoshi-to-kwh'); setCalcError(''); };

  const toggleRegion = (id: string) => {
    setActiveRegionIds((prev) =>
      prev.includes(id) ? prev.length > 1 ? prev.filter((r) => r !== id) : prev : [...prev, id],
    );
  };

  const calcUsdCost = (() => {
    const rawKwh = mode === 'litoshi-to-kwh'
      ? parseFloat(kwhInput)
      : litoshiToKwh(parseFloat(litoshiInput), effectiveRate, ltcPrice);
    if (isNaN(rawKwh) || rawKwh <= 0) return null;
    return (floorTo(rawKwh, 8) * effectiveRate).toFixed(8);
  })();

  const metrics = [
    { label: 'EVI Score',    value: energyIndex.value.toFixed(2),                   color: '#9E7FFF' },
    { label: 'Hash Rate',    value: `${energyIndex.hashRate.toFixed(0)} TH/s`,       color: '#38bdf8' },
    { label: 'Difficulty',   value: `${(energyIndex.difficulty / 1e6).toFixed(2)}M`, color: '#f472b6' },
    { label: 'Block Reward', value: `${energyIndex.blockReward} LTC`,                color: '#10b981' },
    { label: 'Network Fee',  value: `${energyIndex.networkFee.toFixed(4)} LTC`,      color: '#f59e0b' },
    { label: 'Energy Cost',  value: `$${effectiveRate.toFixed(4)}/kWh`,              color: '#ef4444' },
  ];

  const regionPills = BASE_REGIONS.map((r) => ({ id: r.id, name: r.name, flag: r.flag, rate: r.rate, color: r.color }));

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 4 }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', margin: 0 }}>⚡ Energy Index</h1>
          <p style={{ color: '#A3A3A3', margin: '4px 0 0', fontSize: '0.83rem' }}>
            Real-time Litecoin Energy Value Index · Litoshi ↔ KWH · Litoshi ↔ LTC
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {manualRateActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.4)' }}>
              <span>⚙</span>
              <div>
                <div style={{ color: '#f59e0b', fontSize: '0.73rem', fontWeight: 700 }}>Custom Rate</div>
                <div style={{ color: '#A3A3A3', fontSize: '0.63rem' }}>${parseFloat(manualRateInput).toFixed(4)}/kWh</div>
              </div>
            </div>
          )}
          {selectedRegion && !manualRateActive && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 10, background: `${selectedRegion.color}14`, border: `1px solid ${selectedRegion.color}44` }}>
              <span style={{ fontSize: '1.1rem' }}>{selectedRegion.flag}</span>
              <div>
                <div style={{ color: selectedRegion.color, fontSize: '0.76rem', fontWeight: 700 }}>{selectedRegion.name}</div>
                <div style={{ color: '#A3A3A3', fontSize: '0.66rem' }}>${selectedRegion.rate.toFixed(4)}/kWh</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Metric cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(148px, 1fr))', gap: 10, margin: '18px 0 24px' }}>
        {metrics.map((m) => (
          <div key={m.label} style={card}>
            <div style={{ color: '#A3A3A3', fontSize: '0.62rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>{m.label}</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: m.color }}>{isLoading ? '—' : m.value}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1: [KWH Calc] [LTC Calc] — side by side, equal width
          ══════════════════════════════════════════════════════════════════════ */}
      <div
        className="energy-calcs-row"
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}
      >
        {/* ── KWH Calculator ── */}
        <section aria-labelledby="calc-heading" style={{ ...card, display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h2 id="calc-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: '0 0 3px' }}>
            Litoshi ↔ KWH
          </h2>
          <p style={{ color: '#A3A3A3', fontSize: '0.7rem', margin: '0 0 2px' }}>
            1 Ł = <span style={{ fontFamily: 'monospace', color: '#9E7FFF' }}>{formatKwh8(ratePerLitoshi)}</span> kWh
            <span style={{ color: '#555', marginLeft: 5 }}>· {rateTs.toLocaleTimeString()}</span>
          </p>

          {manualRateActive ? (
            <p style={{ color: '#f59e0b', fontSize: '0.68rem', margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 4 }}>
              ⚙ ${parseFloat(manualRateInput).toFixed(4)}/kWh
              <button type="button" onClick={clearManualRate} style={{ marginLeft: 4, color: '#555', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.68rem', textDecoration: 'underline' }}>clear</button>
            </p>
          ) : selectedRegion ? (
            <p style={{ color: selectedRegion.color, fontSize: '0.68rem', margin: '0 0 12px' }}>
              {selectedRegion.flag} {selectedRegion.name} · ${selectedRegion.rate.toFixed(4)}/kWh
            </p>
          ) : (
            <p style={{ color: '#555', fontSize: '0.68rem', margin: '0 0 12px' }}>Global avg · Select a region to pin</p>
          )}

          <div role="group" aria-label="Conversion direction"
            style={{ display: 'flex', background: '#141414', borderRadius: 10, padding: 3, marginBottom: 14, border: '1px solid #2F2F2F' }}>
            {(['litoshi-to-kwh', 'kwh-to-litoshi'] as CalcMode[]).map((m) => (
              <button key={m} type="button" role="radio" aria-checked={mode === m}
                onClick={() => { setMode(m); setCalcError(''); }}
                style={{ flex: 1, padding: '6px 0', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s', background: mode === m ? '#9E7FFF' : 'transparent', color: mode === m ? '#fff' : '#A3A3A3' }}>
                {m === 'litoshi-to-kwh' ? 'Ł → KWH' : 'KWH → Ł'}
              </button>
            ))}
          </div>

          {/* Input / output */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <label htmlFor={mode === 'litoshi-to-kwh' ? 'litoshi-input' : 'kwh-input-primary'}
                style={{ display: 'block', color: '#A3A3A3', fontSize: '0.68rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {mode === 'litoshi-to-kwh' ? 'Litoshi Amount' : 'KWH Amount'}
              </label>
              <input
                id={mode === 'litoshi-to-kwh' ? 'litoshi-input' : 'kwh-input-primary'}
                type="number" min="0" step="any"
                value={mode === 'litoshi-to-kwh' ? litoshiInput : kwhInput}
                onChange={(e) => mode === 'litoshi-to-kwh' ? handleLitoshiChange(e.target.value) : handleKwhChange(e.target.value)}
                placeholder={mode === 'litoshi-to-kwh' ? 'e.g. 1000000' : 'e.g. 0.5'}
                aria-describedby={calcError ? 'calc-error' : undefined}
                aria-invalid={!!calcError}
                style={{ ...inputStyle, borderColor: calcError ? '#ef4444' : '#2F2F2F' }}
                onFocus={(e) => (e.target.style.borderColor = calcError ? '#ef4444' : '#9E7FFF')}
                onBlur={(e)  => (e.target.style.borderColor = calcError ? '#ef4444' : '#2F2F2F')}
              />
              {calcError && <div id="calc-error" role="alert" style={{ color: '#ef4444', fontSize: '0.68rem', marginTop: 3 }}>{calcError}</div>}
            </div>

            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={swapMode} aria-label="Swap conversion direction"
                style={{ width: 30, height: 30, borderRadius: '50%', border: '1px solid #2F2F2F', background: '#141414', color: '#9E7FFF', fontSize: '0.9rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#9E7FFF'; e.currentTarget.style.color = '#fff'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#141414'; e.currentTarget.style.color = '#9E7FFF'; }}>
                ⇅
              </button>
            </div>

            <div>
              <label htmlFor="calc-output"
                style={{ display: 'block', color: '#A3A3A3', fontSize: '0.68rem', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {mode === 'litoshi-to-kwh' ? 'KWH Equivalent' : 'Litoshi Equivalent'}
              </label>
              <div id="calc-output" role="status" aria-live="polite"
                style={{ ...inputStyle, background: '#0f0f0f', border: '1px solid #1a1a1a', color: '#9E7FFF', fontWeight: 700, minHeight: 40, display: 'flex', alignItems: 'center', gap: 6, fontFamily: mode === 'litoshi-to-kwh' ? 'monospace' : 'inherit', fontSize: '0.82rem' }}>
                {mode === 'litoshi-to-kwh' ? (kwhInput || '—') : (litoshiInput || '—')}
                {(mode === 'litoshi-to-kwh' ? kwhInput : litoshiInput) && (
                  <span style={{ color: '#555', fontWeight: 400, fontSize: '0.72rem' }}>
                    {mode === 'litoshi-to-kwh' ? 'kWh' : 'Ł'}
                  </span>
                )}
              </div>
              {mode === 'litoshi-to-kwh' && kwhInput && kwhInput !== '—' && (
                <div style={{ color: '#3F3F3F', fontSize: '0.6rem', marginTop: 2, paddingLeft: 2 }}>↳ floored 8 dp</div>
              )}
            </div>

            {calcUsdCost && !calcError && (
              <div style={{ padding: '8px 12px', background: '#141414', borderRadius: 10, border: '1px solid #1a1a1a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#A3A3A3', fontSize: '0.68rem' }}>Fiat Cost</span>
                <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'monospace' }}>${calcUsdCost}</span>
              </div>
            )}
          </div>

          {/* Manual Rate Override */}
          <div style={{ marginTop: 16, padding: '12px', background: '#141414', borderRadius: 10, border: `1px solid ${manualRateActive ? 'rgba(245,158,11,0.4)' : '#1a1a1a'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
              <div style={{ color: manualRateActive ? '#f59e0b' : '#A3A3A3', fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                ⚙ Manual Rate
              </div>
              {manualRateActive && (
                <button type="button" onClick={clearManualRate}
                  style={{ fontSize: '0.65rem', color: '#555', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Reset
                </button>
              )}
            </div>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '0.82rem', pointerEvents: 'none' }}>$</span>
              <input
                type="number" min="0.001" max="10" step="0.001"
                value={manualRateInput}
                onChange={(e) => handleManualRateChange(e.target.value)}
                placeholder="e.g. 0.1200"
                aria-label="Manual electricity rate per kWh in USD"
                style={{ ...inputStyle, paddingLeft: 24, fontSize: '0.82rem', borderColor: manualRateError ? '#ef4444' : manualRateActive ? 'rgba(245,158,11,0.5)' : '#2F2F2F' }}
                onFocus={(e) => (e.target.style.borderColor = manualRateError ? '#ef4444' : '#f59e0b')}
                onBlur={(e)  => (e.target.style.borderColor = manualRateError ? '#ef4444' : manualRateActive ? 'rgba(245,158,11,0.5)' : '#2F2F2F')}
              />
              <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: '#555', fontSize: '0.68rem', pointerEvents: 'none' }}>/kWh</span>
            </div>
            {manualRateError && <div role="alert" style={{ color: '#ef4444', fontSize: '0.65rem', marginTop: 3 }}>{manualRateError}</div>}
          </div>

          {/* Rate info grid */}
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
            {[
              { label: 'LTC Price',   value: `$${ltcPrice.toFixed(2)}` },
              { label: 'Active Rate', value: `$${effectiveRate.toFixed(4)}/kWh` },
              { label: '1 LTC =',     value: `${floorTo(ltcPrice / effectiveRate, 8).toFixed(8)} kWh` },
              { label: '1 kWh =',     value: `${(effectiveRate / ltcPrice * 1e8).toFixed(0)} Ł` },
            ].map((r) => (
              <div key={r.label} style={{ padding: '7px 9px', background: '#141414', borderRadius: 8, border: '1px solid #1a1a1a' }}>
                <div style={{ color: '#555', fontSize: '0.58rem', textTransform: 'uppercase' }}>{r.label}</div>
                <div style={{ color: '#A3A3A3', fontSize: '0.7rem', fontWeight: 600, marginTop: 2, fontFamily: 'monospace' }}>{r.value}</div>
              </div>
            ))}
          </div>

          {/* Region selector */}
          <div style={{ marginTop: 12 }}>
            <div style={{ color: '#555', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 7 }}>Select Region</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {BASE_REGIONS.map((r) => {
                const isSelected = selectedRegion?.id === r.id && !manualRateActive;
                return (
                  <button key={r.id} type="button"
                    onClick={() => { setSelectedRegion({ id: r.id, name: r.name, flag: r.flag, rate: r.rate, color: r.color }); setManualRateActive(false); setManualRateInput(''); }}
                    aria-pressed={isSelected}
                    title={`${r.name} · $${r.rate.toFixed(4)}/kWh`}
                    style={{ padding: '3px 9px', borderRadius: 20, border: `1px solid ${isSelected ? r.color : '#2F2F2F'}`, cursor: 'pointer', fontSize: '0.67rem', fontWeight: 600, transition: 'all 0.15s', background: isSelected ? `${r.color}22` : 'transparent', color: isSelected ? r.color : '#A3A3A3', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span>{r.flag}</span>
                    <span>{r.name.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── LTC Calculator ── */}
        <LitoshiLtcCalculator ltcPrice={ltcPrice} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2: Charts — full width
          ══════════════════════════════════════════════════════════════════════ */}
      <section aria-labelledby="chart-heading" style={{ ...card, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 id="chart-heading" style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff', margin: 0 }}>
              {chartView === 'trend' ? 'Litoshi → KWH Rate Trend' : 'Comparative Litoshi → KWH'}
            </h2>
            <p style={{ color: '#A3A3A3', fontSize: '0.7rem', margin: '3px 0 0' }}>
              {chartView === 'trend'
                ? (selectedRegion ? `${selectedRegion.flag} ${selectedRegion.name} vs. Global Average` : 'Global Average baseline')
                : 'Litoshi amounts mapped to kWh across regions · floored 8 dp'}
            </p>
          </div>
          <div style={{ display: 'flex', background: '#141414', borderRadius: 10, padding: 3, border: '1px solid #2F2F2F' }}>
            {(['trend', 'comparative'] as ChartView[]).map((v) => (
              <button key={v} type="button" onClick={() => setChartView(v)} aria-pressed={chartView === v}
                style={{ padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 600, transition: 'all 0.15s', background: chartView === v ? '#9E7FFF' : 'transparent', color: chartView === v ? '#fff' : '#A3A3A3' }}>
                {v === 'trend' ? '📈 Trend' : '📊 Compare'}
              </button>
            ))}
          </div>
        </div>

        {/* ── TREND VIEW ── */}
        {chartView === 'trend' && (
          <>
            <div style={{ display: 'flex', gap: 5, marginBottom: 7, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.68rem', flexShrink: 0 }}>Interval:</span>
              {CHART_INTERVALS.map((iv) => (
                <button key={iv} type="button" onClick={() => setChartInterval(iv)} aria-pressed={chartInterval === iv}
                  style={{ padding: '3px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s', background: chartInterval === iv ? '#9E7FFF' : '#2a2a2a', color: chartInterval === iv ? '#fff' : '#A3A3A3' }}>
                  {iv}
                </button>
              ))}
              <span style={{ color: '#555', fontSize: '0.68rem', marginLeft: 6, flexShrink: 0 }}>EVI:</span>
              {RANGES.map((r) => (
                <button key={r} type="button" onClick={() => onRangeChange(r)} aria-pressed={currentRange === r}
                  style={{ padding: '3px 8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: '0.66rem', fontWeight: 600, transition: 'all 0.15s', background: currentRange === r ? '#38bdf8' : '#2a2a2a', color: currentRange === r ? '#fff' : '#A3A3A3' }}>
                  {r}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ color: '#555', fontSize: '0.66rem', alignSelf: 'center', flexShrink: 0 }}>Region:</span>
              {regionPills.map((r) => (
                <button key={r.id} type="button" onClick={() => setSelectedRegion(r)} aria-pressed={selectedRegion?.id === r.id} title={r.name}
                  style={{ padding: '3px 7px', borderRadius: 20, border: `1px solid ${selectedRegion?.id === r.id ? r.color : '#2F2F2F'}`, cursor: 'pointer', fontSize: '0.66rem', fontWeight: 600, transition: 'all 0.15s', background: selectedRegion?.id === r.id ? `${r.color}22` : 'transparent', color: selectedRegion?.id === r.id ? r.color : '#A3A3A3', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <span>{r.flag}</span><span>{r.name.split(' ')[0]}</span>
                </button>
              ))}
            </div>

            {isLoading || chartLoading ? (
              <div style={{ height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid #2F2F2F', borderTopColor: '#9E7FFF', animation: 'spin 0.8s linear infinite' }} />
                <span style={{ color: '#A3A3A3', fontSize: '0.8rem' }}>{chartLoading ? `Loading ${selectedRegion?.name ?? 'regional'} data…` : 'Loading…'}</span>
              </div>
            ) : chartError ? (
              <div style={{ height: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                <div style={{ fontSize: '2rem' }}>⚠️</div>
                <div style={{ color: '#ef4444', fontSize: '0.82rem', textAlign: 'center', maxWidth: 260 }}>{chartError}</div>
                <button type="button" onClick={() => { setChartError(''); setTrendData(generateDualTrendData(effectiveRate, globalAvgCost, ltcPrice, chartInterval)); }}
                  style={{ padding: '5px 14px', borderRadius: 8, border: '1px solid #ef4444', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.78rem' }}>
                  Retry
                </button>
              </div>
            ) : (
              <div role="img" aria-label={`Dual-line chart: ${selectedRegion?.name ?? 'Global'} vs Global Average over ${chartInterval}`}>
                <ResponsiveContainer width="100%" height={360}>
                  <LineChart data={trendData} margin={{ top: 6, right: 22, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                    <XAxis dataKey="time" tick={{ fill: '#A3A3A3', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#2F2F2F' }} interval="preserveStartEnd" />
                    <YAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#2F2F2F' }}
                      tickFormatter={(v: number) => floorTo(v, 8).toFixed(8)} width={90}
                      label={{ value: 'kWh / Ł', angle: -90, position: 'insideLeft', offset: 12, fill: '#555', fontSize: 10 }} />
                    <Tooltip content={<TrendTooltip regionName={selectedRegion?.name ?? 'Global'} regionColor={selectedRegion?.color ?? '#9E7FFF'} />} />
                    <Legend wrapperStyle={{ fontSize: '0.72rem', paddingTop: 8 }}
                      formatter={(value) => value === 'regional' ? `${selectedRegion?.flag ?? '🌐'} ${selectedRegion?.name ?? 'Global'}` : '🌐 Global Avg'} />
                    <ReferenceLine y={floorTo(ratePerLitoshi, 8)} stroke="#555" strokeDasharray="3 3" label={{ value: 'Live', position: 'right', fill: '#555', fontSize: 9 }} />
                    <Line type="monotone" dataKey="global" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="5 3" dot={false} activeDot={{ r: 4, fill: '#38bdf8', stroke: '#fff', strokeWidth: 2 }} animationDuration={500} />
                    <Line type="monotone" dataKey="regional" stroke={selectedRegion?.color ?? '#9E7FFF'} strokeWidth={2.5} dot={false} activeDot={{ r: 6, fill: selectedRegion?.color ?? '#9E7FFF', stroke: '#fff', strokeWidth: 2 }} animationDuration={700} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 18, height: 2.5, background: selectedRegion?.color ?? '#9E7FFF', borderRadius: 2 }} />
                  <span style={{ color: '#A3A3A3', fontSize: '0.63rem' }}>{selectedRegion?.name ?? 'Global'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <div style={{ width: 18, height: 1.5, background: '#38bdf8', borderRadius: 2 }} />
                  <span style={{ color: '#A3A3A3', fontSize: '0.63rem' }}>Global Avg</span>
                </div>
              </div>
              <div style={{ color: '#3F3F3F', fontSize: '0.6rem' }}>{trendData.length} pts · floored 8 dp</div>
            </div>
          </>
        )}

        {/* ── COMPARATIVE VIEW ── */}
        {chartView === 'comparative' && (
          <>
            <div style={{ display: 'flex', gap: 7, marginBottom: 9, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.68rem', flexShrink: 0 }}>Y-Axis:</span>
              {(['kwh', 'cost'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setCompMetric(m)} aria-pressed={compMetric === m}
                  style={{ padding: '3px 9px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: '0.7rem', fontWeight: 600, transition: 'all 0.15s', background: compMetric === m ? '#9E7FFF' : '#2a2a2a', color: compMetric === m ? '#fff' : '#A3A3A3' }}>
                  {m === 'kwh' ? 'kWh' : 'USD Cost'}
                </button>
              ))}
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', marginLeft: 6 }}>
                <input type="checkbox" checked={showCostOverlay} onChange={(e) => setShowCostOverlay(e.target.checked)}
                  style={{ accentColor: '#9E7FFF', width: 13, height: 13 }} />
                <span style={{ color: '#A3A3A3', fontSize: '0.7rem' }}>Cost overlay</span>
              </label>
            </div>

            <div style={{ display: 'flex', gap: 4, marginBottom: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ color: '#555', fontSize: '0.66rem', flexShrink: 0 }}>Regions:</span>
              {BASE_REGIONS.map((r) => {
                const isOn = activeRegionIds.includes(r.id);
                return (
                  <button key={r.id} type="button" onClick={() => toggleRegion(r.id)} aria-pressed={isOn} title={`${r.name} · $${r.rate.toFixed(4)}/kWh`}
                    style={{ padding: '3px 7px', borderRadius: 20, border: `1px solid ${isOn ? r.color : '#2F2F2F'}`, cursor: 'pointer', fontSize: '0.66rem', fontWeight: 600, transition: 'all 0.15s', background: isOn ? `${r.color}22` : 'transparent', color: isOn ? r.color : '#555', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <span>{r.flag}</span><span>{r.name.split(' ')[0]}</span>
                  </button>
                );
              })}
              {manualRateActive && (
                <div style={{ padding: '3px 7px', borderRadius: 20, border: '1px solid rgba(245,158,11,0.5)', fontSize: '0.66rem', fontWeight: 600, background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}>
                  ⚙ Custom
                </div>
              )}
            </div>

            <div role="img" aria-label={`Comparative bar chart: Litoshi amounts vs ${compMetric === 'kwh' ? 'kWh' : 'USD cost'} across ${activeRegionIds.length} regions`}>
              <ResponsiveContainer width="100%" height={360}>
                <ComposedChart data={comparativeData} margin={{ top: 6, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: '#A3A3A3', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#2F2F2F' }}
                    label={{ value: 'Litoshi', position: 'insideBottomRight', offset: -4, fill: '#555', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#A3A3A3', fontSize: 10 }} tickLine={false} axisLine={{ stroke: '#2F2F2F' }} width={90}
                    tickFormatter={(v: number) => floorTo(v, 8).toFixed(8)}
                    label={{ value: compMetric === 'kwh' ? 'kWh' : 'USD ($)', angle: -90, position: 'insideLeft', offset: 12, fill: '#555', fontSize: 10 }} />
                  <Tooltip content={<ComparativeTooltip activeRegionIds={activeRegionIds} showCost={showCostOverlay} manualRate={manualRate} />} />
                  <Legend wrapperStyle={{ fontSize: '0.7rem', paddingTop: 8 }}
                    formatter={(value: string) => {
                      if (value.startsWith('kwh_manual') || value.startsWith('cost_manual')) return '⚙ Custom Rate';
                      const id = value.replace('kwh_', '').replace('cost_', '');
                      const r = BASE_REGIONS.find((r) => r.id === id);
                      return r ? `${r.flag} ${r.name}` : value;
                    }}
                  />
                  {activeRegionIds.map((id) => {
                    const region = BASE_REGIONS.find((r) => r.id === id);
                    if (!region) return null;
                    const dataKey = compMetric === 'kwh' ? `kwh_${id}` : `cost_${id}`;
                    return <Bar key={id} dataKey={dataKey} fill={region.color} opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />;
                  })}
                  {manualRateActive && (
                    <Bar dataKey={compMetric === 'kwh' ? 'kwh_manual' : 'cost_manual'} fill="#f59e0b" opacity={0.85} radius={[3, 3, 0, 0]} maxBarSize={28} />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ marginTop: 8, padding: '7px 10px', background: '#141414', borderRadius: 8, border: '1px solid #1a1a1a' }}>
              <div style={{ color: '#555', fontSize: '0.63rem', lineHeight: 1.5 }}>
                <strong style={{ color: '#3F3F3F' }}>Sources:</strong> EIA (US), Eurostat (EU), IEA (Global). Indicative averages · kWh floored 8 dp.
                {manualRateActive && <span style={{ color: '#f59e0b', marginLeft: 4 }}>· Custom: ${parseFloat(manualRateInput).toFixed(4)}/kWh</span>}
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <div style={{ color: '#555', fontSize: '0.63rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>Active Region Rates</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 5 }}>
                {activeRegionIds.map((id) => {
                  const r = BASE_REGIONS.find((reg) => reg.id === id);
                  if (!r) return null;
                  return (
                    <div key={id} style={{ padding: '5px 9px', background: '#141414', borderRadius: 8, border: `1px solid ${r.color}22`, display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: '0.85rem' }}>{r.flag}</span>
                      <div>
                        <div style={{ color: r.color, fontSize: '0.65rem', fontWeight: 600 }}>{r.name.split(' ')[0]}</div>
                        <div style={{ color: '#A3A3A3', fontSize: '0.62rem' }}>${r.rate.toFixed(4)}/kWh</div>
                      </div>
                    </div>
                  );
                })}
                {manualRateActive && (
                  <div style={{ padding: '5px 9px', background: '#141414', borderRadius: 8, border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⚙</span>
                    <div>
                      <div style={{ color: '#f59e0b', fontSize: '0.65rem', fontWeight: 600 }}>Custom</div>
                      <div style={{ color: '#A3A3A3', fontSize: '0.62rem' }}>${parseFloat(manualRateInput).toFixed(4)}/kWh</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin  { to { transform: rotate(360deg); } }
        input[type="number"]::-webkit-inner-spin-button,
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        input[type="number"] { -moz-appearance: textfield; }
        button:focus-visible { outline: 2px solid #9E7FFF; outline-offset: 2px; }
        @media (max-width: 768px) {
          .energy-calcs-row {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

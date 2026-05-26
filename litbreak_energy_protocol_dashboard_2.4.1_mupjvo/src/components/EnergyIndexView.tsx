import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  Activity,
  RefreshCw,
  Globe,
  BarChart3,
  Zap,
  ArrowUpDown,
  Search,
} from 'lucide-react';
import { useEnergyIndex } from '../hooks/useEnergyIndex';
import { LitecoinPriceChart } from './LitecoinPriceChart';
import { LitoshiKwhConverter } from './LitoshiKwhConverter';
import { KwhLtcCalculator } from './KwhLtcCalculator';
import { countries } from '../data/countries';
import { useMemo } from 'react';

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; color: string; name: string }>; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="tooltip-content">
      <div className="text-xs text-textSecondary mb-1">{label}</div>
      {payload.map((entry, idx) => (
        <div key={idx} className="flex items-center gap-2 text-sm">
          <div className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-textSecondary">{entry.name}:</span>
          <span className="font-mono font-semibold text-white">
            {entry.name === 'Index' ? `$${entry.value?.toFixed(4)}` : `${entry.value?.toFixed(4)}x`}
          </span>
        </div>
      ))}
    </div>
  );
}

type SortField = 'name' | 'rate' | 'consumption' | 'region';
type SortDir = 'asc' | 'desc';

const regionBadgeColors: Record<string, string> = {
  'Asia-Pacific': 'bg-primary/20 text-primary',
  'Americas': 'bg-secondary/20 text-secondary',
  'Europe': 'bg-success/20 text-success',
  'Middle East': 'bg-warning/20 text-warning',
  'Africa': 'bg-accent/20 text-accent',
};

const regionDotColors: Record<string, string> = {
  'Asia-Pacific': '#9E7FFF',
  'Americas': '#38bdf8',
  'Europe': '#10b981',
  'Middle East': '#f59e0b',
  'Africa': '#f472b6',
};

export function EnergyIndexView() {
  const {
    globalIndex,
    energyFactor,
    effectiveRatio,
    historicalIndex,
    countryData,
    trendDirection,
    trendPercent,
    loading,
    refresh,
  } = useEnergyIndex();

  const [chartTab, setChartTab] = useState<'index' | 'factor'>('index');
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<SortField>('rate');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [filterRegion, setFilterRegion] = useState<string>('all');

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const regions = useMemo(() => [...new Set(countries.map(c => c.region))], []);

  const filteredData = useMemo(() => {
    let data = [...countryData];
    if (search) {
      const q = search.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q));
    }
    if (filterRegion !== 'all') {
      data = data.filter(c => c.region === filterRegion);
    }
    data.sort((a, b) => {
      const mult = sortDir === 'asc' ? 1 : -1;
      if (sortField === 'name') return mult * a.name.localeCompare(b.name);
      if (sortField === 'rate') return mult * (a.rate - b.rate);
      if (sortField === 'consumption') return mult * (a.consumption - b.consumption);
      if (sortField === 'region') return mult * a.region.localeCompare(b.region);
      return 0;
    });
    return data;
  }, [countryData, search, filterRegion, sortField, sortDir]);

  const globalAvg = useMemo(
    () => countryData.reduce((s, c) => s + c.rate, 0) / countryData.length,
    [countryData]
  );
  const minRate = useMemo(() => Math.min(...countryData.map(c => c.rate)), [countryData]);
  const maxRate = useMemo(() => Math.max(...countryData.map(c => c.rate)), [countryData]);

  const avgByRegion = useMemo(() => {
    const regs = [...new Set(countryData.map(c => c.region))];
    return regs.map(region => {
      const cs = countryData.filter(c => c.region === region);
      const avg = cs.reduce((s, c) => s + c.rate, 0) / cs.length;
      return { region, avgRate: avg, count: cs.length };
    });
  }, [countryData]);

  return (
    <div className="space-y-6">
      {/* ── Global Energy Index Monitor ─────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 circuit-pattern opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Activity className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Energy Index Monitor</h2>
                <div className="flex items-center gap-2 text-xs text-textSecondary">
                  <span className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-warning animate-pulse' : 'bg-success'}`} />
                    {loading ? 'Updating...' : 'Live'}
                  </span>
                  <span>•</span>
                  <span>Auto-refresh 10s (TanStack Query)</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex rounded-lg bg-navy-800/80 border border-white/5 p-0.5">
                <button
                  onClick={() => setChartTab('index')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartTab === 'index' ? 'bg-primary/20 text-primary' : 'text-textSecondary hover:text-white'
                  }`}
                >
                  Index ($/kWh)
                </button>
                <button
                  onClick={() => setChartTab('factor')}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                    chartTab === 'factor' ? 'bg-secondary/20 text-secondary' : 'text-textSecondary hover:text-white'
                  }`}
                >
                  Efficiency Factor
                </button>
              </div>
              <motion.button
                onClick={refresh}
                disabled={loading}
                className="p-2 rounded-lg bg-navy-800/80 border border-white/5 text-textSecondary hover:text-white hover:border-primary/30 transition-all disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </motion.button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="glass-card-inner p-3">
              <div className="text-xs text-textSecondary mb-1">Global Energy Index</div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-bold font-mono text-white">${globalIndex.toFixed(4)}</span>
                <span className="text-xs text-textSecondary">/kWh</span>
                <span className={`text-xs font-semibold ${
                  trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-error' : 'text-textSecondary'
                }`}>
                  {trendDirection === 'up' ? '↑' : trendDirection === 'down' ? '↓' : '→'}
                  {trendPercent.toFixed(2)}%
                </span>
              </div>
            </div>
            <div className="glass-card-inner p-3">
              <div className="text-xs text-textSecondary mb-1">Efficiency Factor</div>
              <div className="text-xl font-bold font-mono text-secondary">{energyFactor.toFixed(4)}x</div>
            </div>
            <div className="glass-card-inner p-3">
              <div className="text-xs text-textSecondary mb-1">Minting Ratio</div>
              <div className="text-xl font-bold font-mono text-success">{effectiveRatio.toFixed(2)}</div>
              <span className="text-xs text-textSecondary">POWER/LTC</span>
            </div>
          </div>

          {/* Chart */}
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              {chartTab === 'index' ? (
                <AreaChart data={historicalIndex}>
                  <defs>
                    <linearGradient id="eiIndexGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#9E7FFF" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#9E7FFF" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(158,127,255,0.06)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: '#a3a3a3' }} interval="preserveStartEnd" />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: '#a3a3a3' }} domain={['dataMin - 0.005', 'dataMax + 0.005']} tickFormatter={(v: number) => `$${v.toFixed(3)}`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="index" name="Index" stroke="#9E7FFF" fill="url(#eiIndexGrad)" strokeWidth={2} />
                </AreaChart>
              ) : (
                <LineChart data={historicalIndex}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(56,189,248,0.06)" />
                  <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: '#a3a3a3' }} interval="preserveStartEnd" />
                  <YAxis stroke="rgba(255,255,255,0.2)" tick={{ fontSize: 10, fill: '#a3a3a3' }} domain={['dataMin - 0.01', 'dataMax + 0.01']} tickFormatter={(v: number) => `${v.toFixed(2)}x`} />
                  <Tooltip content={<ChartTooltip />} />
                  <Line type="monotone" dataKey="factor" name="Factor" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* ── Litecoin Price Chart ─────────────────────────────────────── */}
      <LitecoinPriceChart />

      {/* ── Calculators Row ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LitoshiKwhConverter />
        <KwhLtcCalculator />
      </div>

      {/* ── Region Breakdown ─────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="sm:col-span-2 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-4 h-4 text-secondary" />
            <h3 className="text-sm font-semibold text-white">Regional Averages</h3>
          </div>
          <div className="space-y-3">
            {avgByRegion.map(({ region, avgRate, count }) => (
              <div key={region} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: regionDotColors[region] }} />
                  <span className="text-sm text-textSecondary">{region}</span>
                  <span className="text-xs text-textSecondary/50">({count})</span>
                </div>
                <span className="font-mono text-sm text-white">${avgRate.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sm:col-span-3 glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-accent" />
            <h3 className="text-sm font-semibold text-white">Rate Distribution</h3>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-textSecondary mb-2">Highest Rates</div>
              {[...countryData].sort((a, b) => b.rate - a.rate).slice(0, 5).map(c => (
                <div key={c.code} className="flex items-center justify-between py-1">
                  <span className="text-sm text-textSecondary">{c.flag} {c.code}</span>
                  <span className="font-mono text-sm text-error">${c.rate.toFixed(3)}</span>
                </div>
              ))}
            </div>
            <div>
              <div className="text-xs text-textSecondary mb-2">Lowest Rates</div>
              {[...countryData].sort((a, b) => a.rate - b.rate).slice(0, 5).map(c => (
                <div key={c.code} className="flex items-center justify-between py-1">
                  <span className="text-sm text-textSecondary">{c.flag} {c.code}</span>
                  <span className="font-mono text-sm text-success">${c.rate.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Country Rates Table ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Globe className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Global Electricity Rates</h2>
              <p className="text-xs text-textSecondary">
                Residential rates across {countryData.length} countries driving the Energy Index
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-navy-800/80 border border-white/10 text-white text-sm placeholder:text-textSecondary/50 focus:border-primary/40 focus:outline-none transition-colors"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setFilterRegion('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  filterRegion === 'all' ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-navy-800/80 text-textSecondary border border-white/5 hover:text-white'
                }`}
              >
                All Regions
              </button>
              {regions.map(r => (
                <button
                  key={r}
                  onClick={() => setFilterRegion(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                    filterRegion === r ? 'bg-primary/20 text-primary border border-primary/30' : 'bg-navy-800/80 text-textSecondary border border-white/5 hover:text-white'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 gap-2 px-5 py-3 bg-navy-800/40 text-xs text-textSecondary uppercase tracking-wider font-semibold border-b border-white/5">
          <div className="col-span-1">#</div>
          <button onClick={() => toggleSort('name')} className="col-span-3 flex items-center gap-1 text-left hover:text-white transition-colors">
            Country <ArrowUpDown className="w-3 h-3" />
          </button>
          <button onClick={() => toggleSort('region')} className="col-span-2 flex items-center gap-1 text-left hover:text-white transition-colors">
            Region <ArrowUpDown className="w-3 h-3" />
          </button>
          <button onClick={() => toggleSort('rate')} className="col-span-2 flex items-center gap-1 text-right justify-end hover:text-white transition-colors">
            Rate ($/kWh) <ArrowUpDown className="w-3 h-3" />
          </button>
          <div className="col-span-2 text-right">Bar</div>
          <button onClick={() => toggleSort('consumption')} className="col-span-2 flex items-center gap-1 text-right justify-end hover:text-white transition-colors">
            TWh <ArrowUpDown className="w-3 h-3" />
          </button>
        </div>

        {/* Rows */}
        <div className="max-h-[480px] overflow-y-auto rates-scroll">
          {filteredData.map((country, idx) => {
            const barPercent = maxRate > 0 ? ((country.rate - minRate) / (maxRate - minRate)) * 100 : 0;
            const rateDiff = ((country.rate - globalAvg) / globalAvg) * 100;

            return (
              <motion.div
                key={country.code}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.02 }}
                className="grid grid-cols-12 gap-2 px-5 py-3 items-center hover:bg-white/[0.02] border-b border-white/[0.03] group transition-colors"
              >
                <div className="col-span-1 text-xs text-textSecondary font-mono">{idx + 1}</div>
                <div className="col-span-3 flex items-center gap-2">
                  <span className="text-base">{country.flag}</span>
                  <div>
                    <div className="text-sm font-semibold text-white group-hover:text-primary transition-colors">{country.name}</div>
                    <div className="text-xs text-textSecondary font-mono">{country.code}</div>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${regionBadgeColors[country.region] || 'bg-white/10 text-white'}`}>
                    {country.region}
                  </span>
                </div>
                <div className="col-span-2 text-right">
                  <div className="text-sm font-mono font-semibold text-white">${country.rate.toFixed(4)}</div>
                  <div className={`text-xs font-mono ${rateDiff > 0 ? 'text-error' : rateDiff < 0 ? 'text-success' : 'text-textSecondary'}`}>
                    {rateDiff > 0 ? '+' : ''}{rateDiff.toFixed(1)}%
                  </div>
                </div>
                <div className="col-span-2">
                  <div className="w-full h-5 bg-navy-800/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${Math.max(barPercent, 5)}%`,
                        background: `linear-gradient(90deg, ${
                          rateDiff > 20 ? '#ef4444' : rateDiff > 0 ? '#f59e0b' : rateDiff > -20 ? '#38bdf8' : '#10b981'
                        }, ${
                          rateDiff > 20 ? '#f472b6' : rateDiff > 0 ? '#9E7FFF' : rateDiff > -20 ? '#9E7FFF' : '#38bdf8'
                        })`,
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-2 text-right font-mono text-xs text-textSecondary">
                  {country.consumption.toLocaleString()}
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="p-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs text-textSecondary">
            Showing {filteredData.length} of {countryData.length} countries
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-success" />
              <span className="text-textSecondary">Below avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-warning" />
              <span className="text-textSecondary">Near avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-error" />
              <span className="text-textSecondary">Above avg</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

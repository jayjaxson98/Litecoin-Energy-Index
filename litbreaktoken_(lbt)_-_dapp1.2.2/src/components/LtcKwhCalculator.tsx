import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Loader2,
  Info,
  Settings,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Globe,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { useLtcPrice } from '../hooks/useLtcPrice';

const TIME_RANGES = ['24h', '7d', '30d', '90d'] as const;

const ELECTRICITY_PRESETS = [
  { label: 'US Average', rate: 0.12, flag: '🇺🇸' },
  { label: 'Germany', rate: 0.35, flag: '🇩🇪' },
  { label: 'UK', rate: 0.28, flag: '🇬🇧' },
  { label: 'China', rate: 0.08, flag: '🇨🇳' },
  { label: 'India', rate: 0.06, flag: '🇮🇳' },
  { label: 'Japan', rate: 0.25, flag: '🇯🇵' },
  { label: 'Saudi Arabia', rate: 0.05, flag: '🇸🇦' },
  { label: 'Brazil', rate: 0.13, flag: '🇧🇷' },
  { label: 'Australia', rate: 0.24, flag: '🇦🇺' },
];

function formatDate(ts: number, range: string): string {
  const d = new Date(ts);
  if (range === '24h') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (range === '7d') return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatKwh(kwh: number): string {
  if (kwh >= 1_000_000) return (kwh / 1_000_000).toFixed(1) + 'M';
  if (kwh >= 1_000) return (kwh / 1_000).toFixed(1) + 'K';
  return kwh.toFixed(1);
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  electricityRate: number;
  timeRange: string;
}

function CustomTooltip({ active, payload, electricityRate, timeRange }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const price = payload[0]?.value;
  const kwh = price && electricityRate > 0 ? price / electricityRate : 0;
  const ts = payload[0]?.payload?.timestamp;

  return (
    <div className="glass rounded-lg p-2.5 border border-primary/20 shadow-xl shadow-primary/5 min-w-[160px]">
      <p className="text-[9px] text-neutral-500 mb-1 font-mono">
        {ts ? formatDate(ts, timeRange) : ''}
      </p>
      <div className="space-y-1">
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] text-secondary flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
            LTC
          </span>
          <span className="text-[11px] font-mono font-bold text-secondary">
            ${typeof price === 'number' ? price.toFixed(2) : '—'}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[9px] text-amber-400 flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            kWh
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-400">
            {formatKwh(kwh)}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LtcKwhCalculator() {
  const {
    currentPrice,
    priceChange24h,
    historicalData,
    timeRange,
    isLoading,
    isHistoryLoading,
    error,
    historyError,
    setTimeRange,
    retry,
    lastFetch,
  } = useLtcPrice();

  const [ltcAmount, setLtcAmount] = useState('1');
  const [electricityRate, setElectricityRate] = useState(0.12);
  const [showSettings, setShowSettings] = useState(false);
  const [customRate, setCustomRate] = useState('0.12');

  const numLtc = parseFloat(ltcAmount) || 0;
  const usdValue = currentPrice ? numLtc * currentPrice : 0;
  const kwhValue = electricityRate > 0 ? usdValue / electricityRate : 0;
  const householdDays = kwhValue / 30;

  const chartData = useMemo(() => {
    if (!historicalData.length) return [];
    const maxPoints = 200;
    const step = Math.max(1, Math.floor(historicalData.length / maxPoints));
    return historicalData
      .filter((_, i) => i % step === 0 || i === historicalData.length - 1)
      .map((p) => ({
        timestamp: p.timestamp,
        price: p.price,
        kwh: electricityRate > 0 ? parseFloat((p.price / electricityRate).toFixed(1)) : 0,
        dateLabel: formatDate(p.timestamp, timeRange),
      }));
  }, [historicalData, electricityRate, timeRange]);

  const priceMin = useMemo(() => {
    if (!chartData.length) return 0;
    return Math.floor(Math.min(...chartData.map((d) => d.price)) * 0.98);
  }, [chartData]);

  const priceMax = useMemo(() => {
    if (!chartData.length) return 100;
    return Math.ceil(Math.max(...chartData.map((d) => d.price)) * 1.02);
  }, [chartData]);

  const handlePresetSelect = useCallback((rate: number) => {
    setElectricityRate(rate);
    setCustomRate(rate.toString());
  }, []);

  const handleCustomRate = useCallback((val: string) => {
    setCustomRate(val);
    const num = parseFloat(val);
    if (num > 0 && num < 10) setElectricityRate(num);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="glass-card rounded-2xl p-4 lg:p-5"
    >
      {/* Header — mb reduced from 6→4 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-amber-400/10 neon-border">
            <Lightbulb className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm">LTC → kWh Calculator</h3>
            <p className="text-[9px] text-neutral-500">Energy purchasing power</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-400/10 text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[9px] font-medium">Simulated</span>
            </div>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={retry}
            disabled={isLoading}
            className="p-1.5 rounded-lg glass hover:bg-primary/10 text-neutral-500 hover:text-primary transition-colors"
            aria-label="Refresh price data"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Live Price Banner — p reduced from 4→3, mb from 5→4 */}
      <div className="glass rounded-xl p-3 mb-4 neon-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5">Live LTC Price</p>
            <div className="flex items-baseline gap-2">
              {isLoading && !currentPrice ? (
                <div className="skeleton w-20 h-7" />
              ) : (
                <motion.span
                  key={currentPrice?.toFixed(2)}
                  initial={{ y: -6, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="text-2xl font-black font-mono text-secondary"
                >
                  ${currentPrice?.toFixed(2) ?? '—'}
                </motion.span>
              )}
              {priceChange24h !== null && (
                <span
                  className={`flex items-center gap-0.5 text-[11px] font-semibold ${
                    priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {priceChange24h >= 0 ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {Math.abs(priceChange24h).toFixed(2)}%
                </span>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5">Rate</p>
            <p className="text-base font-bold font-mono text-amber-400">
              ${electricityRate.toFixed(2)}<span className="text-[9px] text-neutral-500">/kWh</span>
            </p>
          </div>
        </div>
        {lastFetch > 0 && (
          <div className="flex items-center gap-1 mt-1.5 text-[8px] text-neutral-600">
            <Clock className="w-2.5 h-2.5" />
            Updated {Math.floor((Date.now() - lastFetch) / 1000)}s ago • Auto-refreshes every 45s
          </div>
        )}
      </div>

      {/* Calculator Inputs — gap from 4→3, mb from 5→4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* LTC Input — p from 4→3 */}
        <div className="glass rounded-xl p-3">
          <label className="text-[9px] text-neutral-500 uppercase tracking-wider block mb-1.5" htmlFor="ltc-input">
            LTC Amount
          </label>
          <div className="flex items-center gap-2">
            <input
              id="ltc-input"
              type="number"
              value={ltcAmount}
              onChange={(e) => setLtcAmount(e.target.value)}
              placeholder="1.0"
              className="input-field flex-1 bg-transparent border-none p-0 text-xl font-bold"
              min="0"
              step="0.1"
              aria-label="Litecoin amount"
            />
            <span className="text-xs font-semibold text-secondary px-2.5 py-1 rounded-lg bg-secondary/10">
              LTC
            </span>
          </div>
          {/* Quick amounts — mt from 3→2 */}
          <div className="flex gap-1.5 mt-2">
            {[0.1, 0.5, 1, 5, 10, 25].map((v) => (
              <button
                key={v}
                onClick={() => setLtcAmount(v.toString())}
                className={`flex-1 text-[9px] py-1 rounded-md glass hover:bg-secondary/10 hover:text-secondary transition-colors font-medium ${
                  parseFloat(ltcAmount) === v ? 'bg-secondary/15 text-secondary border border-secondary/30' : ''
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </div>

        {/* Result — p from 4→3 */}
        <div className="glass rounded-xl p-3 neon-border relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-amber-400/5 to-primary/5 pointer-events-none" />
          <div className="relative">
            <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1.5">Energy Equivalent</p>
            <motion.p
              key={kwhValue.toFixed(0)}
              initial={{ scale: 1.05, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-2xl font-black font-mono text-amber-400"
            >
              {formatKwh(kwhValue)}
              <span className="text-xs text-neutral-500 ml-1">kWh</span>
            </motion.p>
            <div className="mt-1.5 space-y-0.5">
              <p className="text-[9px] text-neutral-500">
                ≈ <span className="text-neutral-300 font-mono">${usdValue.toFixed(2)}</span> USD
              </p>
              <p className="text-[9px] text-neutral-500">
                ≈ <span className="text-emerald-400 font-mono">{householdDays.toFixed(1)}</span> days US household
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Electricity Rate Settings — mb from 5→3 */}
      <div className="mb-3">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="flex items-center gap-1.5 text-[11px] text-neutral-400 hover:text-primary transition-colors mb-2"
          aria-expanded={showSettings}
          aria-controls="rate-settings"
        >
          <Settings className="w-3 h-3" />
          <span>Electricity Rate Settings</span>
          {showSettings ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        <AnimatePresence>
          {showSettings && (
            <motion.div
              id="rate-settings"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              {/* p from 4→3, space-y from 3→2.5 */}
              <div className="glass rounded-xl p-3 space-y-2.5">
                <div>
                  <label className="text-[9px] text-neutral-500 uppercase tracking-wider block mb-1" htmlFor="rate-input">
                    Custom Rate (USD/kWh)
                  </label>
                  <input
                    id="rate-input"
                    type="number"
                    value={customRate}
                    onChange={(e) => handleCustomRate(e.target.value)}
                    className="input-field text-sm"
                    min="0.01"
                    max="1"
                    step="0.01"
                    aria-label="Electricity rate in USD per kWh"
                  />
                </div>

                <div>
                  <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> Regional Presets
                  </p>
                  {/* gap from 2→1.5 */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {ELECTRICITY_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePresetSelect(preset.rate)}
                        className={`flex items-center gap-1 px-2 py-1.5 rounded-lg glass text-[9px] font-medium transition-all hover:bg-primary/10 ${
                          electricityRate === preset.rate
                            ? 'border-primary/40 bg-primary/10 text-primary'
                            : 'text-neutral-400'
                        }`}
                      >
                        <span>{preset.flag}</span>
                        <div className="text-left">
                          <p className="leading-tight">{preset.label}</p>
                          <p className="font-mono text-[8px] text-neutral-500">${preset.rate}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chart Section — p from 4→3 */}
      <div className="glass rounded-xl p-3">
        {/* Chart header — mb from 4→3 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-secondary" />
            <h4 className="text-xs font-semibold">Historical LTC Price & kWh</h4>
          </div>
          <div className="flex gap-0.5 p-0.5 glass rounded-lg" role="tablist" aria-label="Time range selector">
            {TIME_RANGES.map((r) => (
              <button
                key={r}
                role="tab"
                aria-selected={timeRange === r}
                onClick={() => setTimeRange(r)}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold transition-all ${
                  timeRange === r
                    ? 'bg-primary/15 text-primary'
                    : 'text-neutral-500 hover:text-neutral-300'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        {historyError && (
          <div className="flex items-center gap-1.5 mb-2 px-2 py-1 rounded-lg bg-amber-400/10 text-amber-400 text-[9px]">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            <span>{historyError}</span>
          </div>
        )}

        {/* Chart — height reduced from 300→260 */}
        <div className="relative" style={{ height: 260 }}>
          {isHistoryLoading && !chartData.length ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
              <p className="text-[10px] text-neutral-500">Loading chart data...</p>
            </div>
          ) : chartData.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <AlertTriangle className="w-6 h-6 text-neutral-600" />
              <p className="text-[10px] text-neutral-500">No data available</p>
              <button
                onClick={retry}
                className="text-[10px] text-primary hover:text-primary/80 font-semibold"
              >
                Retry
              </button>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="kwhGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#fbbf24" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" strokeOpacity={0.5} />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 9, fill: '#737373' }}
                  tickLine={false}
                  axisLine={{ stroke: '#2F2F2F' }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                />
                <YAxis
                  yAxisId="price"
                  orientation="left"
                  tick={{ fontSize: 9, fill: '#38bdf8' }}
                  tickLine={false}
                  axisLine={false}
                  domain={[priceMin, priceMax]}
                  tickFormatter={(v: number) => `$${v}`}
                  width={48}
                />
                <YAxis
                  yAxisId="kwh"
                  orientation="right"
                  tick={{ fontSize: 9, fill: '#fbbf24' }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${formatKwh(v)}`}
                  width={48}
                />
                <Tooltip
                  content={
                    <CustomTooltip electricityRate={electricityRate} timeRange={timeRange} />
                  }
                  cursor={{ stroke: '#9E7FFF', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Legend
                  verticalAlign="top"
                  height={24}
                  iconType="circle"
                  iconSize={6}
                  formatter={(value: string) => (
                    <span className="text-[9px] text-neutral-400">{value}</span>
                  )}
                />
                <Area
                  yAxisId="price"
                  type="monotone"
                  dataKey="price"
                  name="LTC Price (USD)"
                  stroke="#38bdf8"
                  strokeWidth={2}
                  fill="url(#priceGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#38bdf8', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
                <Area
                  yAxisId="kwh"
                  type="monotone"
                  dataKey="kwh"
                  name="kWh per LTC"
                  stroke="#fbbf24"
                  strokeWidth={1.5}
                  strokeDasharray="4 2"
                  fill="url(#kwhGradient)"
                  dot={false}
                  activeDot={{ r: 3, fill: '#fbbf24', stroke: '#0a0a0a', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {isHistoryLoading && chartData.length > 0 && (
            <div className="absolute top-1 right-1">
              <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            </div>
          )}
        </div>

        {/* Chart info — mt from 3→2, p from 2.5→2 */}
        <div className="mt-2 flex items-start gap-1.5 p-2 rounded-lg glass text-[9px] text-neutral-500">
          <Info className="w-3 h-3 flex-shrink-0 mt-0.5 text-neutral-600" />
          <p>
            kWh = LTC price ÷ ${electricityRate}/kWh.
            {historyError ? ' Simulated data.' : ' CoinGecko data.'}
          </p>
        </div>
      </div>

      {/* Quick Reference Table — mt from 4→3, p from 4→3 */}
      <div className="mt-3 glass rounded-xl p-3">
        <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-2">Quick Reference</p>
        {/* gap from 2→1.5 */}
        <div className="grid grid-cols-4 gap-1.5 text-center">
          {[0.1, 0.5, 1, 5].map((ltc) => {
            const val = currentPrice ? (ltc * currentPrice) / electricityRate : 0;
            return (
              <div key={ltc} className="glass rounded-lg p-2">
                <p className="text-[9px] text-neutral-500 font-mono">{ltc} LTC</p>
                <p className="text-sm font-bold font-mono text-amber-400">{formatKwh(val)}</p>
                <p className="text-[8px] text-neutral-600">kWh</p>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  BarChart3,
  DollarSign,
  CircleDot,
} from 'lucide-react';
import { useLtcPrice } from '../hooks/useLtcPrice';

const TIMEFRAMES = [
  { key: '1' as const, label: '24H' },
  { key: '7' as const, label: '7D' },
  { key: '30' as const, label: '30D' },
  { key: '365' as const, label: '1Y' },
  { key: 'max' as const, label: 'All' },
];

function formatPrice(val: number): string {
  return `$${val.toFixed(2)}`;
}

function formatVolume(val: number): string {
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(1)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  return `$${val.toLocaleString()}`;
}

function formatDate(ts: number, timeframe: string): string {
  const d = new Date(ts);
  if (timeframe === '1') {
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  if (timeframe === '7') {
    return d.toLocaleDateString('en-US', { weekday: 'short', hour: '2-digit' });
  }
  if (timeframe === '30') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function LtcPriceChart() {
  const {
    data,
    history,
    isLoading,
    isHistoryLoading,
    isLive,
    timeframe,
    setTimeframe,
    refresh,
  } = useLtcPrice();

  const chartData = useMemo(() => {
    if (!history.length) return [];

    // Downsample for performance
    const maxPoints = 200;
    const step = Math.max(1, Math.floor(history.length / maxPoints));

    return history
      .filter((_, i) => i % step === 0 || i === history.length - 1)
      .map(p => ({
        date: formatDate(p.timestamp, timeframe),
        timestamp: p.timestamp,
        price: p.price,
        volume: p.volume || 0,
      }));
  }, [history, timeframe]);

  const priceChange = useMemo(() => {
    if (chartData.length < 2) return { absolute: 0, percent: 0 };
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    const abs = last - first;
    const pct = (abs / first) * 100;
    return { absolute: abs, percent: pct };
  }, [chartData]);

  const isPositive = priceChange.percent >= 0;
  const gradientId = 'ltcPriceGradient';
  const strokeColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
              <BarChart3 className="w-4 h-4 text-blue-400" />
            </div>
            Litecoin Price Chart
          </h3>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-2xl font-bold text-white font-mono">
              {formatPrice(data.price)}
            </span>
            <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-lg ${
              isPositive ? 'text-success bg-success/10' : 'text-error bg-error/10'
            }`}>
              {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isPositive ? '+' : ''}{priceChange.percent.toFixed(2)}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
            isLive
              ? 'bg-success/10 text-success border border-success/20'
              : 'bg-warning/10 text-warning border border-warning/20'
          }`}>
            {isLive ? '● LIVE' : '○ SIMULATED'}
          </span>
          <button
            onClick={refresh}
            className="p-1.5 rounded-lg hover:bg-surface transition-colors"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 text-gray-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-xl bg-background/40 border border-border/20">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">24h Change</span>
          </div>
          <p className={`text-sm font-mono font-semibold ${
            data.change24h >= 0 ? 'text-success' : 'text-error'
          }`}>
            {data.change24h >= 0 ? '+' : ''}{formatPrice(data.change24h)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-background/40 border border-border/20">
          <div className="flex items-center gap-1.5 mb-1">
            <Activity className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">24h Volume</span>
          </div>
          <p className="text-sm font-mono font-semibold text-white">
            {formatVolume(data.volume24h)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-background/40 border border-border/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">24h High</span>
          </div>
          <p className="text-sm font-mono font-semibold text-white">
            {formatPrice(data.high24h)}
          </p>
        </div>
        <div className="p-3 rounded-xl bg-background/40 border border-border/20">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3 h-3 text-gray-500" />
            <span className="text-[10px] text-gray-500 uppercase">24h Low</span>
          </div>
          <p className="text-sm font-mono font-semibold text-white">
            {formatPrice(data.low24h)}
          </p>
        </div>
      </div>

      {/* Timeframe Selectors */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-background/60 rounded-lg p-1">
          {TIMEFRAMES.map(tf => (
            <button
              key={tf.key}
              onClick={() => setTimeframe(tf.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                timeframe === tf.key
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-600">
          <CircleDot className="w-3 h-3" />
          <span>USD</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-72 relative">
        {isHistoryLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 bg-background/40 backdrop-blur-sm rounded-xl">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading chart data...</span>
            </div>
          </div>
        )}

        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
              <XAxis
                dataKey="date"
                stroke="#525252"
                tick={{ fill: '#737373', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                stroke="#525252"
                tick={{ fill: '#737373', fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                domain={['auto', 'auto']}
                width={50}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#262626',
                  border: '1px solid #2F2F2F',
                  borderRadius: '12px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#a3a3a3', fontSize: 11 }}
                formatter={(value: number) => [formatPrice(value), 'LTC/USD']}
              />
              <Area
                type="monotone"
                dataKey="price"
                stroke={strokeColor}
                strokeWidth={2}
                fill={`url(#${gradientId})`}
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : !isHistoryLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500">No chart data available</p>
              <button
                onClick={refresh}
                className="mt-2 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Market Cap */}
      <div className="mt-4 pt-4 border-t border-border/20 flex items-center justify-between">
        <span className="text-[10px] text-gray-600">
          Market Cap: {formatVolume(data.marketCap)}
        </span>
        <span className="text-[10px] text-gray-600">
          Data: CoinGecko API • Updated {new Date(data.lastUpdated).toLocaleTimeString()}
        </span>
      </div>
    </motion.div>
  );
}

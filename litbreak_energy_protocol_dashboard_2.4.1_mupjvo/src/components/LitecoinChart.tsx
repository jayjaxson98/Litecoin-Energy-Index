import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, RefreshCw, ExternalLink } from 'lucide-react';
import { getHistoryForTimeframe } from '@/data/ltcPriceHistory';
import { useLtcPrice } from '@/hooks/useLtcPrice';
import { formatUsd } from '@/utils/calculations';

const TIMEFRAMES = ['24H', '7D', '30D', '90D', '1Y', 'ALL'];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  const date = new Date(point.timestamp);
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-xl border border-white/5">
      <p className="text-[11px] text-gray-400 mb-1">
        {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        {' '}
        {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
      </p>
      <p className="text-lg font-bold text-white">${payload[0].value.toFixed(2)}</p>
      {point.volume && (
        <p className="text-[11px] text-gray-500 mt-1">Vol: {formatUsd(point.volume)}</p>
      )}
    </div>
  );
}

export function LitecoinChart() {
  const { data: ltcData, isLoading, isLive, refresh } = useLtcPrice();
  const [activeTimeframe, setActiveTimeframe] = useState('30D');

  const chartData = useMemo(() => {
    const history = getHistoryForTimeframe(activeTimeframe);
    return history.map(p => ({
      ...p,
      time: new Date(p.timestamp).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        ...(activeTimeframe === '24H' ? { hour: '2-digit', minute: '2-digit' } : {}),
      }),
    }));
  }, [activeTimeframe]);

  const priceRange = useMemo(() => {
    if (chartData.length === 0) return { min: 0, max: 0, change: 0, changePercent: 0 };
    const prices = chartData.map(d => d.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const first = chartData[0].price;
    const last = chartData[chartData.length - 1].price;
    return {
      min,
      max,
      change: last - first,
      changePercent: ((last - first) / first) * 100,
    };
  }, [chartData]);

  const isPositive = priceRange.changePercent >= 0;
  const chartColor = isPositive ? '#10b981' : '#ef4444';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.15 }}
      className="rounded-2xl glass p-5 sm:p-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 flex items-center justify-center">
              <span className="text-sm font-bold text-blue-400">Ł</span>
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Litecoin</h3>
              <span className="text-[11px] text-gray-500">LTC/USD</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-white/5 p-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf}
                onClick={() => setActiveTimeframe(tf)}
                className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                  activeTimeframe === tf
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
          <motion.button
            onClick={refresh}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>
      </div>

      {/* Price display */}
      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <span className="text-3xl sm:text-4xl font-black text-white font-mono">
            ${ltcData.price.toFixed(2)}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
          isPositive ? 'bg-emerald-500/10' : 'bg-red-500/10'
        }`}>
          {isPositive ? (
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
          )}
          <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{priceRange.changePercent.toFixed(2)}%
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          <span className="text-[10px] text-gray-500">{isLive ? 'Live via CoinGecko' : 'Simulated'}</span>
        </div>
      </div>

      {/* Chart */}
      <div className="h-56 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id="ltcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<ChartTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#ltcGradient)"
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Metrics */}
      <div className="mt-5 pt-4 border-t border-white/5 grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Market Cap', value: formatUsd(ltcData.marketCap) },
          { label: '24h Volume', value: formatUsd(ltcData.volume24h) },
          { label: '24h High', value: `$${ltcData.high24h.toFixed(2)}` },
          { label: '24h Low', value: `$${ltcData.low24h.toFixed(2)}` },
        ].map(m => (
          <div key={m.label}>
            <span className="text-[10px] text-gray-600 uppercase tracking-wider">{m.label}</span>
            <p className="text-sm font-mono font-semibold text-white mt-0.5">{m.value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

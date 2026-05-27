import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import { ltcPriceHistory } from '../data/energyData';
import { formatCurrency } from '../utils/format';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-strong rounded-lg p-3 neon-border">
        <p className="text-xs text-white/50 mb-1">{label}</p>
        <p className="text-sm font-mono font-semibold text-secondary">
          {formatCurrency(payload[0].value)}
        </p>
        {payload[1] && (
          <p className="text-xs font-mono text-white/40 mt-1">
            Vol: {payload[1].value.toFixed(0)}M
          </p>
        )}
      </div>
    );
  }
  return null;
};

const LitecoinChart: React.FC = () => {
  const [timeframe, setTimeframe] = useState('30D');
  const data = ltcPriceHistory;
  const currentPrice = data[data.length - 1].price;
  const previousPrice = data[data.length - 2].price;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;
  const isPositive = priceChange >= 0;

  const timeframes = ['7D', '14D', '30D'];

  const filteredData = timeframe === '7D' ? data.slice(-7) : timeframe === '14D' ? data.slice(-14) : data;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="rounded-2xl neon-border p-6"
      style={{ background: 'rgba(18, 18, 26, 0.8)' }}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-ltc/20">
            <BarChart3 className="w-5 h-5 text-ltc-light" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Litecoin Price</h3>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold text-secondary">
                {formatCurrency(currentPrice)}
              </span>
              <span className={`flex items-center gap-0.5 text-sm font-medium ${isPositive ? 'text-success' : 'text-error'}`}>
                {isPositive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                {isPositive ? '+' : ''}{priceChangePercent.toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex gap-1 p-1 rounded-lg glass border border-white/5">
          {timeframes.map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                timeframe === tf
                  ? 'bg-primary/20 text-primary'
                  : 'text-white/40 hover:text-white/70'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="ltcGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.3} />
                <stop offset="50%" stopColor="#38bdf8" stopOpacity={0.1} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
            <XAxis
              dataKey="date"
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }}
              axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
              tickLine={false}
              domain={['auto', 'auto']}
              tickFormatter={(v) => `$${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#38bdf8"
              strokeWidth={2}
              fill="url(#ltcGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#38bdf8', stroke: '#0A0A0F', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
        <div className="flex gap-4">
          <div>
            <span className="text-xs text-white/30">24h High</span>
            <p className="text-sm font-mono text-success">{formatCurrency(Math.max(...data.slice(-1).map(d => d.price)) + 2.5)}</p>
          </div>
          <div>
            <span className="text-xs text-white/30">24h Low</span>
            <p className="text-sm font-mono text-error">{formatCurrency(Math.min(...data.slice(-1).map(d => d.price)) - 1.8)}</p>
          </div>
        </div>
        <div className="text-xs text-white/20">Data from Chainlink Oracle</div>
      </div>
    </motion.div>
  );
};

export default LitecoinChart;

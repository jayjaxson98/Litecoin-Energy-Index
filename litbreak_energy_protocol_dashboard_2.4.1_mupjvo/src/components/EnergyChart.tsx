import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RefreshCw } from 'lucide-react';
import type { ChartDataPoint } from '@/types';

interface EnergyChartProps {
  data: ChartDataPoint[];
  isLoading: boolean;
  onRefresh: () => void;
}

const timeRanges = ['1H', '24H', '7D', '30D', 'ALL'];

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-strong rounded-xl px-4 py-3 shadow-xl">
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-lg font-bold text-white">${payload[0].value.toFixed(4)}</p>
      {payload[1] && (
        <p className="text-xs text-gray-500 mt-1">Vol: {payload[1].value.toLocaleString()}</p>
      )}
    </div>
  );
}

export function EnergyChart({ data, isLoading, onRefresh }: EnergyChartProps) {
  const [activeRange, setActiveRange] = useState('24H');

  return (
    <motion.div
      id="analytics"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.2 }}
      className="rounded-2xl glass p-4 sm:p-6"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-white">Energy Price Index</h3>
          <p className="text-sm text-gray-500 mt-1">LITB/USD real-time pricing</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center rounded-lg bg-white/5 p-1">
            {timeRanges.map((range) => (
              <button
                key={range}
                onClick={() => setActiveRange(range)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeRange === range
                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
          <motion.button
            onClick={onRefresh}
            whileHover={{ rotate: 180 }}
            transition={{ duration: 0.3 }}
            className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="h-64 sm:h-80">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#9E7FFF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#9E7FFF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 11 }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => `$${v.toFixed(2)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="price"
                stroke="#9E7FFF"
                strokeWidth={2}
                fill="url(#priceGradient)"
                animationDuration={1000}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

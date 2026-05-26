import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { Activity, BarChart3 } from 'lucide-react';
import type { PricePoint } from '../types/utx';

interface DualAxisChartProps {
  /** Price data points to render */
  data: PricePoint[];
  /** Chart title */
  title?: string;
  /** Subtitle / description */
  subtitle?: string;
  /** Height in pixels */
  height?: number;
  /** Color for the price line */
  priceColor?: string;
  /** Color for the volume bars */
  volumeColor?: string;
  /** Show volume bars */
  showVolume?: boolean;
}

export function DualAxisChart({
  data,
  title = 'Price & Volume',
  subtitle = 'Dual-axis chart',
  height = 300,
  priceColor = '#9E7FFF',
  volumeColor = '#38bdf8',
  showVolume = true,
}: DualAxisChartProps) {
  const chartData = useMemo(() => {
    return data.map(p => ({
      time: new Date(p.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' }),
      price: p.price,
      volume: (p.volume ?? 0) / 1_000_000, // Convert to millions
      timestamp: p.timestamp,
    }));
  }, [data]);

  const priceMin = useMemo(() => {
    if (chartData.length === 0) return 0;
    return Math.min(...chartData.map(d => d.price)) * 0.98;
  }, [chartData]);

  const priceMax = useMemo(() => {
    if (chartData.length === 0) return 100;
    return Math.max(...chartData.map(d => d.price)) * 1.02;
  }, [chartData]);

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center justify-center h-48 text-textSecondary text-sm">
          No data available
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="glass-card relative overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <BarChart3 className="w-4.5 h-4.5 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">{title}</h3>
            <p className="text-xs text-textSecondary">{subtitle}</p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mb-4">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1 rounded-full" style={{ background: priceColor }} />
            <span className="text-xs text-textSecondary">Price (USD)</span>
          </div>
          {showVolume && (
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm opacity-40" style={{ background: volumeColor }} />
              <span className="text-xs text-textSecondary">Volume (M)</span>
            </div>
          )}
        </div>

        {/* Chart */}
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData}>
              <defs>
                <linearGradient id="dualPriceGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={priceColor} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={priceColor} stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.03)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A3A3A3', fontSize: 10 }}
                interval="preserveStartEnd"
              />

              {/* Left Y-axis: Price */}
              <YAxis
                yAxisId="price"
                orientation="left"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#A3A3A3', fontSize: 10 }}
                domain={[priceMin, priceMax]}
                tickFormatter={(v: number) => `$${v.toFixed(0)}`}
                width={50}
              />

              {/* Right Y-axis: Volume */}
              {showVolume && (
                <YAxis
                  yAxisId="volume"
                  orientation="right"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#A3A3A3', fontSize: 10 }}
                  tickFormatter={(v: number) => `${v.toFixed(0)}M`}
                  width={45}
                />
              )}

              <Tooltip
                contentStyle={{
                  background: '#1e293b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                }}
                labelStyle={{ color: '#A3A3A3', fontSize: 11, marginBottom: 4 }}
                formatter={(value: number, name: string) => {
                  if (name === 'price') return [`$${value.toFixed(2)}`, 'Price'];
                  if (name === 'volume') return [`${value.toFixed(1)}M`, 'Volume'];
                  return [value, name];
                }}
              />

              {showVolume && (
                <Bar
                  yAxisId="volume"
                  dataKey="volume"
                  fill={volumeColor}
                  opacity={0.15}
                  radius={[2, 2, 0, 0]}
                  barSize={8}
                />
              )}

              <Area
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke={priceColor}
                strokeWidth={2}
                fill="url(#dualPriceGrad)"
                dot={false}
                activeDot={{
                  r: 4,
                  fill: priceColor,
                  stroke: '#0f172a',
                  strokeWidth: 2,
                }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}

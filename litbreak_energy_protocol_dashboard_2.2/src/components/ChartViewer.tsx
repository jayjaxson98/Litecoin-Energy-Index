/**
 * ChartViewer — Reusable chart component with time frame selector.
 * Used for displaying price, volume, and energy index data.
 */

import { useState, useMemo } from 'react';
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
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';
import type { TimeFrame, ChartDataPoint } from '../types';

// ─── Props ───────────────────────────────────────────────────────────────────

interface ChartViewerProps {
  title: string;
  subtitle?: string;
  data: ChartDataPoint[];
  timeFrame?: TimeFrame;
  onTimeFrameChange?: (tf: TimeFrame) => void;
  color?: string;
  gradientFrom?: string;
  gradientTo?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  showVolume?: boolean;
  height?: number;
  className?: string;
}

// ─── Time Frame Options ──────────────────────────────────────────────────────

const TIME_FRAMES: TimeFrame[] = ['1H', '6H', '24H', '7D', '30D', '90D', '1Y'];

// ─── Component ───────────────────────────────────────────────────────────────

export function ChartViewer({
  title,
  subtitle,
  data,
  timeFrame = '24H',
  onTimeFrameChange,
  color = '#9E7FFF',
  gradientFrom = '#9E7FFF',
  gradientTo = 'transparent',
  valuePrefix = '$',
  valueSuffix = '',
  showVolume = false,
  height = 300,
  className = '',
}: ChartViewerProps) {
  const [activeTimeFrame, setActiveTimeFrame] = useState<TimeFrame>(timeFrame);
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);

  const handleTimeFrameChange = (tf: TimeFrame) => {
    setActiveTimeFrame(tf);
    onTimeFrameChange?.(tf);
  };

  // Calculate stats
  const stats = useMemo(() => {
    if (!data || data.length === 0) return { current: 0, change: 0, changePercent: 0, high: 0, low: 0 };

    const current = data[data.length - 1]?.value ?? 0;
    const first = data[0]?.value ?? 0;
    const change = current - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;
    const values = data.map(d => d.value);
    const high = Math.max(...values);
    const low = Math.min(...values);

    return { current, change, changePercent, high, low };
  }, [data]);

  const isPositive = stats.change >= 0;
  const displayValue = hoveredValue !== null ? hoveredValue : stats.current;

  // Format timestamp for X axis
  const formatXAxis = (timestamp: number) => {
    const d = new Date(timestamp);
    if (['1H', '6H', '24H'].includes(activeTimeFrame)) {
      return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const point = payload[0].payload as ChartDataPoint;
      return (
        <div className="bg-surface/95 backdrop-blur-sm border border-white/[0.08] rounded-lg px-3 py-2 shadow-xl">
          <p className="text-[10px] text-textSecondary">
            {new Date(point.timestamp).toLocaleString()}
          </p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {valuePrefix}{point.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}{valueSuffix}
          </p>
          {showVolume && point.volume !== undefined && (
            <p className="text-[10px] text-textSecondary mt-0.5">
              Vol: {point.volume.toLocaleString()}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-textSecondary" />
              <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {subtitle && (
              <p className="text-[11px] text-textSecondary mt-0.5 ml-6">{subtitle}</p>
            )}
          </div>

          {/* Current Value */}
          <div className="text-right">
            <p className="text-lg font-bold text-white">
              {valuePrefix}{displayValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}{valueSuffix}
            </p>
            <div className={`flex items-center gap-1 justify-end text-xs ${
              isPositive ? 'text-success' : 'text-error'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{isPositive ? '+' : ''}{stats.changePercent.toFixed(2)}%</span>
            </div>
          </div>
        </div>

        {/* Time Frame Selector */}
        <div className="flex gap-1 mt-3">
          {TIME_FRAMES.map(tf => (
            <button
              key={tf}
              onClick={() => handleTimeFrameChange(tf)}
              className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-all ${
                activeTimeFrame === tf
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-textSecondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-3">
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart
            data={data}
            onMouseMove={(e: any) => {
              if (e?.activePayload?.[0]) {
                setHoveredValue(e.activePayload[0].payload.value);
              }
            }}
            onMouseLeave={() => setHoveredValue(null)}
          >
            <defs>
              <linearGradient id={`gradient-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={gradientFrom} stopOpacity={0.3} />
                <stop offset="100%" stopColor={gradientTo || gradientFrom} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatXAxis}
              tick={{ fontSize: 10, fill: '#A3A3A3' }}
              axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: '#A3A3A3' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${valuePrefix}${v.toLocaleString()}`}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${title})`}
              animationDuration={800}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats Bar */}
      <div className="px-4 pb-3 flex items-center justify-between text-[10px] text-textSecondary">
        <span>High: {valuePrefix}{stats.high.toLocaleString(undefined, { maximumFractionDigits: 2 })}{valueSuffix}</span>
        <span>Low: {valuePrefix}{stats.low.toLocaleString(undefined, { maximumFractionDigits: 2 })}{valueSuffix}</span>
        <span>Change: {isPositive ? '+' : ''}{stats.change.toFixed(2)}</span>
      </div>
    </motion.div>
  );
}

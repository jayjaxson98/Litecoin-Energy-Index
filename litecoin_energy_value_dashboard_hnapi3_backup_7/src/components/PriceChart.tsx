import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import type { PricePoint, TimeRange } from '../types/utx';

interface PriceChartProps {
  data: PricePoint[];
  range: TimeRange;
  height?: number;
  color?: string;
  showGrid?: boolean;
}

function formatLabel(t: number, range: TimeRange): string {
  const d = new Date(t);
  if (range === '24H') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (range === '7D') return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: number;
  range: TimeRange;
}

const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload, label, range }) => {
  if (!active || !payload || payload.length === 0 || label === undefined) return null;
  return (
    <div style={{
      background: '#1a1a1a',
      border: '1px solid #2F2F2F',
      borderRadius: 8,
      padding: '8px 12px',
      fontSize: '0.82rem',
    }}>
      <div style={{ color: '#A3A3A3', marginBottom: 4 }}>{formatLabel(label, range)}</div>
      <div style={{ color: '#9E7FFF', fontWeight: 700 }}>
        ${(payload[0]?.value ?? 0).toFixed(4)}
      </div>
    </div>
  );
};

export const PriceChart: React.FC<PriceChartProps> = ({
  data,
  range,
  height = 220,
  color = '#9E7FFF',
  showGrid = true,
}) => {
  const chartData = useMemo(
    () => data.map((p) => ({ t: p.t, price: p.price })),
    [data]
  );

  const minPrice = useMemo(() => Math.min(...chartData.map((d) => d.price)) * 0.995, [chartData]);
  const maxPrice = useMemo(() => Math.max(...chartData.map((d) => d.price)) * 1.005, [chartData]);

  if (chartData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3A3A3' }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.25} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" vertical={false} />
        )}
        <XAxis
          dataKey="t"
          tickFormatter={(v: number) => formatLabel(v, range)}
          tick={{ fill: '#A3A3A3', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          domain={[minPrice, maxPrice]}
          tickFormatter={(v: number) => `$${v.toFixed(0)}`}
          tick={{ fill: '#A3A3A3', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={52}
        />
        <Tooltip content={<CustomTooltip range={range} />} />
        <Area
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={2}
          fill="url(#priceGrad)"
          dot={false}
          activeDot={{ r: 4, fill: color, stroke: '#171717', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default PriceChart;

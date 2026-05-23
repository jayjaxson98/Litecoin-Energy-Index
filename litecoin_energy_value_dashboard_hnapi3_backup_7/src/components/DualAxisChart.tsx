import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import type { PricePoint, TimeRange } from '../types/utx';

interface DualAxisChartProps {
  priceHistory: PricePoint[];
  range: TimeRange;
  regionRate: number;
  height?: number;
}

function formatLabel(t: number, range: TimeRange): string {
  const d = new Date(t);
  if (range === '24H') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (range === '7D') return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

interface TooltipPayloadItem {
  name: string;
  value: number;
  color: string;
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
      minWidth: 160,
    }}>
      <div style={{ color: '#A3A3A3', marginBottom: 6 }}>{formatLabel(label, range)}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 16, marginBottom: 2 }}>
          <span style={{ color: p.color }}>{p.name}</span>
          <span style={{ color: '#fff', fontWeight: 600 }}>{p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  );
};

export const DualAxisChart: React.FC<DualAxisChartProps> = ({
  priceHistory,
  range,
  regionRate,
  height = 260,
}) => {
  const chartData = useMemo(() =>
    priceHistory.map((p) => ({
      t: p.t,
      ltcPrice: p.price,
      litoshiPerKwh: regionRate / (p.price / 1e8),
      kwhPerLtc: p.price / regionRate,
    })),
    [priceHistory, regionRate]
  );

  if (chartData.length === 0) {
    return (
      <div style={{ height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#A3A3A3' }}>
        No data
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" vertical={false} />
        <XAxis
          dataKey="t"
          tickFormatter={(v: number) => formatLabel(v, range)}
          tick={{ fill: '#A3A3A3', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          yAxisId="left"
          tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`}
          tick={{ fill: '#9E7FFF', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v: number) => v.toFixed(0)}
          tick={{ fill: '#38bdf8', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
        <Tooltip content={<CustomTooltip range={range} />} />
        <Legend
          wrapperStyle={{ fontSize: '0.8rem', paddingTop: 8 }}
          formatter={(value: string) => <span style={{ color: '#A3A3A3' }}>{value}</span>}
        />
        <Line
          yAxisId="left"
          type="monotone"
          dataKey="litoshiPerKwh"
          name="Litoshi/kWh"
          stroke="#9E7FFF"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
        />
        <Line
          yAxisId="right"
          type="monotone"
          dataKey="kwhPerLtc"
          name="kWh/LTC"
          stroke="#38bdf8"
          strokeWidth={2}
          strokeDasharray="6 3"
          dot={false}
          activeDot={{ r: 4 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default DualAxisChart;

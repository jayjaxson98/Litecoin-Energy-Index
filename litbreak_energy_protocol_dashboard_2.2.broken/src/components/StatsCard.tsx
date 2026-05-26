// ─── StatsCard ─── Reusable glass-morphism stats card

import type { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon?: ReactNode;
  trend?: { value: number; label: string };
  glowColor?: 'primary' | 'secondary' | 'accent';
}

const glowMap: Record<string, string> = {
  primary: 'hover:shadow-[0_0_30px_rgba(158,127,255,0.15)]',
  secondary: 'hover:shadow-[0_0_30px_rgba(56,189,248,0.15)]',
  accent: 'hover:shadow-[0_0_30px_rgba(244,114,182,0.15)]',
};

export function StatsCard({ title, value, subtitle, icon, trend, glowColor = 'primary' }: StatsCardProps) {
  return (
    <div
      className={`
        glass rounded-2xl p-5 transition-all duration-300
        hover:scale-[1.02] ${glowMap[glowColor]}
        group cursor-default
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-white/40 uppercase tracking-wider">{title}</span>
        {icon && (
          <div className="text-primary/60 group-hover:text-primary transition-colors">
            {icon}
          </div>
        )}
      </div>
      <div className="animate-count">
        <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
      </div>
      <div className="flex items-center justify-between mt-2">
        {subtitle && <span className="text-xs text-white/30">{subtitle}</span>}
        {trend && (
          <span className={`text-xs font-medium ${trend.value >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value).toFixed(1)}% {trend.label}
          </span>
        )}
      </div>
    </div>
  );
}

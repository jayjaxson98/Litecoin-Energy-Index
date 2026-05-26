// ─── EnergyIndex ─── Energy index gauge with animated ring

import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Flame } from 'lucide-react';
import { useContract } from '../hooks/useContract';
import { formatNumber } from '../lib/format';

export function EnergyIndex() {
  const { getProtocolStats } = useContract();
  const [energyIndex, setEnergyIndex] = useState(0);
  const [oraclePrice, setOraclePrice] = useState('0.00');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const stats = await getProtocolStats();
        if (mounted) {
          setEnergyIndex(stats.energyIndex);
          setOraclePrice(stats.oraclePrice);
          setLoading(false);
        }
      } catch {
        if (mounted) setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 15000);
    return () => { mounted = false; clearInterval(interval); };
  }, [getProtocolStats]);

  const percentage = Math.min(100, Math.max(0, energyIndex));
  const circumference = 2 * Math.PI * 58;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color based on energy level
  const getColor = (val: number) => {
    if (val >= 80) return { ring: '#10b981', text: 'text-emerald-400', label: 'Excellent' };
    if (val >= 60) return { ring: '#9E7FFF', text: 'text-primary', label: 'Good' };
    if (val >= 40) return { ring: '#f59e0b', text: 'text-amber-400', label: 'Moderate' };
    return { ring: '#ef4444', text: 'text-red-400', label: 'Low' };
  };

  const color = getColor(percentage);

  return (
    <div className="glass rounded-2xl p-6 hover:shadow-[0_0_40px_rgba(158,127,255,0.1)] transition-all duration-500">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-white/50 uppercase tracking-wider">Energy Index</h3>
          <p className="text-xs text-white/25 mt-0.5">Litecoin network health</p>
        </div>
        <Activity className="w-5 h-5 text-primary/50" />
      </div>

      <div className="flex items-center gap-6">
        {/* Gauge */}
        <div className="relative flex-shrink-0">
          <svg width="140" height="140" className="transform -rotate-90">
            <circle cx="70" cy="70" r="58" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
            <circle
              cx="70" cy="70" r="58" fill="none"
              stroke={loading ? 'rgba(255,255,255,0.1)' : color.ring}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={loading ? circumference : strokeDashoffset}
              className="transition-all duration-1000 ease-out"
              style={{ filter: loading ? 'none' : `drop-shadow(0 0 8px ${color.ring}40)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-primary rounded-full animate-spin" />
            ) : (
              <>
                <span className={`text-3xl font-bold ${color.text}`}>{formatNumber(energyIndex, 1)}</span>
                <span className="text-[10px] text-white/30 font-medium">{color.label}</span>
              </>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <TrendingUp className="w-4 h-4 text-secondary/60" />
            <div>
              <p className="text-[10px] text-white/30 uppercase">Oracle Price</p>
              <p className="text-sm font-semibold text-white">${loading ? '—' : oraclePrice}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/[0.02] border border-white/5">
            <Flame className="w-4 h-4 text-accent/60" />
            <div>
              <p className="text-[10px] text-white/30 uppercase">Network Status</p>
              <p className={`text-sm font-semibold ${color.text}`}>{loading ? '—' : color.label}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

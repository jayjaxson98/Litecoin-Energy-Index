import { motion } from 'framer-motion';
import { Activity, Clock, Shield, AlertTriangle, Radio, Wifi, WifiOff } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { formatNumber, formatRelativeTime, getOracleHealthColor, getOracleHealthBg } from '../utils/contractHelpers';

export default function OracleStatus() {
  const { oracleData } = useMockContract();

  const statusColor = oracleData.usingFallback ? 'text-amber-400' : 'text-emerald-400';
  const statusBg = oracleData.usingFallback ? 'bg-amber-400/10' : 'bg-emerald-400/10';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-secondary/10">
            <Activity className="w-4 h-4 text-secondary" />
          </div>
          <h3 className="font-semibold text-sm">Oracle Status</h3>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${statusBg} border border-white/5`}>
          <div className={`w-1.5 h-1.5 rounded-full ${oracleData.usingFallback ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`} />
          <span className={`text-[10px] font-semibold ${statusColor}`}>
            {oracleData.usingFallback ? 'FALLBACK ACTIVE' : 'PRIMARY ACTIVE'}
          </span>
        </div>
      </div>

      {/* Oracle feeds — dual display */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        {/* Primary Oracle */}
        <div className={`glass rounded-xl p-3 border ${getOracleHealthBg(oracleData.primaryHealth)}`}>
          <div className="flex items-center gap-1.5 mb-2">
            {oracleData.primaryHealth === 'healthy' ? (
              <Wifi className={`w-3.5 h-3.5 ${getOracleHealthColor(oracleData.primaryHealth)}`} />
            ) : (
              <WifiOff className={`w-3.5 h-3.5 ${getOracleHealthColor(oracleData.primaryHealth)}`} />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Primary</span>
          </div>
          <p className={`text-xs font-bold ${getOracleHealthColor(oracleData.primaryHealth)} capitalize`}>
            {oracleData.primaryHealth}
          </p>
        </div>

        {/* Fallback Oracle */}
        <div className={`glass rounded-xl p-3 border ${getOracleHealthBg(oracleData.fallbackHealth)}`}>
          <div className="flex items-center gap-1.5 mb-2">
            <Shield className={`w-3.5 h-3.5 ${getOracleHealthColor(oracleData.fallbackHealth)}`} />
            <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-400">Fallback</span>
          </div>
          <p className={`text-xs font-bold ${getOracleHealthColor(oracleData.fallbackHealth)} capitalize`}>
            {oracleData.fallbackHealth}
          </p>
        </div>
      </div>

      {/* Fallback reason banner */}
      {oracleData.usingFallback && oracleData.fallbackReason && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-3 p-2.5 rounded-xl bg-amber-400/5 border border-amber-400/15 flex items-start gap-2"
        >
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-[10px] font-semibold text-amber-400">Fallback Activated</p>
            <p className="text-[10px] text-amber-400/70 mt-0.5">{oracleData.fallbackReason}</p>
          </div>
        </motion.div>
      )}

      {/* Data grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <Radio className="w-3 h-3" /> LTC/USD Price
          </span>
          <span className="text-sm font-bold font-mono text-white">${formatNumber(oracleData.ltcPrice, 2)}</span>
        </div>

        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500 flex items-center gap-1.5">
            <Clock className="w-3 h-3" /> Last Update
          </span>
          <span className="text-xs font-mono text-neutral-300">{formatRelativeTime(oracleData.lastUpdate)}</span>
        </div>

        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500">Staleness Threshold</span>
          <span className="text-xs font-mono text-neutral-300">{oracleData.stalenessThreshold}s (5 min)</span>
        </div>

        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500">Gas Price</span>
          <span className="text-xs font-mono text-neutral-300">{oracleData.gasPrice} Gwei</span>
        </div>

        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500">Block Height</span>
          <span className="text-xs font-mono text-neutral-300">#{oracleData.blockHeight.toLocaleString()}</span>
        </div>

        <div className="flex items-center justify-between glass rounded-lg p-2.5">
          <span className="text-[11px] text-neutral-500">Deviation Band</span>
          <span className="text-xs font-mono text-neutral-300">±20% max</span>
        </div>
      </div>
    </motion.div>
  );
}

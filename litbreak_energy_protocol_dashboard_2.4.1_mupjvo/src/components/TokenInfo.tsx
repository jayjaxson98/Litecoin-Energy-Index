import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Shield, Clock, Cpu, Database, Lock } from 'lucide-react';
import type { TokenData } from '@/types';

interface TokenInfoProps {
  tokenData: TokenData;
  isLoading: boolean;
}

export function TokenInfo({ tokenData, isLoading }: TokenInfoProps) {
  if (isLoading) {
    return (
      <div className="rounded-2xl glass p-6 animate-pulse space-y-4">
        <div className="h-6 w-40 bg-white/5 rounded" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-4 w-full bg-white/5 rounded" />
        ))}
      </div>
    );
  }

  const details = [
    { icon: Zap, label: 'Token Name', value: tokenData.name },
    { icon: Database, label: 'Symbol', value: tokenData.symbol },
    { icon: Cpu, label: 'Total Supply', value: `${parseFloat(tokenData.totalSupply).toLocaleString()} LITB` },
    { icon: Lock, label: 'Hard Cap', value: `${parseFloat(tokenData.hardCap).toLocaleString()} LITB` },
    { icon: Shield, label: 'Energy Price', value: `$${(parseFloat(tokenData.energyPrice) / 1000).toFixed(2)}/MWh` },
    { icon: Clock, label: 'Exchange Rate', value: `1 ETH = ${tokenData.exchangeRate} LITB` },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.4 }}
      className="rounded-2xl glass p-4 sm:p-6"
    >
      <h3 className="text-lg sm:text-xl font-bold text-white mb-6">Token Details</h3>
      <div className="space-y-4">
        {details.map(({ icon: Icon, label, value }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.05 }}
            className="flex items-center justify-between py-2 border-b border-white/5 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-400">{label}</span>
            </div>
            <span className="text-sm font-medium text-white font-mono">{value}</span>
          </motion.div>
        ))}
      </div>

      {/* Status */}
      <div className="mt-6 flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${tokenData.isPaused ? 'bg-red-400' : 'bg-emerald-400'} animate-pulse`} />
        <span className={`text-xs font-medium ${tokenData.isPaused ? 'text-red-400' : 'text-emerald-400'}`}>
          {tokenData.isPaused ? 'Contract Paused' : 'Contract Active'}
        </span>
      </div>

      {/* Fee info */}
      <div className="mt-4 p-3 rounded-xl bg-primary/5 border border-primary/10">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-3 h-3 text-primary" />
          <span className="text-xs font-semibold text-primary">Protocol Fee</span>
        </div>
        <p className="text-xs text-gray-400">
          {tokenData.feeBps / 100}% fee on all mint and redeem operations. Max fee capped at 5%.
        </p>
      </div>
    </motion.div>
  );
}

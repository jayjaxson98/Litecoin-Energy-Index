import React from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Shield, ArrowRight, Globe } from 'lucide-react';
import { useLtcPrice } from '@/hooks/useLtcPrice';

export function HeroSection() {
  const { data: ltcData, isLive } = useLtcPrice();
  const isPositive = ltcData.changePercent24h >= 0;

  return (
    <section className="relative pt-32 sm:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-primary/20 mb-8"
        >
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs sm:text-sm font-medium text-gray-300">
            Litecoin-Powered Energy Protocol
          </span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary font-semibold">
            v2.0
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-black tracking-tight leading-[1.1] mb-6"
        >
          <span className="text-white">The Future of</span>
          <br />
          <span className="gradient-text">Energy Finance</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Mint energy-indexed tokens with Litecoin. Powered by multi-oracle
          consensus and global energy price data from 30+ countries.
        </motion.p>

        {/* Live LTC Price Ticker */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="inline-flex items-center gap-4 px-5 py-3 rounded-2xl glass border border-white/5 mb-10"
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
              <span className="text-xs font-black text-white">Ł</span>
            </div>
            <span className="text-sm text-gray-400">LTC/USD</span>
          </div>
          <span className="text-xl font-bold font-mono text-white">${ltcData.price.toFixed(2)}</span>
          <span className={`text-sm font-semibold ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}{ltcData.changePercent24h.toFixed(2)}%
          </span>
          <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <motion.a
            href="#mint"
            className="group flex items-center gap-2 px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Zap className="w-5 h-5" />
            Mint with LTC
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </motion.a>
          <motion.a
            href="#country-table"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl glass border border-white/10 text-white font-semibold text-base hover:border-primary/30 transition-all"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Globe className="w-5 h-5" />
            Energy Prices
          </motion.a>
        </motion.div>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-12 sm:mt-16"
        >
          {[
            { icon: Shield, label: 'Audited Contracts', color: 'text-emerald-400' },
            { icon: TrendingUp, label: 'Real-Time LTC Pricing', color: 'text-secondary' },
            { icon: Zap, label: 'Energy Indexed', color: 'text-primary' },
            { icon: Globe, label: '30+ Countries', color: 'text-accent' },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-gray-400">
              <Icon className={`w-4 h-4 ${color}`} />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Coins, Flame, ShieldCheck, BarChart3, Layers, Wifi, WifiOff } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { useLtcPrice } from '../hooks/useLtcPrice';
import { formatNumber, formatUSD } from '../utils/contractHelpers';
import EnergyGauge from './EnergyGauge';

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

export default function Dashboard() {
  const { isConnected, gei, oracleData, emissions, staking, lbtBalance, wltcBalance } = useMockContract();

  // Use the same price source as LtcKwhCalculator for consistency
  const { currentPrice: apiPrice, priceChange24h, isApiPrice, error: priceError } = useLtcPrice();

  // Unified price: prefer API price (same as calculator), fall back to oracle price
  const displayPrice = apiPrice ?? oracleData.ltcPrice;
  const priceSource = apiPrice !== null
    ? (isApiPrice ? 'api' : 'simulated')
    : 'oracle-fallback';

  const stats = [
    {
      label: 'LTC Price',
      value: formatUSD(displayPrice),
      icon: TrendingUp,
      color: 'text-secondary',
      bgColor: 'bg-secondary/10',
      change: priceChange24h !== null
        ? `${priceChange24h >= 0 ? '+' : ''}${priceChange24h.toFixed(1)}%`
        : '+2.4%',
      changePositive: priceChange24h !== null ? priceChange24h >= 0 : true,
      // Show price source indicator
      badge: priceSource === 'api' ? null : priceSource === 'simulated' ? 'Sim' : 'Oracle',
    },
    {
      label: 'Circulating Supply',
      value: formatNumber(emissions.circulatingSupply) + ' LBT',
      icon: Coins,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      change: '+0.3%',
      changePositive: true,
      badge: null,
    },
    {
      label: 'Total Burned',
      value: formatNumber(emissions.totalBurned) + ' LBT',
      icon: Flame,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      change: '+1.1%',
      changePositive: true,
      badge: null,
    },
    {
      label: 'Backing Ratio',
      value: (emissions.backingRatio * 100).toFixed(1) + '%',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-400/10',
      change: 'Healthy',
      changePositive: true,
      badge: null,
    },
    {
      label: 'Staking APR',
      value: staking.apr.toFixed(1) + '%',
      icon: BarChart3,
      color: 'text-amber-400',
      bgColor: 'bg-amber-400/10',
      change: staking.tier !== 'None' ? staking.tier : 'Connect',
      changePositive: true,
      badge: null,
    },
    {
      label: 'Total Minted',
      value: formatNumber(emissions.totalMinted) + ' LBT',
      icon: Layers,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-400/10',
      change: '+' + formatNumber(emissions.dailyMinted) + '/day',
      changePositive: true,
      badge: null,
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-6"
      >
        {/* Protocol badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full glass neon-border mb-3">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[10px] text-neutral-400">Protocol Active</span>
          <span className="v2-badge">v2</span>
          {/* Price source indicator */}
          {priceSource === 'api' ? (
            <span className="flex items-center gap-0.5 text-[9px] text-emerald-400 ml-1">
              <Wifi className="w-2.5 h-2.5" />
              Live
            </span>
          ) : (
            <span className="flex items-center gap-0.5 text-[9px] text-amber-400 ml-1">
              <WifiOff className="w-2.5 h-2.5" />
              {priceSource === 'simulated' ? 'Sim' : 'Fallback'}
            </span>
          )}
        </div>
        {/* Title */}
        <h2 className="text-3xl sm:text-4xl font-black mb-2 tracking-tight">
          <span className="gradient-text-v2">Litbreak</span>
          <span className="text-neutral-300"> Protocol</span>
        </h2>
        {/* Subtitle */}
        <p className="text-neutral-500 max-w-md mx-auto text-xs leading-relaxed">
          Energy-indexed stablecoin backed by wrapped Litecoin. Mint, redeem, stake, and earn
          with real-time oracle pricing and dynamic emissions.
        </p>
      </motion.div>

      {/* GEI Gauge + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="lg:col-span-3 glass-card rounded-2xl p-4 flex flex-col items-center justify-center neon-glow"
        >
          <EnergyGauge value={gei} />
          <div className="mt-2 text-center">
            <p className="text-[10px] text-neutral-500">Global Energy Index</p>
            <p className="text-[9px] text-neutral-600 font-mono mt-0.5">
              Updated {Math.floor((Date.now() - oracleData.lastUpdate) / 1000)}s ago
            </p>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="lg:col-span-9 grid grid-cols-2 md:grid-cols-3 gap-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className="glass-card rounded-xl p-3 group"
            >
              <div className="flex items-start justify-between mb-2">
                <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1">
                  {stat.badge && (
                    <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-amber-400/10 text-amber-400">
                      {stat.badge}
                    </span>
                  )}
                  <span
                    className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${
                      stat.changePositive
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : 'bg-red-400/10 text-red-400'
                    }`}
                  >
                    {stat.change}
                  </span>
                </div>
              </div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider mb-0.5">
                {stat.label}
              </p>
              <p className="text-base font-bold font-mono tracking-tight">{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Portfolio Summary (Connected) */}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-4 glass-card rounded-2xl p-4 neon-border"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-neutral-300">Your Portfolio</h3>
            <span className="v2-badge">Live</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">WLTC Balance</p>
              <p className="text-lg font-bold font-mono text-secondary">{formatNumber(wltcBalance, 4)}</p>
              <p className="text-[9px] text-neutral-600">{formatUSD(wltcBalance * displayPrice)}</p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">LBT Balance</p>
              <p className="text-lg font-bold font-mono text-primary">{formatNumber(lbtBalance, 2)}</p>
              <p className="text-[9px] text-neutral-600">{formatUSD(lbtBalance)}</p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Staked LBT</p>
              <p className="text-lg font-bold font-mono text-amber-400">{formatNumber(staking.stakedAmount, 2)}</p>
              <p className="text-[9px] text-neutral-600">{formatUSD(staking.stakedAmount)}</p>
            </div>
            <div>
              <p className="text-[9px] text-neutral-500 uppercase tracking-wider">Pending Rewards</p>
              <p className="text-lg font-bold font-mono text-emerald-400">{formatNumber(staking.pendingRewards, 4)}</p>
              <p className="text-[9px] text-neutral-600">{formatUSD(staking.pendingRewards)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

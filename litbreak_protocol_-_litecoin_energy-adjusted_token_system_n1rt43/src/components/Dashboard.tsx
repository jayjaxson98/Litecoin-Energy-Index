import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, BarChart3, Calculator, ArrowLeftRight, Shield, Coins, TrendingUp, Lock, Users } from 'lucide-react';
import EnergyIndexView from './EnergyIndexView';
import LitecoinChart from './LitecoinChart';
import Calculators from './Calculators';
import MintRedeem from './MintRedeem';
import { useEnergyIndex } from '../hooks/useEnergyIndex';
import { useLitbreakToken } from '../hooks/useLitbreakToken';
import { formatNumber, formatCurrency } from '../utils/format';
import { ltcPriceHistory } from '../data/energyData';

type Tab = 'overview' | 'energy' | 'calculators';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const { globalIndex, energyFactor } = useEnergyIndex();
  const { totalSupply, totalLtcLocked } = useLitbreakToken();
  const ltcPrice = ltcPriceHistory[ltcPriceHistory.length - 1].price;

  const tabs = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'energy' as Tab, label: 'Energy Index', icon: Zap },
    { id: 'calculators' as Tab, label: 'Calculators', icon: Calculator },
  ];

  const stats = [
    {
      label: 'Total Supply',
      value: formatNumber(totalSupply, 0),
      suffix: 'LBT',
      icon: Coins,
      color: '#9E7FFF',
      subtext: `of 84M cap (${formatNumber((totalSupply / 84_000_000) * 100, 2)}%)`,
    },
    {
      label: 'Total Value Locked',
      value: formatNumber(totalLtcLocked, 2),
      suffix: 'LTC',
      icon: Lock,
      color: '#38bdf8',
      subtext: formatCurrency(totalLtcLocked * ltcPrice),
    },
    {
      label: 'Energy Factor',
      value: formatNumber(energyFactor, 2),
      suffix: 'x',
      icon: Zap,
      color: '#10b981',
      subtext: `Index: ${formatNumber(globalIndex, 1)}¢/kWh`,
    },
    {
      label: 'LTC Price',
      value: formatCurrency(ltcPrice),
      suffix: '',
      icon: TrendingUp,
      color: '#f59e0b',
      subtext: 'Chainlink Oracle',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10"
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass border border-primary/20 mb-4">
          <div className="w-2 h-2 rounded-full bg-energy animate-pulse" />
          <span className="text-xs font-medium text-white/60">LitVM Testnet • Live</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-black mb-3">
          <span className="text-gradient from-primary via-secondary to-energy">Litbreak Protocol</span>
        </h1>
        <p className="text-base text-white/40 max-w-2xl mx-auto">
          Energy-adjusted token economics linking real-world electricity prices to Litecoin-native minting.
          Cheaper energy means more favorable minting rates.
        </p>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat, idx) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.08 }}
            className="rounded-xl neon-border p-4 group hover:scale-[1.02] transition-transform"
            style={{ background: 'rgba(18, 18, 26, 0.8)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
              <span className="text-xs text-white/40">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold font-mono text-white">{stat.value}</span>
              {stat.suffix && <span className="text-sm font-medium" style={{ color: stat.color }}>{stat.suffix}</span>}
            </div>
            <div className="text-xs text-white/25 mt-1">{stat.subtext}</div>
          </motion.div>
        ))}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl glass border border-white/5 mb-8 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-primary/15 text-primary border border-primary/20'
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <LitecoinChart />
            {/* Protocol Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl neon-border p-6"
              style={{ background: 'rgba(18, 18, 26, 0.8)' }}
            >
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Protocol Mechanics
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl glass border border-white/5">
                  <div className="text-2xl mb-2">⚡</div>
                  <h4 className="text-sm font-semibold text-white mb-1">Energy-Adjusted Minting</h4>
                  <p className="text-xs text-white/40">
                    LBT minting rates dynamically adjust based on global electricity costs. Lower energy prices increase the efficiency factor.
                  </p>
                </div>
                <div className="p-4 rounded-xl glass border border-white/5">
                  <div className="text-2xl mb-2">🔒</div>
                  <h4 className="text-sm font-semibold text-white mb-1">LTC-Backed Reserves</h4>
                  <p className="text-xs text-white/40">
                    Every LBT is backed by locked LTC in the protocol. Redeem anytime with a minimal 0.3% fee.
                  </p>
                </div>
                <div className="p-4 rounded-xl glass border border-white/5">
                  <div className="text-2xl mb-2">🌍</div>
                  <h4 className="text-sm font-semibold text-white mb-1">30-Country Index</h4>
                  <p className="text-xs text-white/40">
                    Real-time electricity data from 30 countries feeds the Global Energy Index via Chainlink oracles.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          <div className="space-y-6">
            <MintRedeem />
          </div>
        </div>
      )}

      {activeTab === 'energy' && <EnergyIndexView />}
      {activeTab === 'calculators' && (
        <div className="space-y-6">
          <Calculators />
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2">
              <LitecoinChart />
            </div>
            <MintRedeem />
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Zap,
  TrendingUp,
  Shield,
  Coins,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3,
  Clock,
  ChevronDown,
  Copy,
  Check,
  LogOut,
  Flame,
  Lock,
  Unlock,
  Users,
  ExternalLink,
  Sparkles,
  CircleDot,
  Calculator,
  Globe,
  Wrench,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';

// New feature components
import LitoshiKwhCalculator from './LitoshiKwhCalculator';
import LitoshiLtcConverter from './LitoshiLtcConverter';
import ElectricityPriceTable from './ElectricityPriceTable';
import LtcPriceChart from './LtcPriceChart';

// ─── Display Constants (LBT Rebranding) ──────────────────────
// NOTE: On-chain symbol remains "LITB" — LBT is display-only.
const TOKEN_DISPLAY_NAME = 'LBT';
const TOKEN_FULL_NAME = 'LitBreak Token';
const PROTOCOL_NAME = 'Litbreak Protocol';

// ─── Mock Data ───────────────────────────────────────────────
const generatePriceData = () => {
  const data = [];
  let price = 0.042;
  for (let i = 30; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    price += (Math.random() - 0.48) * 0.003;
    price = Math.max(0.01, price);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      price: parseFloat(price.toFixed(4)),
      volume: Math.floor(Math.random() * 500000 + 100000),
    });
  }
  return data;
};

const generateEnergyData = () => {
  const data = [];
  for (let i = 24; i >= 0; i--) {
    data.push({
      hour: `${(24 - i).toString().padStart(2, '0')}:00`,
      hashrate: Math.floor(Math.random() * 200 + 600),
      energyIndex: parseFloat((Math.random() * 0.3 + 0.7).toFixed(3)),
    });
  }
  return data;
};

const PROTOCOL_STATS = {
  tvl: '$2,847,392',
  totalSupply: `10,000,000 ${TOKEN_DISPLAY_NAME}`,
  circulatingSupply: `3,247,891 ${TOKEN_DISPLAY_NAME}`,
  energyIndex: '0.847',
  stakingAPY: '12.4%',
  holders: '1,247',
  contractVersion: 13,
  guardianEnabled: true,
};

// ─── Navigation Tabs ─────────────────────────────────────────
type TabId = 'dashboard' | 'tools' | 'analytics';

const NAV_TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'tools', label: 'Tools', icon: Wrench },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

// ─── Background Particles ────────────────────────────────────
function BackgroundEffects() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/8 rounded-full blur-3xl animate-float" />
      <div className="absolute top-1/3 -left-32 w-80 h-80 bg-secondary/6 rounded-full blur-3xl animate-float-delayed" />
      <div className="absolute bottom-20 right-1/4 w-72 h-72 bg-accent/5 rounded-full blur-3xl animate-pulse-glow" />
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(158,127,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(158,127,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />
      {Array.from({ length: 20 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-primary/20"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ─── Header ──────────────────────────────────────────────────
function Header({ activeTab, setActiveTab }: { activeTab: TabId; setActiveTab: (t: TabId) => void }) {
  const { address, shortAddress, connectWallet, disconnectWallet, ltcBalance } = useWallet();
  const { isConnecting, network } = useWeb3();
  const [copied, setCopied] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCopy = useCallback(() => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [address]);

  return (
    <header className="relative z-20 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/20">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-success border-2 border-background" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">
                {PROTOCOL_NAME.split(' ')[0]}<span className="text-primary">{PROTOCOL_NAME.split(' ')[1]}</span>
              </h1>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">
                {network.name} • v{PROTOCOL_STATS.contractVersion} • {TOKEN_DISPLAY_NAME}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          {address && (
            <nav className="hidden md:flex items-center gap-1 bg-surface/40 rounded-xl p-1">
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-primary/15 text-primary shadow-sm'
                      : 'text-gray-400 hover:text-white hover:bg-surface/60'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          )}

          {/* Network + Wallet */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface/60 border border-border/50">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-xs font-medium text-gray-400">{network.name}</span>
            </div>

            {address ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface border border-border/50
                             hover:border-primary/30 transition-all duration-300 group"
                >
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <Wallet className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="text-left hidden sm:block">
                    <p className="text-xs font-mono text-white">{shortAddress}</p>
                    <p className="text-[10px] text-gray-500">{ltcBalance} LTC</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-primary transition-colors" />
                </button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 top-full mt-2 w-64 glass-card p-2 z-50"
                    >
                      <div className="px-3 py-2 mb-1">
                        <p className="text-xs text-gray-500">Connected Address</p>
                        <p className="text-sm font-mono text-white truncate">{address}</p>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface/80 transition-colors text-left"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-300">
                          {copied ? 'Copied!' : 'Copy Address'}
                        </span>
                      </button>
                      <button
                        onClick={() => {
                          disconnectWallet();
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-error/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-error" />
                        <span className="text-sm text-error">Disconnect</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={isConnecting}
                className="gradient-button px-5 py-2.5 flex items-center gap-2 text-sm"
              >
                {isConnecting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4" />
                    Connect Wallet
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {address && (
          <div className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto scrollbar-hide">
            {NAV_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/15 text-primary'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({
  icon: Icon,
  label,
  value,
  change,
  changeType,
  delay = 0,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="glass-card-hover p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Icon className="w-5 h-5 text-primary" />
        </div>
        {change && (
          <div
            className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg ${
              changeType === 'positive'
                ? 'text-success bg-success/10'
                : changeType === 'negative'
                ? 'text-error bg-error/10'
                : 'text-gray-400 bg-surface'
            }`}
          >
            {changeType === 'positive' ? (
              <ArrowUpRight className="w-3 h-3" />
            ) : changeType === 'negative' ? (
              <ArrowDownRight className="w-3 h-3" />
            ) : null}
            {change}
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-white mb-1">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </motion.div>
  );
}

// ─── LBT Price Chart (Protocol Token) ────────────────────────
function LbtPriceChart() {
  const priceData = useMemo(() => generatePriceData(), []);
  const [timeframe, setTimeframe] = useState<'7D' | '30D' | '90D'>('30D');

  const filteredData = useMemo(() => {
    const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
    return priceData.slice(-days);
  }, [priceData, timeframe]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            {TOKEN_DISPLAY_NAME} Price
          </h3>
          <p className="text-sm text-gray-500 mt-1">Energy-indexed token price</p>
        </div>
        <div className="flex gap-1 bg-surface rounded-lg p-1">
          {(['7D', '30D', '90D'] as const).map(tf => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                timeframe === tf
                  ? 'bg-primary text-white shadow-lg shadow-primary/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9E7FFF" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#9E7FFF" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
            <XAxis
              dataKey="date"
              stroke="#525252"
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#525252"
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v: number) => `$${v.toFixed(3)}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#262626',
                border: '1px solid #2F2F2F',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: '#a3a3a3', fontSize: 12 }}
              itemStyle={{ color: '#9E7FFF', fontSize: 13, fontWeight: 600 }}
              formatter={(value: number) => [`$${value.toFixed(4)}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#9E7FFF"
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── Energy Index Chart ──────────────────────────────────────
function EnergyChart() {
  const energyData = useMemo(() => generateEnergyData(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
      className="glass-card p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-secondary" />
            Energy Index
          </h3>
          <p className="text-sm text-gray-500 mt-1">24h hashrate & energy metrics</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-success/10 border border-success/20">
          <CircleDot className="w-3 h-3 text-success" />
          <span className="text-xs font-medium text-success">Live</span>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={energyData}>
            <defs>
              <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.2} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2F2F2F" />
            <XAxis
              dataKey="hour"
              stroke="#525252"
              tick={{ fill: '#737373', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval={3}
            />
            <YAxis
              stroke="#525252"
              tick={{ fill: '#737373', fontSize: 11 }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#262626',
                border: '1px solid #2F2F2F',
                borderRadius: '12px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              }}
              labelStyle={{ color: '#a3a3a3', fontSize: 12 }}
              formatter={(value: number, name: string) => [
                name === 'hashrate' ? `${value} TH/s` : value.toFixed(3),
                name === 'hashrate' ? 'Hashrate' : 'Energy Index',
              ]}
            />
            <Bar dataKey="hashrate" fill="url(#barGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

// ─── Token Actions Panel (LBT Rebranded) ─────────────────────
function TokenActions() {
  const { address, litbreakBalance, addTransaction } = useWallet();
  const [activeTab, setActiveTab] = useState<'mint' | 'burn' | 'stake'>('mint');
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleAction = useCallback(async () => {
    if (!amount || parseFloat(amount) <= 0 || isProcessing) return;

    setIsProcessing(true);

    const chars = '0123456789abcdef';
    let hash = '0x';
    for (let i = 0; i < 64; i++) hash += chars[Math.floor(Math.random() * chars.length)];

    addTransaction({
      type: activeTab,
      amount: `${parseFloat(amount).toLocaleString()} ${TOKEN_DISPLAY_NAME}`,
      status: 'pending',
      hash,
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    addTransaction({
      type: activeTab,
      amount: `${parseFloat(amount).toLocaleString()} ${TOKEN_DISPLAY_NAME}`,
      status: 'confirmed',
      hash,
    });

    setAmount('');
    setIsProcessing(false);
  }, [amount, activeTab, isProcessing, addTransaction]);

  if (!address) return null;

  const tabs = [
    { id: 'mint' as const, label: 'Mint', icon: Sparkles, color: 'text-primary' },
    { id: 'burn' as const, label: 'Burn', icon: Flame, color: 'text-error' },
    { id: 'stake' as const, label: 'Stake', icon: Lock, color: 'text-success' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Coins className="w-5 h-5 text-primary" />
        Token Actions
      </h3>

      <div className="flex gap-1 bg-background/60 rounded-xl p-1 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-surface text-white shadow-lg'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? tab.color : ''}`} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Balance Display — LBT rebranded */}
      <div className="mb-4 p-4 rounded-xl bg-background/60 border border-border/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">Available Balance</span>
          <span className="text-sm font-mono text-white">{litbreakBalance.balance} {TOKEN_DISPLAY_NAME}</span>
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-gray-600">USD Value</span>
          <span className="text-xs font-mono text-gray-400">
            ≈ ${litbreakBalance.usdValue.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Amount Input */}
      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-2 block">Amount</label>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 rounded-xl bg-background/80 border border-border/50 text-white
                       font-mono text-lg placeholder:text-gray-600 focus:outline-none focus:border-primary/50
                       focus:ring-1 focus:ring-primary/20 transition-all duration-200"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => setAmount(litbreakBalance.balance.replace(/,/g, ''))}
              className="text-xs text-primary hover:text-primary/80 font-medium transition-colors"
            >
              MAX
            </button>
            <span className="text-sm text-gray-500 font-medium">{TOKEN_DISPLAY_NAME}</span>
          </div>
        </div>
      </div>

      {/* Fee Breakdown */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Network Fee</span>
          <span className="text-gray-400 font-mono">~0.0001 LTC</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-500">Protocol Fee</span>
          <span className="text-gray-400 font-mono">0.3%</span>
        </div>
        {activeTab === 'mint' && (
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Energy Index Multiplier</span>
            <span className="text-secondary font-mono">×{PROTOCOL_STATS.energyIndex}</span>
          </div>
        )}
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
        className={`w-full py-3.5 rounded-xl font-semibold text-white transition-all duration-300
                    flex items-center justify-center gap-2 ${
                      activeTab === 'mint'
                        ? 'bg-gradient-to-r from-primary to-purple-600 hover:shadow-lg hover:shadow-primary/25'
                        : activeTab === 'burn'
                        ? 'bg-gradient-to-r from-error to-red-600 hover:shadow-lg hover:shadow-error/25'
                        : 'bg-gradient-to-r from-success to-emerald-600 hover:shadow-lg hover:shadow-success/25'
                    } disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]`}
      >
        {isProcessing ? (
          <>
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Processing...
          </>
        ) : (
          <>
            {activeTab === 'mint' && <Sparkles className="w-5 h-5" />}
            {activeTab === 'burn' && <Flame className="w-5 h-5" />}
            {activeTab === 'stake' && <Lock className="w-5 h-5" />}
            {activeTab === 'mint' ? `Mint ${TOKEN_DISPLAY_NAME}` : activeTab === 'burn' ? `Burn ${TOKEN_DISPLAY_NAME}` : `Stake ${TOKEN_DISPLAY_NAME}`}
          </>
        )}
      </button>
    </motion.div>
  );
}

// ─── Transaction History (LBT Rebranded) ─────────────────────
function TransactionHistory() {
  const { transactions, address } = useWallet();

  if (!address) return null;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'mint': return <Sparkles className="w-4 h-4 text-primary" />;
      case 'burn': return <Flame className="w-4 h-4 text-error" />;
      case 'stake': return <Lock className="w-4 h-4 text-success" />;
      case 'unstake': return <Unlock className="w-4 h-4 text-warning" />;
      case 'claim': return <Coins className="w-4 h-4 text-secondary" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="flex items-center gap-1 text-xs text-warning bg-warning/10 px-2 py-0.5 rounded-full">
            <div className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
            Pending
          </span>
        );
      case 'confirmed':
        return (
          <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
            Confirmed
          </span>
        );
      case 'failed':
        return (
          <span className="text-xs text-error bg-error/10 px-2 py-0.5 rounded-full">
            Failed
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        Recent Transactions
      </h3>

      {transactions.length === 0 ? (
        <div className="text-center py-8">
          <Activity className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No transactions yet</p>
          <p className="text-xs text-gray-600 mt-1">Your {TOKEN_DISPLAY_NAME} transaction history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {transactions.slice(0, 5).map(tx => (
            <div
              key={tx.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-background/40 border border-border/20
                         hover:border-border/40 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-surface flex items-center justify-center flex-shrink-0">
                {getTypeIcon(tx.type)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                  {getStatusBadge(tx.status)}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{tx.amount}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs text-gray-500">
                  {new Date(tx.timestamp).toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
                <a
                  href={`https://explorer.litvm.test/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-primary hover:text-primary/80 flex items-center gap-0.5 justify-end mt-0.5"
                >
                  {tx.hash.slice(0, 8)}...
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─── Guardian Status Panel ───────────────────────────────────
function GuardianPanel() {
  const { address } = useWallet();

  if (!address) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.7 }}
      className="glass-card p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
        <Shield className="w-5 h-5 text-primary" />
        Guardian Co-Signer
        <span className="text-[10px] font-mono text-gray-500 bg-surface px-2 py-0.5 rounded-full">
          Pass 13
        </span>
      </h3>

      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-background/60 border border-border/30">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Guardian Status</span>
            <span className="flex items-center gap-1.5 text-xs font-medium text-warning bg-warning/10 px-2.5 py-1 rounded-full">
              <Users className="w-3 h-3" />
              Not Set
            </span>
          </div>
          <p className="text-xs text-gray-500 leading-relaxed">
            The Guardian Co-Signer system adds dual-approval security for critical {TOKEN_DISPLAY_NAME} operations.
            When enabled, sensitive actions require both owner and guardian confirmation.
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Security Tiers</p>
          {[
            { tier: 'Critical', desc: 'Dual-approval required', color: 'text-error', bg: 'bg-error/10', border: 'border-error/20' },
            { tier: 'Sensitive', desc: 'Timelock protected', color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20' },
            { tier: 'Operational', desc: 'Owner-only', color: 'text-success', bg: 'bg-success/10', border: 'border-success/20' },
          ].map(item => (
            <div
              key={item.tier}
              className={`flex items-center justify-between p-3 rounded-lg ${item.bg} border ${item.border}`}
            >
              <span className={`text-sm font-medium ${item.color}`}>{item.tier}</span>
              <span className="text-xs text-gray-400">{item.desc}</span>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-background/60 border border-border/30 text-center">
            <p className="text-xl font-bold text-white">0</p>
            <p className="text-xs text-gray-500 mt-1">Active Proposals</p>
          </div>
          <div className="p-3 rounded-xl bg-background/60 border border-border/30 text-center">
            <p className="text-xl font-bold text-white">7d</p>
            <p className="text-xs text-gray-500 mt-1">Proposal Expiry</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Connect Prompt ──────────────────────────────────────────
function ConnectPrompt() {
  const { connectWallet } = useWallet();
  const { isConnecting } = useWeb3();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className="flex items-center justify-center min-h-[60vh]"
    >
      <div className="glass-card p-10 max-w-md w-full text-center gradient-border">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary to-purple-600 animate-pulse-glow" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-2xl shadow-primary/30">
            <Zap className="w-10 h-10 text-white" />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          Welcome to <span className="gradient-text">{PROTOCOL_NAME}</span>
        </h2>
        <p className="text-gray-400 mb-8 leading-relaxed">
          Connect your wallet to access energy-indexed DeFi on the LitVM network.
          Mint, burn, and stake {TOKEN_DISPLAY_NAME} tokens powered by Litecoin's energy metrics.
        </p>

        <button
          onClick={connectWallet}
          disabled={isConnecting}
          className="gradient-button w-full py-4 text-base flex items-center justify-center gap-3"
        >
          {isConnecting ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Connecting...
            </>
          ) : (
            <>
              <Wallet className="w-5 h-5" />
              Connect Wallet
            </>
          )}
        </button>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Secure
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            LitVM Testnet
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-700" />
          <span>v{PROTOCOL_STATS.contractVersion}</span>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Dashboard Tab Content ───────────────────────────────────
function DashboardContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart3}
          label="Total Value Locked"
          value={PROTOCOL_STATS.tvl}
          change="+8.2%"
          changeType="positive"
          delay={0.1}
        />
        <StatCard
          icon={Coins}
          label="Circulating Supply"
          value={PROTOCOL_STATS.circulatingSupply}
          change="+1,247"
          changeType="positive"
          delay={0.15}
        />
        <StatCard
          icon={Activity}
          label="Energy Index"
          value={PROTOCOL_STATS.energyIndex}
          change="-0.012"
          changeType="negative"
          delay={0.2}
        />
        <StatCard
          icon={TrendingUp}
          label="Staking APY"
          value={PROTOCOL_STATS.stakingAPY}
          change="Stable"
          changeType="neutral"
          delay={0.25}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LbtPriceChart />
        <EnergyChart />
      </div>

      {/* Actions Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <TokenActions />
        <TransactionHistory />
        <GuardianPanel />
      </div>
    </div>
  );
}

// ─── Tools Tab Content ───────────────────────────────────────
function ToolsContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-primary/20 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Conversion Tools</h2>
          <p className="text-sm text-gray-500">Litoshi calculators and unit converters</p>
        </div>
      </motion.div>

      {/* Calculators Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LitoshiKwhCalculator />
        <LitoshiLtcConverter />
      </div>

      {/* Electricity Price Table */}
      <ElectricityPriceTable />
    </div>
  );
}

// ─── Analytics Tab Content ───────────────────────────────────
function AnalyticsContent() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Section Header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Market Analytics</h2>
          <p className="text-sm text-gray-500">Litecoin price data and market metrics</p>
        </div>
      </motion.div>

      {/* LTC Price Chart */}
      <LtcPriceChart />

      {/* Protocol Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LbtPriceChart />
        <EnergyChart />
      </div>
    </div>
  );
}

// ─── Main Dashboard ──────────────────────────────────────────
export default function Dashboard() {
  const { address } = useWallet();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div className="min-h-screen bg-background relative">
      <BackgroundEffects />
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!address ? (
          <ConnectPrompt />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === 'dashboard' && <DashboardContent />}
              {activeTab === 'tools' && <ToolsContent />}
              {activeTab === 'analytics' && <AnalyticsContent />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Footer — LBT Rebranded */}
      <footer className="relative z-10 border-t border-border/30 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-gray-500">
                {PROTOCOL_NAME} v{PROTOCOL_STATS.contractVersion} • {TOKEN_FULL_NAME} ({TOKEN_DISPLAY_NAME})
              </span>
            </div>
            <div className="flex items-center gap-6 text-xs text-gray-600">
              <span>{PROTOCOL_STATS.holders} holders</span>
              <span>•</span>
              <span>LitVM Testnet</span>
              <span>•</span>
              <span>Guardian Co-Signer Enabled</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

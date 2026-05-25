import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, ChevronDown, ExternalLink, Copy, LogOut, Check } from 'lucide-react';
import { useWallet } from '../hooks/useWallet';

export function Header() {
  const { address, isConnected, connect, disconnect, balance } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const truncateAddress = (addr: string) =>
    `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-white/[0.06] bg-background/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center glow-primary"
          >
            <Zap className="w-5 h-5 text-white" fill="currentColor" />
          </motion.div>
          <div>
            <h1 className="text-base font-bold gradient-text leading-tight">LITBREAK</h1>
            <p className="text-[10px] text-textSecondary tracking-widest uppercase">Energy Protocol</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {['Dashboard', 'Mint', 'Analytics', 'Governance'].map((item, i) => (
            <button
              key={item}
              className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                i === 0
                  ? 'text-white bg-white/[0.06]'
                  : 'text-textSecondary hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Wallet */}
        <div className="relative">
          {isConnected ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface/80 border border-white/[0.08] hover:border-primary/30 transition-all"
            >
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm font-mono text-white">{truncateAddress(address!)}</span>
              <ChevronDown className="w-3.5 h-3.5 text-textSecondary" />
            </motion.button>
          ) : (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={connect}
              className="btn-primary flex items-center gap-2 !py-2 !px-4 text-sm"
            >
              <Wallet className="w-4 h-4" />
              Connect Wallet
            </motion.button>
          )}

          <AnimatePresence>
            {showDropdown && isConnected && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-64 glass-card p-3 space-y-2"
              >
                <div className="px-2 py-1.5">
                  <p className="text-xs text-textSecondary">Balance</p>
                  <p className="text-lg font-bold text-white">{balance} LTC</p>
                </div>
                <div className="h-px bg-white/[0.06]" />
                <button
                  onClick={copyAddress}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-textSecondary hover:text-white hover:bg-white/[0.04] transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-textSecondary hover:text-white hover:bg-white/[0.04] transition-all">
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Explorer
                </button>
                <div className="h-px bg-white/[0.06]" />
                <button
                  onClick={() => { disconnect(); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-error hover:bg-error/10 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

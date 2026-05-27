import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, LogOut, ChevronDown, Zap, Shield, AlertTriangle } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { formatAddress } from '../utils/contractHelpers';

export default function Header() {
  const { isConnected, address, network, chainId, connectWallet, disconnectWallet, oracleData } = useMockContract();
  const [showMenu, setShowMenu] = useState(false);

  // Oracle fallback indicator in header
  const oracleIndicator = oracleData.usingFallback
    ? { color: 'text-amber-400', bg: 'bg-amber-400/10', icon: AlertTriangle, label: 'Fallback' }
    : { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: Shield, label: 'Primary' };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#0a0a0a] animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm font-bold tracking-tight">
                Litbreak <span className="text-primary">v2</span>
              </h1>
              <p className="text-[9px] text-neutral-500 -mt-0.5 tracking-wider uppercase">Energy Stablecoin</p>
            </div>
          </div>

          {/* Right side: Network + Oracle Status + Wallet */}
          <div className="flex items-center gap-2">
            {/* Network badge — LitVM Testnet */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg glass text-[10px]">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-neutral-400 font-medium">{network}</span>
              <span className="text-neutral-600 font-mono">#{chainId}</span>
            </div>

            {/* Oracle source indicator */}
            <div className={`hidden md:flex items-center gap-1 px-2 py-1 rounded-lg ${oracleIndicator.bg} text-[10px] border border-white/5`}>
              <oracleIndicator.icon className={`w-3 h-3 ${oracleIndicator.color}`} />
              <span className={`font-medium ${oracleIndicator.color}`}>{oracleIndicator.label}</span>
            </div>

            {/* Wallet button */}
            {isConnected ? (
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl glass neon-border text-xs font-medium"
                >
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="font-mono text-[11px]">{formatAddress(address)}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      className="absolute right-0 mt-2 w-48 glass-card rounded-xl p-2 border border-white/10"
                    >
                      <div className="px-3 py-2 border-b border-white/5 mb-1">
                        <p className="text-[10px] text-neutral-500">Connected to</p>
                        <p className="text-[11px] font-mono text-primary">{formatAddress(address)}</p>
                        <p className="text-[10px] text-neutral-600 mt-0.5">{network} (#{chainId})</p>
                      </div>
                      <button
                        onClick={() => { disconnectWallet(); setShowMenu(false); }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-red-400 hover:bg-red-400/10 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Disconnect
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-xs font-semibold shadow-lg shadow-primary/20"
              >
                <Wallet className="w-3.5 h-3.5" />
                Connect
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

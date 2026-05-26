import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Wallet, ChevronDown, LogOut, Copy, ExternalLink, Check } from 'lucide-react';
import { useWeb3 } from '@/contexts/Web3Context';

export function Header() {
  const { address, isConnected, isConnecting, balance, chainId, isSimulation, connect, disconnect } = useWeb3();
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

  const networkName = chainId === 1 ? 'Ethereum' : chainId === 5 ? 'Goerli' : chainId === 11155111 ? 'Sepolia' : 'Unknown';

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 glass-strong"
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <motion.div
                className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary via-secondary to-accent"
                animate={{ opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
                style={{ filter: 'blur(8px)' }}
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                Litbreak
              </h1>
              <p className="text-[10px] sm:text-xs text-gray-500 font-medium tracking-widest uppercase">
                Protocol
              </p>
            </div>
          </motion.div>

          {/* Nav Links - Hidden on mobile */}
          <nav className="hidden md:flex items-center gap-8">
            {['Dashboard', 'Mint', 'Analytics', 'Docs'].map((item) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                className="text-sm text-gray-400 hover:text-white transition-colors relative group"
                whileHover={{ y: -1 }}
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-primary to-secondary group-hover:w-full transition-all duration-300" />
              </motion.a>
            ))}
          </nav>

          {/* Wallet */}
          <div className="relative">
            {isConnected ? (
              <div>
                <motion.button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl glass border border-white/5 hover:border-primary/30 transition-all"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isSimulation && (
                    <span className="hidden sm:inline-flex px-1.5 py-0.5 text-[10px] font-bold bg-warning/20 text-warning rounded-md">
                      SIM
                    </span>
                  )}
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-mono font-medium text-white">
                    {truncateAddress(address!)}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
                </motion.button>

                <AnimatePresence>
                  {showDropdown && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl glass-strong p-4 shadow-2xl"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Network</span>
                          <span className="text-xs font-medium text-primary">{networkName}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Balance</span>
                          <span className="text-sm font-mono font-semibold text-white">{balance} ETH</span>
                        </div>
                        <div className="h-px bg-white/5" />
                        <button
                          onClick={copyAddress}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300"
                        >
                          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                          {copied ? 'Copied!' : 'Copy Address'}
                        </button>
                        <button
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-gray-300"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on Explorer
                        </button>
                        <div className="h-px bg-white/5" />
                        <button
                          onClick={() => { disconnect(); setShowDropdown(false); }}
                          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg hover:bg-red-500/10 transition-colors text-sm text-red-400"
                        >
                          <LogOut className="w-4 h-4" />
                          Disconnect
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <motion.button
                onClick={connect}
                disabled={isConnecting}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.header>
  );
}

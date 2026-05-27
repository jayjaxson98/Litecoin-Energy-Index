import React, { useState } from 'react';
import { useWallet } from '../context/WalletContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, ChevronDown, LogOut, RefreshCw, Copy, ExternalLink } from 'lucide-react';
import { formatNumber, shortenAddress } from '../utils/format';

const WalletButton: React.FC = () => {
  const { connected, connecting, address, network, ltcBalance, lbtBalance, connect, disconnect, refreshBalances } = useWallet();
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!connected) {
    return (
      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={connect}
        disabled={connecting}
        className="relative group flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300 overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #9E7FFF 0%, #7C5CE0 50%, #5B3DC8 100%)',
          boxShadow: '0 0 20px rgba(158, 127, 255, 0.3), 0 4px 15px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        {connecting ? (
          <RefreshCw className="w-4 h-4 animate-spin" />
        ) : (
          <Wallet className="w-4 h-4" />
        )}
        <span>{connecting ? 'Connecting...' : 'Connect Wallet'}</span>
      </motion.button>
    );
  }

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        onClick={() => setShowDropdown(!showDropdown)}
        className="flex items-center gap-3 px-4 py-2 rounded-xl glass neon-border transition-all duration-300"
      >
        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
        <div className="text-left">
          <div className="text-xs text-white/60 font-mono">{address}</div>
          <div className="text-xs text-primary font-medium">{network}</div>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
      </motion.button>

      <AnimatePresence>
        {showDropdown && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-72 rounded-xl glass-strong neon-border p-4 z-50"
            >
              {/* Balances */}
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/50">LTC Balance</span>
                  <span className="text-sm font-mono font-semibold text-secondary">
                    {formatNumber(ltcBalance / 1e8, 4)} LTC
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-white/50">LBT Balance</span>
                  <span className="text-sm font-mono font-semibold text-primary">
                    {formatNumber(lbtBalance / 1e8, 2)} LBT
                  </span>
                </div>
              </div>

              <div className="border-t border-white/10 pt-3 space-y-1">
                <button
                  onClick={handleCopy}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/70 hover:text-white"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copied ? 'Copied!' : 'Copy Address'}
                </button>
                <button
                  onClick={refreshBalances}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/70 hover:text-white"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Refresh Balances
                </button>
                <a
                  href="#"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/70 hover:text-white"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View on Explorer
                </a>
                <button
                  onClick={() => { disconnect(); setShowDropdown(false); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-error/10 transition-colors text-sm text-error/80 hover:text-error"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Disconnect
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WalletButton;

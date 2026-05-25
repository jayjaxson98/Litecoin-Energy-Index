/**
 * ChainSelector — Network/chain selector dropdown component.
 * Allows users to switch between supported networks.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Check, Globe, Wifi, WifiOff } from 'lucide-react';
import type { NetworkInfo } from '../types';
import { useWallet } from '../contexts/WalletContext';

// ─── Supported Networks ──────────────────────────────────────────────────────

const SUPPORTED_NETWORKS: NetworkInfo[] = [
  {
    id: 'litvm-testnet',
    name: 'LitVM Testnet',
    chainId: 421611,
    rpcUrl: 'https://rpc.litvm-testnet.io',
    explorerUrl: 'https://explorer.litvm-testnet.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: true,
    color: '#38bdf8',
  },
  {
    id: 'litvm-mainnet',
    name: 'LitVM Mainnet',
    chainId: 421612,
    rpcUrl: 'https://rpc.litvm.io',
    explorerUrl: 'https://explorer.litvm.io',
    nativeCurrency: { name: 'Litecoin', symbol: 'LTC', decimals: 18 },
    isTestnet: false,
    color: '#9E7FFF',
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function ChainSelector() {
  const { chainId, switchNetwork, connected } = useWallet();
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const currentNetwork = SUPPORTED_NETWORKS.find(n => n.chainId === chainId) || SUPPORTED_NETWORKS[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSwitch = async (network: NetworkInfo) => {
    if (network.chainId === chainId) {
      setOpen(false);
      return;
    }

    setSwitching(true);
    try {
      await switchNetwork(network.chainId);
    } catch {
      // Ignore errors
    } finally {
      setSwitching(false);
      setOpen(false);
    }
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={!connected}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
          connected
            ? 'bg-surface/60 border-white/[0.08] text-white hover:bg-surface/80 hover:border-white/[0.12]'
            : 'bg-surface/30 border-white/[0.04] text-textSecondary cursor-not-allowed'
        }`}
      >
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: currentNetwork.color || '#38bdf8' }}
        />
        <span className="hidden sm:inline">{currentNetwork.name}</span>
        <span className="sm:hidden">{currentNetwork.isTestnet ? 'Test' : 'Main'}</span>
        <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-56 bg-surface border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="p-2 border-b border-white/[0.06]">
              <div className="flex items-center gap-2 px-2 py-1">
                <Globe className="w-3.5 h-3.5 text-textSecondary" />
                <span className="text-[11px] text-textSecondary font-medium">Select Network</span>
              </div>
            </div>

            <div className="p-1.5">
              {SUPPORTED_NETWORKS.map(network => (
                <button
                  key={network.id}
                  onClick={() => handleSwitch(network)}
                  disabled={switching}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs transition-all ${
                    network.chainId === chainId
                      ? 'bg-primary/10 text-white'
                      : 'text-textSecondary hover:bg-white/[0.04] hover:text-white'
                  } disabled:opacity-50`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: network.color || '#38bdf8' }}
                    />
                    <div className="text-left">
                      <p className="font-medium">{network.name}</p>
                      <p className="text-[10px] text-textSecondary/60 mt-0.5">
                        Chain ID: {network.chainId}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {network.isTestnet && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-warning/10 text-warning font-medium">
                        Testnet
                      </span>
                    )}
                    {network.chainId === chainId && (
                      <Check className="w-3.5 h-3.5 text-success" />
                    )}
                  </div>
                </button>
              ))}
            </div>

            <div className="p-2 border-t border-white/[0.06]">
              <div className="flex items-center gap-1.5 px-2 py-1">
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3 text-success" />
                    <span className="text-[10px] text-success">Connected</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-textSecondary" />
                    <span className="text-[10px] text-textSecondary">Not connected</span>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

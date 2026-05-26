// ─── Header ─── Top navigation with wallet connection

import { Wallet, Zap, ChevronDown, Power, ToggleLeft, ToggleRight } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useWeb3 } from '../contexts/Web3Context';
import { shortenAddress } from '../lib/format';
import { GlowButton } from './GlowButton';

export function Header() {
  const { address, isConnected, isSimulation, balance, connect, disconnect, toggleSimulation } = useWallet();
  const { network, isCorrectNetwork, switchNetwork } = useWeb3();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#171717] animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white tracking-tight">LitBreak</h1>
              <p className="text-[10px] text-white/30 -mt-0.5 font-medium tracking-widest uppercase">Protocol</p>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Simulation Toggle */}
            <button
              onClick={toggleSimulation}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/5"
              title={isSimulation ? 'Simulation Mode ON' : 'Simulation Mode OFF'}
            >
              {isSimulation ? (
                <ToggleRight className="w-4 h-4 text-amber-400" />
              ) : (
                <ToggleLeft className="w-4 h-4 text-white/40" />
              )}
              <span className="hidden sm:inline">{isSimulation ? 'Sim' : 'Live'}</span>
            </button>

            {/* Network */}
            {isConnected && (
              <button
                onClick={switchNetwork}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${isCorrectNetwork
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                  }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${isCorrectNetwork ? 'bg-emerald-400' : 'bg-red-400'}`} />
                {isCorrectNetwork ? network.name : 'Wrong Network'}
                <ChevronDown className="w-3 h-3" />
              </button>
            )}

            {/* Wallet */}
            {isConnected ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-xs font-mono text-white/70">{shortenAddress(address ?? '')}</span>
                  <span className="text-[10px] text-white/30">{balance} LTC</span>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-all border border-white/5"
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <GlowButton onClick={connect} size="sm" glow>
                <Wallet className="w-4 h-4" />
                Connect
              </GlowButton>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

import { motion } from 'framer-motion';
import { Globe, Shield, Clock, Server } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export function NetworkBadge() {
  const { connected, networkName, chainId, contractAddress } = useWallet();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="rounded-2xl glass border border-white/5 p-6"
    >
      <div className="flex items-center gap-2 mb-4">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold">Network</h2>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                connected ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-600'
              }`}
            />
            <span className="text-sm text-neutral-400">Status</span>
          </div>
          <span
            className={`text-sm font-medium ${
              connected ? 'text-emerald-400' : 'text-neutral-500'
            }`}
          >
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm text-neutral-400">Network</span>
          </div>
          <span className="text-sm font-medium">{networkName}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm text-neutral-400">Chain ID</span>
          </div>
          <span className="text-sm font-mono font-medium">{chainId}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-neutral-500" />
            <span className="text-sm text-neutral-400">Block Time</span>
          </div>
          <span className="text-sm font-mono font-medium">~2.5m</span>
        </div>
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">
            Protocol Contract
          </p>
          <p className="text-xs font-mono text-neutral-300 break-all bg-white/5 rounded-lg px-3 py-2">
            {contractAddress}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

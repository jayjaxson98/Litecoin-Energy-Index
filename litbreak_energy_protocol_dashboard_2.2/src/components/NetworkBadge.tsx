import { motion } from 'framer-motion';
import { Radio, Shield, Server } from 'lucide-react';

export function NetworkBadge() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.7 }}
      className="glass-card p-5"
    >
      <h3 className="text-sm font-semibold text-white mb-4">Network Status</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-success" />
            <span className="text-xs text-textSecondary">Network</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />
            <span className="text-xs font-medium text-success">LitVM Testnet</span>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-secondary" />
            <span className="text-xs text-textSecondary">Block Height</span>
          </div>
          <span className="text-xs font-mono text-white">2,847,391</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs text-textSecondary">Contract</span>
          </div>
          <span className="text-xs font-mono text-primary hover:underline cursor-pointer">
            0x7a3f...8b2e
          </span>
        </div>
      </div>
    </motion.div>
  );
}

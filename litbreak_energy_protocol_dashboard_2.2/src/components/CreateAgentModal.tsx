import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bot, Zap, AlertCircle } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

interface CreateAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateAgentModal({ isOpen, onClose }: CreateAgentModalProps) {
  const wallet = useWallet();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [strategy, setStrategy] = useState('momentum');
  const [riskLevel, setRiskLevel] = useState<'low' | 'medium' | 'high'>('medium');

  const handleCreate = async () => {
    if (!wallet.connected) {
      await wallet.connect();
      return;
    }
    // Mock creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="glass-card w-full max-w-md p-6 relative"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-white/5 transition-colors text-textSecondary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Create Agent</h2>
                <p className="text-xs text-textSecondary">Configure your trading agent</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider mb-1.5 block">Agent Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="My Trading Agent"
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-800/80 border border-white/5 text-sm text-white placeholder-textSecondary/50 outline-none focus:border-primary/30 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider mb-1.5 block">Description</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="Describe your agent's strategy..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-800/80 border border-white/5 text-sm text-white placeholder-textSecondary/50 outline-none focus:border-primary/30 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider mb-1.5 block">Strategy</label>
                <select
                  value={strategy}
                  onChange={e => setStrategy(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-navy-800/80 border border-white/5 text-sm text-white outline-none focus:border-primary/30 transition-colors"
                >
                  <option value="momentum">Momentum</option>
                  <option value="mean-reversion">Mean Reversion</option>
                  <option value="arbitrage">Arbitrage</option>
                  <option value="grid">Grid Trading</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-textSecondary uppercase tracking-wider mb-1.5 block">Risk Level</label>
                <div className="flex gap-2">
                  {(['low', 'medium', 'high'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setRiskLevel(level)}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all ${
                        riskLevel === level
                          ? level === 'low' ? 'bg-success/20 text-success border border-success/30'
                          : level === 'medium' ? 'bg-warning/20 text-warning border border-warning/30'
                          : 'bg-error/20 text-error border border-error/30'
                          : 'bg-white/5 text-textSecondary border border-white/5 hover:border-white/10'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <motion.button
              onClick={handleCreate}
              className="w-full mt-6 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-bold text-sm"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {wallet.connected ? 'Create Agent' : 'Connect Wallet'}
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

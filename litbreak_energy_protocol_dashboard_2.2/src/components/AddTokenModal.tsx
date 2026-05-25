import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Loader2, AlertCircle, CheckCircle2, Coins } from 'lucide-react';
import { useTokenData } from '@/hooks/useTokenData';
import type { TokenInfo } from '@/types/token';

interface AddTokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenAdded?: (token: TokenInfo) => void;
}

export function AddTokenModal({ isOpen, onClose, onTokenAdded }: AddTokenModalProps) {
  const { lookupToken, addCustomToken, loading, error } = useTokenData();
  const [address, setAddress] = useState('');
  const [foundToken, setFoundToken] = useState<TokenInfo | null>(null);
  const [added, setAdded] = useState(false);

  const handleLookup = useCallback(async () => {
    if (!address.trim()) return;
    setFoundToken(null);
    setAdded(false);

    const token = await lookupToken(address.trim());
    if (token) {
      setFoundToken(token);
    }
  }, [address, lookupToken]);

  const handleAdd = useCallback(() => {
    if (!foundToken) return;
    addCustomToken(foundToken);
    setAdded(true);
    onTokenAdded?.(foundToken);
    setTimeout(() => {
      onClose();
      setAddress('');
      setFoundToken(null);
      setAdded(false);
    }, 1200);
  }, [foundToken, addCustomToken, onTokenAdded, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') handleLookup();
      if (e.key === 'Escape') onClose();
    },
    [handleLookup, onClose]
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-center justify-center p-4"
          >
            <div className="w-full max-w-md glass-card overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center justify-between p-5 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Coins className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-white">Add Custom Token</h2>
                    <p className="text-xs text-textSecondary">Import by contract address</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-white/5 transition-colors text-textSecondary hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                {/* Address Input */}
                <div>
                  <label className="text-xs text-textSecondary uppercase tracking-wider mb-1.5 block">
                    Token Contract Address
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-textSecondary" />
                    <input
                      type="text"
                      value={address}
                      onChange={e => { setAddress(e.target.value); setFoundToken(null); setAdded(false); }}
                      onKeyDown={handleKeyDown}
                      placeholder="0x..."
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-navy-800/80 border border-white/5 text-sm font-mono text-white placeholder-textSecondary/40 outline-none focus:border-primary/30 transition-colors"
                    />
                  </div>
                </div>

                {/* Lookup Button */}
                <motion.button
                  onClick={handleLookup}
                  disabled={!address.trim() || loading}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/20 text-sm font-semibold text-primary hover:border-primary/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Looking up...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Search className="w-4 h-4" />
                      Lookup Token
                    </span>
                  )}
                </motion.button>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-error/10 border border-error/20">
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                    <span className="text-sm text-error">{error}</span>
                  </div>
                )}

                {/* Found Token */}
                {foundToken && !added && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="glass-card-inner p-4 space-y-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 border border-white/10 flex items-center justify-center text-sm font-bold text-white">
                        {foundToken.symbol.slice(0, 2)}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-bold text-white">{foundToken.name}</div>
                        <div className="text-xs text-textSecondary font-mono">{foundToken.symbol} · {foundToken.decimals} decimals</div>
                      </div>
                    </div>
                    <div className="text-xs font-mono text-textSecondary break-all bg-navy-900/50 p-2 rounded-lg">
                      {foundToken.address}
                    </div>
                    <motion.button
                      onClick={handleAdd}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold"
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Plus className="w-4 h-4" />
                        Add {foundToken.symbol}
                      </span>
                    </motion.button>
                  </motion.div>
                )}

                {/* Success */}
                {added && foundToken && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 p-4 rounded-lg bg-success/10 border border-success/20"
                  >
                    <CheckCircle2 className="w-5 h-5 text-success" />
                    <div>
                      <div className="text-sm font-semibold text-success">Token Added!</div>
                      <div className="text-xs text-textSecondary">{foundToken.name} ({foundToken.symbol}) imported successfully</div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="px-5 pb-5">
                <p className="text-[10px] text-textSecondary/60 text-center leading-relaxed">
                  Only add tokens you trust. Verify the contract address on the block explorer before importing.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

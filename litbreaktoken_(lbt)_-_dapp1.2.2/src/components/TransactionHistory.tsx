import { motion, AnimatePresence } from 'framer-motion';
import { History, ArrowUpRight, ArrowDownRight, CheckCircle2, XCircle, Clock, ExternalLink } from 'lucide-react';
import { useMockContract } from '../hooks/useMockContract';
import { shortenAddress, formatNumber } from '../utils/contractHelpers';

export default function TransactionHistory() {
  const { transactions } = useMockContract();

  const typeColors: Record<string, string> = {
    mint: 'text-primary',
    redeem: 'text-accent',
    stake: 'text-amber-400',
    unstake: 'text-amber-400',
    claim: 'text-emerald-400',
  };

  const typeIcons: Record<string, typeof ArrowUpRight> = {
    mint: ArrowUpRight,
    redeem: ArrowDownRight,
    stake: ArrowUpRight,
    unstake: ArrowDownRight,
    claim: ArrowUpRight,
  };

  return (
    /* p reduced from 5→4 */
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4"
    >
      {/* Header — mb from 4→3 */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <History className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-sm">Transaction History</h3>
        </div>
        <span className="text-[10px] text-neutral-500">{transactions.length} txns</span>
      </div>

      {transactions.length === 0 ? (
        <div className="text-center py-6">
          <Clock className="w-8 h-8 text-neutral-700 mx-auto mb-2" />
          <p className="text-xs text-neutral-500">No transactions yet</p>
        </div>
      ) : (
        /* space-y from 2→1.5 for tighter rows */
        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
          <AnimatePresence>
            {transactions.slice(0, 10).map((tx, i) => {
              const Icon = typeIcons[tx.type] || ArrowUpRight;
              return (
                <motion.div
                  key={tx.hash}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass rounded-xl p-2.5 flex items-center justify-between group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`p-1 rounded-lg ${tx.type === 'mint' ? 'bg-primary/10' : tx.type === 'redeem' ? 'bg-accent/10' : tx.type === 'claim' ? 'bg-emerald-400/10' : 'bg-amber-400/10'}`}>
                      <Icon className={`w-3 h-3 ${typeColors[tx.type]}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-semibold capitalize ${typeColors[tx.type]}`}>
                          {tx.type}
                        </span>
                        {tx.status === 'confirmed' ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : tx.status === 'failed' ? (
                          <XCircle className="w-3 h-3 text-red-400" />
                        ) : (
                          <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                        )}
                      </div>
                      <p className="text-[9px] text-neutral-600 font-mono">{shortenAddress(tx.hash)}</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-2">
                    <div>
                      <p className="text-xs font-mono font-semibold">{formatNumber(tx.amount, 4)}</p>
                      <p className="text-[9px] text-neutral-600">
                        {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <ExternalLink className="w-3 h-3 text-neutral-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}

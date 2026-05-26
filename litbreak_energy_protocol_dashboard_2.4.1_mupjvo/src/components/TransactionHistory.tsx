import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export function TransactionHistory() {
  const { transactions } = useWallet();

  if (transactions.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="rounded-2xl glass p-4 sm:p-6"
      >
        <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Transactions</h3>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Clock className="w-10 h-10 text-gray-600 mb-3" />
          <p className="text-sm text-gray-500">No transactions yet</p>
          <p className="text-xs text-gray-600 mt-1">Your transactions will appear here</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.5 }}
      className="rounded-2xl glass p-4 sm:p-6"
    >
      <h3 className="text-lg sm:text-xl font-bold text-white mb-4">Recent Transactions</h3>
      <div className="space-y-3">
        <AnimatePresence>
          {transactions.slice(0, 5).map((tx, i) => (
            <motion.div
              key={tx.hash}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tx.type === 'mint' ? 'bg-primary/10' : 'bg-accent/10'
                }`}>
                  {tx.type === 'mint' ? (
                    <ArrowDownLeft className="w-4 h-4 text-primary" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4 text-accent" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white capitalize">{tx.type}</p>
                  <p className="text-xs text-gray-500 font-mono">
                    {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono text-white">{tx.amount}</span>
                <div className="flex items-center gap-1">
                  {tx.status === 'pending' ? (
                    <Clock className="w-4 h-4 text-warning animate-pulse" />
                  ) : tx.status === 'confirmed' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </div>
                <button className="p-1 hover:bg-white/5 rounded transition-colors">
                  <ExternalLink className="w-3 h-3 text-gray-500" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

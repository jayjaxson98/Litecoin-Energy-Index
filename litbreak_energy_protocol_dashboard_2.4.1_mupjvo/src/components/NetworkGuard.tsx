import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRightLeft } from 'lucide-react';
import { useWeb3 } from '../contexts/Web3Context';

export function NetworkGuard() {
  const { chainId, isCorrectNetwork, switchNetwork, provider } = useWeb3();

  // Only show if connected but on wrong network
  const showBanner = provider && chainId && !isCorrectNetwork;

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden"
        >
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                </div>
                <div>
                  <p className="text-sm font-medium text-warning">
                    Wrong Network Detected
                  </p>
                  <p className="text-xs text-gray-400">
                    Please switch to LitVM Testnet (Chain ID: 12345) to use Litbreak Protocol.
                  </p>
                </div>
              </div>
              <button
                onClick={switchNetwork}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-warning/20 text-warning
                           text-sm font-medium hover:bg-warning/30 transition-colors flex-shrink-0"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Switch Network
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

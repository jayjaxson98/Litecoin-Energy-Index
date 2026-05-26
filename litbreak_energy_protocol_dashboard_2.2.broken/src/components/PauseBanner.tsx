/**
 * PauseBanner — Global banner displayed when the LitbreakProtocol contract is paused.
 *
 * Fix #13: No pause banner component existed. Users had no visual indication
 * that the protocol was paused, leading to confusing transaction failures.
 *
 * This component should be placed at the top of the app layout, above all
 * other content. It only renders when the contract is paused.
 */

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { usePauseState } from '../hooks/usePauseState';

export function PauseBanner() {
  const { isPaused, loading, refresh } = usePauseState();

  return (
    <AnimatePresence>
      {isPaused && !loading && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
          className="overflow-hidden"
        >
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-2.5">
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
              <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
              <p className="text-warning text-sm font-medium">
                Protocol is currently paused — all mint and redeem transactions are disabled.
              </p>
              <button
                onClick={refresh}
                className="text-warning/70 hover:text-warning transition-colors shrink-0"
                title="Refresh pause state"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

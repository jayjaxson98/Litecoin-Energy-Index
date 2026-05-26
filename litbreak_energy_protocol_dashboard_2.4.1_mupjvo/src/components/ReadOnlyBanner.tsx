/**
 * ReadOnlyBanner — Visual indicator when the frontend is in read-only mode.
 * Displays a prominent banner at the top of the page.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, Eye } from 'lucide-react';
import { useReadOnly } from '../contexts/ReadOnlyContext';

export function ReadOnlyBanner() {
  const { isReadOnly, reason } = useReadOnly();

  if (!isReadOnly) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-amber-500/10 border-b border-amber-500/20 backdrop-blur-sm"
    >
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-center gap-3">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Eye className="w-4 h-4 text-amber-400" />
          </div>
          <ShieldAlert className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-xs sm:text-sm text-amber-300/90 font-medium text-center">
          <span className="font-bold text-amber-300">Read-Only Mode</span>
          <span className="hidden sm:inline"> — {reason}</span>
          <span className="sm:hidden"> — Write operations disabled</span>
        </p>
      </div>
    </motion.div>
  );
}

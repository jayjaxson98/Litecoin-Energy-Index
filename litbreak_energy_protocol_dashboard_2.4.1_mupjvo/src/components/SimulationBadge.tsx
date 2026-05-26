import React from 'react';
import { motion } from 'framer-motion';
import { FlaskConical } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';

export function SimulationBadge() {
  const { isSimulation, address } = useWallet();

  if (!address || !isSimulation) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-6 left-6 z-50"
    >
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-warning/10 border border-warning/20 backdrop-blur-xl">
        <FlaskConical className="w-4 h-4 text-warning" />
        <span className="text-xs font-medium text-warning">Simulation Mode</span>
        <div className="w-2 h-2 rounded-full bg-warning animate-pulse" />
      </div>
    </motion.div>
  );
}

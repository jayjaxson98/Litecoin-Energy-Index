import { motion } from 'framer-motion';
import ParticleBackground from './components/ParticleBackground';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MintPanel from './components/MintPanel';
import RedeemPanel from './components/RedeemPanel';
import StakingPanel from './components/StakingPanel';
import OracleStatus from './components/OracleStatus';
import EmissionsPanel from './components/EmissionsPanel';
import LtcKwhCalculator from './components/LtcKwhCalculator';
import TransactionHistory from './components/TransactionHistory';
import Footer from './components/Footer';
import { useMockContract } from './hooks/useMockContract';

export default function App() {
  const { isConnected } = useMockContract();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white circuit-pattern relative">
      <ParticleBackground />

      {/* Ambient glow effects */}
      <div className="fixed top-0 left-1/4 w-[500px] h-[500px] bg-primary/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[500px] bg-secondary/4 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed top-1/2 left-1/2 w-80 h-80 bg-accent/3 rounded-full blur-[120px] pointer-events-none -translate-x-1/2 -translate-y-1/2" />

      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5">
          {/* Dashboard */}
          <Dashboard />

          {/*
           * ── HORIZONTAL PANEL LAYOUT ──
           * Requirement #10-13: Mint, Redeem, Staking panels arranged side-by-side.
           *
           * Layout decisions:
           * - CSS Grid with 3 equal columns on desktop (≥1024px)
           * - 2 columns on tablet (≥768px), stacking the 3rd panel below
           * - Single column on mobile (<768px)
           * - 12px gap between panels (gap-3 = 12px in Tailwind)
           * - Each panel has 16px internal padding (p-4)
           * - min-h ensures visual consistency when panels have different content heights
           */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            <MintPanel />
            <RedeemPanel />
            {/* On md (tablet), StakingPanel spans full width below the first two */}
            <div className="md:col-span-2 xl:col-span-1">
              <StakingPanel />
            </div>
          </motion.div>

          {/* LTC to kWh Calculator */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <LtcKwhCalculator />
          </motion.div>

          {/* Oracle & Emissions — 2-col grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            <OracleStatus />
            <EmissionsPanel />
          </motion.div>

          {/* Transaction History */}
          {isConnected && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <TransactionHistory />
            </motion.div>
          )}
        </main>

        <Footer />
      </div>
    </div>
  );
}

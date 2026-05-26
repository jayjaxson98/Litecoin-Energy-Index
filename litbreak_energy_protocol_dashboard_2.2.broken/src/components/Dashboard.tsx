// ─── Dashboard ─── Main layout composition

import { Header } from './Header';
import { EnergyIndex } from './EnergyIndex';
import { MiningStats } from './MiningStats';
import { TokenActions } from './TokenActions';
import { AgentPanel } from './AgentPanel';
import { PortfolioChart } from './PortfolioChart';
import { TransactionHistory } from './TransactionHistory';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#171717] bg-grid relative">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-primary/[0.03] blur-[120px] animate-float" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-secondary/[0.02] blur-[150px] animate-float" style={{ animationDelay: '-3s' }} />
        <div className="absolute top-[40%] right-[20%] w-[300px] h-[300px] rounded-full bg-accent/[0.02] blur-[100px] animate-pulse-slow" />
      </div>

      {/* Content */}
      <div className="relative z-10">
        <Header />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Top row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <EnergyIndex />
            <PortfolioChart />
          </div>

          {/* Middle row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="lg:col-span-1">
              <TokenActions />
            </div>
            <div className="lg:col-span-2">
              <MiningStats />
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AgentPanel />
            <TransactionHistory />
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-white/5 mt-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-white/15">© 2025 LitBreak Protocol. All rights reserved.</p>
              <div className="flex items-center gap-4">
                <a href="#" className="text-xs text-white/15 hover:text-white/30 transition-colors">Docs</a>
                <a href="#" className="text-xs text-white/15 hover:text-white/30 transition-colors">GitHub</a>
                <a href="#" className="text-xs text-white/15 hover:text-white/30 transition-colors">Discord</a>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}

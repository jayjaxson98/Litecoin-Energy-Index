import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Github, Twitter, BookOpen } from 'lucide-react';
import WalletButton from './WalletButton';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-white/5" style={{ background: 'rgba(10, 10, 15, 0.85)', backdropFilter: 'blur(20px)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-energy flex items-center justify-center shadow-lg shadow-primary/20">
                  <Zap className="w-5 h-5 text-white" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-energy animate-pulse border-2 border-background" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white tracking-tight">Litbreak</h1>
                <p className="text-[10px] text-white/30 -mt-0.5 tracking-wider uppercase">Protocol</p>
              </div>
            </motion.div>

            {/* Nav Links */}
            <nav className="hidden md:flex items-center gap-1">
              <a href="#" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                Docs
              </a>
              <a href="#" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                Governance
              </a>
              <a href="#" className="px-3 py-1.5 rounded-lg text-xs font-medium text-white/50 hover:text-white/80 hover:bg-white/5 transition-all">
                Analytics
              </a>
              <div className="w-px h-4 bg-white/10 mx-2" />
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg glass border border-white/5">
                <div className="w-1.5 h-1.5 rounded-full bg-energy animate-pulse" />
                <span className="text-[10px] font-mono text-white/40">LitVM Testnet</span>
              </div>
            </nav>

            {/* Wallet */}
            <WalletButton />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-primary/50" />
              <span className="text-xs text-white/25">
                Litbreak Protocol © 2025 — Energy-Adjusted Token Economics
              </span>
            </div>
            <div className="flex items-center gap-3">
              <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/25 hover:text-white/50">
                <Github className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/25 hover:text-white/50">
                <Twitter className="w-4 h-4" />
              </a>
              <a href="#" className="p-2 rounded-lg hover:bg-white/5 transition-colors text-white/25 hover:text-white/50">
                <BookOpen className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

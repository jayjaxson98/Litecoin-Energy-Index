import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Github, Twitter, MessageCircle, ExternalLink } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-16 sm:mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">Litbreak</span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Energy-indexed DeFi protocol powered by multi-oracle consensus and battle-tested smart contracts.
            </p>
            <div className="flex items-center gap-3">
              {[Github, Twitter, MessageCircle].map((Icon, i) => (
                <motion.a
                  key={i}
                  href="#"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </motion.a>
              ))}
            </div>
          </div>

          {/* Links */}
          {[
            {
              title: 'Protocol',
              links: ['Dashboard', 'Mint & Redeem', 'Analytics', 'Governance'],
            },
            {
              title: 'Resources',
              links: ['Documentation', 'Smart Contracts', 'Security Audit', 'Bug Bounty'],
            },
            {
              title: 'Community',
              links: ['Discord', 'Twitter', 'Forum', 'Blog'],
            },
          ].map((section) => (
            <div key={section.title}>
              <h4 className="text-sm font-semibold text-white mb-4">{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1 group"
                    >
                      {link}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            © 2025 Litbreak Protocol. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="text-xs text-gray-600 hover:text-gray-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}

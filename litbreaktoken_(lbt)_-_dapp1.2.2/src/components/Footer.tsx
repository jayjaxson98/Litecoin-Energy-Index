import { Zap, Github, Twitter, BookOpen } from 'lucide-react';

export default function Footer() {
  return (
    /* py reduced from 8→5, mt from 8→4 */
    <footer className="mt-4 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg animated-gradient flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <div>
              <span className="text-xs font-bold gradient-text">Litbreak v2</span>
              <p className="text-[9px] text-neutral-600">Energy-Indexed Stablecoin Protocol</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-4">
            {[
              { icon: BookOpen, label: 'Docs' },
              { icon: Github, label: 'GitHub' },
              { icon: Twitter, label: 'Twitter' },
            ].map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-1 text-[10px] text-neutral-500 hover:text-primary transition-colors"
              >
                <Icon className="w-3 h-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Copyright */}
          <p className="text-[9px] text-neutral-600">
            © 2025 Litbreak Protocol. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

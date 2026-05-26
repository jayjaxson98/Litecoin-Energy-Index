// ─── GlowButton ─── Reusable animated button component

import { type ButtonHTMLAttributes } from 'react';

interface GlowButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  glow?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-gradient-to-r from-primary to-purple-500 text-white hover:shadow-[0_0_25px_rgba(158,127,255,0.4)]',
  secondary: 'bg-gradient-to-r from-secondary to-cyan-400 text-white hover:shadow-[0_0_25px_rgba(56,189,248,0.4)]',
  accent: 'bg-gradient-to-r from-accent to-pink-400 text-white hover:shadow-[0_0_25px_rgba(244,114,182,0.4)]',
  ghost: 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export function GlowButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  glow = false,
  className = '',
  children,
  disabled,
  ...props
}: GlowButtonProps) {
  return (
    <button
      className={`
        inline-flex items-center justify-center gap-2 font-semibold
        transition-all duration-300 ease-out
        hover:scale-[1.02] active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${glow ? 'animate-glow' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}

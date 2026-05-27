/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#9E7FFF',
        secondary: '#38bdf8',
        accent: '#f472b6',
        background: '#0A0A0F',
        surface: '#12121A',
        'surface-light': '#1A1A28',
        'surface-lighter': '#222236',
        border: '#2A2A40',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
        ltc: '#345D9D',
        'ltc-light': '#4A7CC9',
        energy: '#10b981',
        'energy-glow': '#34d399',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 20s linear infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(158, 127, 255, 0.2), 0 0 20px rgba(158, 127, 255, 0.1)' },
          '100%': { boxShadow: '0 0 20px rgba(158, 127, 255, 0.4), 0 0 60px rgba(158, 127, 255, 0.2)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      backgroundImage: {
        'grid-pattern': 'linear-gradient(rgba(158, 127, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(158, 127, 255, 0.03) 1px, transparent 1px)',
      },
      backgroundSize: {
        'grid': '60px 60px',
      },
    },
  },
  plugins: [],
};

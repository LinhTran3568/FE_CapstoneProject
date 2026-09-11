/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        ts: {
          black: '#05070A',
          surface: '#0A0D12',
          card: '#11151D',
          text: '#F5F5F2',
          muted: '#A3A8B3',
          orange: '#FF5A36',
          'orange-hover': '#FF7252',
          border: 'rgba(245, 245, 242, 0.08)',
        },
        navy: {
          950: '#070a11',
          900: '#0b0f19',
          850: '#111726',
          800: '#161e2e',
          750: '#1d273a',
          700: '#26334d',
          600: '#384a6e',
        },
        cyan: {
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        emerald: {
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
        },
        shield: {
          bg: '#05070A',
          card: '#0A0D12',
          border: 'rgba(245, 245, 242, 0.08)',
          accent: '#FF5A36',
          verified: '#10b981',
          risk: '#ef4444',
          warn: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'sans-serif'],
        heading: ['Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'Space Mono', 'monospace'],
      },

      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
        'glow-orange': '0 0 30px -5px rgba(249, 115, 22, 0.4)',
        'glow-green': '0 0 30px -5px rgba(34, 197, 94, 0.4)',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(40px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        floatY: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-16px)' },
        },
        glowPulse: {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.6s ease-out forwards',
        slideUp: 'slideUp 0.8s ease-out forwards',
        shimmer: 'shimmer 3s linear infinite',
        floatY: 'floatY 4s ease-in-out infinite',
        glowPulse: 'glowPulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

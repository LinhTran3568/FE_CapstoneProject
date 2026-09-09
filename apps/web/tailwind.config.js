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
          bg: '#0b0f19',
          card: '#161e2e',
          border: '#26334d',
          accent: '#06b6d4',
          verified: '#10b981',
          risk: '#ef4444',
          warn: '#f59e0b',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.3)',
        'glow-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.3)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.3)',
      },
    },
  },
  plugins: [],
};

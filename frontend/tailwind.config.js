/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        industrial: {
          950: '#070a12',
          900: '#0b1120',
          850: '#0f172a',
          800: '#17223b',
          700: '#1e2e4f',
          600: '#33476d',
          500: '#4a6491',
        },
        risk: {
          low: '#10b981',
          'low-bg': 'rgba(16, 185, 129, 0.1)',
          'low-border': 'rgba(16, 185, 129, 0.3)',
          medium: '#f59e0b',
          'medium-bg': 'rgba(245, 158, 11, 0.1)',
          'medium-border': 'rgba(245, 158, 11, 0.3)',
          high: '#ef4444',
          'high-bg': 'rgba(239, 68, 68, 0.12)',
          'high-border': 'rgba(239, 68, 68, 0.35)',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}

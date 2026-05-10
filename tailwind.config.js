/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          purple: '#6366f1',
          green: '#22c55e',
          amber: '#f59e0b',
          pink: '#ec4899',
        },
        surface: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
}

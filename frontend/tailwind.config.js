/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        luxury: {
          gold: '#D4AF37',
          darkGold: '#B8960F',
          navy: '#1e3a5f',
          cream: '#FAF7F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        'luxury': '0 4px 20px rgba(212, 175, 55, 0.15)',
        'card': '0 2px 12px rgba(0, 0, 0, 0.08)',
      }
    },
  },
  plugins: [],
}

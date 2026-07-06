/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          'Hanken Grotesk',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
        serif: ['Newsreader', 'Georgia', 'Cambria', 'serif'],
      },
      colors: {
        // Quiet sage-green accent (replaces the generic indigo).
        brand: {
          50: '#edf6f0',
          100: '#d3ead9',
          200: '#a9d6b8',
          300: '#7cc096',
          400: '#54a978',
          500: '#3a8c5d',
          600: '#2c6f49',
          700: '#27583c',
          800: '#234633',
          900: '#1d3a2b',
        },
      },
    },
  },
  plugins: [],
};

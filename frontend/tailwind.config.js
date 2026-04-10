/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        surface: 'var(--surface)',
        'surface-low': 'var(--surface-low)',
        'surface-mid': 'var(--surface-mid)',
        'surface-high': 'var(--surface-high)',
        'surface-highest': 'var(--surface-highest)',
        primary: 'var(--primary)',
        'on-primary': 'var(--on-primary)',
        'on-surface': 'var(--on-surface)',
        'on-surface-variant': 'var(--on-surface-variant)',
        outline: 'var(--outline)',
        'outline-variant': 'var(--outline-variant)',
        tertiary: 'var(--tertiary)',
        secondary: 'var(--secondary)',
      },
      fontFamily: {
        headline: ['Newsreader', 'serif'],
        body: ['Public Sans', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgb(186 195 255 / 0.25), 0 24px 42px rgb(8 33 138 / 0.18)',
      },
      borderRadius: {
        panel: '22px',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: 0.7 },
          '50%': { opacity: 1 },
        },
      },
      animation: {
        float: 'float 3s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

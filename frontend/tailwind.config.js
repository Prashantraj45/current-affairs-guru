/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'surface': '#0b1326',
        'surface-low': '#131b2e',
        'surface-mid': '#171f33',
        'surface-high': '#222a3d',
        'surface-highest': '#2d3449',
        'primary': '#bac3ff',
        'on-primary': '#08218a',
        'primary-container': '#072189',
        'on-surface': '#dae2fd',
        'on-surface-variant': '#c6c5d4',
        'outline': '#908f9d',
        'outline-variant': '#454652',
        'tertiary': '#e9c400',
        'secondary': '#b1cad7',
      },
      fontFamily: {
        headline: ['Newsreader', 'serif'],
        body: ['Public Sans', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./index.tsx",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'app-bg': 'var(--app-bg)',
        'app-text': 'var(--app-text)',
        'app-accent': 'var(--app-accent)',
        'app-card': 'var(--app-card)',
      },
    },
  },
  plugins: [],
}
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // ⬅️ Enables class-based dark mode
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      gridTemplateColumns: {
        'auto': 'repeat(auto-fill, minmax(200px, 1fr))'
      },
      colors: {
        'primary': '#5F6FFF'
      }
    },
  },
  plugins: [],
}

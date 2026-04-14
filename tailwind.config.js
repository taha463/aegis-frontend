/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}", // 🎯 This tells Tailwind to remove unused CSS
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

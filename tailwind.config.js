/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        blue: {
          50: '#f0f5f9',
          100: '#e1ebf2',
          200: '#c8dce7',
          300: '#a1c4d8',
          400: '#73a5c3',
          500: '#5288ab',
          600: '#406d8f',
          700: '#355875',
          800: '#2e4a62',
          900: '#293e53',
          950: '#1b2938',
        },
      },
    },
  },
  plugins: [],
};
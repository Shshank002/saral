/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/app/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        saral: {
          primary: '#FF0000',
          dark: '#0F0F0F',
          gray: '#272727',
          light: '#F9F9F9',
        },
      },
    },
  },
  plugins: [],
};

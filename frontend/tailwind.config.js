/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brightloop Navy & Sand Design System
        primary: {
          DEFAULT: '#1B3C53',
          dark: '#122838',
          light: '#2A5A7B',
        },
        sand: {
          DEFAULT: '#F9F3EF',
          light: '#FAF6F2',
          card: '#FFFFFF',
          border: '#E4DBD3',
          dark: '#D2C1B6',
        },
        blue: {
          50: '#F0F4F8',
          100: '#D9E4EC',
          200: '#B3C9D9',
          300: '#7E9EB7',
          400: '#4D7899',
          500: '#2A5A7B',
          600: '#1B3C53', // Brand Primary Navy
          700: '#153043',
          800: '#122838',
          900: '#0E1F2C',
          950: '#08131C',
        },
        slate: {
          50: '#F9F3EF', // Brightloop Sand background
          100: '#F4ECE6',
          200: '#E4DBD3', // Border Sand
          300: '#D2C1B6', // Accent Sand
          400: '#9E928A',
          500: '#6E655F',
          600: '#586877',
          700: '#3D4A56',
          800: '#23303C',
          900: '#18222C',
          950: '#122838',
        },
        brand: {
          50: '#F0F4F8',
          100: '#D9E4EC',
          200: '#B3C9D9',
          300: '#7E9EB7',
          400: '#4D7899',
          500: '#2A5A7B',
          600: '#1B3C53', // Primary Navy
          700: '#153043',
          800: '#122838',
          900: '#0E1F2C',
          950: '#08131C',
        },
      },
      fontFamily: {
        sans: [
          '"Plus Jakarta Sans"',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'sans-serif',
        ],
      },
    },
  },
  plugins: [],
};

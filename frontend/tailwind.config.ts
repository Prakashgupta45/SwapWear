import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f2f8f4',
          100: '#e1efe6',
          200: '#c5e0cf',
          300: '#9ac9ad',
          400: '#69ab84',
          500: '#468e64',
          600: '#34724e',
          700: '#2a5b3f',
          800: '#234934',
          900: '#1e3c2c',
          950: '#0f2118',
        },
        sage: {
          50: '#f6f7f5',
          100: '#e9ebe5',
          200: '#d5d9ce',
          300: '#b8c0ad',
          400: '#9ba58c',
          500: '#7f8a70',
          600: '#636e56',
          700: '#4f5745',
          800: '#414739',
          900: '#373c31',
        },
        sand: {
          50: '#fdfbf7',
          100: '#f9f6ef',
          200: '#f1ebd9',
          300: '#e6dcbe',
          400: '#d7c79e',
          500: '#c7b27f',
        }
      },
    },
  },
  plugins: [],
};

export default config;

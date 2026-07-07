import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        penny: {
          50: '#fbf6f0',
          100: '#f5e9db',
          200: '#ead0b4',
          300: '#ddb185',
          400: '#cf9057',
          500: '#B87333',
          600: '#a35f28',
          700: '#874b23',
          800: '#6e3e22',
          900: '#5a341f',
          950: '#31190e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        coinflip: {
          '0%': { transform: 'rotateY(0deg)' },
          '100%': { transform: 'rotateY(720deg)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        coinflip: 'coinflip 0.8s ease-in-out',
      },
    },
  },
  plugins: [],
};

export default config;

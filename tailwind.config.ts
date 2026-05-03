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
        brand: {
          50:  '#f0f4ff',
          100: '#dde8ff',
          500: '#3d5cff',
          600: '#2d4cef',
          700: '#1e3bdf',
        },
      },
    },
  },
  plugins: [],
};

export default config;

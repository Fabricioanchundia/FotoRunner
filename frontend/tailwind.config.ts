import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  safelist: [
    'bg-primary-500',
    'bg-primary-600',
    'text-primary-500',
    'text-primary-400',
    'border-primary-500',
    'hover:bg-primary-600',
    'shadow-primary-500',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          400: '#FF8C33',
          500: '#FF6B00',
          600: '#ea5a00',
          700: '#c44b00',
        },
        dark: {
          900: '#0a0a0a',
          800: '#111111',
          700: '#1a1a1a',
          600: '#222222',
        }
      },
      fontFamily: {
        display: ["'Bebas Neue'", "cursive"],
        body: ["'DM Sans'", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
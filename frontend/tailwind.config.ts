/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#6C3BFF',
          secondary: '#00D4AA',
          cta: '#FF6B35',
        },
        surface: {
          1: '#0A0A0F',
          2: '#12121A',
          3: '#1C1C2E',
        },
        text: {
          primary: '#F0EFFF',
          muted: '#8B89A8',
        },
      },
      animation: {
        gradient: 'gradient 4s ease infinite',
        marquee: 'marquee 30s linear infinite',
      },
      keyframes: {
        gradient: {
          '0%, 100%': { backgroundPosition: '0% center' },
          '50%': { backgroundPosition: '100% center' },
        },
        marquee: {
          from: { transform: 'translateX(0)' },
          to: { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}

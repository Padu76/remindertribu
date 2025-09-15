/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F37021',
          dark: '#D95E16',
        },
        dark: '#1A1A1A',
        gray: {
          DEFAULT: '#333333',
          light: '#F7F7F7',
        },
        whatsapp: '#25D366',
      },
      fontFamily: {
        montserrat: ['Montserrat', 'sans-serif'],
        'open-sans': ['Open Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-in-out',
        'slide-up': 'slideUp 0.6s ease-out',
        'count-up': 'countUp 2s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
      },
      boxShadow: {
        'xl-orange': '0 20px 25px -5px rgba(243, 112, 33, 0.2), 0 10px 10px -5px rgba(243, 112, 33, 0.1)',
      },
    },
  },
  plugins: [],
} 

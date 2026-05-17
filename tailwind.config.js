/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        fintech: {
          bg: '#FAFAFC', // Ultra-light grayish blue
          card: '#FFFFFF',
          text: '#0F172A',
          subtext: '#64748B',
          primary: '#4338CA', // Deep, sophisticated Indigo
          primaryHover: '#3730A3',
          accent: '#10B981', // Crisp Mint
          border: '#F1F5F9',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'luxury': '0 20px 40px -10px rgba(15, 23, 42, 0.05), 0 10px 20px -5px rgba(15, 23, 42, 0.02)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.05)',
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        lenskart: {
          DEFAULT: '#000042',    // Lenskart signature deep dark navy blue
          navy: '#000042',
          dark: '#000028',
          teal: '#00bac6',       // Accent cyan/teal
          light: '#f7f8fa',
          border: '#e2e8f0',
          muted: '#64748b',
          purple: '#4f46e5',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        gbl: {
          navy: {
            950: '#060B18',
            900: '#0A1128',
            800: '#101C3E',
            700: '#1B2A56',
            600: '#283D75'
          },
          orange: {
            50: '#FFF7ED',
            400: '#FB923C',
            500: '#FF5E00', // Signature Gulf Racing Orange
            600: '#EA580C',
            700: '#C2410C'
          },
          blue: {
            400: '#38BDF8',
            500: '#0284C7', // Signature Gulf Light/Sky Blue
            600: '#0369A1'
          },
          gold: {
            400: '#FBBF24',
            500: '#F59E0B',
            600: '#D97706'
          }
        }
      },
      fontFamily: {
        sports: ['Montserrat', 'Teko', 'system-ui', 'sans-serif'],
        display: ['Impact', 'Teko', 'sans-serif']
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-fast': 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite',
        'bounce-short': 'bounce 0.5s ease-in-out infinite'
      }
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,css}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          cyan: '#00f3ff',
          purple: '#bc13fe',
          pink: '#ff00ff',
          green: '#b6ff00',
          blue: '#0066ff',
        },
        slate: {
          950: '#020617',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 5px theme("colors.neon.cyan"), 0 0 20px theme("colors.neon.cyan")',
        'neon-purple': '0 0 5px theme("colors.neon.purple"), 0 0 20px theme("colors.neon.purple")',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0.05))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px theme("colors.neon.cyan"), 0 0 10px theme("colors.neon.cyan")' },
          '100%': { boxShadow: '0 0 10px theme("colors.neon.cyan"), 0 0 20px theme("colors.neon.cyan")' },
        }
      }
    },
  },
  plugins: [
    function({ addComponents }) {
      addComponents({
        '.glass': {
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(12px)',
          '-webkit-backdrop-filter': 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        },
        '.glass-card': {
          '@apply glass rounded-2xl p-6 transition-all duration-300': {},
          '&:hover': {
            borderColor: 'rgba(0, 243, 255, 0.3)',
            transform: 'translateY(-4px)',
            boxShadow: '0 12px 40px 0 rgba(0, 243, 255, 0.1)',
          }
        },
        '.neon-button-cyan': {
          '@apply px-6 py-2 rounded-full font-bold transition-all duration-300': {},
          background: 'transparent',
          border: `2px solid theme('colors.neon.cyan')`,
          color: `theme('colors.neon.cyan')`,
          boxShadow: '0 0 10px rgba(0, 243, 255, 0.2)',
          cursor: 'pointer',
          '&:hover': {
            background: `theme('colors.neon.cyan')`,
            color: '#000',
            boxShadow: `0 0 20px theme('colors.neon.cyan'), 0 0 40px theme('colors.neon.cyan')`,
          }
        }
      })
    }
  ],
}


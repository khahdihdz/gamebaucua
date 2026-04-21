/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        casino: {
          bg:       '#0a0a0f',
          surface:  '#12121a',
          card:     '#1a1a26',
          border:   '#2a2a3a',
          gold:     '#f5c842',
          'gold-light': '#ffd966',
          red:      '#e63946',
          green:    '#2ecc71',
          blue:     '#4cc9f0',
          purple:   '#7b2d8b',
          glow:     'rgba(245,200,66,0.15)'
        }
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        display: ['var(--font-beVietnam)', 'sans-serif']
      },
      animation: {
        'spin-slow':    'spin 3s linear infinite',
        'pulse-gold':   'pulseGold 2s ease-in-out infinite',
        'float':        'float 3s ease-in-out infinite',
        'shake':        'shake 0.5s ease-in-out',
        'bounce-in':    'bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'slide-up':     'slideUp 0.4s ease-out',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite'
      },
      keyframes: {
        pulseGold: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(245,200,66,0.3)' },
          '50%':      { boxShadow: '0 0 30px rgba(245,200,66,0.8)' }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-8px)' }
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%':      { transform: 'translateX(-8px)' },
          '75%':      { transform: 'translateX(8px)' }
        },
        bounceIn: {
          '0%':   { transform: 'scale(0.3)', opacity: '0' },
          '50%':  { transform: 'scale(1.05)' },
          '70%':  { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' }
        },
        slideUp: {
          '0%':   { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)',    opacity: '1' }
        },
        glowPulse: {
          '0%, 100%': { filter: 'drop-shadow(0 0 4px rgba(245,200,66,0.4))' },
          '50%':      { filter: 'drop-shadow(0 0 12px rgba(245,200,66,0.9))' }
        }
      },
      backgroundImage: {
        'casino-felt':    "radial-gradient(ellipse at center, #1a2a1a 0%, #0d1a0d 100%)",
        'gold-gradient':  'linear-gradient(135deg, #f5c842 0%, #e6a817 50%, #f5c842 100%)',
        'card-gradient':  'linear-gradient(145deg, #1e1e2e 0%, #12121a 100%)',
        'glow-radial':    'radial-gradient(circle at center, rgba(245,200,66,0.1) 0%, transparent 70%)'
      },
      boxShadow: {
        'gold':   '0 0 20px rgba(245,200,66,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
        'card':   '0 4px 24px rgba(0,0,0,0.4)',
        'glow':   '0 0 40px rgba(245,200,66,0.2)',
        'inner-gold': 'inset 0 0 20px rgba(245,200,66,0.1)'
      }
    }
  },
  plugins: []
};

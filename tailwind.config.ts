import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        /* ── Backgrounds — sampled from logo's void backdrop ── */
        bg:       '#06060a',
        surface:  '#0d0d14',
        raised:   '#13131e',
        overlay:  '#1a1a28',
        border:   '#22223a',
        borderhover: '#2e2e4a',

        /* ── Orange (Primary) — from the phoenix fire ── */
        orange: {
          DEFAULT: '#f07028',
          bright:  '#ff8844',
          dim:     '#c05018',
          subtle:  'rgba(240,112,40,0.13)',
          border:  'rgba(240,112,40,0.30)',
          glow:    'rgba(240,112,40,0.15)',
        },

        /* ── Fire — the fire on the wings and tail ── */
        fire: {
          DEFAULT: '#ff6b2b',
          bright:  '#ff8550',
          dim:     '#cc5020',
          subtle:  'rgba(255,107,43,0.12)',
          border:  'rgba(255,107,43,0.28)',
        },

        /* ── Gold (Secondary) — the wing tips ── */
        gold: {
          DEFAULT: '#e8a820',
          bright:  '#f0be40',
          dim:     '#b87e10',
          subtle:  'rgba(232,168,32,0.13)',
          border:  'rgba(232,168,32,0.28)',
        },

        /* ── Chrome — the metallic silver of the phoenix body ── */
        chrome: {
          DEFAULT: '#b8c4d4',
          bright:  '#d4dde8',
          dim:     '#7a8898',
          subtle:  'rgba(184,196,212,0.08)',
        },

        /* ── Emerald — success, Normal BMI, achievements ── */
        emerald: {
          DEFAULT: '#1ed696',
          dim:     '#12a870',
          subtle:  'rgba(30,214,150,0.12)',
          border:  'rgba(30,214,150,0.25)',
        },

        /* ── Amber — fats macro, Underweight BMI ── */
        amber: {
          DEFAULT: '#f0a020',
          dim:     '#c07810',
          subtle:  'rgba(240,160,32,0.12)',
          border:  'rgba(240,160,32,0.25)',
        },

        /* ── Violet — achievement badges, streaks ── */
        violet: {
          DEFAULT: '#9060f0',
          dim:     '#6840c0',
          subtle:  'rgba(144,96,240,0.12)',
          border:  'rgba(144,96,240,0.25)',
        },

        /* ── Danger — errors, Obese BMI ── */
        danger: {
          DEFAULT: '#f04040',
          dim:     '#c02828',
          subtle:  'rgba(240,64,64,0.12)',
          border:  'rgba(240,64,64,0.25)',
        },

        /* ── Text scale ── */
        text: {
          primary:   '#ffffff',
          secondary: '#9090a0',
          muted:     '#545870',
          inverse:   '#06060a',
        },
      },

      fontFamily: {
        display: ['var(--font-display)', 'Orbitron', 'sans-serif'],
        body:    ['var(--font-body)', 'Inter', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },

      borderRadius: {
        none: '0',
        sm:   '4px',
        DEFAULT: '7px',
        md:   '10px',
        lg:   '14px',
        xl:   '20px',
        full: '9999px',
      },

      boxShadow: {
        'orange-sm':  '0 0 14px rgba(240,112,40,0.2)',
        'orange-md':  '0 0 28px rgba(240,112,40,0.18)',
        'fire-sm':  '0 0 14px rgba(255,107,43,0.2)',
        'gold-sm':  '0 0 14px rgba(232,168,32,0.18)',
        'inner':    'inset 0 1px 0 rgba(255,255,255,0.04)',
      },

      backgroundImage: {
        'grid-void': `
          linear-gradient(rgba(240,112,40,0.025) 1px, transparent 1px),
          linear-gradient(90deg, rgba(240,112,40,0.025) 1px, transparent 1px)
        `,
        'chrome-text':
          'linear-gradient(180deg, #d4dde8 0%, #8898b0 50%, #b8c4d4 100%)',
        'fire-text':
          'linear-gradient(135deg, #ff8550 0%, #ff6b2b 50%, #cc5020 100%)',
        'gold-radial':
          'radial-gradient(ellipse at center, rgba(232,168,32,0.06) 0%, transparent 70%)',
      },


      backgroundSize: {
        'grid': '48px 48px',
      },

      animation: {
        'fade-in':    'fadeIn 0.25s ease-out',
        'slide-up':   'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.25s ease-out',
        'spin':       'spin 0.75s linear infinite',
        'pulse-slow': 'pulseSlow 3s ease-in-out infinite',
      },

      keyframes: {
        fadeIn:    { from:{opacity:'0'}, to:{opacity:'1'} },
        slideUp:   { from:{opacity:'0',transform:'translateY(10px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        slideDown: { from:{opacity:'0',transform:'translateY(-8px)'}, to:{opacity:'1',transform:'translateY(0)'} },
        pulseSlow: { '0%,100%':{opacity:'1'}, '50%':{opacity:'0.55'} },
      },
    },
  },
  plugins: [],
};

export default config;

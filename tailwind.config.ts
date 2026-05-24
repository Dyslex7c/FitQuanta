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
        bg:      '#0a0a12',
        surface: '#12121e',
        raised:  '#1a1a2e',
        border:  '#1e1e3a',
        cyan: {
          DEFAULT: '#00d4ff',
          dim:     '#0099bb',
          glow:    'rgba(0,212,255,0.2)',
        },
        orange: {
          DEFAULT: '#ff6b35',
          dim:     '#cc5222',
          glow:    'rgba(255,107,53,0.2)',
        },
        purple: {
          DEFAULT: '#7b5ea7',
          dim:     '#5c3f8f',
          glow:    'rgba(123,94,167,0.2)',
        },
        green: {
          DEFAULT: '#22c55e',
          dim:     '#16a34a',
          glow:    'rgba(34,197,94,0.2)',
        },
        yellow: {
          DEFAULT: '#fbbf24',
          dim:     '#d97706',
        },
        red: {
          DEFAULT: '#ef4444',
          dim:     '#dc2626',
          glow:    'rgba(239,68,68,0.2)',
        },
        text: {
          primary: '#e2e8f0',
          muted:   '#94a3b8',
          hint:    '#475569',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body:    ['var(--font-body)', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        sm:   '6px',
        md:   '10px',
        lg:   '14px',
        xl:   '20px',
        full: '9999px',
      },
      boxShadow: {
        'cyan':   '0 0 20px rgba(0,212,255,0.25)',
        'orange': '0 0 20px rgba(255,107,53,0.25)',
        'purple': '0 0 20px rgba(123,94,167,0.25)',
        'inner-cyan': 'inset 0 0 12px rgba(0,212,255,0.1)',
      },
      backgroundImage: {
        'grid-dark': `linear-gradient(rgba(0,212,255,0.03) 1px, transparent 1px),
                      linear-gradient(90deg, rgba(0,212,255,0.03) 1px, transparent 1px)`,
      },
      backgroundSize: {
        'grid': '40px 40px',
      },
      animation: {
        'pulse-cyan': 'pulse-cyan 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'fade-in':    'fadeIn 0.3s ease-out',
        'slide-up':   'slideUp 0.4s ease-out',
      },
      keyframes: {
        'pulse-cyan': {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.5' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};

export default config;

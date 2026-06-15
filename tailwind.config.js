/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#172554',
        },
        secondary: {
          50:  '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        success: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fff1f2',
          100: '#ffe4e6',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
        },
        info: {
          50:  '#ecfeff',
          100: '#cffafe',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        surface: {
          light: '#ffffff',
          dark:  '#0f172a',
        },
        bg: {
          light: '#f8fafc',
          dark:  '#0f172a',
        },
        card: {
          light: '#ffffff',
          dark:  '#1e293b',
        },
        border: {
          light: '#e2e8f0',
          dark:  '#334155',
        },
        text: {
          primary:   { light: '#0f172a', dark: '#f1f5f9' },
          secondary: { light: '#64748b', dark: '#94a3b8' },
          muted:     { light: '#94a3b8', dark: '#475569' },
        },
        sidebar: {
          light: '#ffffff',
          dark:  '#1e293b',
        },
      },
      boxShadow: {
        soft:   '0 2px 8px 0 rgba(0,0,0,0.06)',
        card:   '0 1px 4px 0 rgba(0,0,0,0.08), 0 4px 16px 0 rgba(0,0,0,0.04)',
        modal:  '0 8px 32px 0 rgba(0,0,0,0.12)',
        button: '0 1px 2px 0 rgba(0,0,0,0.08)',
      },
      borderRadius: {
        xl2: '1rem',
        xl3: '1.5rem',
      },
      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'slide-in-left':'slideInLeft 0.25s ease-out',
        'slide-in-right':'slideInRight 0.25s ease-out',
        'slide-up':     'slideUp 0.2s ease-out',
        'pulse-soft':   'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: 0 }, to: { opacity: 1 } },
        slideInLeft:  { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        slideInRight: { from: { opacity: 0, transform: 'translateX(16px)' },  to: { opacity: 1, transform: 'translateX(0)' } },
        slideUp:      { from: { opacity: 0, transform: 'translateY(12px)' },  to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft:    { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
      },
      screens: {
        xs: '375px',
      },
      spacing: {
        4.5: '1.125rem',
        13:  '3.25rem',
        18:  '4.5rem',
        22:  '5.5rem',
        68:  '17rem',
        72:  '18rem',
        76:  '19rem',
      },
    },
  },
  plugins: [],
};

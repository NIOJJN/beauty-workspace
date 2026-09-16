import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './store/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '1.25rem',
      screens: { '2xl': '1280px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        /* Пастельные подложки для плашек, бейджей и градиентов */
        pastel: {
          lilac: '#EFEAFF',
          blush: '#FFEAF3',
          peach: '#FFEFE6',
          mint: '#E4FBF3',
          sky: '#E8F3FF',
          butter: '#FFF6DA',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 4px)',
        sm: 'calc(var(--radius) - 8px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
        '4xl': '2rem',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 1px 2px hsl(258 45% 35% / 0.04), 0 10px 24px -14px hsl(258 45% 40% / 0.18)',
        card: '0 1px 2px hsl(258 45% 35% / 0.03), 0 18px 40px -28px hsl(262 60% 40% / 0.28)',
        float: '0 28px 64px -32px hsl(262 65% 42% / 0.38)',
        glow: '0 0 0 1px hsl(258 85% 72% / 0.22), 0 20px 45px -22px hsl(262 85% 62% / 0.5)',
        'inner-soft': 'inset 0 1px 0 hsl(0 0% 100% / 0.65)',
      },
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-soft': 'var(--gradient-soft)',
        'gradient-mesh': 'var(--gradient-mesh)',
      },
      transitionTimingFunction: {
        soft: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      /* Дополняем шкалу прозрачности: пастельные подложки часто нужны
         с шагом 2% (bg-success/12, bg-primary/8 и т.п.) */
      opacity: {
        2: '0.02',
        3: '0.03',
        4: '0.04',
        6: '0.06',
        7: '0.07',
        8: '0.08',
        12: '0.12',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-18px) scale(1.03)' },
        },
        aurora: {
          '0%': { transform: 'translate3d(-6%, 0, 0) scale(1)' },
          '50%': { transform: 'translate3d(6%, -4%, 0) scale(1.08)' },
          '100%': { transform: 'translate3d(-6%, 0, 0) scale(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.55' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-up': 'fade-up 0.5s ease-out both',
        float: 'float 9s ease-in-out infinite',
        aurora: 'aurora 18s ease-in-out infinite',
        shimmer: 'shimmer 1.8s infinite',
        'pulse-soft': 'pulse-soft 2.4s ease-in-out infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;

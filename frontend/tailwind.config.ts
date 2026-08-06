import type { Config } from 'tailwindcss';

/** Resolves a design token to an alpha-aware color reference. */
const token = (name: string) => `rgb(var(--${name}-rgb) / <alpha-value>)`;

const config: Config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      // Design tokens live in app/globals.css as "R G B" channel triplets.
      // Referencing them through rgb(... / <alpha-value>) is what lets opacity
      // modifiers work (bg-primary/10). Pointing at the literal `var(--x)`
      // instead makes Tailwind silently drop the modifier.
      colors: {
        border: token('border'),
        input: token('input'),
        ring: token('ring'),
        background: token('background'),
        foreground: {
          DEFAULT: token('foreground'),
          strong: token('foreground-strong'),
        },
        surface: {
          raised: token('surface-raised'),
          sunken: token('surface-sunken'),
        },
        primary: {
          DEFAULT: token('primary'),
          foreground: token('primary-foreground'),
          dark: token('brand-primary-dark'),
        },
        secondary: {
          DEFAULT: token('secondary'),
          foreground: token('secondary-foreground'),
        },
        destructive: {
          DEFAULT: token('destructive'),
          foreground: token('destructive-foreground'),
          muted: token('destructive-muted'),
        },
        muted: {
          DEFAULT: token('muted'),
          foreground: token('muted-foreground'),
        },
        accent: {
          DEFAULT: token('accent'),
          foreground: token('accent-foreground'),
        },
        popover: {
          DEFAULT: token('popover'),
          foreground: token('popover-foreground'),
        },
        card: {
          DEFAULT: token('card'),
          foreground: token('card-foreground'),
        },
        success: {
          DEFAULT: token('success'),
          foreground: token('success-foreground'),
          muted: token('success-muted'),
        },
        warning: {
          DEFAULT: token('warning'),
          foreground: token('warning-foreground'),
          muted: token('warning-muted'),
        },
        info: {
          DEFAULT: token('info'),
          foreground: token('info-foreground'),
          muted: token('info-muted'),
        },
        brand: {
          DEFAULT: token('brand-primary'),
          secondary: token('brand-secondary'),
          dark: token('brand-primary-dark'),
        },
        chart: {
          1: token('chart-1'),
          '1-soft': token('chart-1-soft'),
          2: token('chart-2'),
          '2-soft': token('chart-2-soft'),
          3: token('chart-3'),
          '3-soft': token('chart-3-soft'),
          4: token('chart-4'),
          '4-soft': token('chart-4-soft'),
          5: token('chart-5'),
          '5-soft': token('chart-5-soft'),
        },
      },
      fontFamily: {
        sans: ['var(--font-inter-tight)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-inter-tight)', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // Named keys, not `duration-[var(--duration-base)]`. The animate plugin also
      // registers `duration-*` (for animation-duration), so an arbitrary value is
      // ambiguous — Tailwind warns and emits nothing, silently dropping the token.
      transitionDuration: {
        fast: 'var(--duration-fast)',
        base: 'var(--duration-base)',
        slow: 'var(--duration-slow)',
      },
      transitionTimingFunction: {
        'out-quart': 'var(--ease-out-quart)',
      },
      boxShadow: {
        card: '0 1px 2px 0 rgb(15 23 42 / 0.04), 0 1px 3px 0 rgb(15 23 42 / 0.06)',
        'card-hover': '0 4px 6px -1px rgb(15 23 42 / 0.07), 0 2px 4px -2px rgb(15 23 42 / 0.06)',
        elevated: '0 10px 15px -3px rgb(15 23 42 / 0.08), 0 4px 6px -4px rgb(15 23 42 / 0.05)',
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
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'scroll-left': { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } },
        'scroll-right': { '0%': { transform: 'translateX(-50%)' }, '100%': { transform: 'translateX(0)' } },
        'orb-rotate': { '0%': { transform: 'rotate(0deg)', filter: 'hue-rotate(0deg) brightness(1.1)' }, '100%': { transform: 'rotate(360deg)', filter: 'hue-rotate(360deg) brightness(1.1)' } },
        'gradient-flow': { '0%': { backgroundPosition: '0% 50%' }, '50%': { backgroundPosition: '100% 50%' }, '100%': { backgroundPosition: '0% 50%' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        marquee: 'marquee 30s linear infinite',
        'scroll-left': 'scroll-left 25s linear infinite',
        'scroll-right': 'scroll-right 25s linear infinite',
        'orb-rotate': 'orb-rotate 20s linear infinite',
        'gradient-flow': 'gradient-flow 2s linear infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
export default config;


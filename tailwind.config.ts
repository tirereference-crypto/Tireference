import type { Config } from 'tailwindcss';

/**
 * TireLogic design tokens — mirrored in src/styles/global.css @theme for Tailwind v4.
 */
const config: Config = {
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#5B4FE6',
          hover: '#4A3FD0',
          light: '#EEF0FE',
        },
        surface: {
          dark: '#0F172A',
          DEFAULT: '#FFFFFF',
          subtle: '#F8FAFC',
        },
        border: {
          DEFAULT: '#E2E8F0',
        },
        heading: '#0F172A',
        body: '#475569',
        muted: '#94A3B8',
        success: '#16A34A',
        danger: '#DC2626',
        info: '#2563EB',
        accent: '#EA580C',
      },
      borderRadius: {
        card: '14px',
        button: '8px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgb(15 23 42 / 0.07), 0 1px 2px -1px rgb(15 23 42 / 0.05)',
        'card-hover': '0 6px 20px -4px rgb(15 23 42 / 0.12), 0 2px 6px -2px rgb(15 23 42 / 0.06)',
      },
    },
  },
};

export default config;

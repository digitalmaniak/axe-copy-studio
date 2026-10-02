/** @type {import('tailwindcss').Config} */
// Colors point at the AXE tokens in app/globals.css, so they switch with [data-theme].
module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      colors: {
        bg: 'var(--bg)',
        surface: { DEFAULT: 'var(--surface)', 2: 'var(--surface-2)', 3: 'var(--surface-3)' },
        line: { DEFAULT: 'var(--border)', strong: 'var(--border-strong)' },
        ink: { DEFAULT: 'var(--text)', 2: 'var(--text-2)', 3: 'var(--text-3)' },
        accent: {
          DEFAULT: 'var(--accent)', hover: 'var(--accent-hover)', press: 'var(--accent-press)',
          text: 'var(--accent-text)', soft: 'var(--accent-soft)', 'soft-text': 'var(--accent-soft-text)',
        },
        contrast: { DEFAULT: 'var(--contrast)', on: 'var(--on-contrast)' },
        success: 'var(--success)', warning: 'var(--warning)', danger: 'var(--danger)', info: 'var(--info)',
      },
      borderRadius: { md: '10px', lg: '16px', xl: '20px' },
    },
  },
  plugins: [],
};

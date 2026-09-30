/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'Helvetica Neue', 'Arial', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        // LG red + tints
        accent: { DEFAULT: '#A50034', hover: '#8A002C', tint: '#FBEFF3', 'tint-dark': '#2A0A14', light: '#F2708F' },
        // Light theme
        paper: '#F5F5F2',
        subtle: '#FAFAF8',
        seg: '#F0EFEB',
        line: { DEFAULT: '#E3E2DD', strong: '#D9D8D2' },
        ink: '#16161A',
        muted: '#5E5E66',
        faint: '#6B6B73',
        meter: '#9A9AA2',
        // Dark theme
        night: {
          DEFAULT: '#0C0C0E', surface: '#151518', subtle: '#1B1B1F', seg: '#1F1F24',
          line: '#26262B', 'line-strong': '#33333A', ink: '#F2F2F3', muted: '#A3A3AB', faint: '#8E8E96', meter: '#5A5A62',
        },
      },
    },
  },
  plugins: [],
};

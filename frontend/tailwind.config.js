/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      fontSize: {
        'table': ['0.75rem', { lineHeight: '1rem' }],
        'table-header': ['0.6875rem', { lineHeight: '1rem' }],
      },
      spacing: {
        'sidebar': '14rem',
        'sidebar-collapsed': '3.5rem',
      },
    },
  },
  plugins: [],
}

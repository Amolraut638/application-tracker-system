/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // ── Brand: deep navy ───────────────────────────────
        navy: {
          50:  '#f0f4fa',
          100: '#dce6f5',
          200: '#b9cde9',
          300: '#8aadd8',
          400: '#5a8ac4',
          500: '#3b6cb0',
          600: '#2d5494',
          700: '#223f72',
          800: '#1a2f54',
          900: '#0f1e36',
          950: '#080f1c',
        },
        // ── Surface neutrals (warm-leaning) ────────────────
        slate: {
          50:  '#f8f9fb',
          100: '#f1f3f7',
          200: '#e2e6ed',
          300: '#cdd3dd',
          400: '#9aa4b2',
          500: '#6b7a8d',
          600: '#4f5d6e',
          700: '#374151',
          800: '#1f2937',
          900: '#111827',
          950: '#080e17',
        },
        // ── Teal secondary ─────────────────────────────────
        teal: {
          50:  '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        // ── Status (muted, intentional) ────────────────────
        status: {
          green:    '#16a34a',
          greenBg:  '#f0fdf4',
          greenBdr: '#bbf7d0',
          amber:    '#d97706',
          amberBg:  '#fffbeb',
          amberBdr: '#fde68a',
          red:      '#dc2626',
          redBg:    '#fef2f2',
          redBdr:   '#fecaca',
          blue:     '#2563eb',
          blueBg:   '#eff6ff',
          blueBdr:  '#bfdbfe',
          purple:   '#7c3aed',
          purpleBg: '#f5f3ff',
          purpleBdr:'#ddd6fe',
        },
      },
      boxShadow: {
        // Restrained, professional shadows
        card:     '0 1px 2px 0 rgb(15 30 54 / 0.05), 0 1px 3px 0 rgb(15 30 54 / 0.04)',
        'card-md': '0 2px 4px 0 rgb(15 30 54 / 0.06), 0 4px 8px -2px rgb(15 30 54 / 0.05)',
        dropdown: '0 4px 6px -1px rgb(15 30 54 / 0.08), 0 2px 4px -2px rgb(15 30 54 / 0.06)',
        'inner-sm': 'inset 0 1px 2px 0 rgb(15 30 54 / 0.06)',
      },
      borderRadius: {
        DEFAULT: '0.25rem', // 4px — sharper, more professional
        sm: '0.1875rem',    // 3px
        md: '0.375rem',     // 6px
        lg: '0.5rem',       // 8px
        xl: '0.75rem',      // 12px
      },
    },
  },
  plugins: [],
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js}'],
  theme: {
    extend: {
      colors: {
        ink: '#020617',
        panel: '#0f172a',
        brand: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        },
        violet: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        electric: '#22d3ee',
        certificate: '#fbbf24',
      },
      fontFamily: {
        display: ['Sora', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // The technical register (readouts, tags, platform metadata) carries a
        // real monospace rather than falling through to whatever the OS picks,
        // which on Windows is Courier New and undoes the whole aesthetic.
        mono: ['"JetBrains Mono"', 'SFMono-Regular', 'Consolas', 'monospace'],
      },
      maxWidth: {
        site: '1160px',
      },
      boxShadow: {
        glow: '0 20px 80px rgba(79, 70, 229, 0.28)',
        cyan: '0 18px 70px rgba(34, 211, 238, 0.14)',
      },
      backgroundImage: {
        'hero-radial':
          'radial-gradient(circle at 70% 20%, rgba(99,102,241,.20), transparent 38%), radial-gradient(circle at 20% 80%, rgba(34,211,238,.09), transparent 32%)',
      },
    },
  },
  plugins: [],
}


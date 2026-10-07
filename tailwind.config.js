/**
 * Every colour is a semantic token backed by a CSS variable in
 * `src/assets/main.css`. Components say what a colour is for (`bg-surface`,
 * `text-fg-muted`, `border-line`) rather than which shade it is, so the light
 * and dark themes are a single variable swap instead of a `dark:` variant on
 * every element.
 */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './docs/**/*.html', './src/**/*.{vue,js}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        canvas: token('bg'),
        subtle: token('bg-subtle'),
        surface: token('surface'),
        muted: token('surface-muted'),
        line: {
          DEFAULT: token('border'),
          strong: token('border-strong'),
        },
        fg: {
          DEFAULT: token('fg'),
          muted: token('fg-muted'),
          subtle: token('fg-subtle'),
        },
        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          text: token('brand-text'),
        },
        success: {
          DEFAULT: token('success'),
          text: token('success-text'),
        },
        warning: {
          DEFAULT: token('warning'),
          text: token('warning-text'),
        },
        danger: {
          DEFAULT: token('danger'),
          text: token('danger-text'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        // System monospace only: no extra font download, and Consolas is
        // present on every supported Windows install.
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      maxWidth: {
        site: '1200px',
      },
      boxShadow: {
        card: '0 1px 2px rgb(var(--shadow) / 0.06), 0 1px 3px rgb(var(--shadow) / 0.08)',
        lift: '0 10px 30px -12px rgb(var(--shadow) / 0.25)',
      },
    },
  },
  plugins: [],
}

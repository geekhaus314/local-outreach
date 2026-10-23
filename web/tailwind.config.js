/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/routes/admin/**/*.{svelte,ts}',
    './src/lib/components/admin/**/*.{svelte,ts}'
  ],
  theme: {
    extend: {
      colors: {
        adm: {
          bg: 'color-mix(in srgb, var(--color-bg) 92%, var(--color-bg-alt))',
          surface: 'var(--color-surface)',
          'surface-2': 'color-mix(in srgb, var(--color-bg-alt) 80%, var(--color-surface))',
          border: 'var(--color-border)',
          text: 'var(--color-text)',
          muted: 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
          'accent-soft': 'color-mix(in srgb, var(--color-accent) 16%, transparent)',
          danger: '#dc2626',
          'danger-soft': 'color-mix(in srgb, #dc2626 14%, transparent)',
          success: '#15803d',
          'success-soft': 'color-mix(in srgb, #15803d 14%, transparent)',
          warning: '#b45309',
          'warning-soft': 'color-mix(in srgb, #b45309 14%, transparent)',
          info: '#0369a1',
          'info-soft': 'color-mix(in srgb, #0369a1 14%, transparent)'
        }
      },
      borderRadius: {
        adm: '12px',
        'adm-sm': '8px',
        'adm-lg': '16px'
      },
      fontFamily: {
        display: ['var(--font-display)', 'sans-serif'],
        body: ['var(--font-body)', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace']
      }
    }
  },
  plugins: []
}

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Tokens — todos consomem CSS variables de index.css
        bg:         'var(--bg)',
        surface:    'var(--surface)',
        'surface-2':'var(--surface-2)',
        border:     'var(--border)',
        'border-2': 'var(--border-2)',
        'text-1':   'var(--text-1)',
        'text-2':   'var(--text-2)',
        'text-3':   'var(--text-3)',
        accent:     'var(--accent)',
        'accent-bg':'var(--accent-bg)',
        success:    'var(--green)',
        'success-bg':'var(--green-bg)',
        danger:     'var(--red)',
        'danger-bg':'var(--red-bg)',
        warning:    'var(--yellow)',
        'warning-bg':'var(--yellow-bg)',
      },
      borderRadius: {
        token: 'var(--radius)',
      },
    },
  },
  plugins: [],
};

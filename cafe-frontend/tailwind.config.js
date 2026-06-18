/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas:  '#FAF7F2',
        surface: '#FFFFFF',
        saffron: {
          50:  '#F2F4EF',
          100: '#E0E6DC',
          400: '#6B7F65',
          500: '#3D4A3E',
          600: '#2C3A2D',
        },
        ink:    '#1C1917',
        muted:  '#5C5754',
        ghost:  '#A8A39F',
        veg:    '#008000',
        nonveg: '#C0392B',
        line:   '#EDE9E0',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(26,20,16,0.07), 0 1px 2px rgba(26,20,16,0.04)',
        'tab':  '0 2px 8px rgba(26,20,16,0.10)',
        'cart': '0 -4px 16px rgba(26,20,16,0.12)',
      },
    },
  },
  plugins: [],
}
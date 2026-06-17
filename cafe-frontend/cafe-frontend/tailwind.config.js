/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Design system — warm Indian cafe palette
        // Background: warm off-white, not clinical white
        canvas:  '#FAF8F4',
        surface: '#FFFFFF',
        // Accent: saffron — unmistakably Indian, never seen in Western SaaS templates
        saffron: {
          50:  '#FFF8ED',
          100: '#FFEFD0',
          400: '#F5A623',
          500: '#E8920A',
          600: '#C97A06',
        },
        // Text
        ink:    '#1A1410',   // near-black with warmth
        muted:  '#6B6560',   // secondary text
        ghost:  '#B0AAA3',   // placeholder / disabled
        // Status dots (FSSAI standard)
        veg:    '#008000',
        nonveg: '#C0392B',
        // Border
        line:   '#EDE9E4',
      },
      fontFamily: {
        // Inter for UI chrome, slightly warm feel
        sans: ['Inter', 'system-ui', 'sans-serif'],
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

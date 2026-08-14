/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        background: '#FCFAFC',
        foreground: '#171735',
        primary: {
          DEFAULT: '#E83E83',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#F58DB5',
          foreground: '#171735',
        },
        lavender: {
          DEFAULT: '#8B63D9',
          light: '#F5F0FF',
          soft: '#B99AEF',
        },
        peach: {
          DEFAULT: '#FFB58F',
        },
        cream: {
          DEFAULT: '#FFF7EF',
        },
        border: 'rgba(30, 20, 60, 0.07)',
        input: 'rgba(30, 20, 60, 0.07)',
        ring: '#E83E83',
        card: {
          DEFAULT: '#FFFFFF',
          foreground: '#171735',
        },
        popover: {
          DEFAULT: '#FFFFFF',
          foreground: '#171735',
        },
        muted: {
          DEFAULT: '#F5F0FF',
          foreground: '#64748b',
        },
        accent: {
          DEFAULT: '#F5F0FF',
          foreground: '#171735',
        },
        destructive: {
          DEFAULT: '#ef4444',
          foreground: '#FFFFFF',
        },
      },
      borderRadius: {
        lg: '24px', // Cards 20-28px
        md: '16px', // Inputs 14-18px
        sm: '8px',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'sans-serif'],
        script: ['"Dancing Script"', 'cursive'], // Tasteful script font
      },
      boxShadow: {
        soft: '0 8px 30px rgba(40, 25, 70, 0.08)',
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}

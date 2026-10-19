/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono Variable"', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      colors: {
        ink: {
          950: '#050507',
          900: '#0a0b0d',
          850: '#0d0f11',
          800: '#121518',
          700: '#1a1e21',
        },
        neon: {
          DEFAULT: '#00ff9d',
          soft: '#5dffc0',
          deep: '#00b86f',
          dark: '#003b25',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(.94)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-6px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.55', boxShadow: '0 0 0 0 rgba(0,255,157,.25)' },
          '50%': { opacity: '1', boxShadow: '0 0 0 8px rgba(0,255,157,0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        scan: {
          '0%': { transform: 'translateY(-110%)' },
          '100%': { transform: 'translateY(110%)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '20%, 60%': { transform: 'translateX(-7px)' },
          '40%, 80%': { transform: 'translateX(7px)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        'reveal-up': {
          from: { opacity: '0', transform: 'translateY(10px) scale(.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        'fade-in': 'fade-in .25s ease-out both',
        'slide-up': 'slide-up .32s cubic-bezier(.22,1,.36,1) both',
        'scale-in': 'scale-in .28s cubic-bezier(.22,1,.36,1) both',
        float: 'float 5s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 2.4s ease-in-out infinite',
        shimmer: 'shimmer 2.2s linear infinite',
        scan: 'scan 1.8s ease-in-out infinite',
        shake: 'shake .4s ease-in-out',
        'spin-slow': 'spin-slow 8s linear infinite',
        'reveal-up': 'reveal-up .45s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};

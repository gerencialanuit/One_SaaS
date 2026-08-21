import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: '#001B40',
        slate: {
          DEFAULT: '#44536B',
          muted: '#64748B',
        },
        brand: {
          blue: '#F15523',
          'blue-hover': '#F15523',
          'blue-dark': '#F15523',
          yellow: '#FFC414',
        },
        tint: {
          blue: '#FDF0E6',
          yellow: '#FFF9E8',
        },
      },
      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

export default config

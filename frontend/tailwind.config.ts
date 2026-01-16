import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SwarmShield Dark Pool Theme
        'void': '#000000',
        'void-light': '#0a0a0a',
        'void-border': '#1a1a1a',

        // Neon Green (Terminal/Success)
        'matrix': '#00FF00',
        'matrix-dim': '#00CC00',
        'matrix-glow': '#00FF0033',

        // Alert Red (MEV/Danger)
        'mev-red': '#FF0000',
        'mev-dim': '#CC0000',
        'mev-glow': '#FF000033',

        // Cyber Blue (Info/Neutral)
        'cyber': '#00FFFF',
        'cyber-dim': '#00CCCC',

        // Purple (Shielded/Protected)
        'shield': '#8B5CF6',
        'shield-glow': '#8B5CF633',
      },
      fontFamily: {
        'mono': ['JetBrains Mono', 'Fira Code', 'monospace'],
        'display': ['Space Grotesk', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'scan': 'scan 3s linear infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px #00FF00, 0 0 10px #00FF00, 0 0 15px #00FF00' },
          '100%': { boxShadow: '0 0 10px #00FF00, 0 0 20px #00FF00, 0 0 30px #00FF00' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
      backgroundImage: {
        'grid-pattern': `linear-gradient(#1a1a1a 1px, transparent 1px),
                         linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
        'radial-glow': 'radial-gradient(circle at center, #00FF0011 0%, transparent 70%)',
      },
      backgroundSize: {
        'grid': '50px 50px',
      },
    },
  },
  plugins: [],
} satisfies Config;

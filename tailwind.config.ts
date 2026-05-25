import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          primary: "#080808",
          secondary: "#111111",
          tertiary: "#0f0f0f",
          DEFAULT: "#080808",
        },
        border: {
          default: "#1a1a1a",
          muted: "#141414",
          strong: "#222222",
          DEFAULT: "#1a1a1a",
        },
        text: {
          primary: "#FAFAFA",
          secondary: "#888888",
          muted: "#555555",
        },
        violet: {
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
        },
        cyan: {
          400: "#22d3ee",
          500: "#06b6d4",
          600: "#0891b2",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "monospace"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "shimmer-x": "shimmer-x 2.4s linear infinite",
        float: "float 3s ease-in-out infinite",
        "float-slow": "float 6s ease-in-out infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "pulse-slow": "pulse-slow 5s ease-in-out infinite",
        "gradient-shift": "gradient-shift 4s ease infinite",
        "gradient-shift-slow": "gradient-shift 12s ease infinite",
        "fade-in": "fade-in 0.4s ease-out forwards",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "slide-in-left": "slide-in-left 0.4s ease-out forwards",
        "scale-in": "scale-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "spin-slow": "spin 14s linear infinite",
        "spin-slower": "spin 28s linear infinite",
        "orbit-slow": "orbit 18s linear infinite",
        marquee: "marquee 30s linear infinite",
        "border-rotate": "border-rotate 6s linear infinite",
        "bg-pan": "bg-pan 18s linear infinite",
        "tilt-hover": "tilt-hover 4s ease-in-out infinite",
        glow: "glow 2.5s ease-in-out infinite",
        ripple: "ripple 1.6s ease-out infinite",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "0% 0%" },
          "100%": { backgroundPosition: "200% 0%" },
        },
        "shimmer-x": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(300%)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "1" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "0.55", transform: "scale(1)" },
          "50%": { opacity: "0.95", transform: "scale(1.04)" },
        },
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-left": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.94)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        orbit: {
          "0%": { transform: "rotate(0deg) translateX(28px) rotate(0deg)" },
          "100%": { transform: "rotate(360deg) translateX(28px) rotate(-360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "border-rotate": {
          "0%": { "--angle": "0deg" },
          "100%": { "--angle": "360deg" },
        },
        "bg-pan": {
          "0%, 100%": { backgroundPosition: "0% 0%" },
          "50%": { backgroundPosition: "100% 100%" },
        },
        "tilt-hover": {
          "0%, 100%": { transform: "rotate(-0.5deg)" },
          "50%": { transform: "rotate(0.5deg)" },
        },
        glow: {
          "0%, 100%": {
            boxShadow:
              "0 0 22px rgba(124,58,237,0.35), 0 0 44px rgba(6,182,212,0.18)",
          },
          "50%": {
            boxShadow:
              "0 0 32px rgba(124,58,237,0.6), 0 0 70px rgba(6,182,212,0.32)",
          },
        },
        ripple: {
          "0%": { transform: "scale(0.9)", opacity: "0.6" },
          "100%": { transform: "scale(2.4)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

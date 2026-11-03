import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // OFFVYBE palette (brand sheet): black #000000, off-white #F5F5F5, red #B30015, grey #6B6B6B.
        // Token names are historical: burgundy = primary black, crimson = brand red, gold = bright accent red,
        // espresso = text black, ivory = off-white.
        bone: "var(--color-bone)",
        ink: "var(--color-ink)",
        burgundy: {
          50: "#F5F5F5",
          100: "#E8E8E8",
          200: "#D1D1D1",
          300: "#B0B0B0",
          400: "#8A8A8A",
          500: "#6B6B6B",
          600: "#4A4A4A",
          700: "#2E2E2E",
          800: "#1A1A1A",
          900: "#111111",
          950: "#0A0A0A",
          DEFAULT: "#0A0A0A",
          dark: "#000000",
          light: "#2A2A2A",
        },
        crimson: {
          DEFAULT: "#B30015",
          hover: "#C8102E",
          active: "#8E0011",
          light: "#D9364A",
        },
        espresso: {
          DEFAULT: "#0A0A0A",
          dark: "#000000",
          light: "#1F1F1F",
        },
        ivory: {
          DEFAULT: "#F5F5F5",
          dark: "#E8E8E8",
          light: "#FFFFFF",
          muted: "#E0E0E0",
        },
        gold: {
          DEFAULT: "#E3122B",
          light: "#F0394F",
          dark: "#8E0011",
          rich: "#E3122B",
        },
        steel: "#6B6B6B",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Montserrat", "Arial", "sans-serif"],
        sans: ["var(--font-sans)", "Montserrat", "Arial", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s infinite",
        marquee: "marquee 28s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;

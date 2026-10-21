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
        // Jodhpur palette: burgundy=Blue City indigo, crimson=Mehrangarh sandstone, gold=marigold, ivory=Thar sand
        bone: "var(--color-bone)",
        ink: "var(--color-ink)",
        burgundy: {
          50: "#EEF3FA",
          100: "#D9E3F2",
          200: "#B3C6E4",
          300: "#87A3D1",
          400: "#5B7FBC",
          500: "#3A5F9F",
          600: "#2A4B85",
          700: "#22406F",
          800: "#1F3A6B",
          900: "#162A4E",
          950: "#0E1B33",
          DEFAULT: "#1F3A6B",
          dark: "#172C52",
          light: "#2A4B85",
        },
        crimson: {
          DEFAULT: "#A8432F",
          hover: "#B9503A",
          active: "#8E3626",
          light: "#C46A52",
        },
        espresso: {
          DEFAULT: "#1A1712",
          dark: "#0F0D0A",
          light: "#2B2620",
        },
        ivory: {
          DEFAULT: "#F6EFE3",
          dark: "#EDE2CF",
          light: "#FFFDF8",
          muted: "#EADFCB",
        },
        gold: {
          DEFAULT: "#E3A33B",
          light: "#F0C072",
          dark: "#8A5A12",
          rich: "#E9A23B",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Playfair Display", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Plus Jakarta Sans", "Inter", "sans-serif"],
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

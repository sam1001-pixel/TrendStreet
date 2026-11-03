import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import plugin from "tailwindcss/plugin";

/**
 * Enter animations used across the storefront (`animate-in fade-in zoom-in-95 slide-in-from-right duration-300`).
 * Same API as the tailwindcss-animate plugin, kept inline so no extra package is needed.
 * Before this, those classes did nothing and drawers/modals popped in without motion.
 */
const enterAnimations = plugin(({ addUtilities, matchUtilities, theme }) => {
  addUtilities({
    "@keyframes enter": {
      from: {
        opacity: "var(--tw-enter-opacity, 1)",
        transform:
          "translate3d(var(--tw-enter-translate-x, 0), var(--tw-enter-translate-y, 0), 0) scale3d(var(--tw-enter-scale, 1), var(--tw-enter-scale, 1), var(--tw-enter-scale, 1))",
      },
    },
    ".animate-in": {
      animationName: "enter",
      animationDuration: "200ms",
      animationTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
      animationFillMode: "both",
      "--tw-enter-opacity": "initial",
      "--tw-enter-scale": "initial",
      "--tw-enter-translate-x": "initial",
      "--tw-enter-translate-y": "initial",
    },
  });
  matchUtilities({ "fade-in": (v) => ({ "--tw-enter-opacity": v }) }, { values: { DEFAULT: "0", ...(theme("animationOpacity") as Record<string, string>) } });
  matchUtilities({ "zoom-in": (v) => ({ "--tw-enter-scale": v }) }, { values: { DEFAULT: "0", ...(theme("animationScale") as Record<string, string>) } });
  matchUtilities(
    {
      "slide-in-from-top": (v) => ({ "--tw-enter-translate-y": `-${v}` }),
      "slide-in-from-bottom": (v) => ({ "--tw-enter-translate-y": v }),
      "slide-in-from-left": (v) => ({ "--tw-enter-translate-x": `-${v}` }),
      "slide-in-from-right": (v) => ({ "--tw-enter-translate-x": v }),
    },
    { values: { DEFAULT: "100%", ...(theme("animationTranslate") as Record<string, string>) } }
  );
  // `duration-300` sets the animation length too, as in tailwindcss-animate.
  matchUtilities({ duration: (v) => ({ animationDuration: v }) }, { values: theme("transitionDuration") as Record<string, string> });
});

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // `xs` (small phones and up) must come before `sm`, so the full list is spelled out.
    screens: { xs: "380px", ...defaultTheme.screens },
    extend: {
      boxShadow: { xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)" },
      backdropBlur: { xs: "2px" },
      animationOpacity: { 0: "0", 50: "0.5" },
      animationScale: { 50: ".5", 90: ".9", 95: ".95" },
      animationTranslate: { 2: "0.5rem", 4: "1rem", 8: "2rem", full: "100%" },
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
  plugins: [enterAnimations],
};

export default config;

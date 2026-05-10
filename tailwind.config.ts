import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Neutral palette
        ink: {
          DEFAULT: "#1a1a1a",
          soft: "#3a3a3a",
          mute: "#6b6b6b",
          faint: "#9a9a9a",
        },
        paper: {
          DEFAULT: "#fafaf7",
          warm: "#f1efe8",
          veil: "#efece4",
          card: "#ffffff",
        },
        // A single deep, considered accent
        accent: {
          DEFAULT: "#25405e",
          deep: "#1c3047",
          soft: "#4a6783",
        },
        line: {
          DEFAULT: "#e8e6df",
          strong: "#d8d5cc",
        },
      },
      fontFamily: {
        sans: ["Inter", "IBM Plex Sans Arabic", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Source Serif 4", "Charter", "Georgia", "serif"],
      },
      maxWidth: {
        prose: "65ch",
        reading: "44rem",
      },
      spacing: {
        "page-y": "5rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.04), 0 8px 24px -12px rgba(0,0,0,0.08)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
    },
  },
  plugins: [],
};

export default config;

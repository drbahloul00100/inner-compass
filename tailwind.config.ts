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
          warm: "#f4f3ee",
          card: "#ffffff",
        },
        // Single deep accent — a considered, calm blue
        accent: {
          DEFAULT: "#2c4a6b",
          deep: "#1f3650",
          soft: "#4a6783",
        },
        line: "#e8e6df",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "sans-serif"],
        serif: ["Charter", "Georgia", "serif"],
      },
      maxWidth: {
        prose: "65ch",
        reading: "42rem",
      },
      spacing: {
        "page-y": "5rem",
      },
    },
  },
  plugins: [],
};

export default config;

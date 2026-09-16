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
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        display: [
          "var(--font-display)",
          "Georgia",
          "Cambria",
          "serif",
        ],
      },
      transitionTimingFunction: {
        // One shared deceleration curve so every hover on the site moves
        // with the same physical feel instead of default linear-ish easing.
        butter: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      boxShadow: {
        // Paper elevation used by cards/masthead: soft, warm, never gray-black.
        paper: "0 1px 2px rgba(28, 25, 23, 0.05), 0 8px 24px -12px rgba(28, 25, 23, 0.14)",
        "paper-lg":
          "0 2px 4px rgba(28, 25, 23, 0.06), 0 20px 48px -16px rgba(28, 25, 23, 0.22)",
        "paper-gold": "0 16px 40px -16px rgba(184, 134, 11, 0.35)",
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
export default config;

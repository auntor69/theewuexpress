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
      typography: {
        DEFAULT: {
          css: {
            maxWidth: "none",
          },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
};
export default config;

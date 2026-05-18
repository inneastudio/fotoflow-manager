import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#f7f3ed",
        paper: "#fffaf2",
        mist: "#eee6da",
        ink: "#211d19",
        muted: "#776e63",
        line: "#e0d0bd",
        clay: "#a86f51",
        olive: "#6f7f61",
        rose: "#b85b5b",
        charcoal: "#332c25"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 24px 70px rgba(66, 47, 29, 0.10)",
        card: "0 10px 30px rgba(66, 47, 29, 0.07)"
      }
    }
  },
  plugins: []
};

export default config;

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
        canvas: "#f5f5f7",
        paper: "#ffffff",
        mist: "#e8e8ed",
        ink: "#1d1d1f",
        muted: "#6e6e73",
        line: "#d2d2d7",
        clay: "#0071e3",
        olive: "#248a3d",
        rose: "#d70015",
        charcoal: "#424245"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 18px 50px rgba(0, 0, 0, 0.08)",
        card: "0 8px 24px rgba(0, 0, 0, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

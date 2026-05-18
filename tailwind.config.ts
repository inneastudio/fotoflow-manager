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
        mist: "#f1f2f4",
        ink: "#171717",
        muted: "#6e6e73",
        line: "#e5e5ea",
        clay: "#8f6f42",
        olive: "#4f7c59",
        rose: "#c84747",
        charcoal: "#242426"
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui"]
      },
      boxShadow: {
        soft: "0 28px 80px rgba(15, 23, 42, 0.10)",
        card: "0 12px 36px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF6B35", // Orange
          dark: "#FF4500",
          light: "#FF8C55",
        },
        secondary: {
          DEFAULT: "#FFD700", // Yellow
          dark: "#FFA500",
          light: "#FFE135",
        },
        background: {
          DEFAULT: "#000000",
          card: "#0A0A0A",
          hover: "#1A1A1A",
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "cyber-grid": "linear-gradient(rgba(255, 107, 53, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 107, 53, 0.1) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "50px 50px",
      },
      boxShadow: {
        "glow-orange": "0 0 20px rgba(255, 107, 53, 0.5)",
        "glow-yellow": "0 0 20px rgba(255, 215, 0, 0.5)",
        "inner-glow": "inset 0 0 20px rgba(255, 107, 53, 0.2)",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "scan-line": "scan-line 3s linear infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": {
            boxShadow: "0 0 20px rgba(255, 107, 53, 0.5)",
          },
          "50%": {
            boxShadow: "0 0 40px rgba(255, 107, 53, 0.8)",
          },
        },
        "scan-line": {
          "0%": {
            transform: "translateY(-100%)",
          },
          "100%": {
            transform: "translateY(100vh)",
          },
        },
      },
    },
  },
  plugins: [],
};
export default config;
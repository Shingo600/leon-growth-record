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
        cream: "#f7f2ea",
        sand: "#e7dccd",
        ink: "#2f2a25",
        warm: "#c98b61",
        moss: "#6f7d5b"
      },
      boxShadow: {
        card: "0 18px 40px -24px rgba(47, 42, 37, 0.35)"
      },
      borderRadius: {
        "4xl": "2rem"
      }
    }
  },
  plugins: []
};

export default config;

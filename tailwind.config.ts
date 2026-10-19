import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F5EBDF",
        rust: "#C04E2A",
        maroon: "#661414",
        ink: "#351D1D",
        clay: "#B58777",
        blush: "#E6CBBD",
        paper: "#F8F2EB",
      },
      fontFamily: {
        serif: ["Fraunces Variable", "Georgia", "serif"],
        sans: ["DM Sans Variable", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;

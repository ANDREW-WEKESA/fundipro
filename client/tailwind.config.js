/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        terracotta: {
          DEFAULT: "#B85042",
          dark: "#9C463A",
          light: "#D17C6F",
        },
        sand: "#E7E8D1",
        sage: "#A7BEAE",
        bark: {
          DEFAULT: "#3A2E2A",
          card: "#4A3C36",
        },
        cream: "#FBFAF7",
        ink: "#33302E",
        muted: "#6B6058",
        good: "#4B7F52",
        bad: "#9E3B3B",
      },
      fontFamily: {
        display: ["Cambria", "Georgia", "serif"],
        body: ["Calibri", "Segoe UI", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px -8px rgba(58, 46, 42, 0.18)",
      },
    },
  },
  plugins: [],
};

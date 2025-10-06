/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        abcwhyte: ["ABCWhyte", "sans-serif"],
      },
      colors: {
        primary: "#df153e",
        "primary-hover": "#c8102e",
        secondary: "#707070",
        "gray-border": "#232323",
        surface: "#0C0C0C",
        "surface-hover": "#1A1A1A",
        helper: "#595959",
        background: "#090909",
        stroke: "#232323",
        footer: "#313131",
        "text-success": "rgba(0, 253, 160, 1)",
        "stroke-success": "rgba(0, 253, 160, 0.39)",
        "bg-success": "rgba(0, 253, 160, 0.06)",
        "text-pending": "rgba(255, 213, 0, 1)",
        "stroke-pending": "rgba(255, 213, 0, 0.39)",
        "bg-pending": "rgba(255, 213, 0, 0.06)",
        "text-failed": "rgba(255, 76, 76, 1)",
        "stroke-failed": "rgba(255, 76, 76, 0.39)",
        "bg-failed": "rgba(255, 76, 76, 0.06)",
      },
    },
  },
  plugins: [],
};

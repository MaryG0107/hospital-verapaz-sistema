export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      colors: {
        navy: {
          DEFAULT: "#0F7A3D",
          dark: "#0A5C2E",
          light: "#1C9752",
        },
        gold: {
          DEFAULT: "#B08B2E",
          light: "#D4AF54",
        },
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)",
        card: "0 2px 8px rgba(16, 24, 40, 0.06), 0 1px 2px rgba(16, 24, 40, 0.04)",
        lifted: "0 12px 24px -8px rgba(15, 122, 61, 0.25)",
      },
    },
  },
  plugins: [],
};

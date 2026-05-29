/**
 * Tailwind CSS Configuration File.
 *
 * Defines content source paths and custom themes (harmonic HSL colors,
 * fonts, animations) for the Omnisage application frontend.
 * Uses ES module syntax since package.json sets "type": "module".
 */

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Aesthetic, harmony-rich medical theme colors
        primary: {
          50: "hsl(214, 100%, 97%)",
          100: "hsl(214, 95%, 93%)",
          500: "hsl(215, 90%, 50%)", // Modern clean medical blue
          600: "hsl(215, 90%, 40%)",
          700: "hsl(215, 90%, 30%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [],
}

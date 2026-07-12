/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Base — same graphite DNA as DevCalendar/City Lens, kept consistent
        // across your projects as a personal brand signal.
        graphite: {
          950: "#0e0d0c",
          900: "#151311",
          800: "#1e1b18",
          700: "#2b2723",
        },
        // Two combatants, two accents. This is the signature move: every
        // "you" data point renders in amber, every "rival" data point in
        // ember-red. The gap between them IS the product.
        amber: {
          DEFAULT: "#d97706",
          soft: "#c9a96e",
        },
        ember: {
          DEFAULT: "#b34a3c",
          soft: "#c97462",
        },
        parchment: "#ece7dd",
        muted: "#8a8378",
      },
      fontFamily: {
        display: ["Instrument Serif", "serif"],
        body: ["Geist", "system-ui", "sans-serif"],
        mono: ["Geist Mono", "JetBrains Mono", "monospace"],
      },
      borderRadius: {
        card: "16px",
      },
    },
  },
  plugins: [],
};

/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // Instrument graphite surfaces
        ink: {
          base: "#0D1117",
          deep: "#10141A",
          panel: "#161B22",
          elevated: "#1C232C",
          edge: "#262D38",
          line: "#1d242d",
        },
        txt: {
          DEFAULT: "#E6EDF3",
          muted: "#8B97A6",
          faint: "#5c6775",
        },
        // Strict semantic system (verdict logic only)
        robust: { DEFAULT: "#3FB68B", soft: "#3fb68b1f" },
        caution: { DEFAULT: "#D9A441", soft: "#d9a4411f" },
        overfit: { DEFAULT: "#E5534B", soft: "#e5534b1f" },
        // Data accent — charts, axes, interactive highlights ONLY
        data: { DEFAULT: "#58A6FF", soft: "#58a6ff1f" },
        // Back-compat aliases (interactive accent + verdict palette)
        brand: { DEFAULT: "#58A6FF", dark: "#3f8de0" },
        verdict: {
          green: "#3FB68B",
          yellow: "#D9A441",
          red: "#E5534B",
        },
      },
      fontFamily: {
        sans: ["IBM Plex Sans", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["IBM Plex Sans", "Inter", "ui-sans-serif", "sans-serif"],
        mono: ["IBM Plex Mono", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      letterSpacing: {
        label: "0.12em",
      },
      keyframes: {
        // Inflated value deflating to its true value (Truth Collapse)
        deflate: {
          "0%": { transform: "translateY(-0.08em)", opacity: "0.55" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        // System unlock reveal for the access gate -> dashboard
        unlock: {
          "0%": { opacity: "0", transform: "scale(0.985)", filter: "blur(2px)" },
          "60%": { opacity: "1", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1)", filter: "blur(0)" },
        },
        // Settle / stabilize on data render
        settle: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        scan: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        unlock: "unlock 620ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        settle: "settle 380ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
        scan: "scan 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};

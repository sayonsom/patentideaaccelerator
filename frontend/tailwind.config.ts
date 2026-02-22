import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ─── McKinsey Primary ─────────────────────────
        "blue-ribbon": "#2251FF",
        "black-pearl": "#051C2C",
        ink: "#051C2C",

        // ─── McKinsey Secondary ───────────────────────
        "stellar-explorer": "#051C2A",
        "mondrian-blue": "#163E93",
        dayflower: "#30A3DA",
        marine: "#053259",
        "rhapsody-blue": "#042440",

        // ─── McKinsey Accent ──────────────────────────
        "mack-creek": "#BFAE5A",
        "crusade-king": "#D9C666",
        "yellow-warning": "#F3C13A",

        // ─── McKinsey Neutral ─────────────────────────
        "cotton-field": "#F2F0E9",
        "neutral-off-white": "#F5F5F5",
        "neutral-light": "#A2AAAD",
        "neutral-dark": "#222222",
        "armor-wash": "#060200",

        // ─── Semantic Surface (Light Mode) ────────────
        surface: {
          DEFAULT: "#FFFFFF",
          secondary: "#F5F5F5",
          tertiary: "#F2F0E9",
          elevated: "#FFFFFF",
        },

        // ─── Semantic Border ──────────────────────────
        border: {
          DEFAULT: "#E5E7EB",
          strong: "#A2AAAD",
          hover: "#051C2C",
        },

        // ─── Semantic Text ────────────────────────────
        text: {
          primary: "#051C2C",
          secondary: "#222222",
          muted: "#A2AAAD",
          inverse: "#FFFFFF",
        },

        // ─── Functional Accents ───────────────────────
        accent: {
          DEFAULT: "#2251FF",
          hover: "#1A41CC",
          light: "#E8EEFF",
        },

        success: "#2E6F4E",
        warning: "#F3C13A",
        danger: "#B91C1C",

        // ─── Series colors (charts/badges via CSS vars) ──
        series: {
          1: "var(--series-1)",
          2: "var(--series-2)",
          3: "var(--series-3)",
          4: "var(--series-4)",
          5: "var(--series-5)",
          6: "var(--series-6)",
          7: "var(--series-7)",
          8: "var(--series-8)",
        },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Arial", "Helvetica", "sans-serif"],
      },
      animation: {
        "fade-in": "fadeIn 0.3s ease-out",
        "slide-up": "slideUp 0.4s ease-out",
        pulse: "pulse 2s infinite",
        spin: "spin 1s linear infinite",
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      spacing: {
        18: "4.5rem",
        22: "5.5rem",
      },
      maxWidth: {
        prose: "750px",
      },
    },
  },
  plugins: [],
};
export default config;

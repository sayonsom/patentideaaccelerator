import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Semantic surface colors
        surface: {
          DEFAULT: "#FFFFFF",
          panel: "#F5F7FA",
          deep: "#020617",
          card: "#0f172a",
          elevated: "#1e293b",
          dark: "#0b1120",
        },
        border: {
          DEFAULT: "#1e293b",
          grid: "#E5E7EB",
          axis: "#D1D5DB",
          hover: "#334155",
        },
        text: {
          primary: "#f8fafc",
          secondary: "#e2e8f0",
          muted: "#94a3b8",
          dim: "#64748b",
          faint: "#475569",
        },
        // Dark mode overrides (accessible via dark: prefix)
        dark: {
          surface: "#0B1220",
          panel: "#111827",
          grid: "#1F2933",
          axis: "#374151",
          textPrimary: "#E5E7EB",
          textSecondary: "#9CA3AF",
        },
        // Accent colors
        accent: {
          DEFAULT: "#1F4CEB",
          gold: "#f59e0b",
          blue: "#3b82f6",
          green: "#10b981",
          red: "#ef4444",
          purple: "#8b5cf6",
          pink: "#ec4899",
          cyan: "#06b6d4",
          orange: "#f97316",
        },
        // Series colors for charts/badges (resolved via CSS vars)
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
        // Semantic aliases
        success: "#2E6F4E",
        warning: "#C69214",
        danger: "#7A2E2E",
      },
      fontFamily: {
        body: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "serif"],
        mono: ["var(--font-mono)", "monospace"],
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
    },
  },
  plugins: [],
};
export default config;

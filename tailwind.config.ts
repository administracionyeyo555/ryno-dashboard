import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#111111",
        foreground: "#ededed",
        card: "#1a1a1a",
        "card-hover": "#222222",
        border: "#2a2a2a",
        "border-hover": "#3a3a3a",
        accent: "#FF6B35",
        "accent-hover": "#ff8554",
        "accent-muted": "rgba(255, 107, 53, 0.1)",
        muted: "#888888",
        success: "#22c55e",
        warning: "#eab308",
        error: "#ef4444",
        info: "#3b82f6",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Geist", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "Geist Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-in": "slideIn 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};
export default config;

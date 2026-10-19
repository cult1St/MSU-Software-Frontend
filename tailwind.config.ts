import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          red: "#d0342c",
          reddark: "#b32b24",
        },
        ink: "#1c1c1e",
        sidebar: {
          DEFAULT: "#242427",
          hover: "#323236",
          muted: "#9a9a9e",
          text: "#c9c9cc",
          border: "#38383c",
        },
        surface: {
          DEFAULT: "#f3f3f4",
          border: "#e6e6e8",
          muted: "#8a8a8e",
          soft: "#d9d9dc",
        },
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontSize: {
        "portal": ["13px", { lineHeight: "1.4" }],
      },
      keyframes: {
        "brand-pop": {
          "0%, 100%": { transform: "scale(0.86)", opacity: "0.75" },
          "45%": { transform: "scale(1.08)", opacity: "1" },
          "70%": { transform: "scale(0.96)", opacity: "0.95" },
        },
        "brand-ring": {
          "0%, 100%": { transform: "scale(0.9)", opacity: "0.35" },
          "50%": { transform: "scale(1.25)", opacity: "0" },
        },
        "brand-dot": {
          "0%, 80%, 100%": { transform: "translateY(0)", opacity: "0.35" },
          "40%": { transform: "translateY(-4px)", opacity: "1" },
        },
      },
      animation: {
        "brand-pop": "brand-pop 1.35s ease-in-out infinite",
        "brand-ring": "brand-ring 1.35s ease-out infinite",
        "brand-dot": "brand-dot 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

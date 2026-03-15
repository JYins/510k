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
        // iOS Dark Mode Colors
        bg: {
          primary: "#000000",
          secondary: "#1C1C1E",
          tertiary: "#2C2C2E",
          elevated: "#3A3A3C",
          card: "rgba(28, 28, 30, 0.85)",
          glass: "rgba(44, 44, 46, 0.7)",
        },
        // iOS System Gray Colors
        ios: {
          gray: {
            100: "#8E8E93",
            200: "#636366",
            300: "#48484A",
            400: "#3A3A3C",
            500: "#2C2C2E",
            600: "#1C1C1E",
          },
          blue: "#0A84FF",
          green: "#34C759",
          red: "#FF453A",
          orange: "#FF9F0A",
          yellow: "#FFCC00",
          pink: "#FF375F",
          purple: "#BF5AF2",
          indigo: "#5E5CE6",
          teal: "#5AC8FA",
        },
        // Surface Colors with Glassmorphism
        surface: {
          DEFAULT: "rgba(44, 44, 46, 0.6)",
          hover: "rgba(58, 58, 60, 0.8)",
          pressed: "rgba(72, 72, 74, 0.9)",
          solid: "#2C2C2E",
        },
        // Text Colors
        text: {
          primary: "#FFFFFF",
          secondary: "rgba(255, 255, 255, 0.7)",
          tertiary: "rgba(255, 255, 255, 0.5)",
          inverse: "#000000",
        },
        // Accent Colors - iOS Style
        accent: {
          DEFAULT: "#0A84FF",
          hover: "#5AC8FA",
          pressed: "#0070D8",
          glow: "rgba(10, 132, 255, 0.5)",
        },
        // Semantic Colors
        success: "#34C759",
        warning: "#FF9F0A",
        error: "#FF453A",
        // Card Suits
        suit: {
          hearts: "#FF453A",
          diamonds: "#FF453A",
          spades: "#FFFFFF",
          clubs: "#FFFFFF",
        },
        // Turn Indicator
        turn: {
          active: "#34C759",
          inactive: "#3A3A3C",
        },
      },
      fontFamily: {
        sans: ["SF Pro Display", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "PingFang SC", "Microsoft YaHei", "sans-serif"],
        mono: ["SF Mono", "SFMono-Regular", "monospace"],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.75rem" }],
        "xs": ["0.75rem", { lineHeight: "1rem" }],
        "sm": ["0.875rem", { lineHeight: "1.25rem" }],
        "base": ["1rem", { lineHeight: "1.5rem" }],
        "lg": ["1.125rem", { lineHeight: "1.75rem" }],
        "xl": ["1.25rem", { lineHeight: "1.75rem" }],
        "2xl": ["1.5rem", { lineHeight: "2rem" }],
        "3xl": ["1.875rem", { lineHeight: "2.25rem" }],
        "4xl": ["2.25rem", { lineHeight: "2.5rem" }],
      },
      spacing: {
        "0.5": "0.125rem",
        "1": "0.25rem",
        "1.5": "0.375rem",
        "2": "0.5rem",
        "2.5": "0.625rem",
        "3": "0.75rem",
        "3.5": "0.875rem",
        "4": "1rem",
        "5": "1.25rem",
        "6": "1.5rem",
        "7": "1.75rem",
        "8": "2rem",
        "9": "2.25rem",
        "10": "2.5rem",
        "11": "2.75rem",
        "12": "3rem",
        "14": "3.5rem",
        "16": "4rem",
        "20": "5rem",
        "24": "6rem",
        "28": "7rem",
        "32": "8rem",
        "36": "9rem",
        "40": "10rem",
        "44": "11rem",
        "48": "12rem",
        "52": "13rem",
        "56": "14rem",
        "60": "15rem",
        "64": "16rem",
        "72": "18rem",
        "80": "20rem",
        "88": "22rem",
        "96": "24rem",
      },
      borderRadius: {
        "none": "0",
        "xs": "4px",
        "sm": "8px",
        "md": "12px",
        "lg": "16px",
        "xl": "20px",
        "2xl": "24px",
        "3xl": "28px",
        "4xl": "32px",
        "full": "9999px",
        "card": "16px",
        "button": "12px",
        "avatar": "14px",
      },
      boxShadow: {
        // iOS Floating Shadows
        "ios": "0 4px 24px rgba(0, 0, 0, 0.5)",
        "ios-lg": "0 8px 32px rgba(0, 0, 0, 0.6)",
        "ios-xl": "0 12px 48px rgba(0, 0, 0, 0.7)",
        // Floating Button Shadow
        "float": "0 4px 20px rgba(10, 132, 255, 0.4), 0 2px 8px rgba(0, 0, 0, 0.3)",
        "float-hover": "0 8px 30px rgba(10, 132, 255, 0.5), 0 4px 12px rgba(0, 0, 0, 0.4)",
        "float-active": "0 2px 10px rgba(10, 132, 255, 0.3), 0 1px 4px rgba(0, 0, 0, 0.3)",
        // Card Shadows
        "card": "0 4px 24px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        "card-hover": "0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)",
        "card-selected": "0 0 0 2.5px #0A84FF, 0 8px 32px rgba(10, 132, 255, 0.3)",
        // Button Shadows
        "button": "0 2px 8px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)",
        "button-active": "0 1px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
        // Elevated
        "elevated": "0 8px 32px rgba(0, 0, 0, 0.5)",
        // Glow Effects
        "glow": "0 0 30px rgba(10, 132, 255, 0.5)",
        "glow-green": "0 0 30px rgba(52, 199, 89, 0.5)",
        "glow-red": "0 0 30px rgba(255, 69, 58, 0.5)",
        "glow-purple": "0 0 30px rgba(191, 90, 242, 0.5)",
      },
      transitionTimingFunction: {
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
      },
      transitionDuration: {
        "50": "50ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "250": "250ms",
        "300": "300ms",
        "400": "400ms",
        "500": "500ms",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(20px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(99, 102, 241, 0.3)" },
          "50%": { boxShadow: "0 0 30px rgba(99, 102, 241, 0.6)" },
        },
        "card-float": {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" },
        },
        "shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-4px)" },
          "75%": { transform: "translateX(4px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.3s ease-out",
        "fade-up": "fade-up 0.4s ease-out",
        "scale-in": "scale-in 0.3s ease-out",
        "slide-up": "slide-up 0.4s ease-out",
        "pulse-soft": "pulse-soft 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "card-float": "card-float 3s ease-in-out infinite",
        "shake": "shake 0.3s ease-in-out",
      },
      backdropBlur: {
        "xs": "2px",
        "ios": "20px",
        "glass": "40px",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "ios-gradient": "linear-gradient(180deg, rgba(44,44,46,0.8) 0%, rgba(28,28,30,0.9) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;

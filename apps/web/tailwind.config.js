/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        flexy: {
          bg: "#08090d",
          surface: "#11131a",
          card: "rgba(255,255,255,0.04)",
          ink: "#f4f5f7",
          mute: "rgba(244,245,247,0.6)",
          line: "rgba(255,255,255,0.08)",
          accent: "#22e7a2",
          accent2: "#06d4ce",
        },
      },
      fontFamily: {
        sans: ['"Inter var"', 'Inter', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'Inter', 'sans-serif'],
      },
      backdropBlur: { xs: "2px" },
      boxShadow: {
        glass: "0 1px 0 rgba(255,255,255,0.06) inset, 0 8px 32px rgba(0,0,0,0.3)",
      },
      animation: {
        "fade-in": "fadeIn 200ms ease-out both",
        "slide-up": "slideUp 240ms cubic-bezier(.2,.7,.2,1) both",
      },
      keyframes: {
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
        slideUp: { from: { transform: "translateY(8px)", opacity: "0" }, to: { transform: "translateY(0)", opacity: "1" } },
      },
    },
  },
  plugins: [],
};

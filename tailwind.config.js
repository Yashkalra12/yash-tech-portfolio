/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      rotate: {
        "y-180": "rotateY(180deg)",
      },
      colors: {
        // The reference design's single accent colour.
        brand: "#006AFF",
        // Kept for the legacy dark portfolio at /legacy.
        background: "#CBACF9",
      },
      fontFamily: {
        sans: ["Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        spacemono: ["Space Mono", "ui-monospace", "monospace"],
        cartoon: ["Nanum Pen Script", "cursive"],
      },
      boxShadow: {
        "3xl": "0 10px 40px 0 rgba(80, 80, 180, 0.35), 0 2px 8px 0 rgba(0,0,0,0.10)",
      },
      backgroundImage: {
        glass:
          "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(200,200,255,0.10) 100%)",
      },
    },
  },
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        ".bg-glass": {
          background: "rgba(255,255,255,0.08)",
          "backdrop-filter": "blur(8px)",
        },
        ".text-gradient": {
          background: "linear-gradient(90deg, #CBACF9, #38bdf8, #6366f1)",
          "-webkit-background-clip": "text",
          "-webkit-text-fill-color": "transparent",
        },
      });
    },
  ],
};

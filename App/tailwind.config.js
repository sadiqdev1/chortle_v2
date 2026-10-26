/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/screens/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],

  // NativeWind v4 uses "class" strategy driven by the ThemeContext
  darkMode: "class",

  theme: {
    extend: {
      colors: {
        // ── Light canvas ─────────────────────────────────────
        bg:             "#FFFFFF",
        elevated:       "#FFFFFF",
        "bg-card":      "#F1F0EB",
        "bg-input":     "#F1F0EB",
        surface:        "#F7F6F2",
        border:         "#E4E2DA",
        "border-light": "#EDEBE3",

        // ── Brand accent ──────────────────────────────────────
        accent:         "#3D1B83",
        "accent-bright":"#6A3FD2",
        "accent-soft":  "#EDE7FA",
        "accent-dim":   "#D4C8F5",

        // ── Text ──────────────────────────────────────────────
        ink:             "#111111",
        "text-primary":  "#111111",
        "text-secondary":"#555555",
        "text-muted":    "#A5A399",
        "text-inverse":  "#FFFFFF",

        // ── Semantic ──────────────────────────────────────────
        success: "#2F6B4F",
        error:   "#E5484D",
        warning: "#8A6D1B",
        danger:  "#E5484D",
      },
      borderRadius: {
        sm:    "6px",
        md:    "10px",
        lg:    "14px",
        xl:    "18px",
        "2xl": "24px",
        full:  "9999px",
      },
      fontFamily: {
        sans:          ["Inter_400Regular"],
        "sans-md":     ["Inter_500Medium"],
        "sans-semi":   ["Inter_600SemiBold"],
        "sans-bold":   ["Inter_700Bold"],
        friendly:      ["Fredoka_600SemiBold"],
        "friendly-r":  ["Fredoka_400Regular"],
        display:       ["LilitaOne_400Regular"],
      },
    },
  },
  plugins: [],
};

// ─────────────────────────────────────────────────────────────
//  Chortle — Meme Platform Design System
//  Neutral base, one loud accent. Orange does the work.
// ─────────────────────────────────────────────────────────────

// ── Fonts ────────────────────────────────────────────────────
export const Fonts = {
  display: "LilitaOne_400Regular",
  friendly: "Fredoka_600SemiBold",
  friendlyRegular: "Fredoka_400Regular",
  bold: "Inter_700Bold",
  semiBold: "Inter_600SemiBold",
  medium: "Inter_500Medium",
  regular: "Inter_400Regular",
};

// ── Static Colors (light palette — used by files that haven't
//    adopted useTheme yet). Dynamic palette lives in ThemeContext.
// ─────────────────────────────────────────────────────────────
export const Colors = {
  bg:           "#FFFFFF",
  bgElevated:   "#FFFFFF",
  bgCard:       "#F1F0EB",
  bgInput:      "#F1F0EB",
  surface:      "#F7F6F2",
  surface2:     "#EDEBE3",
  border:       "#E4E2DA",
  borderLight:  "#EDEBE3",
  accent:       "#3D1B83",
  accentBright: "#6A3FD2",
  accentSoft:   "#EDE7FA",
  accentDim:    "#D4C8F5",
  textPrimary:  "#111111",
  textSecondary:"#555555",
  textMuted:    "#A5A399",
  textInverse:  "#FFFFFF",
  ink:          "#111111",
  white:        "#FFFFFF",
  black:        "#000000",
  danger:       "#E5484D",
  success:      "#2F6B4F",
  error:        "#E5484D",
  warning:      "#8A6D1B",
};

// ── Typography ───────────────────────────────────────────────
export const Typography = {
  // Display — Lilita One. Reserved for the wordmark and hero
  // moments where the brand voice needs to be loud.
  display: {
    fontFamily: Fonts.display,
    fontSize: 36,
    letterSpacing: 0.5,
    lineHeight: 42,
  },
  hero: {
    fontFamily: Fonts.display,
    fontSize: 48,
    letterSpacing: 1,
    lineHeight: 54,
  },

  // Headings — Fredoka. Rounded and friendly without going
  // full cartoon; safe for repeated use in the UI.
  h1: {
    fontFamily: Fonts.friendly,
    fontSize: 27,
    letterSpacing: -0.2,
    lineHeight: 33,
  },
  h2: {
    fontFamily: Fonts.friendly,
    fontSize: 21,
    letterSpacing: -0.1,
    lineHeight: 27,
  },
  h3: {
    fontFamily: Fonts.friendly,
    fontSize: 18,
    letterSpacing: 0,
    lineHeight: 24,
  },
  h4: {
    fontFamily: Fonts.friendly,
    fontSize: 16,
    letterSpacing: 0,
    lineHeight: 22,
  },

  // Body — Inter. Neutral, highly legible, does not compete
  // with the display/friendly fonts above.
  body: {
    fontFamily: Fonts.regular,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 24,
  },
  bodyMd: {
    fontFamily: Fonts.medium,
    fontSize: 15,
    letterSpacing: 0,
    lineHeight: 24,
  },
  small: {
    fontFamily: Fonts.regular,
    fontSize: 13,
    letterSpacing: 0,
    lineHeight: 19,
  },
  tiny: {
    fontFamily: Fonts.medium,
    fontSize: 11,
    letterSpacing: 0.5,
    lineHeight: 16,
  },

  // Label — all-caps eyebrow text, section dividers, pills
  label: {
    fontFamily: Fonts.bold,
    fontSize: 11,
    letterSpacing: 2,
    lineHeight: 16,
  },
};

// ── Radius ───────────────────────────────────────────────────
export const Radius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  xxl: 24,
  full: 999,
};

// ── Shadow ───────────────────────────────────────────────────
export const Shadow = {
  card: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  raised: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  // Orange glow, used ONLY for the elevated Create button and
  // active/selected states — this is the one place a colored
  // shadow is allowed, precisely because it's rare.
  accentGlow: {
    shadowColor: "#FF5A1F",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
};

// ── Content taxonomies ───────────────────────────────────────
// Humor tags — replaces the old blog CATEGORIES entirely.
export const CATEGORIES = [
  { id: "trending",  label: "Trending" },
  { id: "funny", label: "Funny" },
  { id: "relatable", label: "Relatable" },
  { id: "gaming",    label: "Gaming" },
  { id: "wholesome", label: "Wholesome" },
  { id: "tech",   label: "Coding" },
];

// Reaction set — matches the backend enum + UI reaction IDs.
// Single tap = 'fire'. Long press reveals the full picker.
export const REACTIONS = [
  { id: "fire",  emoji: "🔥", label: "Fire"  },
  { id: "laugh", emoji: "😂", label: "Haha"  },
  { id: "skull", emoji: "💀", label: "Dead"  },
  { id: "heart", emoji: "❤️", label: "Love"  },
];
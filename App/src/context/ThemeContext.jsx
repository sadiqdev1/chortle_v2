import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { Appearance } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// ─────────────────────────────────────────────────────────────
//  Chortle — Dual-mode colour palettes
//  Same accent (#3D1B83 / #7B4BE8), different canvas.
// ─────────────────────────────────────────────────────────────

export const LightColors = {
  // Canvas
  bg:           "#FFFFFF",
  bgElevated:   "#FFFFFF",
  bgCard:       "#F1F0EB",
  bgInput:      "#F1F0EB",
  surface:      "#F7F6F2",
  surface2:     "#EDEBE3",

  // Borders
  border:       "#E4E2DA",
  borderLight:  "#EDEBE3",

  // Accent — deep purple brand
  accent:       "#3D1B83",
  accentBright: "#6A3FD2",
  accentSoft:   "#EDE7FA",
  accentDim:    "#D4C8F5",

  // Text
  textPrimary:  "#111111",
  textSecondary:"#555555",
  textMuted:    "#A5A399",
  textInverse:  "#FFFFFF",
  ink:          "#111111",

  // Utility
  white:        "#FFFFFF",
  black:        "#000000",
  danger:       "#E5484D",

  // System
  success:      "#2F6B4F",
  error:        "#E5484D",
  warning:      "#8A6D1B",

  // Cover gradient stops (profile)
  coverGradient: ["#C4B0F0", "#8A5BFF", "#3D1B83", "#1A0A50"],
};

export const DarkColors = {
  // Canvas
  bg:           "#090812",
  bgElevated:   "#10101B",
  bgCard:       "#151322",
  bgInput:      "#1A1828",
  surface:      "#10101B",
  surface2:     "#151322",

  // Borders
  border:       "#252238",
  borderLight:  "#1E1C30",

  // Accent — brighter on dark canvas
  accent:       "#7B4BE8",
  accentBright: "#9A70FF",
  accentSoft:   "#1E1540",
  accentDim:    "#2A1D5A",

  // Text
  textPrimary:  "#F7F5FF",
  textSecondary:"#A6A0C0",
  textMuted:    "#77718F",
  textInverse:  "#090812",
  ink:          "#F7F5FF",

  // Utility
  white:        "#FFFFFF",
  black:        "#000000",
  danger:       "#FF4F8B",

  // System
  success:      "#4ADE80",
  error:        "#FF4F8B",
  warning:      "#FCD34D",

  // Cover gradient stops (profile)
  coverGradient: ["#24105B", "#3D1B83", "#6A3FD2", "#32156F"],
};

// ─────────────────────────────────────────────────────────────

const STORAGE_KEY = "chortle_theme";

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  // "system" | "light" | "dark"
  const [preference, setPreference] = useState("system");
  const [systemScheme, setSystemScheme] = useState(
    Appearance.getColorScheme() ?? "light"
  );

  // Restore saved preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((saved) => {
      if (saved === "light" || saved === "dark" || saved === "system") {
        setPreference(saved);
      }
    });
  }, []);

  // Track system appearance changes
  useEffect(() => {
    const sub = Appearance.addChangeListener(({ colorScheme }) => {
      setSystemScheme(colorScheme ?? "light");
    });
    return () => sub.remove();
  }, []);

  const isDark = useMemo(() => {
    if (preference === "dark") return true;
    if (preference === "light") return false;
    return systemScheme === "dark";
  }, [preference, systemScheme]);

  const colors = useMemo(
    () => (isDark ? DarkColors : LightColors),
    [isDark]
  );

  const setTheme = useCallback((pref) => {
    setPreference(pref);
    AsyncStorage.setItem(STORAGE_KEY, pref);
  }, []);

  const toggleTheme = useCallback(() => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
  }, [isDark, setTheme]);

  const value = useMemo(
    () => ({ colors, isDark, preference, setTheme, toggleTheme }),
    [colors, isDark, preference, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

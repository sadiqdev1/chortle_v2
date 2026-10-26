/**
 * ToastContext — lightweight, beautiful toast notification system.
 *
 * Usage:
 *   const { toast } = useToast();
 *   toast.success("Post saved!");
 *   toast.error("Something went wrong");
 *   toast.info("Check your connection");
 *   toast.warn("Slow network detected");
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Dimensions, StyleSheet, Text, View } from "react-native";
import Animated, {
  FadeInDown,
  FadeOutUp,
  LinearTransition,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "./ThemeContext";
import { Fonts, Radius } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const TOAST_DURATION = 3500;

let _nextId = 0;

const ToastContext = createContext(null);

/* ── single toast item visual ─────────────────────────────── */
const TYPE_META = {
  success: { icon: "✅", accent: "#2F6B4F", bg: "#E8F5EE" },
  error:   { icon: "❌", accent: "#E5484D", bg: "#FFE8E8" },
  warn:    { icon: "⚠️", accent: "#8A6D1B", bg: "#FBF1D4" },
  info:    { icon: "ℹ️", accent: "#3D1B83", bg: "#EDE7FA" },
  offline: { icon: "📵", accent: "#555555", bg: "#F0F0F0" },
};

const TYPE_META_DARK = {
  success: { icon: "✅", accent: "#4ADE80", bg: "#0D2B1D" },
  error:   { icon: "❌", accent: "#FF4F8B", bg: "#2B0D16" },
  warn:    { icon: "⚠️", accent: "#FCD34D", bg: "#2B2000" },
  info:    { icon: "ℹ️", accent: "#9A70FF", bg: "#1E1540" },
  offline: { icon: "📵", accent: "#A6A0C0", bg: "#1A1828" },
};

function ToastItem({ toast, onDismiss }) {
  const { colors, isDark } = useTheme();
  const meta = (isDark ? TYPE_META_DARK : TYPE_META)[toast.type] ?? TYPE_META.info;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18).stiffness(300)}
      exiting={FadeOutUp.duration(200)}
      layout={LinearTransition.springify().damping(18)}
      style={[
        styles.toast,
        {
          backgroundColor: isDark ? colors.bgCard : meta.bg,
          borderColor: meta.accent + (isDark ? "55" : "33"),
          shadowColor: meta.accent,
        },
      ]}
    >
      <Text style={styles.icon}>{meta.icon}</Text>
      <Text
        style={[
          styles.message,
          {
            fontFamily: Fonts.medium,
            color: isDark ? colors.textPrimary : meta.accent,
          },
        ]}
        numberOfLines={3}
      >
        {toast.message}
      </Text>
    </Animated.View>
  );
}

/* ── provider ─────────────────────────────────────────────── */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef({});
  const insets = useSafeAreaInsets();

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timers.current[id]);
    delete timers.current[id];
  }, []);

  const show = useCallback(
    (message, type = "info", duration = TOAST_DURATION) => {
      const id = ++_nextId;
      setToasts((prev) => [...prev.slice(-2), { id, message, type }]);

      timers.current[id] = setTimeout(() => {
        dismiss(id);
      }, duration);

      return id;
    },
    [dismiss]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const toast = {
    success: (msg, dur) => show(msg, "success", dur),
    error:   (msg, dur) => show(msg, "error", dur),
    warn:    (msg, dur) => show(msg, "warn", dur),
    info:    (msg, dur) => show(msg, "info", dur),
    offline: (msg, dur) => show(msg || "No internet connection", "offline", dur ?? 5000),
    dismiss,
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Overlay container — top of screen, above everything */}
      <View
        style={[
          styles.container,
          { top: insets.top + 8, paddingHorizontal: 16 },
        ]}
        pointerEvents="box-none"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 9999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 8,
    maxWidth: SCREEN_WIDTH - 32,
  },
  icon: {
    fontSize: 16,
  },
  message: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});

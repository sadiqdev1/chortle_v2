import { QueryClientProvider } from "@tanstack/react-query";
import { Fredoka_400Regular, Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import { LilitaOne_400Regular } from "@expo-google-fonts/lilita-one";
import { useFonts } from "expo-font";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "../../global.css";
import { AuthProvider } from "../context/AuthContext";
import { BookmarksProvider } from "../context/BookmarksContext";
import { ThemeProvider, useTheme } from "../context/ThemeContext";
import { ToastProvider } from "../context/ToastContext";
import { useAuth } from "../hooks/useAuth";
import { queryClient } from "../lib/queryClient";
import NetworkBanner from "../components/NetworkBanner";
import ErrorBoundary from "../components/ErrorBoundary";

SplashScreen.preventAutoHideAsync();

// ── Push notification tap handler ─────────────────────────
// Guard: expo-notifications remote push removed from Expo Go SDK 53+
// Only wire up on real devices / dev builds.
let Notifications = null;
try {
  Notifications = require("expo-notifications");
  // Configure foreground behaviour
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch {
  // Running in Expo Go — push notifications not available
}

function AuthGuard() {
  const { user, loading } = useAuth();
  const segments = useSegments();

  // Handle push notification taps — navigate to the right screen
  useEffect(() => {
    if (!Notifications) return; // Expo Go — skip
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data ?? {};
      if (data.meme_slug) {
        router.push({ pathname: "/PostView", params: { slug: data.meme_slug } });
      } else if (data.actor_username) {
        router.push({ pathname: "/UserProfile", params: { username: data.actor_username } });
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (loading) return;
    const inAuthGroup =
      segments[0] === "(auth)" ||
      segments[0] === "welcome" ||
      segments[0] === undefined;
    // CompleteProfile is part of onboarding — always allow through
    const isCompleteProfile =
      segments[0] === "(auth)" && segments[1] === "CompleteProfile";
    if (!user && !inAuthGroup) {
      router.replace("/welcome");
      return;
    }
    if (user && inAuthGroup && segments[0] !== undefined && !isCompleteProfile) {
      router.replace("/(tabs)");
    }
  }, [user, loading, segments]);

  return null;
}

function ThemedStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? "light" : "dark"} />;
}

// ── Root layout — Expo Router requires a default export ───
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    LilitaOne_400Regular,
    Fredoka_400Regular,
    Fredoka_600SemiBold,
    Inter_400Regular: require("../../assets/fonts/Inter_400Regular.ttf"),
    Inter_500Medium: require("../../assets/fonts/Inter_500Medium.ttf"),
    Inter_600SemiBold: require("../../assets/fonts/Inter_600SemiBold.ttf"),
    Inter_700Bold: require("../../assets/fonts/Inter_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    // ErrorBoundary wraps inside GestureHandlerRootView — NOT wrapping the export itself
    // so Expo Router can still detect the default export correctly.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <BookmarksProvider>
                  <AuthGuard />
                  <ThemedStatusBar />
                  <NetworkBanner />
                  <Stack screenOptions={{ headerShown: false }}>
                    <Stack.Screen name="index" />
                    <Stack.Screen name="welcome" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen
                      name="(screens)"
                      options={{ presentation: "card", gestureEnabled: true }}
                    />
                  </Stack>
                </BookmarksProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </GestureHandlerRootView>
  );
}

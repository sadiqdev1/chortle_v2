/**
 * pushNotifications.js — Expo Push Notification setup.
 *
 * Guards against Expo Go (SDK 53+) which removed remote push support.
 * Only works on physical devices with a development build or production build.
 */
import * as Device from "expo-device";
import { Platform } from "react-native";
import api from "./api";

// Lazily load expo-notifications — crashes in Expo Go SDK 53+
let Notifications = null;
try {
  Notifications = require("expo-notifications");
} catch {
  // Expo Go — silent fail
}

/**
 * Requests notification permissions and registers the Expo push token.
 * No-ops gracefully in Expo Go or on simulators.
 *
 * @returns {Promise<string|null>}
 */
export async function registerForPushNotifications() {
  if (!Notifications) {
    console.info("[Push] expo-notifications not available (Expo Go).");
    return null;
  }

  if (!Device.isDevice) {
    console.info("[Push] Skipping — not a physical device.");
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    console.info("[Push] Permission not granted.");
    return null;
  }

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#7B4BE8",
    });
  }

  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    const token = tokenData.data;

    await api.post("/profile/push-token", { push_token: token });
    console.info("[Push] Token registered.");
    return token;
  } catch (e) {
    console.warn("[Push] Token registration failed:", e?.message);
    return null;
  }
}

/**
 * Unregisters the push token on logout.
 */
export async function unregisterPushToken() {
  if (!Notifications) return;
  try {
    await api.delete("/profile/push-token");
  } catch {
    // Silent — token expires naturally
  }
}

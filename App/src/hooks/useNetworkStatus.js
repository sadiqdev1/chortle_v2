/**
 * useNetworkStatus
 *
 * Monitors the device's network connectivity and exposes an `isOnline` boolean.
 * Uses the NetInfo API available through React Native's built-in connectivity.
 *
 * Pattern: polling via fetch to a known fast endpoint, since @react-native-community/netinfo
 * isn't in the project. Falls back gracefully.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";

const CHECK_URL = "https://www.google.com/generate_204";
const POLL_INTERVAL_MS = 15_000; // check every 15s while running

async function checkConnectivity() {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(CHECK_URL, {
      method: "HEAD",
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeout);
    return res.ok || res.status === 204;
  } catch {
    return false;
  }
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const pollRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);

  const check = useCallback(async () => {
    const online = await checkConnectivity();
    setIsOnline(online);
    return online;
  }, []);

  useEffect(() => {
    // Initial check
    check();

    // Poll on interval
    pollRef.current = setInterval(check, POLL_INTERVAL_MS);

    // Re-check when app comes back to foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === "active"
      ) {
        check();
      }
      appStateRef.current = nextState;
    });

    return () => {
      clearInterval(pollRef.current);
      subscription.remove();
    };
  }, [check]);

  return { isOnline, recheck: check };
}

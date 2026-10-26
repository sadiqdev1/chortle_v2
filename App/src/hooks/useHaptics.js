/**
 * useHaptics — centralized haptic feedback patterns.
 *
 * Wraps expo-haptics so callers don't need to import it directly
 * and patterns stay consistent across the app.
 */
import * as Haptics from "expo-haptics";
import { useCallback } from "react";

export function useHaptics() {
  /** Gentle tap — selection changes, toggles, tab switches */
  const light = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  /** Standard press — buttons, submissions */
  const medium = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  /** Strong press — destructive actions, FAB */
  const heavy = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }, []);

  /** Picker / segmented control selection */
  const selection = useCallback(() => {
    Haptics.selectionAsync();
  }, []);

  /** Success — post created, profile saved */
  const success = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  /** Error — validation failed, network error */
  const error = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  /** Warning — already reported, rate limited */
  const warning = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }, []);

  return { light, medium, heavy, selection, success, error, warning };
}

/**
 * NetworkBanner
 *
 * Sits below the status bar and animates in when the device goes offline.
 * Auto-hides when connectivity is restored with a brief "Back online" flash.
 */
import { useEffect, useRef, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Fonts } from "../constants/theme";
import { useNetworkStatus } from "../hooks/useNetworkStatus";

const BANNER_HEIGHT = 36;

export default function NetworkBanner() {
  const { isOnline } = useNetworkStatus();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-BANNER_HEIGHT);
  const [label, setLabel] = useState("No internet connection");
  const [bannerBg, setBannerBg] = useState("#E5484D");
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      // Going offline
      wasOffline.current = true;
      setLabel("No internet connection");
      setBannerBg("#E5484D");
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(1800, withTiming(-BANNER_HEIGHT, { duration: 300 }))
      ); 
    } else if (wasOffline.current) {
      // Coming back online — show brief "Back online" success message
      setLabel("Back online ✓");
      setBannerBg("#2F6B4F");
      translateY.value = withSequence(
        withTiming(0, { duration: 200 }),
        withDelay(1800, withTiming(-BANNER_HEIGHT, { duration: 280 }))
      );
      wasOffline.current = false;
    }
  }, [isOnline]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.banner,
        animStyle,
        { top: insets.top, backgroundColor: bannerBg },
      ]}
      pointerEvents="none"
    >
      <Text style={[styles.text, { fontFamily: Fonts.medium }]}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 0,
    right: 0,
    height: BANNER_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9998,
  },
  text: {
    fontSize: 13,
    letterSpacing: 0.2,
    color: "#FFFFFF",
  },
});

/**
 * SkeletonLoader — shimmer placeholder cards for feed loading states.
 *
 * Usage:
 *   <FeedSkeleton />           → 3 post card skeletons
 *   <ProfileSkeleton />        → profile header skeleton
 *   <NotificationSkeleton />   → notification list skeleton
 */
import { Dimensions, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { Radius } from "../constants/theme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ── Shimmer base ─────────────────────────────────────────── */
function Shimmer({ width, height, radius = Radius.md, style }) {
  const { colors, isDark } = useTheme();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 700, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.4, { duration: 700, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? colors.surface2 : colors.bgCard,
        },
        animStyle,
        style,
      ]}
    />
  );
}

/* ── Feed post card skeleton ──────────────────────────────── */
function PostCardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.bgElevated,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingHorizontal: 14,
        paddingVertical: 14,
      }}
    >
      {/* Author row */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <Shimmer width={38} height={38} radius={19} />
        <View style={{ gap: 6 }}>
          <Shimmer width={120} height={12} />
          <Shimmer width={80} height={10} />
        </View>
      </View>
      {/* Image */}
      <Shimmer width="100%" height={SCREEN_WIDTH - 28} radius={Radius.lg} />
      {/* Engagement row */}
      <View style={{ flexDirection: "row", gap: 20, marginTop: 12 }}>
        <Shimmer width={56} height={20} />
        <Shimmer width={72} height={20} />
      </View>
    </View>
  );
}

/* ── Notification row skeleton ────────────────────────────── */
function NotificationRowSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
      }}
    >
      <Shimmer width={44} height={44} radius={22} />
      <View style={{ flex: 1, gap: 7 }}>
        <Shimmer width="75%" height={13} />
        <Shimmer width="45%" height={11} />
      </View>
    </View>
  );
}

/* ── Profile header skeleton ──────────────────────────────── */
function ProfileHeaderSkeleton() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.bg }}>
      {/* Cover */}
      <Shimmer width="100%" height={155} radius={0} />
      {/* Info section */}
      <View style={{ paddingHorizontal: 20, paddingTop: 12, gap: 10 }}>
        <Shimmer width={96} height={96} radius={48} style={{ marginTop: -48 }} />
        <Shimmer width={160} height={18} />
        <Shimmer width={100} height={13} />
        <Shimmer width="80%" height={13} />
        <Shimmer width="65%" height={13} />
        {/* Stats row */}
        <View style={{ flexDirection: "row", gap: 24, marginTop: 8 }}>
          <Shimmer width={60} height={32} />
          <Shimmer width={60} height={32} />
          <Shimmer width={60} height={32} />
        </View>
      </View>
    </View>
  );
}

/* ── Exports ──────────────────────────────────────────────── */

export function FeedSkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PostCardSkeleton key={i} />
      ))}
    </>
  );
}

export function NotificationSkeleton({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <NotificationRowSkeleton key={i} />
      ))}
    </>
  );
}

export function ProfileSkeleton() {
  return <ProfileHeaderSkeleton />;
}

export default Shimmer;

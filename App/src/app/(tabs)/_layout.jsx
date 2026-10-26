/**
 * Tab navigator layout.
 *
 * - Spring scale animation on focus
 * - Subtle pill indicator under active tab icon
 * - Create FAB with gradient + glow shadow
 * - Notification badge with count
 * - Haptics on every press
 */
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Tabs } from "expo-router";
import { Pressable, Text, View } from "react-native";
import {
  Bell,
  BellSimple,
  House,
  MagnifyingGlass,
  Plus,
  User,
  Compass,
} from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useNotifications } from "../../hooks/useNotifications";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ── Tab item ─────────────────────────────────────────────── */
function TabItem({ children, onPress, accessibilityState, label }) {
  const focused = accessibilityState?.selected ?? false;
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress(e) {
    Haptics.selectionAsync();
    scale.value = withSpring(0.82, { damping: 8, stiffness: 400 }, () => {
      scale.value = withSpring(1, { damping: 10, stiffness: 260 });
    });
    onPress?.(e);
  }

  return (
    <Pressable
      onPress={handlePress}
      android_ripple={{ color: "transparent" }}
      accessibilityRole="tab"
      accessibilityState={{ selected: focused }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 2 }}
    >
      <Animated.View
        style={[
          {
            width: 52,
            height: 34,
            alignItems: "center",
            justifyContent: "center",
            borderRadius: Radius.lg,
            backgroundColor: focused ? colors.accentSoft : "transparent",
          },
          animStyle,
        ]}
      >
        {children}
      </Animated.View>

      {label ? (
        <Text
          style={{
            fontFamily: focused ? Fonts.semiBold : Fonts.regular,
            fontSize: 10,
            letterSpacing: 0.2,
            color: focused ? colors.accent : colors.textMuted,
            marginTop: 2,
          }}
        >
          {label}
        </Text>
      ) : null}
    </Pressable>
  );
}

/* ── Create FAB ───────────────────────────────────────────── */
function CreateTabButton({ onPress }) {
  const scale = useSharedValue(1);
  const { colors, isDark } = useTheme();

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePressIn() {
    scale.value = withSpring(0.86, { damping: 12, stiffness: 400 });
  }
  function handlePressOut() {
    scale.value = withSpring(1, { damping: 10, stiffness: 240 });
  }
  function handlePress() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  }

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      android_ripple={{ color: "transparent" }}
      accessibilityRole="button"
      accessibilityLabel="Create post"
      style={{ flex: 1, alignItems: "center", justifyContent: "center", marginTop: -18 }}
    >
      <Animated.View
        style={[
          animStyle,
          {
            width: 56,
            height: 56,
            borderRadius: 28,
            overflow: "hidden",
            shadowColor: colors.accent,
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: isDark ? 0.6 : 0.35,
            shadowRadius: 12,
            elevation: 12,
          },
        ]}
      >
        <LinearGradient
          colors={[colors.accentBright, colors.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          <Plus size={28} color="#FFFFFF" weight="bold" />
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}

/* ── Notification bell with badge ────────────────────────── */
function BellTabIcon({ focused, color, unreadCount, colors }) {
  const Icon = focused ? BellSimple : Bell;
  return (
    <View>
      <Icon size={24} color={color} weight={focused ? "fill" : "regular"} />
      {unreadCount > 0 && (
        <View
          style={{
            position: "absolute",
            top: -4,
            right: -6,
            minWidth: 16,
            height: 16,
            paddingHorizontal: 3,
            borderRadius: 8,
            backgroundColor: colors.accent,
            borderWidth: 2,
            borderColor: colors.bg,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text
            style={{
              fontFamily: Fonts.bold,
              fontSize: 9,
              color: "#FFFFFF",
              lineHeight: 12,
            }}
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Text>
        </View>
      )}
    </View>
  );
}

/* ── Stable tab button factories ──────────────────────────── */
const HomeTabButton     = (props) => <TabItem {...props} />;
const ExploreTabButton  = (props) => <TabItem {...props} />;
const ActivityTabButton = (props) => <TabItem {...props} />;
const ProfileTabButton  = (props) => <TabItem {...props} />;
const CreateButton      = (props) => <CreateTabButton onPress={props.onPress} />;

/* ── Icon renderers ───────────────────────────────────────── */
function homeIcon({ focused, color }) {
  return <House size={24} color={color} weight={focused ? "fill" : "regular"} />;
}
function searchIcon({ focused, color }) {
  return <MagnifyingGlass size={24} color={color} weight={focused ? "fill" : "regular"} />;
}
function userIcon({ focused, color }) {
  return <User size={24} color={color} weight={focused ? "fill" : "regular"} />;
}

/* ── Layout ───────────────────────────────────────────────── */
export default function TabsLayout() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  // Account for Android nav bar height
  const tabBarHeight = 58 + insets.bottom;

  const { data: rawNotifData } = useNotifications();
  const unreadCount = (() => {
    const list = rawNotifData?.data ?? rawNotifData ?? [];
    return Array.isArray(list) ? list.filter((n) => !n.read_at).length : 0;
  })();

  function bellIcon({ focused, color }) {
    return (
      <BellTabIcon
        focused={focused}
        color={color}
        unreadCount={unreadCount}
        colors={colors}
      />
    );
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: isDark ? "#0D0C17" : colors.bg,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
          height: tabBarHeight,
          paddingBottom: insets.bottom + 4,
          paddingTop: 6,
        },
      }}
    >
      <Tabs.Screen name="index"         options={{ tabBarIcon: homeIcon,   tabBarButton: HomeTabButton }} />
      <Tabs.Screen name="search"        options={{ tabBarIcon: searchIcon, tabBarButton: ExploreTabButton }} />
      <Tabs.Screen name="create"        options={{ tabBarIcon: () => null, tabBarButton: CreateButton }} />
      <Tabs.Screen name="notifications" options={{ tabBarIcon: bellIcon,   tabBarButton: ActivityTabButton }} />
      <Tabs.Screen name="profile"       options={{ tabBarIcon: userIcon,   tabBarButton: ProfileTabButton }} />
    </Tabs>
  );
}

import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Bell,
  ChatCircle,
  Heart,
  At,
  BookmarkSimple,
  UserPlus,
  SmileyXEyes,
  UserIcon,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { NotificationSkeleton } from "../../components/SkeletonLoader";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotifications,
} from "../../hooks/useNotifications";
import { formatRelativeDate } from "../../utils/formatDate";

// ── Notification type config ────────────────────────────────
const NOTIF_CONFIG = {
  reaction: {
    Icon: Heart,
    iconColor: "#E5484D",
    bgLight: "#FFE8E8",
    bgDark: "#2B0D16",
    verb: "reacted to your meme",
  },
  comment: {
    Icon: ChatCircle,
    iconColor: "#7B4BE8",
    bgLight: "#EDE7FA",
    bgDark: "#1E1540",
    verb: "commented on your meme",
  },
  follow: {
    Icon: UserPlus,
    iconColor: "#2F6B4F",
    bgLight: "#E3F0E8",
    bgDark: "#0D2B1D",
    verb: "started following you",
  },
  mention: {
    Icon: At,
    iconColor: "#8A6D1B",
    bgLight: "#FBF1D4",
    bgDark: "#2B2000",
    verb: "mentioned you in a comment",
  },
  bookmark: {
    Icon: BookmarkSimple,
    iconColor: "#7B4BE8",
    bgLight: "#EDE7FA",
    bgDark: "#1E1540",
    verb: "saved your meme",
  },
};

function normalise(n) {
  const d = n.data ?? {};
  const rawType = (n.type ?? "").split("\\").pop().toLowerCase();

  let type = "reaction";
  if (rawType.includes("comment")) type = "comment";
  else if (rawType.includes("follow")) type = "follow";
  else if (rawType.includes("mention")) type = "mention";
  else if (rawType.includes("bookmark") || rawType.includes("saved")) type = "bookmark";

  return {
    id: n.id,
    type,
    read: Boolean(n.read_at),
    createdAt: n.created_at,
    preview: d.preview ?? d.body ?? null,
    postSlug: d.meme_slug ?? d.post_slug ?? null,
    postThumbnail: d.meme_image ?? d.post_thumbnail ?? null,
    user: {
      name: d.actor_name ?? d.user_name ?? "Someone",
      username: d.actor_username ?? d.username ?? null,
      avatar: d.actor_avatar ?? d.avatar ?? null,
    },
  };
}

// ── Single row ──────────────────────────────────────────────
function NotificationRow({ item, onPress, colors, isDark, index }) {
  const config = NOTIF_CONFIG[item.type] ?? NOTIF_CONFIG.reaction;
  const { Icon, iconColor, bgLight, bgDark } = config;
  const iconBg = isDark ? bgDark : bgLight;
  const unread = !item.read;

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300).springify()}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`${item.user.name} ${config.verb}`}
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          paddingHorizontal: 20,
          paddingVertical: 14,
          backgroundColor: unread
            ? isDark ? colors.accentDim + "55" : colors.accentSoft
            : "transparent",
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          gap: 12,
        }}
      >
        {/* Avatar + badge */}
        <View style={{ position: "relative" }}>
          {item.user?.avatar ? (
            <Image
              source={{ uri: item.user.avatar }}
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
              }}
            />
          ) : (
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: colors.bgCard,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* <Text style={{ fontSize: 20 }}>👤</Text> */}
              <UserIcon size={22} color={colors.textMuted}></UserIcon>
            </View>
          )}

          {/* Type icon badge */}
          <View
            style={{
              position: "absolute",
              bottom: -3,
              right: -3,
              width: 22,
              height: 22,
              borderRadius: 11,
              backgroundColor: iconBg,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 2,
              borderColor: colors.bg,
            }}
          >
            <Icon size={11} color={iconColor} weight="fill" />
          </View>
        </View>

        {/* Body */}
        <View style={{ flex: 1 }}>
          <Text
            numberOfLines={2}
            style={{
              fontFamily: Fonts.medium,
              fontSize: 14,
              lineHeight: 20,
              color: colors.textPrimary,
            }}
          >
            <Text style={{ fontFamily: Fonts.semiBold }}>{item.user?.name ?? "Someone"}</Text>
            {"  "}
            <Text style={{ fontFamily: Fonts.regular, color: colors.textSecondary }}>
              {config.verb}
            </Text>
          </Text>

          {item.preview ? (
            <Text
              numberOfLines={1}
              style={{
                fontFamily: Fonts.regular,
                fontSize: 13,
                color: colors.textMuted,
                marginTop: 3,
              }}
            >
              "{item.preview}"
            </Text>
          ) : null}

          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 11,
              color: colors.textMuted,
              marginTop: 4,
              letterSpacing: 0.2,
            }}
          >
            {formatRelativeDate(item.createdAt)}
          </Text>
        </View>

        {/* Post thumbnail */}
        {item.postThumbnail ? (
          <Image
            source={{ uri: item.postThumbnail }}
            style={{
              width: 44,
              height: 44,
              borderRadius: Radius.md,
              backgroundColor: colors.bgCard,
            }}
          />
        ) : null}

        {/* Unread dot */}
        {unread && (
          <View
            style={{
              position: "absolute",
              top: 16,
              right: 14,
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: colors.accent,
            }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Screen ──────────────────────────────────────────────────
export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const { colors, isDark } = useTheme();

  const { data: rawData, isLoading, refetch } = useNotifications();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();

  const notifications = useMemo(() => {
    const raw = rawData?.data ?? rawData ?? [];
    return Array.isArray(raw) ? raw.map(normalise) : [];
  }, [rawData]);

  const filtered = useMemo(() => {
    if (activeTab === "unread") return notifications.filter((n) => !n.read);
    return notifications;
  }, [notifications, activeTab]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  async function handleRefresh() {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  }

  function handlePress(item) {
    if (!item.read) markRead(item.id);
    if (item.type === "follow") {
      router.push({
        pathname: "/UserProfile",
        params: { username: item.user?.username?.replace("@", "") },
      });
      return;
    }
    if (item.postSlug) {
      router.push({ pathname: "/PostView", params: { slug: item.postSlug } });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* ── Header ──────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 12,
            paddingBottom: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <Text
              style={{
                fontFamily: Fonts.friendly,
                fontSize: 26,
                letterSpacing: -0.2,
                color: colors.textPrimary,
              }}
            >
              Notifications
            </Text>

            {unreadCount > 0 && (
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 3,
                  borderRadius: Radius.full,
                  backgroundColor: colors.accent,
                  minWidth: 22,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.bold,
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  {unreadCount > 99 ? "99+" : unreadCount}
                </Text>
              </View>
            )}
          </View>

          {unreadCount > 0 && (
            <TouchableOpacity
              onPress={() => markAllRead()}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Mark all as read"
            >
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 13,
                  color: colors.accent,
                }}
              >
                Mark all read
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── All / Unread tabs ────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 20,
            gap: 8,
            marginBottom: 4,
          }}
        >
          {[
            { id: "all", label: "All" },
            { id: "unread", label: `Unread${unreadCount > 0 ? ` (${unreadCount})` : ""}` },
          ].map((tab) => {
            const active = activeTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                activeOpacity={0.7}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  borderRadius: Radius.full,
                  backgroundColor: active ? colors.accent : colors.bgCard,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.semiBold,
                    fontSize: 13,
                    color: active ? "#fff" : colors.textSecondary,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── List ─────────────────────────────────────── */}
        {isLoading ? (
          <NotificationSkeleton count={7} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => String(item.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.accent}
                colors={[colors.accent]}
              />
            }
            renderItem={({ item, index }) => (
              <NotificationRow
                item={item}
                onPress={() => handlePress(item)}
                colors={colors}
                isDark={isDark}
                index={index}
              />
            )}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingTop: 80,
                  paddingHorizontal: 36,
                }}
              >
                <View
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: 22,
                    backgroundColor: colors.bgCard,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 18,
                  }}
                >
                  {activeTab === "unread"
                    ? <Bell size={30} color={colors.textMuted} weight="regular" />
                    : <SmileyXEyes size={30} color={colors.textMuted} weight="regular" />
                  }
                </View>
                <Text
                  style={{
                    fontFamily: Fonts.friendly,
                    fontSize: 18,
                    color: colors.textPrimary,
                    marginBottom: 8,
                    textAlign: "center",
                  }}
                >
                  {activeTab === "unread" ? "You're all caught up" : "No notifications yet"}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    fontSize: 14,
                    lineHeight: 22,
                    color: colors.textSecondary,
                    textAlign: "center",
                  }}
                >
                  {activeTab === "unread"
                    ? "All new activity will appear here."
                    : "When people react, comment, or follow you — it shows up here."}
                </Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

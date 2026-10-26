import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CalendarBlank,
  Check,
  DotsThree,
  Gear,
  MapPin,
  Trophy,
  SealCheck,
  ExportIcon,
  Export,
  SealCheckIcon,
} from "phosphor-react-native";
import { Fonts } from "../../constants/theme";
import { useBookmarks } from "../../context/BookmarksContext";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import { useUserMemes } from "../../hooks/useProfile";
import { formatRelativeDate } from "../../utils/formatDate";
import PostCard from "../../components/PostCard";
import { ProfileSkeleton } from "../../components/SkeletonLoader";
import AnimatedTabs from "../../components/AnimatedTabs";

const PROFILE_TABS = ["Posts", "Saved"];

/* ============================================================
   SCREEN
============================================================ */

export default function ProfileScreen() {
  const [activeTab, setActiveTab] = useState(PROFILE_TABS[0]);
  const { colors, isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const { isBookmarked, toggleBookmark, savedPosts } = useBookmarks(); 

  const { data: myMemesData, isLoading: memesLoading, refetch: refetchMemes } = useUserMemes(
    user?.username
  );

 
  const myMemes = useMemo(() => {
    const pages = myMemesData?.pages ?? [];
    return pages.flatMap((page) => {
      const raw = page?.data ?? page ?? [];
      return Array.isArray(raw) ? raw : [];
    });
  }, [myMemesData]);

  const listData = activeTab === "Saved" ? savedPosts : myMemes;
  const showEmpty = !memesLoading && listData.length === 0;
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try { await refetchMemes?.(); } finally { setRefreshing(false); }
  }

  function openPost(slug) {
    router.push({ pathname: "/PostView", params: { slug } });
  }

  async function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/welcome");
          } catch {
            toast.error("Could not sign out. Try again.");
          }
        },
      },
    ]);
  }

  // Joined date from user
  const joinedLabel = useMemo(() => {
    if (!user?.created_at) return null;
    const d = new Date(user.created_at);
    return `Joined since ${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
  }, [user?.created_at]);

  /* ============================================================
     HEADER (cover + profile info + tabs) rendered as
     ListHeaderComponent so it scrolls with the feed
  ============================================================ */

  const ListHeader = (
    <View style={{ backgroundColor: colors.bg }}>
      {/* ── COVER ─────────────────────────────────────────── */}
      <View style={styles.coverContainer}>
        <LinearGradient
          colors={colors.coverGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />

        {/* Decorative circles */}
        <View style={[styles.coverCircle, styles.circleOne]} />
        <View style={[styles.coverCircle, styles.circleTwo]} />
        <View style={[styles.coverCircle, styles.circleThree]} />

        {/* Cover text */}
        <View style={styles.coverTextBlock}>
          <Text style={[styles.coverSmall, { fontFamily: Fonts.bold }]}>GOOD MEMES</Text>
          <Text style={[styles.coverBig, { fontFamily: Fonts.bold }]}>BETTER</Text>
          <Text style={[styles.coverBig, { fontFamily: Fonts.bold }]}>DAYS</Text>
        </View>

        {/* Mascot */}
        <View style={styles.coverMascot}>
          <Text style={styles.mascotEmoji}>🐸</Text>
        </View>

        {/* Top controls */}
        <SafeAreaView edges={["top"]} style={styles.topControls}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.circleButton, { backgroundColor: "rgba(0,0,0,0.35)" }]}
          >
            <ArrowLeft size={22} color="#FFFFFF" weight="bold" />
          </Pressable>

          <View style={styles.topControlsRight}>

            <Pressable
              onPress={() => router.push("/Settings")}
              style={[styles.circleButton, { backgroundColor: "rgba(0,0,0,0.35)" }]}
            >
              <Gear size={21} color="#FFFFFF" weight="bold" />
            </Pressable>

            <Pressable
              onPress={handleSignOut}
              style={[styles.circleButton, { backgroundColor: "rgba(0,0,0,0.35)" }]}
            >
              <Export size={25} color="#FFFFFF" weight="bold" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* ── PROFILE INFO ──────────────────────────────────── */}
      <View style={[
        styles.profileSection,
        {
          backgroundColor: colors.bg,
          borderTopWidth: 1,
          borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
        }
      ]}>
        {/* Avatar */}
        <View style={[styles.avatarWrapper, { backgroundColor: colors.bg }]}>
          <LinearGradient
            colors={[colors.accentBright, colors.accent, "#3D1B83"]}
            style={styles.avatarRing}
          >
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={[styles.avatar, { borderColor: colors.bg }]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { borderColor: colors.bg, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Text style={{ fontSize: 32 }}>🐸</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Edit + Leaderboard buttons */}
        <View style={styles.profileActions}>
          <Pressable
            onPress={() => router.push("/EditProfile")}
            style={[styles.editButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.editText, { color: colors.accent, fontFamily: Fonts.semiBold }]}>
              Edit Profile
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push("/(screens)/VerificationRequest")}
            style={[styles.iconButton, { borderColor: colors.border }]}
            accessibilityLabel="Verified badge"
          >
            {user?.verification_status == "approved"
              ? <SealCheck size={18} color={colors.accent} weight="fill" />
              : <SealCheck size={18} color={colors.textMuted} weight="duotone" />
            }
          </Pressable>

          <Pressable
            onPress={() => router.push("/(screens)/leaderboard")}
            style={[styles.iconButton, { borderColor: colors.border }]}
          >
            <Trophy size={18} color={colors.accent} weight="duotone" />
          </Pressable>
        </View>

        {/* Name */}
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
            {user?.name ?? "—"}
          </Text>

          {user?.verification_status == "approved" && (
            <View >
              <SealCheckIcon size={20} color={colors.accent}  weight="fill" />
            </View>
          )}
        </View>

        <Text style={[styles.username, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
          @{user?.username ?? user?.name?.toLowerCase().replace(/\s+/g, "") ?? "—"}
        </Text>

        {user?.bio ? (
          <Text style={[styles.bio, { color: colors.textPrimary, fontFamily: Fonts.regular }]}>
            {user.bio}
          </Text>
        ) : null}

        {/* Meta (location + joined) */}
        <View style={styles.metaRow}>
          {user?.location ? (
            <View style={styles.metaItem}>
              <MapPin size={16} color={colors.textMuted} weight="regular" />
              <Text style={[styles.metaText, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                {user.location}
              </Text>
            </View>
          ) : null}

          {joinedLabel ? (
            <View style={styles.metaItem}>
              <CalendarBlank size={16} color={colors.textMuted} weight="regular" />
              <Text style={[styles.metaText, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                {joinedLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Followers / Following */}
        <View style={styles.followRow}>
          <Pressable>
            <Text style={[styles.followNum, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
              {user?.following_count ?? 0}{" "}
              <Text style={[styles.followLabel, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                Following
              </Text>
            </Text>
          </Pressable>

          <Pressable>
            <Text style={[styles.followNum, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
              {user?.followers_count != null
                ? user.followers_count >= 1000
                  ? `${(user.followers_count / 1000).toFixed(1)}K`
                  : user.followers_count
                : 0}{" "}
              <Text style={[styles.followLabel, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                Followers
              </Text>
            </Text>
          </Pressable>
        </View>
      </View>
      {/* ── TABS ──────────────────────────────────────────── */}
      <AnimatedTabs
        tabs={PROFILE_TABS}
        active={activeTab}
        onChange={setActiveTab}
        colors={colors}
      />

      {/* Loading / empty */}
      {activeTab === "Posts" && memesLoading && (
        <ProfileSkeleton />
      )}

      {showEmpty && (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 36, marginBottom: 12 }}>
            {activeTab === "Saved" ? "🔖" : "🐸"}
          </Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: Fonts.friendly }]}>
            {activeTab === "Saved" ? "Nothing saved yet" : "No memes yet"}
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
            {activeTab === "Saved"
              ? "Save memes from the feed and they'll show up here."
              : "Memes you post will appear here."}
          </Text>
          {activeTab === "Saved" && (
            <TouchableOpacity
              onPress={() => router.replace("/(tabs)")}
              activeOpacity={0.8}
              style={{
                marginTop: 20,
                paddingHorizontal: 24,
                paddingVertical: 12,
                borderRadius: 999,
                backgroundColor: colors.accent,
              }}
            >
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: "#fff", letterSpacing: 0.3 }}>
                Browse the feed
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />

      <FlatList
        data={showEmpty ? [] : listData}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32, flexGrow: 1 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
        renderItem={({ item }) => (
          <PostCard
            post={item}
            bookmarked={isBookmarked(item.id)}
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => openPost(item.slug)}
          />
        )}
      />
    </View>
  );
}

/* ============================================================
   STYLES
============================================================ */

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  coverCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  circleOne:   { width: 230, height: 230, right: -80, top: -80 },
  circleTwo:   { width: 130, height: 130, left: -50, bottom: -45 },
  circleThree: { width: 80,  height: 80,  right: 90, bottom: -25 },

  coverTextBlock: {
    position: "absolute",
    left: 34,
    top: 42,
  },
  coverSmall: {
    color: "#C9B8FF",
    fontSize: 13,
    letterSpacing: 2.2,
  },
  coverBig: {
    color: "#FFFFFF",
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -0.5,
  },
  coverMascot: {
    position: "absolute",
    right: 10,
    bottom: 10,
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  mascotEmoji: {
    fontSize: 72,
  },
  topControls: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 10,
  },
  topControlsRight: {
    flexDirection: "row",
    gap: 8,
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },

// Cover

coverContainer: {
  height: 155,
  position: "relative",
  overflow: "hidden",
  // add this so the profile section can overlap it
  marginBottom: 0,
},

profileSection: {
  paddingHorizontal: 20,
  paddingBottom: 20,
  borderTopLeftRadius: 28,
  borderTopRightRadius: 28,
  marginTop: -24,
  // Explicit elevation in dark mode so content doesn't bleed into gradient

},
  avatarWrapper: {
    marginTop: -44,
    width: 108,
    height: 108,
    borderRadius: 54,
    padding: 4,
  },
  avatarRing: {
    flex: 1,
    borderRadius: 52,
    padding: 3,
  },
  avatar: {
    flex: 1,
    borderRadius: 46,
    borderWidth: 3,
  },
  verifiedBadge: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  profileActions: {
    position: "absolute",
    right: 20,
    top: 16,
    flexDirection: "row",
    gap: 8,
  },
  editButton: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  editText: {
    fontSize: 14,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
  },
  name: {
    fontSize: 24,
    letterSpacing: -0.3,
  },
  verifiedSmall: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  username: {
    fontSize: 14,
    marginTop: 3,
  },
  bio: {
    fontSize: 15,
    lineHeight: 22,
    marginTop: 14,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 14,
    marginTop: 14,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
  },
  followRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 16,
  },
  followNum: {
    fontSize: 15,
  },
  followLabel: {
    fontSize: 15,
  },

  // ── Tabs ─────────────────────────────────────────────────
  tabsBar: {
    height: 56,
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  tabText: {
    fontSize: 14,
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    width: 40,
    borderRadius: 3,
  },


  // ── Empty state ──────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: 8,
  },
  emptyBody: {
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});

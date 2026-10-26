import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";import {
  ActivityIndicator,
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
  MapPin,
  ShareNetwork,
  UserMinus,
  UserPlus,
} from "phosphor-react-native";
import { Fonts } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useToggleFollow, useUserMemes, useUserProfile } from "../../hooks/useProfile";
import { formatRelativeDate } from "../../utils/formatDate";
import PostCard from "../../components/PostCard";
import { ProfileSkeleton, FeedSkeleton } from "../../components/SkeletonLoader";
import { useBookmarks } from "../../context/BookmarksContext";
import AnimatedTabs from "../../components/AnimatedTabs";

const PROFILE_TABS = ["Posts", "About"];

/* ============================================================
   SCREEN
============================================================ */

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams();
  const { colors, isDark } = useTheme();
  const { user: me } = useAuth();
  const [activeTab, setActiveTab] = useState(PROFILE_TABS[0]);

  const { data: profileData, isLoading, isError } = useUserProfile(username);
  const { data: memesData, isLoading: memesLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch: refetchMemes } = useUserMemes(username);
  const { mutate: toggleFollow, isPending: followPending } = useToggleFollow(username);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const [refreshing, setRefreshing] = useState(false);

  async function handleRefresh() {
    setRefreshing(true);
    try { await refetchMemes?.(); } finally { setRefreshing(false); }
  }

  // Backend returns { data: user } (UserResource)
  const profile = profileData?.data ?? profileData;

  const memes = (() => {
    const pages = memesData?.pages ?? [];
    if (pages.length > 0) {
      return pages.flatMap((p) => {
        const raw = p?.data ?? p ?? [];
        return Array.isArray(raw) ? raw : [];
      });
    }
    const raw = memesData?.data ?? memesData ?? [];
    return Array.isArray(raw) ? raw : [];
  })();

  const isOwnProfile = me?.username === username || me?.id === profile?.id;

  const joinedLabel = (() => {
    if (!profile?.created_at) return null;
    const d = new Date(profile.created_at);
    return `Joined ${d.toLocaleString("default", { month: "long" })} ${d.getFullYear()}`;
  })();

  /* ── Loading ─────────────────────────────────────────── */
  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <ProfileSkeleton />
      </View>
    );
  }

  /* ── Error ───────────────────────────────────────────── */
  if (isError || !profile) {
    return (
      <View style={[styles.center, { backgroundColor: colors.bg, padding: 32 }]}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <Text style={{ fontSize: 32, marginBottom: 12 }}>🤔</Text>
        <Text style={[styles.errorTitle, { color: colors.textPrimary, fontFamily: Fonts.friendly }]}>
          User not found
        </Text>
        <Text style={[styles.errorBody, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
          @{username} doesn't exist or may have been removed.
        </Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: colors.accent, fontFamily: Fonts.friendly, fontSize: 15 }}>
            Go back
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  /* ── List header — cover + profile info + tabs ───────── */
  const ListHeader = (
    <View style={{ backgroundColor: colors.bg }}>
      {/* Cover */}
      <View style={styles.cover}>
        <LinearGradient
          colors={colors.coverGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.coverCircle, styles.circleA]} />
        <View style={[styles.coverCircle, styles.circleB]} />

        {/* Top controls */}
        <SafeAreaView edges={["top"]} style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={[styles.circleBtn, { backgroundColor: "rgba(0,0,0,0.35)" }]}
          >
            <ArrowLeft size={22} color="#FFFFFF" weight="bold" />
          </Pressable>

          <View style={styles.topBarRight}>
            <Pressable style={[styles.circleBtn, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
              <ShareNetwork size={20} color="#FFFFFF" weight="regular" />
            </Pressable>
            <Pressable style={[styles.circleBtn, { backgroundColor: "rgba(0,0,0,0.35)" }]}>
              <DotsThree size={25} color="#FFFFFF" weight="bold" />
            </Pressable>
          </View>
        </SafeAreaView>
      </View>

      {/* Profile info */}
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
            {profile.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                style={[styles.avatar, { borderColor: colors.bg }]}
              />
            ) : (
              <View
                style={[
                  styles.avatar,
                  { borderColor: colors.bg, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" },
                ]}
              >
                <Text style={{ fontSize: 28 }}>🐸</Text>
              </View>
            )}
          </LinearGradient>

          {profile.verification_status == "approved" && (
            <View style={[styles.verifiedBadge, { backgroundColor: colors.accent, borderColor: colors.bg }]}>
              <Check size={12} color="#FFFFFF" weight="bold" />
            </View>
          )}
        </View>

       

        {isOwnProfile && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => router.push("/EditProfile")}
              style={[styles.editBtn, { borderColor: colors.border }]}
            >
              <Text style={[styles.editBtnText, { color: colors.accent, fontFamily: Fonts.semiBold }]}>
                Edit Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Name */}
        <View style={styles.nameRow}>
          <Text style={[styles.name, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
            {profile.name}
          </Text>
          {profile.verification_status == "approved" && (
            <View style={[styles.verifiedSmall, { backgroundColor: colors.accent }]}>
              <Check size={10} color="#FFFFFF" weight="bold" />
            </View>


          )}   
          
           {/* Follow / Edit button */}
        {!isOwnProfile && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={() => toggleFollow()}
              disabled={followPending}
              style={[
                styles.followBtn,
                {
                  backgroundColor: profile.is_following ? "transparent" : colors.accent,
                  borderColor: profile.is_following ? colors.border : colors.accent,
                },
              ]}
            >
              {(
                <>
                  <Text
                    style={[
                      styles.followBtnText,
                      {
                        fontFamily: Fonts.semiBold,
                        color: profile.is_following ? colors.textPrimary : "#FFFFFF",
                      },
                    ]}
                  >
                    {profile.is_following ? "Following" : "Follow"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}
        </View>

        <Text style={[styles.username, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
          @{profile.username}
        </Text>

        {profile.bio ? (
          <Text style={[styles.bio, { color: colors.textPrimary, fontFamily: Fonts.regular }]}>
            {profile.bio}
          </Text>
        ) : null}

        {/* Meta */}
        <View style={styles.metaRow}>
          {profile.location ? (
            <View style={styles.metaItem}>
              <MapPin size={15} color={colors.textMuted} weight="regular" />
              <Text style={[styles.metaText, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                {profile.location}
              </Text>
            </View>
          ) : null}
          {joinedLabel ? (
            <View style={styles.metaItem}>
              <CalendarBlank size={15} color={colors.textMuted} weight="regular" />
              <Text style={[styles.metaText, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                {joinedLabel}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stats
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          {[
            { value: profile.memes_count ?? memes.length, label: "Memes" },
            { value: profile.followers_count ?? 0, label: "Followers" },
            { value: profile.following_count ?? 0, label: "Following" },
          ].map(({ value, label }) => (
            <View key={label} style={styles.stat}>
              <Text style={[styles.statValue, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
                {value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value}
              </Text>
              <Text style={[styles.statLabel, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                {label}
              </Text>
            </View>
          ))}
        </View> */}

                {/* Followers / Following */}
                <View style={styles.followRow}>
                  <Pressable>
                    <Text style={[styles.followNum, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
                      {profile?.following_count ?? 0}{" "}
                      <Text style={[styles.followLabel, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                        Following
                      </Text>
                    </Text>
                  </Pressable>
        
                  <Pressable>
                    <Text style={[styles.followNum, { color: colors.textPrimary, fontFamily: Fonts.bold }]}>
                      {profile?.followers_count != null
                        ? profile.followers_count >= 1000
                          ? `${(profile.followers_count / 1000).toFixed(1)}K`
                          : profile.followers_count
                        : 0}{" "}
                      <Text style={[styles.followLabel, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
                        Followers
                      </Text>
                    </Text>
                  </Pressable>
                </View>
      </View>

      {/* Tabs */}
      <AnimatedTabs
        tabs={PROFILE_TABS}
        active={activeTab}
        onChange={setActiveTab}
        colors={colors}
        
        memesCount={profile.memes_count ?? memes.length}
      />

      {/* About tab content (inline) */}
      {activeTab === "About" && (
        <View style={[styles.about, { backgroundColor: colors.bg }]}>
          <Text style={[styles.aboutText, { color: colors.textPrimary, fontFamily: Fonts.regular }]}>
            {profile.bio ?? "No bio yet."}
          </Text>
        </View>
      )}

      {/* Posts tab — loading or empty */}
      {activeTab === "Posts" && memesLoading && (
        <FeedSkeleton count={3} />
      )}

      {activeTab === "Posts" && !memesLoading && memes.length === 0 && (
        <View style={styles.empty}>
          <Text style={{ fontSize: 32, marginBottom: 10 }}>🐸</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily: Fonts.friendly }]}>
            No memes yet
          </Text>
          <Text style={[styles.emptyBody, { color: colors.textMuted, fontFamily: Fonts.regular }]}>
            {profile.name?.split(" ")[0]} hasn't posted anything yet.
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor="transparent"
        translucent
      />

      <FlatList
        data={activeTab === "Posts" ? memes : []}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={ListHeader}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.accent} colors={[colors.accent]} />
        }
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? (
          <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} />
        ) : null}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            bookmarked={isBookmarked(item.id)}
            onToggleBookmark={() => toggleBookmark(item)}
            onPress={() => router.push({ pathname: "/PostView", params: { slug: item.slug } })}
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
  container: { flex: 1 },
  center:    { flex: 1, alignItems: "center", justifyContent: "center" },

  // Cover
  cover: {
    height: 155,
    position: "relative",
    overflow: "hidden",
  },
  coverCircle: {
    position: "absolute",
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  circleA: { width: 180, height: 180, right: -60, top: -60 },
  circleB: { width: 100, height: 100, left: -40, bottom: -40 },

  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topBarRight: { flexDirection: "row", gap: 8 },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile section
  profileSection: { paddingHorizontal: 20, paddingBottom: 4 },
  avatarWrapper: {
    marginTop: -44,
    width: 96,
    height: 96,
    borderRadius: 48,
    padding: 4,
  },
  avatarRing: { flex: 1, borderRadius: 46, padding: 3 },
  avatar:     { flex: 1, borderRadius: 40, borderWidth: 3 },
  verifiedBadge: {
    position: "absolute",
    right: 2,
    bottom: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  // Action buttons
  actionRow: {
    position: "absolute",
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  followBtn: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  followBtnText: { fontSize: 14 },
  editBtn: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 22,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  editBtnText: { fontSize: 14 },

  // Identity
  nameRow:     { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 12 },
  name:        { fontSize: 22, letterSpacing: -0.3 },
  verifiedSmall: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  username:    { fontSize: 14, marginTop: 2 },
  bio:         { fontSize: 15, lineHeight: 22, marginTop: 12 },

  metaRow:  { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 12 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },

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

  // Tabs
  tabsBar:     { height: 52, flexDirection: "row", borderBottomWidth: 1 },
  tab:         { flex: 1, alignItems: "center", justifyContent: "center", position: "relative" },
  tabText:     { fontSize: 14 },
  tabIndicator:{ position: "absolute", bottom: 0, height: 3, width: 36, borderRadius: 3 },

  // Post card styles live in components/ProfilePostCard.jsx

  // About tab
  about:     { padding: 20 },
  aboutText: { fontSize: 15, lineHeight: 23 },

  // Empty / error
  empty:      { alignItems: "center", paddingTop: 48, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 17, marginBottom: 6 },
  emptyBody:  { fontSize: 14, lineHeight: 21, textAlign: "center" },
  errorTitle: { fontSize: 20, marginBottom: 8 },
  errorBody:  { fontSize: 14, lineHeight: 21, textAlign: "center" },
});

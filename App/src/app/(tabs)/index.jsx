import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Bell,
  MagnifyingGlass,
  UserCircle,
  Sun,
  X,
  CaretDown,
  Images,
  Users,
} from "phosphor-react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PostCard from "../../components/PostCard";
import { FeedSkeleton } from "../../components/SkeletonLoader";
import { CATEGORIES, Fonts, Radius } from "../../constants/theme";
import { useBookmarks } from "../../context/BookmarksContext";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useNotifications } from "../../hooks/useNotifications";
import { usePosts } from "../../hooks/usePosts";
import { useSuggestedCreators, useToggleFollow } from "../../hooks/useProfile";

const HEADER_ROW_HEIGHT = 68;
const FEED_TABS_HEIGHT  = 46;
const TRENDING_HEIGHT   = 46;
const HEADER_HEIGHT     = HEADER_ROW_HEIGHT + FEED_TABS_HEIGHT ;

/* ── Feed tab ─────────────────────────────────────────────── */
function FeedTab({ label, active, onPress, onOpenFilter }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={active ? onOpenFilter : onPress}
      activeOpacity={0.8}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={{ flex: 1, alignItems: "center", justifyContent: "center", height: FEED_TABS_HEIGHT, position: "relative" }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, letterSpacing: 0.1, color: active ? colors.textPrimary : colors.textMuted }}>
          {label}
        </Text>
        {active && <CaretDown size={13} color={colors.textPrimary} weight="bold" />}
      </View>

      {active && (
        <View style={{ position: "absolute", bottom: -1, height: 2.5, width: "60%", borderRadius: 3, backgroundColor: colors.accent }} />
      )}
    </TouchableOpacity>
  );
}

/* ── Filter sheet ─────────────────────────────────────────── */
function FilterSheet({ visible, onClose, categories, selected, onSelect, onClear, title }) {
  const { colors } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.38)" }}>
        <Pressable onPress={() => {}} style={{ paddingHorizontal: 20, paddingBottom: 36, paddingTop: 12, backgroundColor: colors.bg, borderTopLeftRadius: Radius.xxl, borderTopRightRadius: Radius.xxl }}>

          <View style={{ alignSelf: "center", width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, marginBottom: 18 }} />

          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <Text style={{ fontFamily: Fonts.friendly, fontSize: 20, letterSpacing: -0.1, color: colors.textPrimary }}>
              {title ?? "Filter"}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={12}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
                <X size={17} color={colors.textPrimary} weight="bold" />
              </View>
            </TouchableOpacity>
          </View>

          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.textMuted, marginBottom: 14 }}>
            Categories
          </Text>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 28 }}>
            {categories.map((c) => {
              const isActive = selected === c.id;
              return (
                <TouchableOpacity
                  key={c.id}
                  onPress={() => onSelect(c.id)}
                  activeOpacity={0.7}
                  style={{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: Radius.full, borderWidth: 1.5, borderColor: isActive ? colors.accent : colors.border, backgroundColor: isActive ? colors.accent : colors.bgCard }}
                >
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: isActive ? "#fff" : colors.textSecondary }}>
                    {c.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity onPress={onClear} activeOpacity={0.7} style={{ flex: 1, height: 50, borderRadius: Radius.lg, borderWidth: 1.5, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: colors.textPrimary }}>Clear</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onClose} activeOpacity={0.85} style={{ flex: 2, height: 50, borderRadius: Radius.lg, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: "#fff" }}>Apply</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Suggested creators card ──────────────────────────────── */

function SuggestedCreatorCard({ creator, colors }) {
  const {
    mutate: toggleFollow,
    isPending,
  } = useToggleFollow(creator?.username);

  const [following, setFollowing] = useState(
    Boolean(creator?.is_following)
  );

  useEffect(() => {
    setFollowing(Boolean(creator?.is_following));
  }, [creator?.is_following, creator?.username]);

  if (!creator?.username) return null;

  function handleFollowPress(event) {
    event?.stopPropagation?.();

    if (isPending) return;

    const previous = following;
    setFollowing(!previous);

    toggleFollow(undefined, {
      onError: () => setFollowing(previous),
    });
  }

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({
          pathname: "/UserProfile",
          params: { username: creator.username },
        })
      }
      activeOpacity={0.85}
      style={{
        width: 140,
        backgroundColor: colors.bgCard,
        borderRadius: Radius.xl,
        padding: 14,
        alignItems: "center",
        borderWidth: 1,
        borderColor: colors.border,
        marginRight: 10,
      }}
    >
      {creator.avatar ? (
        <Image
          source={{ uri: creator.avatar }}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            marginBottom: 8,
          }}
        />
      ) : (
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <Text style={{ fontSize: 24 }}>🐸</Text>
        </View>
      )}

      <Text
        numberOfLines={1}
        style={{
          fontFamily: Fonts.semiBold,
          fontSize: 13,
          color: colors.textPrimary,
          marginBottom: 2,
        }}
      >
        {creator.name}
      </Text>

      <Text
        numberOfLines={1}
        style={{
          fontFamily: Fonts.regular,
          fontSize: 11,
          color: colors.textMuted,
          marginBottom: 10,
        }}
      >
        @{creator.username}
      </Text>

      <TouchableOpacity
        onPress={handleFollowPress}
        disabled={isPending}
        style={{
          paddingHorizontal: 16,
          paddingVertical: 7,
          borderRadius: Radius.full,
          backgroundColor: following
            ? "transparent"
            : colors.accent,
          borderWidth: 1.5,
          borderColor: following
            ? colors.border
            : colors.accent,
          opacity: isPending ? 0.65 : 1,
        }}
      >
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 12,
            color: following
              ? colors.textSecondary
              : "#fff",
          }}
        >
          {following ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function SuggestedCreators({ colors }) {
  const { data } = useSuggestedCreators();
  const creators = data?.data ?? [];

  if (!creators.length) return null;

  return (
    <View style={{ paddingTop: 28, paddingHorizontal: 20 }}>
      <Text style={{ fontFamily: Fonts.friendly, fontSize: 18, color: colors.textPrimary, marginBottom: 4 }}>
        People to follow
      </Text>
      <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: colors.textSecondary, marginBottom: 16 }}>
        Follow some creators to fill your feed.
      </Text>
      <FlatList
        data={creators}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => String(c.id)}
        renderItem={({ item }) => <SuggestedCreatorCard creator={item} colors={colors} />}
        contentContainerStyle={{ paddingRight: 20 }}
      />
    </View>
  );
}

/* ── Home screen ──────────────────────────────────────────── */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeFeed, setActiveFeed] = useState("for-you");
  const [refreshing, setRefreshing] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);

  const { user } = useAuth();
const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors, isDark } = useTheme();

  const { data: rawNotifData } = useNotifications();
  const unreadCount = useMemo(() => {
    const list = rawNotifData?.data ?? rawNotifData ?? [];
    return Array.isArray(list) ? list.filter((n) => !n.read_at).length : 0;
  }, [rawNotifData]);

  const queryParams = useMemo(() => {
    const p = {};
    if (activeCategory !== "all") p.category = activeCategory;
    if (activeFeed === "following") p.feed = "following";
    return p;
  }, [activeCategory, activeFeed]);

  const { data: postsData, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } = usePosts(queryParams);

  const allPosts = useMemo(() => {
    return (postsData?.pages ?? []).flatMap((page) => {
      const raw = page?.data ?? page ?? [];
      return Array.isArray(raw) ? raw : [];
    });
  }, [postsData]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "GOOD MORNING";
    if (h < 17) return "GOOD AFTERNOON";
    return "GOOD EVENING";
  }, []);

  const hasActiveFilter = activeCategory !== "all";
  const activeCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "All";
  const EmptyIcon = activeFeed === "following" ? Users : Images;

  /* ── Scroll-driven header ──────────────────────────────── */
  const hideProgress = useSharedValue(0);
  const lastScrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      const y = event.contentOffset.y;
      const delta = y - lastScrollY.value;
      if (y <= 8) {
        hideProgress.value = withTiming(0, { duration: 150 });
      } else if (delta > 4 && y > HEADER_HEIGHT) {
        hideProgress.value = withTiming(1, { duration: 200 });
      } else if (delta < -4) {
        hideProgress.value = withTiming(0, { duration: 200 });
      }
      lastScrollY.value = y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [{
      translateY: interpolate(hideProgress.value, [0, 1], [0, -(HEADER_HEIGHT + insets.top)], Extrapolate.CLAMP),
    }],
    opacity: interpolate(hideProgress.value, [0, 0.7, 1], [1, 0.6, 0], Extrapolate.CLAMP),
  }));

  async function handleRefresh() {
    setRefreshing(true);
    try { await refetch?.(); } finally { setRefreshing(false); }
  }

  /* ── Floating header ──────────────────────────────────── */
  const Header = (
    <Animated.View
      style={[{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
        paddingTop: insets.top, height: HEADER_HEIGHT + insets.top,
        backgroundColor: colors.bg,
      }, headerStyle]}
    >
      {/* Greeting row */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, height: HEADER_ROW_HEIGHT }}>
        <View>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 2, color: colors.textMuted, marginBottom: 2 }}>
            {greeting}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Text style={{ fontFamily: Fonts.friendly, fontSize: 24, letterSpacing: -0.2, color: colors.textPrimary }}>
              {user?.name?.split(" ")[0] ?? "there"}
            </Text>
            <Sun size={18} color={colors.accent} weight="duotone" />
          </View>
        </View>


        <View style={{ flexDirection: "row", gap: 8 }}>


          <TouchableOpacity
            onPress={() => router.push("/profile")}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Profile"
            style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", overflow: "hidden" }}
          >
            {user?.avatar ? (
              <Image source={{ uri: user.avatar }} style={{ width: 40, height: 40, borderRadius: 20 }} />
            ) : (
              <UserCircle size={22} color={colors.textSecondary} weight="duotone" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Feed tabs */}
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, borderBottomWidth: 0, borderBottomColor: colors.border, height: FEED_TABS_HEIGHT }}>
        <FeedTab label="For You" active={activeFeed === "for-you"} onPress={() => setActiveFeed("for-you")} onOpenFilter={() => setFilterOpen(true)} />
        <FeedTab label="Following" active={activeFeed === "following"} onPress={() => setActiveFeed("following")} onOpenFilter={() => setFilterOpen(true)} />
      </View>

  
    </Animated.View>
  );

  /* ── List header ──────────────────────────────────────── */
  const ListHeader = (
    <View style={{ height: HEADER_HEIGHT + insets.top }} />
  );

  const EmptyState = (
    <View style={{ alignItems: "center", paddingTop: 60, paddingHorizontal: 32 }}>
      <View style={{ width: 68, height: 68, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
        <EmptyIcon size={30} color={colors.textMuted} weight="duotone" />
      </View>
      <Text style={{ fontFamily: Fonts.friendly, fontSize: 18, color: colors.textPrimary, textAlign: "center", marginBottom: 8 }}>
        {activeFeed === "following" ? "Your following feed is empty" : hasActiveFilter ? `Nothing in ${activeCategoryLabel} yet` : "Nothing here yet"}
      </Text>
      <Text style={{ fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: "center", marginBottom: 4 }}>
        {activeFeed === "following"
          ? "Follow some creators to see their memes here."
          : hasActiveFilter
            ? "Try a different category, or clear the filter."
            : "Be the first to post a meme."}
      </Text>
      {activeFeed === "following" && <SuggestedCreators colors={colors} />}
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />

      {Header}

      <Animated.FlatList
        data={isLoading ? [] : allPosts}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingBottom: 60 }}
        ListHeaderComponent={ListHeader}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 16 }} /> : null}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            progressViewOffset={HEADER_HEIGHT + insets.top}
          />
        }
        ListEmptyComponent={
          isLoading
            ? (
              <>
                <View style={{ height: HEADER_HEIGHT + insets.top }} />
                <FeedSkeleton count={4} />
              </>
            )
            : EmptyState
        }
        renderItem={({ item: post }) => (
  <PostCard
    post={post}
    bookmarked={isBookmarked(post.id)}
    onToggleBookmark={() => toggleBookmark(post)}
    onPress={() =>
      router.push({
        pathname: "/PostView",
        params: { slug: post.slug },
      })
    }
  />
)}
      />

      <FilterSheet
        visible={filterOpen}
        onClose={() => setFilterOpen(false)}
        categories={CATEGORIES}
        selected={activeCategory}
        onSelect={(id) => { setActiveCategory(id); setFilterOpen(false); }}
        onClear={() => { setActiveCategory("all"); setFilterOpen(false); }}
        title={activeFeed === "following" ? "Filter Following" : "Filter For You"}
      />
    </View>
  );
}

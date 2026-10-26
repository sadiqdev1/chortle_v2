import { router } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MagnifyingGlass, X, UserCircle, UserIcon } from "phosphor-react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import PostCard from "../../components/PostCard";
import { CATEGORIES, Fonts, Radius } from "../../constants/theme";
import { useBookmarks } from "../../context/BookmarksContext";
import { useTheme } from "../../context/ThemeContext";
import { usePosts } from "../../hooks/usePosts";
import { useSearchUsers } from "../../hooks/useProfile";

const DEBOUNCE_MS = 350;

/* ── User result row ──────────────────────────────────────── */
function UserRow({ user, colors }) {
  return (
    <TouchableOpacity
      onPress={() => router.push({ pathname: "/UserProfile", params: { username: user.username } })}
      activeOpacity={0.7}
      style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      {user.avatar ? (
        <Image source={{ uri: user.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
      ) : (
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
          {/* <UserCircle size={28} color={colors.textMuted} weight="duotone" /> */}
          <UserIcon size={22} color={colors.textMuted}></UserIcon>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: colors.textPrimary }}>
            {user.name}
          </Text>
          {user.is_verified && (
            <View style={{ width: 15, height: 15, borderRadius: 8, backgroundColor: colors.accent, alignItems: "center", justifyContent: "center" }}>
              <Text style={{ fontSize: 8, color: "#fff" }}>✓</Text>
            </View>
          )}
        </View>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: colors.textMuted }}>
          @{user.username}
          {user.followers_count > 0 ? ` · ${user.followers_count >= 1000 ? `${(user.followers_count / 1000).toFixed(1)}K` : user.followers_count} followers` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const timerRef = useRef(null);
  const inputRef = useRef(null);
  const [activeTab, setActiveTab] = useState("memes"); // "memes" | "people"
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(query.trim()), DEBOUNCE_MS);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const isSearching = debouncedQuery.length > 0;

  const { data: memeData, isLoading: loadingMemes } = usePosts(
    isSearching ? { q: debouncedQuery } : {}
  );
  const { data: userData, isLoading: loadingUsers } = useSearchUsers(
    isSearching ? debouncedQuery : ""
  );

  const memeResults = useMemo(() => {
    return (memeData?.pages ?? []).flatMap((p) => p?.data ?? []);
  }, [memeData]);

  const userResults = useMemo(() => {
    return userData?.data ?? [];
  }, [userData]);

  const isLoading = activeTab === "memes" ? loadingMemes : loadingUsers;
  const results = activeTab === "memes" ? memeResults : userResults;

  const browseTags = CATEGORIES.filter((c) => c.id !== "all");

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>

        {/* Search bar */}
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 }}>
          <Text style={{ fontFamily: Fonts.friendly, fontSize: 26, letterSpacing: -0.2, color: colors.textPrimary, marginBottom: 16 }}>
            Search
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", borderRadius: Radius.lg, paddingHorizontal: 14, backgroundColor: colors.bgCard, borderWidth: 1.5, borderColor: query ? colors.accent : colors.border, gap: 10 }}>
            <MagnifyingGlass size={18} color={query ? colors.accent : colors.textMuted} weight={query ? "bold" : "regular"} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search memes, creators…"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={{ flex: 1, paddingVertical: 14, fontFamily: Fonts.regular, fontSize: 15, color: colors.textPrimary }}
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => { setQuery(""); inputRef.current?.focus(); }} hitSlop={12}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: colors.textMuted + "44", alignItems: "center", justifyContent: "center" }}>
                  <X size={12} color={colors.textMuted} weight="bold" />
                </View>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tabs — Memes / People */}
        {isSearching && (
          <View style={{ flexDirection: "row", paddingHorizontal: 20, gap: 8, marginBottom: 4 }}>
            {[
              { id: "All", label: `All${userResults.length > 0 ? ` (${userResults.length})` : ""}` },
              { id: "memes", label: `Memes${memeResults.length > 0 ? ` (${memeResults.length})` : ""}` },
              { id: "people", label: `People${userResults.length > 0 ? ` (${userResults.length})` : ""}` },
              
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => setActiveTab(tab.id)}
                  style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: active ? colors.accent : colors.bgCard, borderWidth: 1, borderColor: active ? colors.accent : colors.border }}
                >
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: active ? "#fff" : colors.textSecondary }}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Results / Browse */}
        {isSearching ? (
          isLoading || query.trim() !== debouncedQuery ? (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
              <ActivityIndicator color={colors.accent} />
              <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: colors.textMuted, marginTop: 12 }}>Searching…</Text>
            </View>
          ) : activeTab === "people" ? (
            <FlatList
              data={userResults}
              keyExtractor={(u) => String(u.id)}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
              renderItem={({ item }) => <UserRow user={item} colors={colors} />}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 80, paddingHorizontal: 36 }}>
                  <Text style={{ fontFamily: Fonts.friendly, fontSize: 18, color: colors.textPrimary, marginBottom: 8, textAlign: "center" }}>
                    No users found for "{debouncedQuery}"
                  </Text>
                </View>
              }
            />
          ) : (
            <FlatList
              data={memeResults}
              keyExtractor={(item) => String(item.slug)}
              contentContainerStyle={{ paddingBottom: 80, flexGrow: 1 }}
              showsVerticalScrollIndicator={false}
              ListHeaderComponent={
                memeResults.length > 0 ? (
                  <Animated.View entering={FadeIn.duration(200)}>
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: colors.textMuted, paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 }}>
                      {memeResults.length} {memeResults.length === 1 ? "result" : "results"} for{" "}
                      <Text style={{ fontFamily: Fonts.semiBold, color: colors.textPrimary }}>"{query.trim()}"</Text>
                    </Text>
                  </Animated.View>
                ) : null
              }
              renderItem={({ item }) => (
                <PostCard
                  post={item}
                  bookmarked={isBookmarked(item.id)}
                  onToggleBookmark={() => toggleBookmark(item)}
                  onPress={() => router.push({ pathname: "/PostView", params: { slug: item.slug } })}
                />
              )}
              ListEmptyComponent={
                <View style={{ flex: 1, alignItems: "center", paddingTop: 80, paddingHorizontal: 36 }}>
                  <MagnifyingGlass size={36} color={colors.textMuted} />
                  <Text style={{ fontFamily: Fonts.friendly, fontSize: 18, color: colors.textPrimary, marginTop: 16, marginBottom: 8, textAlign: "center" }}>
                    No memes for "{debouncedQuery}"
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: "center" }}>
                    Try switching to People or use a different term.
                  </Text>
                </View>
              }
            />
          )
        ) : (
          <Animated.View entering={FadeInDown.duration(300).springify()} style={{ paddingHorizontal: 20, paddingTop: 20 }}>
            <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.textMuted, marginBottom: 16 }}>
              Browse Categories
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {browseTags.map((c, i) => (
                <Animated.View key={c.id} entering={FadeInDown.delay(i * 35).duration(280).springify()}>
                  <TouchableOpacity
                    onPress={() => { setQuery(c.label); setActiveTab("memes"); }}
                    activeOpacity={0.7}
                    style={{ flexDirection: "row", alignItems: "center", gap: 6, borderRadius: Radius.full, paddingVertical: 10, paddingHorizontal: 16, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.bgCard }}
                  >

                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: colors.textPrimary }}>{c.label}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        )}
      </SafeAreaView>
    </View>
  );
}

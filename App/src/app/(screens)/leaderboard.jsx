import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Trophy,
  Fire,
  UserCircle,
  Images,
  ChartLineUp,
} from "phosphor-react-native";
import { Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { usePosts } from "../../hooks/usePosts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/* ============================================================
   HELPERS
============================================================ */

function totalReactions(post) {
  return Object.values(post.reactions ?? {}).reduce((s, n) => s + n, 0);
}

function fmtCount(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n ?? 0);
}

const MEDAL = {
  1: { color: "#F5A623", label: "1st" },
  2: { color: "#9B9B9B", label: "2nd" },
  3: { color: "#C47D3E", label: "3rd" },
};

/* ============================================================
   SEGMENTED CONTROL — Memes / Creators
============================================================ */

function SegmentedControl({ options, value, onChange, colors }) {
  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.bgCard,
        borderRadius: Radius.full,
        padding: 4,
        marginHorizontal: 20,
        marginBottom: 20,
      }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <TouchableOpacity
            key={opt.id}
            onPress={() => onChange(opt.id)}
            activeOpacity={0.7}
            style={{
              flex: 1,
              paddingVertical: 10,
              borderRadius: Radius.full,
              backgroundColor: active ? colors.bgElevated : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.friendly,
                fontSize: 14,
                letterSpacing: 0.2,
                color: active ? colors.textPrimary : colors.textMuted,
              }}
            >
              {opt.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

/* ============================================================
   PODIUM — top 3 memes as a hero arrangement
============================================================ */

function PodiumCard({ post, rank, colors, size = "md" }) {
  const medal = MEDAL[rank];
  const total = totalReactions(post);
  const isFirst = rank === 1;

  // First place is bigger, sits higher
  const cardWidth = isFirst ? (SCREEN_WIDTH - 40) * 0.44 : (SCREEN_WIDTH - 40) * 0.28;
  const cardHeight = isFirst ? cardWidth * 1.25 : cardWidth * 1.15;

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/PostView", params: { slug: post.slug } })
      }
      activeOpacity={0.9}
      style={{
        width: cardWidth,
        marginTop: isFirst ? 0 : 24,
      }}
    >
      {/* Medal badge */}
      <View
        style={{
          alignSelf: "center",
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          paddingHorizontal: 10,
          paddingVertical: 4,
          borderRadius: Radius.full,
          backgroundColor: medal.color + "22",
          marginBottom: 8,
        }}
      >
        <Trophy size={12} color={medal.color} weight="fill" />
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 11,
            letterSpacing: 0.4,
            color: medal.color,
          }}
        >
          {medal.label}
        </Text>
      </View>

      {/* Image */}
      <View
        style={{
          width: cardWidth,
          height: cardHeight,
          borderRadius: Radius.xl,
          overflow: "hidden",
          backgroundColor: colors.bgCard,
          borderWidth: 2,
          borderColor: medal.color,
        }}
      >
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Images size={28} color={colors.textMuted} weight="duotone" />
          </View>
        )}

        {/* Reaction pill overlay */}
        <View style={{ position: "absolute", bottom: 8, left: 8, right: 8, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4, paddingVertical: 5, paddingHorizontal: 10, borderRadius: Radius.full, backgroundColor: "rgba(0,0,0,0.6)" }}>
          <Fire size={12} color="#FFFFFF" weight="fill" />
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 0.3, color: "#FFFFFF" }}>
            {fmtCount(total)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function Podium({ memes, colors }) {
  if (memes.length === 0) return null;

  // Arrange: [2nd] [1st] [3rd] — classic podium
  const [first, second, third] = memes;

  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "flex-end",
        gap: 10,
        paddingHorizontal: 20,
        marginBottom: 32,
      }}
    >
      {second ? (
        <PodiumCard post={second} rank={2} colors={colors} />
      ) : (
        <View style={{ width: (SCREEN_WIDTH - 40) * 0.28 }} />
      )}
      {first ? (
        <PodiumCard post={first} rank={1} colors={colors} />
      ) : (
        <View style={{ width: (SCREEN_WIDTH - 40) * 0.44 }} />
      )}
      {third ? (
        <PodiumCard post={third} rank={3} colors={colors} />
      ) : (
        <View style={{ width: (SCREEN_WIDTH - 40) * 0.28 }} />
      )}
    </View>
  );
}

/* ============================================================
   RANKED MEME ROW (rank 4+)
============================================================ */

function RankedMemeRow({ post, rank, colors }) {
  const total = totalReactions(post);

  return (
    <TouchableOpacity
      onPress={() =>
        router.push({ pathname: "/PostView", params: { slug: post.slug } })
      }
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
      }}
    >
      {/* Rank number — the design element */}
      <Text
        style={{
          fontFamily: Fonts.friendly,
          fontSize: 18,
          letterSpacing: -0.3,
          color: colors.textMuted,
          width: 32,
          textAlign: "center",
        }}
      >
        {rank}
      </Text>

      {/* Thumbnail */}
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: Radius.md,
          overflow: "hidden",
          backgroundColor: colors.bgCard,
        }}
      >
        {post.image_url ? (
          <Image source={{ uri: post.image_url }} style={{ width: "100%", height: "100%" }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Images size={20} color={colors.textMuted} weight="duotone" />
          </View>
        )}
      </View>

      {/* Caption / author */}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.regular, fontSize: 13, color: colors.textPrimary, marginBottom: 2 }}>
          {post.caption ?? "Untitled meme"}
        </Text>
        <Text numberOfLines={1} style={{ fontFamily: Fonts.regular, fontSize: 11, color: colors.textMuted }}>
          @{post.user?.username ?? post.creator?.username ?? "anonymous"}
        </Text>
      </View>

      {/* Reactions */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: colors.accentSoft }}>
        <Fire size={12} color={colors.accent} weight="fill" />
        <Text style={{ fontFamily: Fonts.semiBold, fontSize: 12, letterSpacing: 0.2, color: colors.accent }}>
          {fmtCount(total)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ============================================================
   RANKED CREATOR ROW
============================================================ */

function RankedCreatorRow({ creator, rank, total, colors }) {
  const medal = MEDAL[rank];

  return (
    <TouchableOpacity
      onPress={() => {
        if (creator?.username) {
          router.push({
            pathname: "/UserProfile",
            params: { username: creator.username },
          });
        }
      }}
      activeOpacity={0.7}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        gap: 12,
      }}
    >
      {/* Rank badge or number */}
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: medal
            ? medal.color + "22"
            : colors.bgCard,
        }}
      >
        {medal ? (
          <Trophy size={15} color={medal.color} weight="fill" />
        ) : (
          <Text
            style={{
              fontFamily: Fonts.semiBold,
              fontSize: 13,
              color: colors.textMuted,
            }}
          >
            {rank}
          </Text>
        )}
      </View>

      {/* Avatar */}
        {creator.avatar ? (
          <Image source={{ uri: creator.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
        ) : (
          <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
            <UserCircle size={24} color={colors.textMuted} weight="duotone" />
          </View>
        )}

      {/* Name + handle */}
      <View style={{ flex: 1 }}>
        <Text
          numberOfLines={1}
          style={{
            fontFamily: Fonts.friendly,
            fontSize: 15,
            letterSpacing: 0.1,
            color: colors.textPrimary,
            marginBottom: 2,
          }}
        >
          {creator.name}
        </Text>
        {creator.username ? (
          <Text
            numberOfLines={1}
            style={{
              fontFamily: Fonts.regular,
              fontSize: 12,
              color: colors.textMuted,
            }}
          >
            {creator.username}
          </Text>
        ) : null}
      </View>

      {/* Total reactions */}
      <View style={{ alignItems: "flex-end" }}>
        <Text
          style={{
            fontFamily: Fonts.friendly,
            fontSize: 15,
            letterSpacing: -0.1,
            color: colors.textPrimary,
          }}
        >
          {fmtCount(total)}
        </Text>
        <Text
          style={{
            fontFamily: Fonts.regular,
            fontSize: 10,
            letterSpacing: 0.4,
            textTransform: "uppercase",
            color: colors.textMuted,
          }}
        >
          reactions
        </Text>
      </View>
    </TouchableOpacity>
  );
}

/* ============================================================
   SCREEN
============================================================ */

const TABS = [
  { id: "memes", label: "Top Memes" },
  { id: "creators", label: "Top Creators" },
];

export default function LeaderboardScreen() {
  const { colors, isDark } = useTheme();
  const { data: postsData, isLoading } = usePosts();
  const [activeTab, setActiveTab] = useState("memes");

  const allPosts = useMemo(() => {
    const pages = postsData?.pages ?? [];
    return pages.flatMap((page) => {
      const raw = page?.data ?? page ?? [];
      return Array.isArray(raw) ? raw : [];
    });
  }, [postsData]);

  const topMemes = useMemo(
    () =>
      [...allPosts]
        .sort((a, b) => totalReactions(b) - totalReactions(a))
        .slice(0, 20),
    [allPosts]
  );

  const topCreators = useMemo(() => {
    const byCreator = {};
    allPosts.forEach((post) => {
      const creator = post.user ?? post.creator;
      const id = creator?.id ?? creator?.name;
      if (!id) return;
      if (!byCreator[id]) byCreator[id] = { creator, total: 0 };
      byCreator[id].total += totalReactions(post);
    });
    return Object.values(byCreator)
      .sort((a, b) => b.total - a.total)
      .slice(0, 20);
  }, [allPosts]);

  const isEmpty = !isLoading && allPosts.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
        {/* ── Header ─────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View
              style={{
                width: 42,
                height: 42,
                borderRadius: 14,
                backgroundColor: colors.accentSoft,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Trophy size={22} color={colors.accent} weight="duotone" />
            </View>

            <View>
              <Text
                style={{
                  fontFamily: Fonts.friendly,
                  fontSize: 24,
                  letterSpacing: -0.3,
                  color: colors.textPrimary,
                }}
              >
                Leaderboard
              </Text>
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 12,
                  letterSpacing: 0.3,
                  color: colors.textMuted,
                  marginTop: 1,
                }}
              >
                Updated just now
              </Text>
            </View>
          </View>

          {/* Trending badge */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: Radius.full,
              backgroundColor: colors.bgCard,
            }}
          >
            <ChartLineUp size={14} color={colors.accent} weight="bold" />
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 11,
                letterSpacing: 0.3,
                color: colors.accent,
              }}
            >
              This week
            </Text>
          </View>
        </View>

        {/* ── Segmented control ─────────────────────────── */}
        <SegmentedControl
          options={TABS}
          value={activeTab}
          onChange={setActiveTab}
          colors={colors}
        />

        {/* ── Body ──────────────────────────────────────── */}
        {isLoading ? (
          <ActivityIndicator
            color={colors.accent}
            style={{ marginTop: 60 }}
          />
        ) : isEmpty ? (
          <View
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 40,
            }}
          >
            <View
              style={{
                width: 72,
                height: 72,
                borderRadius: 24,
                backgroundColor: colors.bgCard,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <Trophy size={32} color={colors.textMuted} weight="duotone" />
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
              Nothing to rank yet
            </Text>

            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 14,
                lineHeight: 21,
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              Once memes start getting reactions, rankings show up here.
            </Text>
          </View>
        ) : activeTab === "memes" ? (
          <FlatList
            data={topMemes.slice(3)}
            keyExtractor={(p) => String(p.id)}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 60 }}
            ListHeaderComponent={
              <>
                <Podium memes={topMemes} colors={colors} />

                {topMemes.length > 3 ? (
                  <View style={{ paddingHorizontal: 20, marginBottom: 8 }}>
                    <Text
                      style={{
                        fontFamily: Fonts.friendly,
                        fontSize: 12,
                        letterSpacing: 1.2,
                        textTransform: "uppercase",
                        color: colors.textMuted,
                      }}
                    >
                      Rising
                    </Text>
                  </View>
                ) : null}
              </>
            }
            renderItem={({ item, index }) => (
              <View style={{ paddingHorizontal: 20 }}>
                <RankedMemeRow
                  post={item}
                  rank={index + 4}
                  colors={colors}
                />
              </View>
            )}
          />
        ) : (
          <FlatList
            data={topCreators}
            keyExtractor={(c) =>
              String(c.creator?.id ?? c.creator?.name ?? Math.random())
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 60,
            }}
            ItemSeparatorComponent={() => (
              <View
                style={{
                  height: 1,
                  backgroundColor: colors.border,
                  opacity: 0.5,
                }}
              />
            )}
            renderItem={({ item, index }) => (
              <RankedCreatorRow
                creator={item.creator}
                rank={index + 1}
                total={item.total}
                colors={colors}
              />
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}
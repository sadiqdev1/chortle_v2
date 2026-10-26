import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Share,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  ShareNetwork,
  BookmarkSimple,
  PaperPlaneTilt,
  UserCircle,
  SmileyMeh,
  DotsThree,
  PencilSimple,
  Trash,
} from "phosphor-react-native";
import { Fonts, REACTIONS, Radius } from "../../constants/theme";
import { useBookmarks } from "../../context/BookmarksContext";
import { useAuth } from "../../hooks/useAuth";
import { useComments, useCreateComment } from "../../hooks/useComments";
import { usePost, useDeletePost } from "../../hooks/usePosts";
import { formatRelativeDate } from "../../utils/formatDate";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";

const { width } = Dimensions.get("window");

function ReactionButton({ reaction, count, active, onPress, colors }) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.value = withSpring(1.25, { damping: 6, stiffness: 300 }, () => {
      scale.value = withSpring(1, { damping: 8, stiffness: 300 });
    });
    onPress();
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} style={{ flex: 1, alignItems: "center" }}>
      <View style={{ width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: active ? colors.accentSoft : colors.bgCard, borderWidth: 1.5, borderColor: active ? colors.accent : colors.border, marginBottom: 6 }}>
        <Animated.Text style={[{ fontSize: 24 }, style]}>{reaction.emoji}</Animated.Text>
      </View>
      <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 0.2, color: active ? colors.accent : colors.textMuted }}>
        {count > 0 ? count : reaction.label}
      </Text>
    </TouchableOpacity>
  );
}

function CommentRow({ comment, colors }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {comment.user?.avatar ? (
        <Image source={{ uri: comment.user.avatar }} style={{ width: 34, height: 34, borderRadius: 17, marginTop: 2 }} />
      ) : (
        <View style={{ width: 34, height: 34, borderRadius: 17, marginTop: 2, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
          <UserCircle size={22} color={colors.textMuted} weight="duotone" />
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 13, color: colors.textPrimary }}>
            {comment.user?.name ?? "Anonymous"}
          </Text>
          <Text style={{ fontFamily: Fonts.regular, fontSize: 11, color: colors.textMuted }}>
            {formatRelativeDate(comment.created_at)}
          </Text>
        </View>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 14, lineHeight: 21, color: colors.textPrimary }}>
          {comment.body}
        </Text>
      </View>
    </View>
  );
}

export default function PostViewScreen() {
  const { slug } = useLocalSearchParams();
  const { data: postData, isLoading, isError } = usePost(slug);
  const { colors, isDark } = useTheme();
  const { toast } = useToast();

  const meme = postData?.data ?? postData?.meme ?? postData;

  const { user } = useAuth();
  const { isBookmarked, toggleBookmark, getReactionState, toggleReaction } = useBookmarks();
  const { mutate: deletePost, isPending: deleting } = useDeletePost();

  // Infinite-scroll comments — flatten pages
  const { data: commentsData, isLoading: commentsLoading, hasNextPage, fetchNextPage, isFetchingNextPage } = useComments(meme?.slug ?? slug);
  const allComments = (commentsData?.pages ?? []).flatMap((p) => p?.data ?? []);

  const { mutate: submitComment, isPending: submitting } = useCreateComment(meme?.slug ?? slug);
  const [draft, setDraft] = useState("");

  const isOwner = user?.id === meme?.user?.id;

  function handleCommentSubmit() {
    const body = draft.trim();
    if (!body) return;
    submitComment({ body }, {
      onSuccess: () => setDraft(""),
      onError: () => toast.error("Couldn't post comment. Try again."),
    });
  }

  async function handleShare() {
    if (!meme) return;
    try {
      await Share.share({
        message: meme.caption
          ? `${meme.caption}\n\nchortle://post/${meme.slug}`
          : `chortle://post/${meme.slug}`,
        url: `chortle://post/${meme.slug}`,
      });
    } catch {}
  }

  function handleDeleteMeme() {
    Alert.alert(
      "Delete meme",
      "This will permanently remove your meme. Are you sure?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deletePost(meme.slug, {
              onSuccess: () => {
                toast.success("Meme deleted.");
                router.replace("/(tabs)");
              },
              onError: () => toast.error("Couldn't delete. Try again."),
            });
          },
        },
      ]
    );
  }

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (isError || !meme) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center", padding: 32 }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
        <SmileyMeh size={48} color={colors.textMuted} weight="duotone" style={{ marginBottom: 16 }} />
        <Text style={{ fontFamily: Fonts.friendly, fontSize: 20, color: colors.textPrimary, marginBottom: 8, textAlign: "center" }}>Meme not found</Text>
        <Text style={{ fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22, color: colors.textSecondary, textAlign: "center", marginBottom: 28 }}>
          It may have been removed or the link is outdated.
        </Text>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.8} style={{ paddingHorizontal: 24, paddingVertical: 12, borderRadius: Radius.full, backgroundColor: colors.accent }}>
          <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: "#fff" }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const saved = isBookmarked(meme.id);
  const { active: myReaction, counts: reactionCounts } = getReactionState(meme);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <FlatList
        data={allComments}
        keyExtractor={(c) => String(c.id)}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 20 }}
        onEndReached={() => { if (hasNextPage && !isFetchingNextPage) fetchNextPage(); }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color={colors.accent} style={{ marginVertical: 12 }} /> : null}
        ListHeaderComponent={
          <View>
            {/* Hero image */}
            <View style={{ position: "relative" }}>
              {meme.image_url ? (
                <Image source={{ uri: meme.image_url }} style={{ width, height: 380 }} resizeMode="cover" />
              ) : (
                <View style={{ width, height: 260, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
                  <Text style={{ fontSize: 48 }}>🐸</Text>
                </View>
              )}

              <SafeAreaView edges={["top"]} style={{ position: "absolute", top: 0, left: 0, right: 0 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 8 }}>
                  <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}>
                    <ArrowLeft size={20} color="#fff" weight="bold" />
                  </TouchableOpacity>

                  <View style={{ flexDirection: "row", gap: 8 }}>
                    {isOwner && (
                      <>
                        <TouchableOpacity
                          onPress={() => router.push({ pathname: "/create", params: { editSlug: meme.slug } })}
                          style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}
                        >
                          <PencilSimple size={18} color="#fff" weight="bold" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={handleDeleteMeme}
                          disabled={deleting}
                          style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(220,38,38,0.7)", alignItems: "center", justifyContent: "center" }}
                        >
                          {deleting ? <ActivityIndicator size="small" color="#fff" /> : <Trash size={18} color="#fff" weight="bold" />}
                        </TouchableOpacity>
                      </>
                    )}
                    <TouchableOpacity onPress={handleShare} style={{ width: 40, height: 40, borderRadius: 13, backgroundColor: "rgba(0,0,0,0.45)", alignItems: "center", justifyContent: "center" }}>
                      <ShareNetwork size={20} color="#fff" weight="bold" />
                    </TouchableOpacity>
                  </View>
                </View>
              </SafeAreaView>

              {meme.category && (
                <View style={{ position: "absolute", bottom: 14, left: 16, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full, backgroundColor: "rgba(0,0,0,0.55)" }}>
                  <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 0.8, color: "#fff" }}>
                    {meme.category.toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {meme.caption && (
                <Text style={{ fontFamily: Fonts.friendly, fontSize: 21, lineHeight: 28, letterSpacing: -0.1, color: colors.textPrimary, marginBottom: 20 }}>
                  {meme.caption}
                </Text>
              )}

              {/* Author */}
              <TouchableOpacity
                onPress={() => meme.user?.username && router.push({ pathname: "/UserProfile", params: { username: meme.user.username } })}
                activeOpacity={0.8}
                style={{ flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: colors.bgCard, borderRadius: Radius.xl, borderWidth: 1, borderColor: colors.border, marginBottom: 24, gap: 12 }}
              >
                {meme.user?.avatar ? (
                  <Image source={{ uri: meme.user.avatar }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                ) : (
                  <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
                    <UserCircle size={26} color={colors.textMuted} weight="duotone" />
                  </View>
                )}
                <View style={{ flex: 1 }}>
                  <Text numberOfLines={1} style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: colors.textPrimary }}>
                    {meme.user?.name ?? "Unknown"}
                  </Text>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: colors.textMuted, marginTop: 1 }}>
                    {meme.user?.username ? `@${meme.user.username} · ` : ""}
                    {formatRelativeDate(meme.created_at)}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Reactions */}
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {REACTIONS.map((r) => (
                  <ReactionButton key={r.id} reaction={r} count={reactionCounts[r.id] ?? 0} active={myReaction === r.id} onPress={() => toggleReaction(meme, r.id)} colors={colors} />
                ))}
              </View>

              {/* Save */}
              <TouchableOpacity
                onPress={() => toggleBookmark(meme)}
                style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: Radius.xl, borderWidth: 1.5, borderColor: saved ? colors.accent : colors.border, backgroundColor: saved ? colors.accentSoft : colors.bgCard, marginBottom: 28 }}
                activeOpacity={0.8}
              >
                <BookmarkSimple size={18} color={saved ? colors.accent : colors.textSecondary} weight={saved ? "fill" : "regular"} />
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 14, color: saved ? colors.accent : colors.textSecondary }}>
                  {saved ? "Saved" : "Save meme"}
                </Text>
              </TouchableOpacity>

              {/* Comments heading */}
              <Text style={{ fontFamily: Fonts.friendly, fontSize: 17, color: colors.textPrimary, marginBottom: 4 }}>
                Comments
                {allComments.length > 0 && (
                  <Text style={{ fontFamily: Fonts.regular, color: colors.textMuted, fontSize: 14 }}>
                    {"  "}{allComments.length}
                  </Text>
                )}
              </Text>
            </View>
          </View>
        }
        renderItem={({ item: comment }) => <CommentRow comment={comment} colors={colors} />}
        ListEmptyComponent={
          commentsLoading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
          ) : (
            <View style={{ alignItems: "center", paddingTop: 32, paddingHorizontal: 32 }}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>💬</Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, color: colors.textSecondary, textAlign: "center" }}>
                No comments yet. Be the first!
              </Text>
            </View>
          )
        }
      />

      {user && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg }}>
          {user.avatar ? (
            <Image source={{ uri: user.avatar }} style={{ width: 34, height: 34, borderRadius: 17 }} />
          ) : (
            <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}>
              <UserCircle size={22} color={colors.textMuted} weight="duotone" />
            </View>
          )}
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a comment…"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={2000}
            style={{ flex: 1, fontFamily: Fonts.regular, fontSize: 14, color: colors.textPrimary, paddingVertical: 8, paddingHorizontal: 14, backgroundColor: colors.bgCard, borderRadius: Radius.lg, maxHeight: 100 }}
          />
          <TouchableOpacity
            onPress={handleCommentSubmit}
            disabled={!draft.trim() || submitting}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: draft.trim() && !submitting ? colors.accent : colors.bgCard, alignItems: "center", justifyContent: "center" }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <PaperPlaneTilt size={17} color={draft.trim() ? "#fff" : colors.textMuted} weight="fill" />
            )}
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

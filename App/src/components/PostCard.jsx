
/**
 * PostCard — unified feed card.
 * Phosphor icons, expo-image, follow button, read-more, bottom-sheet comments.
 */
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  Pressable,
  Share,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Image } from "expo-image";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  ZoomIn,
  ZoomOut,
} from "react-native-reanimated";
import {
  Heart,
  ChatCircle,
  BookmarkSimple,
  DotsThree,
  ShareNetwork,
  Link,
  EyeSlash,
  Flag,
  Eye,
  SealCheckIcon,
} from "phosphor-react-native";
import { Fonts, Radius, REACTIONS } from "../constants/theme";
import { useBookmarks } from "../context/BookmarksContext";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import { useToggleFollow } from "../hooks/useProfile";
import { formatRelativeDate } from "../utils/formatDate";
import { reportPost } from "../services/postService";
import { fmtCount } from "../utils/helpers";
import CommentsSheet from "./CommentsSheet";
import ImageZoomModal from "./ImageZoomModal";

export { REACTIONS };

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const API_URL2 = process.env.EXPO_PUBLIC_API_URL2;

const REACTION_COLORS = {
  fire: "#E9710F",
  laugh: "#F7B125",
  skull: "#555555",
  heart: "#F33E58",
};

/* ── Image URL helper ─────────────────────────────────────── */
function resolveImageUrl(imageUrl) {
  if (!imageUrl) return null;

  // Preserve absolute URLs.
  if (/^https?:\/\//i.test(imageUrl)) {
    return imageUrl;
  }

  // Resolve relative paths against the configured image base URL.
  const base = (API_URL2 ?? "").replace(/\/+$/, "");
  const path = imageUrl.replace(/^\/+/, "");

  return base ? `${base}/${path}` : null;
}

/* ── Reaction picker ──────────────────────────────────────── */
function ReactionPicker({ visible, onSelect, onClose, colors }) {
  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={{ flex: 1 }} onPress={onClose}>
        <View
          style={{
            position: "absolute",
            bottom: 80,
            left: 14,
            flexDirection: "row",
            gap: 2,
            backgroundColor: colors.bgElevated,
            borderRadius: 40,
            paddingHorizontal: 8,
            paddingVertical: 6,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 16,
            elevation: 14,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {REACTIONS.map((reaction, index) => (
            <Animated.View
              key={reaction.id}
              entering={ZoomIn.delay(index * 30)
                .springify()
                .damping(12)
                .stiffness(280)}
              exiting={ZoomOut.duration(120)}
            >
              <Pressable
                onPress={() => {
                  onSelect(reaction.id);
                  onClose();
                }}
                style={{
                  alignItems: "center",
                  paddingHorizontal: 6,
                  paddingVertical: 2,
                }}
              >
                <Text style={{ fontSize: 30 }}>
                  {reaction.emoji}
                </Text>
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    fontSize: 9,
                    color: colors.textMuted,
                    marginTop: 2,
                  }}
                >
                  {reaction.label}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

/* ── Like button ──────────────────────────────────────────── */
function LikeButton({ post, colors }) {
  const { getReactionState, toggleReaction } = useBookmarks();

  const {
    active: myReaction,
    counts: reactionCounts,
  } = getReactionState(post);

  const [pickerOpen, setPickerOpen] = useState(false);
  const scale = useSharedValue(1);

  const activeReaction = REACTIONS.find(
    (reaction) => reaction.id === myReaction
  );

  const totalCount = Object.values(reactionCounts).reduce(
    (sum, count) => sum + (Number(count) || 0),
    0
  );

  const reactionColor = myReaction
    ? REACTION_COLORS[myReaction] ?? colors.accent
    : colors.textSecondary;

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  function handlePress() {
    scale.value = withSpring(
      1.35,
      { damping: 5, stiffness: 300 },
      () => {
        scale.value = withSpring(1, {
          damping: 8,
          stiffness: 260,
        });
      }
    );

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleReaction(post, "fire");
  }

  return (
    <>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={() => {
          Haptics.selectionAsync();
          setPickerOpen(true);
        }}
        delayLongPress={380}
        activeOpacity={0.7}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 6,
          paddingHorizontal: 10,
          paddingVertical: 8,
        }}
      >
        {activeReaction ? (
          <Animated.Text
            style={[{ fontSize: 20 }, animStyle]}
          >
            {activeReaction.emoji}
          </Animated.Text>
        ) : (
          <Heart
            size={22}
            color={colors.textSecondary}
            weight="regular"
          />
        )}

        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 13,
            color: myReaction
              ? reactionColor
              : colors.textSecondary,
          }}
        >
          {totalCount > 0 ? fmtCount(totalCount) : "Like"}
        </Text>
      </TouchableOpacity>

      <ReactionPicker
        visible={pickerOpen}
        onSelect={(id) => toggleReaction(post, id)}
        onClose={() => setPickerOpen(false)}
        colors={colors}
      />
    </>
  );
}

/* ── Inline follow button ─────────────────────────────────── */
function FollowButton({
  username,
  colors,
  initialFollowing = false,
}) {
  const { mutate: toggleFollow, isPending } =
    useToggleFollow(username);

  const [following, setFollowing] = useState(initialFollowing);

  useEffect(() => {
    setFollowing(initialFollowing);
  }, [initialFollowing, username]);

  function handlePress() {
    if (isPending) return;

    const previous = following;

    setFollowing(!previous);
    Haptics.selectionAsync();

    toggleFollow(undefined, {
      onError: () => setFollowing(previous),
    });
  }

  if (!username) return null;

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isPending}
      hitSlop={6}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: Radius.full,
        borderWidth: 1.5,
        borderColor: following ? colors.border : colors.accent,
        backgroundColor: following
          ? "transparent"
          : colors.accent,
        opacity: isPending ? 0.65 : 1,
      }}
    >
      <Text
        style={{
          fontFamily: Fonts.semiBold,
          fontSize: 11,
          color: following
            ? colors.textSecondary
            : "#fff",
        }}
      >
        {following ? "Following" : "Follow"}
      </Text>
    </TouchableOpacity>
  );
}

/* ── Post actions sheet ───────────────────────────────────── */
function PostActionsSheet({
  visible,
  onClose,
  onAction,
  colors,
}) {
  const actions = [
    { id: "save", label: "Save meme", Icon: BookmarkSimple },
    { id: "share", label: "Share", Icon: ShareNetwork },
    { id: "copy", label: "Copy link", Icon: Link },
    { id: "hide", label: "Hide this post", Icon: EyeSlash },
    {
      id: "report",
      label: "Report",
      Icon: Flag,
      destructive: true,
    },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: Radius.xxl,
            borderTopRightRadius: Radius.xxl,
            paddingTop: 12,
            paddingBottom: 36,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 18,
            }}
          />

          {actions.map((action, index) => {
            const { Icon } = action;
            const isLast = index === actions.length - 1;

            return (
              <TouchableOpacity
                key={action.id}
                onPress={() => {
                  onAction(action.id);
                  onClose();
                }}
                activeOpacity={0.6}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 14,
                  paddingVertical: 14,
                  borderBottomWidth: isLast ? 0 : 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: action.destructive
                      ? colors.error + "18"
                      : colors.bgCard,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon
                    size={20}
                    color={
                      action.destructive
                        ? colors.error
                        : colors.textPrimary
                    }
                    weight="duotone"
                  />
                </View>

                <Text
                  style={{
                    fontFamily: Fonts.medium,
                    fontSize: 15,
                    color: action.destructive
                      ? colors.error
                      : colors.textPrimary,
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Report sheet ─────────────────────────────────────────── */
const REPORT_REASONS = [
  { id: "Spam", label: "Spam" },
  { id: "Harassment", label: "Harassment" },
  { id: "Inappropriate", label: "Inappropriate content" },
  { id: "Copyright", label: "Copyright violation" },
  { id: "Other", label: "Other" },
];

function ReportSheet({ visible, onClose, postSlug }) {
  const { colors } = useTheme();
  const { toast } = useToast();

  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!selected || submitting) return;

    setSubmitting(true);

    try {
      await reportPost(postSlug, selected);
      toast.success("Reported. We'll review this post.");
      setSelected(null);
      onClose();
    } catch (error) {
      toast.error(
        error?.response?.data?.message ??
          "Couldn't submit report."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        onPress={onClose}
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.4)",
          justifyContent: "flex-end",
        }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.bg,
            borderTopLeftRadius: Radius.xxl,
            borderTopRightRadius: Radius.xxl,
            paddingTop: 12,
            paddingBottom: 40,
            paddingHorizontal: 20,
          }}
        >
          <View
            style={{
              alignSelf: "center",
              width: 36,
              height: 4,
              borderRadius: 2,
              backgroundColor: colors.border,
              marginBottom: 18,
            }}
          />

          <Text
            style={{
              fontFamily: Fonts.friendly,
              fontSize: 20,
              color: colors.textPrimary,
              marginBottom: 4,
            }}
          >
            Report post
          </Text>

          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 14,
              lineHeight: 20,
              color: colors.textMuted,
              marginBottom: 20,
            }}
          >
            Why are you reporting this?
          </Text>

          {REPORT_REASONS.map((reason) => {
            const active = selected === reason.id;

            return (
              <TouchableOpacity
                key={reason.id}
                onPress={() => setSelected(reason.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                }}
              >
                <Text
                  style={{
                    fontFamily: active
                      ? Fonts.semiBold
                      : Fonts.regular,
                    fontSize: 15,
                    color: active
                      ? colors.accent
                      : colors.textPrimary,
                  }}
                >
                  {reason.label}
                </Text>

                <View
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    borderWidth: 2,
                    borderColor: active
                      ? colors.accent
                      : colors.border,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {active && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colors.accent,
                      }}
                    />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={!selected || submitting}
            activeOpacity={0.85}
            style={{
              marginTop: 24,
              height: 52,
              borderRadius: Radius.full,
              backgroundColor: selected
                ? colors.error
                : colors.bgCard,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 15,
                  color: selected ? "#fff" : colors.textMuted,
                }}
              >
                Submit Report
              </Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/* ── Caption with read-more ───────────────────────────────── */
function CaptionText({ caption, colors }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = caption.length > 120;

  return (
    <View style={{ paddingHorizontal: 14, paddingBottom: 12 }}>
      <Text
        numberOfLines={expanded ? undefined : 3}
        style={{
          fontFamily: Fonts.regular,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textPrimary,
        }}
      >
        {caption}
      </Text>

      {isLong && !expanded && (
        <TouchableOpacity
          onPress={() => setExpanded(true)}
          hitSlop={8}
        >
          <Text
            style={{
              fontFamily: Fonts.semiBold,
              fontSize: 13,
              color: colors.accent,
              marginTop: 4,
            }}
          >
            Read more
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

/* ── Post card ────────────────────────────────────────────── */
export default function PostCard({
  post,
  bookmarked,
  onToggleBookmark,
  onPress,
}) {
  const { colors } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();

  const [menuOpen, setMenuOpen] = useState(false);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const author = post.user ?? post.creator ?? post.author;
  const commentsCount = post.commentsCount ?? post.comments_count ?? 0;
  const imageUri = resolveImageUrl(post.image_url);

  const isOwnPost =
    String(user?.id ?? "") === String(author?.id ?? "") ||
    Boolean(user?.username && user.username === author?.username);

  function openAuthorProfile() {
    if (author?.username) {
      router.push({
        pathname: "/UserProfile",
        params: { username: author.username },
      });
    }
  }

  async function handleAction(actionId) {
    switch (actionId) {
      case "save":
        onToggleBookmark?.();
        break;

      case "share":
        try {
          await Share.share({
            message: post.caption
              ? `${post.caption}\n\nchortle://post/${post.slug}`
              : "Check this meme on Chortle",
            url: `https://chortle.app/post/${post.slug}`,
          });
        } catch {}
        break;

      case "copy":
        try {
          await Clipboard.setStringAsync(
            `chortle://post/${post.slug}`
          );
          toast.success("Link copied!");
        } catch {
          toast.error("Couldn't copy link.");
        }
        break;

      case "hide":
        toast.info("Post hidden.");
        break;

      case "report":
        setReportOpen(true);
        break;
    }
  }

  return (
    <>
      <View
        style={{
          width: SCREEN_WIDTH,
          backgroundColor: colors.bgElevated,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {/* Author row */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingTop: 14,
            paddingBottom: 10,
          }}
        >
          <TouchableOpacity
            onPress={openAuthorProfile}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              flex: 1,
              gap: 10,
            }}
          >
            {author?.avatar ? (
              <Image
                source={{ uri: author.avatar }}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                }}
              />
            ) : (
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: colors.bgCard,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>🐸</Text>
              </View>
            )}

            <View style={{ flex: 1 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <Text
                  numberOfLines={1}
                  style={{
                    fontFamily: Fonts.semiBold,
                    fontSize: 14,
                    color: colors.textPrimary,
                  }}
                >
                  {author?.name ?? "Anonymous"}
                </Text>

                {author?.is_verified && (
                  <SealCheckIcon
                    size={18}
                    color={colors.accent}
                    weight="fill"
                  />
                )}
              </View>

              <Text
                numberOfLines={1}
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 11,
                  letterSpacing: 0.2,
                  color: colors.textMuted,
                  marginTop: 1,
                }}
              >
                {author?.username
                  ? `@${author.username} · `
                  : ""}
                {formatRelativeDate(post.created_at)}
              </Text>
            </View>
          </TouchableOpacity>

          {!isOwnPost && author?.username && (
            <FollowButton
              username={author.username}
              colors={colors}
              initialFollowing={Boolean(author.is_following)}
            />
          )}

          <TouchableOpacity
            onPress={() => setMenuOpen(true)}
            hitSlop={12}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              alignItems: "center",
              justifyContent: "center",
              marginLeft: 4,
            }}
          >
            <DotsThree
              size={22}
              color={colors.textMuted}
              weight="bold"
            />
          </TouchableOpacity>
        </View>

        {/* Caption */}
        {post.caption ? (
          <CaptionText
            caption={post.caption}
            colors={colors}
          />
        ) : null}

        {/* Media */}
        <TouchableOpacity
          activeOpacity={0.97}
          onPress={() => setZoomOpen(true)}
          onLongPress={onPress}
          delayLongPress={400}
        >
          {imageUri ? (
            <Image
              source={{ uri: imageUri }}
              style={{
                width: "100%",
                aspectRatio: post.aspect_ratio ?? 1,
                backgroundColor: colors.bgCard,
              }}
              contentFit="cover"
              transition={200}
              placeholder={{
                blurhash: "L6PZfSi_.AyE_3t7t7R**0o#DgR4",
              }}
            />
          ) : (
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                backgroundColor: colors.bgCard,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 48 }}>🐸</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Engagement bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 4,
            paddingVertical: 4,
          }}
        >
          <LikeButton post={post} colors={colors} />

          <TouchableOpacity
            onPress={() => setCommentsOpen(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <ChatCircle
              size={22}
              color={colors.textSecondary}
              weight="regular"
            />
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 13,
                color: colors.textSecondary,
              }}
            >
              {commentsCount > 0
                ? fmtCount(commentsCount)
                : "Comment"}
            </Text>
          </TouchableOpacity>

          {post.views_count > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingHorizontal: 8,
              }}
            >
              <Eye
                size={16}
                color={colors.textMuted}
                weight="regular"
              />
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 12,
                  color: colors.textMuted,
                }}
              >
                {fmtCount(post.views_count)}
              </Text>
            </View>
          )}

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            onPress={() => {
              Haptics.selectionAsync();
              onToggleBookmark?.();
            }}
            hitSlop={10}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <BookmarkSimple
              size={22}
              color={
                bookmarked
                  ? colors.accent
                  : colors.textSecondary
              }
              weight={bookmarked ? "fill" : "regular"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              try {
                await Share.share({
                  message: post.slug
                    ? post.slug
                    : "Check this out on Chortle",
                });
              } catch {}
            }}
            hitSlop={10}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
          >
            <ShareNetwork
              size={22}
              color={colors.textSecondary}
              weight="regular"
            />
          </TouchableOpacity>
        </View>
      </View>

      <PostActionsSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onAction={handleAction}
        colors={colors}
      />

      <CommentsSheet
        visible={commentsOpen}
        onClose={() => setCommentsOpen(false)}
        post={post}
      />

      <ReportSheet
        visible={reportOpen}
        onClose={() => setReportOpen(false)}
        postSlug={post.slug}
      />

      <ImageZoomModal
        visible={zoomOpen}
        imageUrl={imageUri}
        onClose={() => setZoomOpen(false)}
      />
    </>
  );
}

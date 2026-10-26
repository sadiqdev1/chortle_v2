
import { useRef, useState, useCallback, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import {
  X,
  PaperPlaneTilt,
  UserCircle,
  Trash,
  CaretDown,
  CaretUp,
  SealCheckIcon,
  UserIcon,
} from "phosphor-react-native";
import { router } from "expo-router";

import { Fonts, Radius } from "../constants/theme";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../context/ThemeContext";
import { useToast } from "../context/ToastContext";
import {
  useComments,
  useCreateComment,
  useDeleteComment,
} from "../hooks/useComments";
import {
  useReplies,
  useCreateReply,
  useDeleteReply,
} from "../hooks/useReplies";
import { formatRelativeDate } from "../utils/formatDate";
import { fmtCount } from "../utils/helpers";

const { height: SCREEN_H } = Dimensions.get("window");
const SNAP_HALF = SCREEN_H * 0.52;
const SNAP_FULL = SCREEN_H * 0.92;

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);

function openAuthorProfile(author) {
  if (author?.username) {
    router.push({
      pathname: "/UserProfile",
      params: { username: author.username },
    });
  }
}

/* ── Reply row ────────────────────────────────────────────── */

function ReplyRow({ reply, currentUserId, onDelete, colors }) {
  const canDelete = String(reply.user?.id) === String(currentUserId);

  return (
    <Animated.View entering={FadeInDown.duration(180)}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 8,
          paddingVertical: 7,
          paddingLeft: 46,
        }}
      >
        <TouchableOpacity
          onPress={() => openAuthorProfile(reply.user)}
          activeOpacity={0.7}
        >
          {reply.user?.avatar ? (
            <Image
              source={{ uri: reply.user.avatar }}
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                marginTop: 2,
              }}
            />
          ) : (
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                marginTop: 2,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserIcon size={20} color={colors.textMuted} />
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 12,
              paddingHorizontal: 11,
              paddingVertical: 7,
            }}
          >
            <TouchableOpacity
              onPress={() => openAuthorProfile(reply.user)}
              activeOpacity={0.7}
            >
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 12,
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {reply.user?.name ?? "Anonymous"}
              </Text>
            </TouchableOpacity>

            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 13,
                lineHeight: 18,
                color: colors.textPrimary,
              }}
            >
              {reply.body}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              marginTop: 3,
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 10,
                color: colors.textMuted,
              }}
            >
              {formatRelativeDate(reply.created_at)}
            </Text>

            {canDelete && (
              <TouchableOpacity
                onPress={() => onDelete(reply.id)}
                hitSlop={8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Trash size={10} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    fontSize: 10,
                    color: colors.textMuted,
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

/* ── Comment row with collapsible replies ─────────────────── */

function CommentRow({
  comment,
  currentUserId,
  slug,
  onReply,
  colors,
}) {
  const canDelete = String(comment.user?.id) === String(currentUserId);
  const [showReplies, setShowReplies] = useState(false);
  const replyCount = Number(comment.replies_count ?? 0);

  const {
    data: repliesData,
    isLoading: loadingReplies,
  } = useReplies(comment.id, showReplies);

  const { mutate: deleteReply } = useDeleteReply(comment.id);
  const { mutate: deleteComment } = useDeleteComment(slug);

  const replies = repliesData?.data ?? [];

  const handleReplyPress = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    onReply(comment);
  }, [comment, onReply]);

  const handleToggleReplies = useCallback(() => {
    Haptics.selectionAsync().catch(() => {});
    setShowReplies((previous) => !previous);
  }, []);

  return (
    <View style={{ paddingVertical: 9 }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "flex-start",
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => openAuthorProfile(comment.user)}
          activeOpacity={0.7}
        >
          {comment.user?.avatar ? (
            <Image
              source={{ uri: comment.user.avatar }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                marginTop: 2,
              }}
            />
          ) : (
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                marginTop: 2,
                backgroundColor: colors.surface,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <UserCircle
                size={20}
                color={colors.textMuted}
                weight="duotone"
              />
            </View>
          )}
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: 16,
              paddingHorizontal: 13,
              paddingVertical: 9,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 4,
                marginBottom: 3,
              }}
            >
              <TouchableOpacity
                onPress={() => openAuthorProfile(comment.user)}
                activeOpacity={0.7}
              >
                <Text
                  style={{
                    fontFamily: Fonts.semiBold,
                    fontSize: 13,
                    color: colors.textPrimary,
                  }}
                >
                  {comment.user?.name ?? "Anonymous"}
                </Text>
              </TouchableOpacity>

              {comment.user?.verification_status === "approved" && (
                <SealCheckIcon
                  size={15}
                  color={colors.accent}
                  weight="fill"
                />
              )}
            </View>

            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 14,
                lineHeight: 20,
                color: colors.textPrimary,
              }}
            >
              {comment.body}
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              marginTop: 5,
              paddingHorizontal: 6,
            }}
          >
            <Text
              style={{
                fontFamily: Fonts.regular,
                fontSize: 11,
                color: colors.textMuted,
              }}
            >
              {formatRelativeDate(comment.created_at)}
            </Text>

            <TouchableOpacity
              onPress={handleReplyPress}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 12,
                  color: colors.accent,
                }}
              >
                Reply
              </Text>
            </TouchableOpacity>

            {canDelete && (
              <TouchableOpacity
                onPress={() => deleteComment(comment.id)}
                hitSlop={8}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                }}
              >
                <Trash size={11} color={colors.textMuted} />
                <Text
                  style={{
                    fontFamily: Fonts.regular,
                    fontSize: 11,
                    color: colors.textMuted,
                  }}
                >
                  Delete
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {replyCount > 0 && (
            <TouchableOpacity
              onPress={handleToggleReplies}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                marginTop: 5,
                paddingHorizontal: 6,
              }}
            >
              <View
                style={{
                  width: 20,
                  height: 1,
                  backgroundColor: colors.border,
                }}
              />

              {showReplies ? (
                <CaretUp
                  size={11}
                  color={colors.accent}
                  weight="bold"
                />
              ) : (
                <CaretDown
                  size={11}
                  color={colors.accent}
                  weight="bold"
                />
              )}

              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 12,
                  color: colors.accent,
                }}
              >
                {showReplies ? "Hide" : "View"} {replyCount}{" "}
                {replyCount === 1 ? "reply" : "replies"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showReplies && (
        <View style={{ marginTop: 3 }}>
          {loadingReplies ? (
            <ActivityIndicator
              size="small"
              color={colors.accent}
              style={{ marginLeft: 44, marginTop: 6 }}
            />
          ) : (
            replies.map((reply) => (
              <ReplyRow
                key={reply.id}
                reply={reply}
                currentUserId={currentUserId}
                onDelete={(id) => deleteReply(id)}
                colors={colors}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

/* ── Comments bottom sheet ────────────────────────────────── */

export default function CommentsSheet({ visible, onClose, post }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { toast } = useToast();

  const slug = post?.slug;

  const inputRef = useRef(null);
  const [draft, setDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [sheetHeight, setSheetHeight] = useState(SNAP_HALF);

  const translateY = useSharedValue(SCREEN_H);
  const startY = useSharedValue(0);

  useEffect(() => {
    translateY.value = visible
      ? withTiming(0, { duration: 280 })
      : withTiming(SCREEN_H, { duration: 250 });
  }, [visible, translateY]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleClose = useCallback(() => {
    translateY.value = withTiming(SCREEN_H, { duration: 220 });
    onClose?.();
  }, [onClose, translateY]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      const expandedOffset = -(SNAP_FULL - SNAP_HALF);
      const nextY = startY.value + event.translationY;

      translateY.value = Math.max(
        expandedOffset,
        Math.min(SCREEN_H, nextY)
      );
    })
    .onEnd((event) => {
      const expandedOffset = -(SNAP_FULL - SNAP_HALF);

      if (event.translationY > 120 || event.velocityY > 600) {
        translateY.value = withTiming(SCREEN_H, { duration: 250 });
        runOnJS(onClose)();
      } else if (
        event.translationY < -80 ||
        event.velocityY < -400
      ) {
        translateY.value = withSpring(expandedOffset, {
          damping: 20,
          stiffness: 260,
        });
        runOnJS(setSheetHeight)(SNAP_FULL);
      } else {
        const shouldStayExpanded =
          startY.value <= expandedOffset / 2;

        const targetY = shouldStayExpanded ? expandedOffset : 0;
        const targetHeight = shouldStayExpanded ? SNAP_FULL : SNAP_HALF;

        translateY.value = withSpring(targetY, {
          damping: 20,
          stiffness: 260,
        });
        runOnJS(setSheetHeight)(targetHeight);
      }
    });

  const {
    data: commentsData,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useComments(visible ? slug : null);

  const {
    mutate: submitComment,
    isPending: submitting,
  } = useCreateComment(slug);

  const {
    mutate: submitReply,
    isPending: submittingReply,
  } = useCreateReply(slug);

  const allComments = (commentsData?.pages ?? []).flatMap(
    (page) => page?.data ?? []
  );

  const totalCount =
    commentsData?.pages?.[0]?.meta?.total ?? allComments.length;

  const handleReply = useCallback((comment) => {
    setReplyingTo({
      id: comment.id,
      name: comment.user?.name ?? "someone",
    });

    setDraft(
      `@${comment.user?.username ?? comment.user?.name ?? "user"} `
    );

    inputRef.current?.focus();
  }, []);

  const handleSubmit = useCallback(() => {
    const body = draft.trim();

    if (!body || submitting || submittingReply) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => {}
    );

    if (replyingTo) {
      submitReply(
        {
          body,
          parentId: replyingTo.id,
        },
        {
          onSuccess: () => {
            setDraft("");
            setReplyingTo(null);
          },
          onError: () => toast.error("Couldn't post reply."),
        }
      );
    } else {
      submitComment(
        { body },
        {
          onSuccess: () => setDraft(""),
          onError: () => toast.error("Couldn't post comment."),
        }
      );
    }
  }, [
    draft,
    submitting,
    submittingReply,
    replyingTo,
    submitReply,
    submitComment,
    toast,
  ]);

  const handleBackdropPress = useCallback(() => {
    handleClose();
  }, [handleClose]);

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackdropPress}
          style={{
            ...Dimensions.get("window"),
            position: "absolute",
            top: 0,
            left: 0,
            backgroundColor: "rgba(0,0,0,0.45)",
          }}
        />

        {/* Bottom sheet panel */}
        <Animated.View
          style={[
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: sheetHeight,
              backgroundColor: colors.bg,
              borderTopLeftRadius: Radius.xxl,
              borderTopRightRadius: Radius.xxl,
              overflow: "hidden",
            },
            sheetStyle,
          ]}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            {/* Drag handle */}
            <GestureDetector gesture={panGesture}>
              <View
                style={{
                  paddingTop: 12,
                  paddingBottom: 4,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 4,
                    borderRadius: 2,
                    backgroundColor: colors.border,
                  }}
                />
              </View>
            </GestureDetector>

            {/* Header */}
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingBottom: 12,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: Fonts.friendly,
                  fontSize: 17,
                  color: colors.textPrimary,
                  flex: 1,
                }}
              >
                Comments
                {totalCount > 0 ? `  ${fmtCount(totalCount)}` : ""}
              </Text>

              <TouchableOpacity
                onPress={handleClose}
                hitSlop={10}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: colors.bgCard,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X
                  size={16}
                  color={colors.textMuted}
                  weight="bold"
                />
              </TouchableOpacity>
            </View>

            {/* Comments list */}
            {isLoading ? (
              <View
                style={{
                  flex: 1,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : (
              <FlatList
                data={allComments}
                keyExtractor={(comment) => String(comment.id)}
                contentContainerStyle={{
                  paddingHorizontal: 16,
                  paddingTop: 4,
                  paddingBottom: 16,
                  flexGrow: 1,
                }}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
                onEndReached={() => {
                  if (hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                  }
                }}
                onEndReachedThreshold={0.4}
                ListFooterComponent={
                  isFetchingNextPage ? (
                    <ActivityIndicator
                      color={colors.accent}
                      style={{ marginVertical: 10 }}
                    />
                  ) : null
                }
                ListEmptyComponent={
                  <View
                    style={{
                      alignItems: "center",
                      paddingTop: 60,
                      paddingHorizontal: 32,
                    }}
                  >
                    <Text style={{ fontSize: 38, marginBottom: 12 }}>
                      💬
                    </Text>

                    <Text
                      style={{
                        fontFamily: Fonts.friendly,
                        fontSize: 17,
                        color: colors.textPrimary,
                        marginBottom: 4,
                        textAlign: "center",
                      }}
                    >
                      No comments yet
                    </Text>

                    <Text
                      style={{
                        fontFamily: Fonts.regular,
                        fontSize: 14,
                        lineHeight: 20,
                        color: colors.textSecondary,
                        textAlign: "center",
                      }}
                    >
                      Be the first to say something.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <CommentRow
                    comment={item}
                    currentUserId={user?.id}
                    slug={slug}
                    onReply={handleReply}
                    colors={colors}
                  />
                )}
              />
            )}

            {/* Reply banner */}
            {replyingTo && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: colors.accentSoft,
                  borderTopWidth: 1,
                  borderTopColor: colors.accentDim,
                }}
              >
                <Text
                  style={{
                    fontFamily: Fonts.medium,
                    fontSize: 13,
                    color: colors.accent,
                  }}
                >
                  Replying to {replyingTo.name}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    setReplyingTo(null);
                    setDraft("");
                  }}
                  hitSlop={10}
                >
                  <X
                    size={15}
                    color={colors.accent}
                    weight="bold"
                  />
                </TouchableOpacity>
              </View>
            )}

            {/* Compose bar */}
            {user && (
              <SafeAreaView
                edges={["bottom"]}
                style={{ backgroundColor: colors.bg }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "flex-end",
                    gap: 10,
                    paddingHorizontal: 12,
                    paddingTop: 10,
                    paddingBottom: 10,
                    borderTopWidth: replyingTo ? 0 : 1,
                    borderTopColor: colors.border,
                  }}
                >
                  {user.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                      }}
                    />
                  ) : (
                    <View
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: 17,
                        backgroundColor: colors.bgCard,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <UserIcon
                        size={20}
                        color={colors.textMuted}
                      />
                    </View>
                  )}

                  <TextInput
                    ref={inputRef}
                    value={draft}
                    onChangeText={setDraft}
                    placeholder={
                      replyingTo
                        ? `Reply to ${replyingTo.name}…`
                        : "Add a comment…"
                    }
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={2000}
                    style={{
                      flex: 1,
                      fontFamily: Fonts.regular,
                      fontSize: 14,
                      lineHeight: 20,
                      color: colors.textPrimary,
                      paddingVertical: 9,
                      paddingHorizontal: 14,
                      backgroundColor: colors.bgCard,
                      borderRadius: 20,
                      maxHeight: 100,
                    }}
                  />

                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={
                      !draft.trim() || submitting || submittingReply
                    }
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 19,
                      backgroundColor:
                        draft.trim() && !submitting && !submittingReply
                          ? colors.accent
                          : colors.bgCard,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {submitting || submittingReply ? (
                      <ActivityIndicator
                        size="small"
                        color="#fff"
                      />
                    ) : (
                      <PaperPlaneTilt
                        size={17}
                        color={draft.trim() ? "#fff" : colors.textMuted}
                        weight="fill"
                      />
                    )}
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            )}
          </KeyboardAvoidingView>
        </Animated.View>
      </View>
    </Modal>
  );
}

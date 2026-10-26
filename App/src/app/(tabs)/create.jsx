import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image as PhosphorImage, X, ArrowLeft, CheckCircle } from "phosphor-react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import AuthInput from "../../components/AuthInput";
import { CATEGORIES, Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useCreatePost } from "../../hooks/usePosts";
import { uploadFile } from "../../services/uploadService";
import { normalizeError } from "../../utils/helpers";

// Map frontend category IDs to the backend enum values
const CATEGORY_MAP = {
  trending:     "Trending",
  wholesome:    "Wholesome",
  gaming:       "Gaming",
  relatable:    "Relatable",
  funny:        "Funny",
  tech:         "Coding",
};

export default function CreateScreen() {
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [tag, setTag] = useState("");
  const [errors, setErrors] = useState({});
  const [uploadProgress, setUploadProgress] = useState(null); // null | "uploading" | "done"

  const { mutateAsync: createPost, isPending: publishing } = useCreatePost();

  // Publish button scale spring
  const publishScale = useSharedValue(1);
  const publishStyle = useAnimatedStyle(() => ({
    transform: [{ scale: publishScale.value }],
  }));

  function validate() {
    const next = {};
    if (!media) next.media = "Add an image or GIF to continue.";
    if (!tag) next.tag = "Pick a category for your meme.";
    setErrors(next);
    if (Object.keys(next).length > 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
    return Object.keys(next).length === 0;
  }

  async function handlePickMedia() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      toast.warn("Allow photo access to post a meme.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.85,
    });
    if (!result.canceled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setMedia(result.assets[0].uri);
      setErrors((e) => ({ ...e, media: undefined }));
    }
  }

  async function handlePublish() {
    if (!validate()) return;

    publishScale.value = withSpring(0.94, { damping: 10 }, () => {
      publishScale.value = withSpring(1, { damping: 8 });
    });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      setUploadProgress("uploading");
      const imageUrl = await uploadFile(media, "meme");
      setUploadProgress("done");

      const backendCategory = CATEGORY_MAP[tag] ?? "Funny";
      const post = await createPost({
        caption: caption.trim() || null,
        category: backendCategory,
        image_url: imageUrl,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success("Meme posted! 🔥");

      const slug = post?.data?.slug ?? post?.slug;
      setTimeout(() => {
        if (slug) {
          router.replace({ pathname: "/PostView", params: { slug } });
        } else {
          router.replace("/(tabs)");
        }
      }, 400);
    } catch (e) {
      setUploadProgress(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(normalizeError(e));
    }
  }

  const tags = CATEGORIES.filter((c) => c.id !== "all");
  const isWorking = publishing || uploadProgress === "uploading";

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
        {/* ── Header ────────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.bgCard,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>

          <Text
            style={{
              fontFamily: Fonts.friendly,
              fontSize: 20,
              letterSpacing: -0.1,
              color: colors.textPrimary,
            }}
          >
            New Meme
          </Text>

          <Animated.View style={publishStyle}>
            <TouchableOpacity
              onPress={handlePublish}
              disabled={isWorking}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Publish meme"
              style={{
                height: 38,
                paddingHorizontal: 20,
                borderRadius: Radius.full,
                backgroundColor: isWorking ? colors.accentDim : colors.accent,
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "row",
                gap: 6,
              }}
            >
              {isWorking ? (
                <ActivityIndicator size={14} color="#fff" />
              ) : (
                <>
                  <Text
                    style={{
                      fontFamily: Fonts.semiBold,
                      fontSize: 14,
                      color: "#fff",
                      letterSpacing: 0.2,
                    }}
                  >
                    Upload
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* ── Upload progress strip ─────────────────────── */}
        {uploadProgress === "uploading" && (
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: colors.accentSoft,
            }}
          >
            <ActivityIndicator size={14} color={colors.accent} />
            <Text
              style={{
                fontFamily: Fonts.medium,
                fontSize: 13,
                color: colors.accent,
              }}
            >
              Uploading your meme…
            </Text>
          </View>
        )}

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={{
              paddingHorizontal: 24,
              paddingTop: 24,
              paddingBottom: 48,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* ── Media picker ────────────────────────── */}
            <TouchableOpacity
              onPress={handlePickMedia}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Pick an image"
              style={{
                height: 260,
                borderRadius: Radius.xl,
                backgroundColor: colors.bgCard,
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                marginBottom: 8,
                borderWidth: 1.5,
                borderColor: errors.media ? colors.error : colors.border,
                borderStyle: media ? "solid" : "dashed",
              }}
            >
              {media ? (
                <>
                  <Image
                    source={{ uri: media }}
                    style={{ width: "100%", height: "100%" }}
                    resizeMode="contain"
                  />
                  {/* Change overlay */}
                  <View
                    style={{
                      position: "absolute",
                      bottom: 12,
                      right: 12,
                      backgroundColor: "rgba(0,0,0,0.55)",
                      borderRadius: Radius.full,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <PhosphorImage size={14} color="#fff" weight="bold" />
                    <Text
                      style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: 12,
                        color: "#fff",
                      }}
                    >
                      Change
                    </Text>
                  </View>
                </>
              ) : (
                <View style={{ alignItems: "center", gap: 12 }}>
                  <View
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      backgroundColor: colors.accentSoft,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <PhosphorImage size={26} color={colors.accent} weight="duotone" />
                  </View>
                  <Text
                    style={{
                      fontFamily: Fonts.friendly,
                      fontSize: 16,
                      color: colors.textPrimary,
                    }}
                  >
                    Add an image or GIF
                  </Text>
                  <Text
                    style={{
                      fontFamily: Fonts.regular,
                      fontSize: 13,
                      color: colors.textMuted,
                    }}
                  >
                    Tap to choose from your library
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {errors.media ? (
              <Text
                style={{
                  marginBottom: 16,
                  fontFamily: Fonts.regular,
                  fontSize: 13,
                  color: colors.error,
                }}
              >
                {errors.media}
              </Text>
            ) : (
              <View style={{ marginBottom: 20 }} />
            )}

            {/* ── Caption ─────────────────────────────── */}
            <View style={{ marginBottom: 18 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.textMuted }}>
                  Caption
                </Text>
                <Text style={{
                  fontFamily: Fonts.regular,
                  fontSize: 11,
                  color: caption.length > 450 ? colors.error : caption.length > 350 ? colors.warning : colors.textMuted,
                }}>
                  {caption.length}/500
                </Text>
              </View>
              <AuthInput
                value={caption}
                onChangeText={setCaption}
                multiline
                helper="Optional — keep it spicy 🌶️"
                placeholder="Add a caption…"
              />
            </View>

            {/* ── Category ────────────────────────────── */}
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 11,
                letterSpacing: 1.4,
                textTransform: "uppercase",
                color: colors.textMuted,
                marginBottom: 12,
                marginTop: 4,
              }}
            >
              Category
            </Text>

            {errors.tag ? (
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 13,
                  color: colors.error,
                  marginBottom: 10,
                }}
              >
                {errors.tag}
              </Text>
            ) : null}

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
              {tags.map((t) => {
                const active = tag === t.id;
                return (
                  <TouchableOpacity
                    key={t.id}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setTag(t.id);
                      setErrors((e) => ({ ...e, tag: undefined }));
                    }}
                    activeOpacity={0.7}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    style={{
                      paddingVertical: 9,
                      paddingHorizontal: 16,
                      borderRadius: Radius.full,
                      borderWidth: 1.5,
                      borderColor: active ? colors.accent : colors.border,
                      backgroundColor: active ? colors.accent : colors.bgCard,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: Fonts.semiBold,
                        fontSize: 13,
                        letterSpacing: 0.1,
                        color: active ? "#fff" : colors.textSecondary,
                      }}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

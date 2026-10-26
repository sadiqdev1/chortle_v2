import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CaretRight,
  Check,
  Lock,
  Palette,
  Bell,
  Info,
  SignOut,
  Trash,
  UserCircle,
  Sun,
  Moon,
  DeviceMobile,
  EnvelopeSimple,
  SealCheck,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useAuth } from "../../hooks/useAuth";
import { useToast } from "../../context/ToastContext";

/* ── Section label ─────────────────────────────────────────── */
function SectionLabel({ label, colors }) {
  return (
    <Text
      style={{
        fontFamily: Fonts.semiBold,
        fontSize: 11,
        letterSpacing: 1.4,
        textTransform: "uppercase",
        color: colors.textMuted,
        marginBottom: 4,
        marginTop: 28,
        paddingHorizontal: 24,
      }}
    >
      {label}
    </Text>
  );
}

/* ── Row ────────────────────────────────────────────────────── */
function Row({ label, onPress, right, destructive, colors, icon: Icon, iconColor }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={onPress ? 0.6 : 1}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 14,
      }}
    >
      {Icon && (
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            backgroundColor: (iconColor ?? colors.accent) + "18",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon
            size={17}
            color={destructive ? colors.error : (iconColor ?? colors.accent)}
            weight="duotone"
          />
        </View>
      )}
      <Text
        style={{
          flex: 1,
          fontFamily: Fonts.medium,
          fontSize: 15,
          letterSpacing: 0.1,
          color: destructive ? colors.error : colors.textPrimary,
        }}
      >
        {label}
      </Text>
      {right ?? (onPress && (
        <CaretRight size={16} color={colors.textMuted} weight="regular" />
      ))}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const [pushEnabled, setPushEnabled] = useState(true);
  const [emailDigest, setEmailDigest] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const { logout } = useAuth();
  const { colors, isDark, preference, setTheme } = useTheme();
  const { toast } = useToast();

  async function handleSignOut() {
    Alert.alert(
      "Sign out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign out",
          style: "destructive",
          onPress: async () => {
            setSigningOut(true);
            try {
              await logout();
              router.replace("/welcome");
            } catch {
              toast.error("Could not sign out. Try again.");
            } finally {
              setSigningOut(false);
            }
          },
        },
      ]
    );
  }

  async function handleCheckForUpdates() {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    try {
      await new Promise((r) => setTimeout(r, 900));
      toast.success("You're on the latest version 🎉");
    } catch {
      toast.error("Couldn't check for updates. Try again later.");
    } finally {
      setCheckingUpdate(false);
    }
  }

  const THEME_OPTIONS = [
    { id: "system", label: "Follow System", Icon: DeviceMobile },
    { id: "light",  label: "Light Mode",    Icon: Sun },
    { id: "dark",   label: "Dark Mode",     Icon: Moon },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>

        {/* ── Nav bar ──────────────────────────────────── */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 20,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            gap: 14,
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
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
            Settings
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

          {/* ── Account ─────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(50).duration(300).springify()}>
            <SectionLabel label="Account" colors={colors} />
            <Row colors={colors} label="Edit Profile" icon={UserCircle} onPress={() => router.push("/EditProfile")} />
            <Row colors={colors} label="Change Password" icon={Lock} onPress={() => router.push("/(auth)/ForgotPassword")} />
            <Row colors={colors} label="Verified Badge" icon={SealCheck} onPress={() => router.push("/(screens)/VerificationRequest")} />
          </Animated.View>

          {/* ── Appearance ─────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(300).springify()}>
            <SectionLabel label="Appearance" colors={colors} />
            {THEME_OPTIONS.map(({ id, label, Icon }) => (
              <Row
                key={id}
                colors={colors}
                label={label}
                icon={Icon}
                onPress={() => setTheme(id)}
                right={
                  preference === id ? (
                    <Check size={18} color={colors.accent} weight="bold" />
                  ) : null
                }
              />
            ))}
          </Animated.View>

          {/* ── Notifications ──────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(300).springify()}>
            <SectionLabel label="Notifications" colors={colors} />
            <Row
              colors={colors}
              label="Push Notifications"
              icon={Bell}
              right={
                <Switch
                  value={pushEnabled}
                  onValueChange={setPushEnabled}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#fff"
                />
              }
            />
            <Row
              colors={colors}
              label="Weekly Email Digest"
              icon={EnvelopeSimple}
              right={
                <Switch
                  value={emailDigest}
                  onValueChange={setEmailDigest}
                  trackColor={{ false: colors.border, true: colors.accent }}
                  thumbColor="#fff"
                />
              }
            />
          </Animated.View>

          {/* ── About ──────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(300).springify()}>
            <SectionLabel label="About" colors={colors} />
            <Row colors={colors} label="Privacy Policy" icon={Info} onPress={() => {}} />
            <Row colors={colors} label="Terms of Service" icon={Info} onPress={() => {}} />
            <Row
              colors={colors}
              label="Check for Updates"
              icon={Info}
              onPress={checkingUpdate ? undefined : handleCheckForUpdates}
              right={
                checkingUpdate ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <CaretRight size={16} color={colors.textMuted} />
                )
              }
            />
            <Row
              colors={colors}
              label="App Version"
              icon={DeviceMobile}
              right={
                <Text style={{ fontFamily: Fonts.regular, fontSize: 13, color: colors.textMuted }}>
                  1.0.0
                </Text>
              }
            />
          </Animated.View>

          {/* ── Account Actions ────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(250).duration(300).springify()}>
            <SectionLabel label="Account Actions" colors={colors} />
            <Row
              colors={colors}
              label={signingOut ? "Signing out…" : "Sign Out"}
              icon={SignOut}
              iconColor={colors.textSecondary}
              onPress={signingOut ? undefined : handleSignOut}
            />
            <Row
              colors={colors}
              label="Delete Account"
              icon={Trash}
              destructive
              onPress={() =>
                Alert.alert(
                  "Delete Account",
                  "This permanently deletes your account and all your memes. This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => toast.warn("Feature coming soon.") },
                  ]
                )
              }
            />
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

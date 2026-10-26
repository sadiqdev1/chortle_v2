import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";
import AppButton from "../../components/AppButton";
import AuthInput from "../../components/AuthInput";
import { Fonts, Typography } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { forgotPassword } from "../../services/authService";

export default function ForgotPasswordScreen() {
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSend() {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) return setError("Enter your email address.");
    if (!/^\S+@\S+\.\S+$/.test(trimmed))
      return setError("That doesn't look like a valid email.");

    setError("");
    setSubmitting(true);

    try {
      await forgotPassword(trimmed);
    } catch (e) {
      if (e?.isNetworkError) {
        toast.offline("No internet connection.");
        setSubmitting(false);
        return;
      }
      const status = e?.response?.status;
      if (status === 422) {
        setError(e.response.data?.message || "Something went wrong. Try again.");
        setSubmitting(false);
        return;
      }
      // Any other error — still navigate (don't leak user existence)
    } finally {
      setSubmitting(false);
    }

    router.replace({
      pathname: "/(auth)/OtpVerification",
      params: { email: trimmed, mode: "reset" },
    });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 8, paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
          >
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={10}
              style={{
                width: 40, height: 40, borderRadius: 20,
                backgroundColor: colors.bgCard, borderWidth: 1,
                borderColor: colors.border, alignItems: "center",
                justifyContent: "center", marginBottom: 32,
              }}
            >
              <ArrowLeft size={20} color={colors.textPrimary} weight="bold" />
            </TouchableOpacity>

            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: Fonts.friendly, fontSize: 28, lineHeight: 34, letterSpacing: -0.2, color: colors.textPrimary, marginBottom: 8 }}>
                Reset password
              </Text>
              <Text style={[Typography.body, { color: colors.textSecondary, marginBottom: 32, lineHeight: 24 }]}>
                Enter your email and we'll send a 6-digit code to reset it.
              </Text>

              <AuthInput
                label="Email"
                value={email}
                onChangeText={(t) => { setEmail(t); setError(""); }}
                keyboardType="email-address"
                autoCapitalize="none"
                error={error}
                placeholder="Enter your email address"
                leftIcon="mail-outline"
              />

              <AppButton label="Send Reset Code" onPress={handleSend} loading={submitting} style={{ marginTop: 8 }} />
            </View>

            <View style={{ flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 28 }}>
              <Text style={{ color: colors.textSecondary, fontFamily: Fonts.regular, fontSize: 15 }}>
                Remember your password?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.replace("/(auth)/Login")} hitSlop={10}>
                <Text style={{ fontFamily: Fonts.friendly, fontSize: 15, color: colors.accent }}>Log in</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

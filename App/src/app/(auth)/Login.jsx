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
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "phosphor-react-native";

import AuthInput from "../../components/AuthInput";
import OAuthButtons from "../../components/OAuthButtons";
import { logoIcon } from "../../constants/data";
import { Fonts, Radius, Typography } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";

export default function LoginScreen() {
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();

  function validate() {
    const next = {};
    const trimmedEmail = email.trim();
    if (!trimmedEmail) next.email = "Enter your email address.";
    else if (!/^\S+@\S+\.\S+$/.test(trimmedEmail))
      next.email = "That doesn't look like a valid email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setSubmitting(true);
    setErrors({});
    try {
      await login({ email: email.trim().toLowerCase(), password });
      router.replace("/(tabs)");
    } catch (error) {
      if (error?.isNetworkError) {
        toast.offline("No internet connection. Check your network and try again.");
        return;
      }
      const responseData = error.response?.data;
      const backendErrors = responseData?.errors;
      if (backendErrors) {
        setErrors({
          email: backendErrors.email?.[0],
          password: backendErrors.password?.[0],
          form: responseData?.message,
        });
      } else {
        setErrors({
          form: responseData?.message || "Something went wrong. Please try again.",
        });
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleGoogle() {
    toast.info("Google sign-in coming soon.");
  }
  function handleApple() {
    toast.info("Apple sign-in coming soon.");
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>
          <ScrollView
            contentContainerStyle={{
              flexGrow: 1,
              paddingHorizontal: 24,
              paddingTop: 8,
              paddingBottom: 24,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Nav row */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 36,
              }}
            >
              <TouchableOpacity
                onPress={() => router.back()}
                hitSlop={10}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.bgCard,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <ArrowLeft size={20} color={colors.textPrimary} weight="bold" />
              </TouchableOpacity>

              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: colors.accentSoft,
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                <Image
                  source={logoIcon}
                  style={{ width: 28, height: 28 }}
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Heading — Fredoka */}
            <Text
              style={{
                fontFamily: Fonts.friendly,
                fontSize: 28,
                lineHeight: 34,
                letterSpacing: -0.2,
                color: colors.textPrimary,
                marginBottom: 8,
              }}
            >
              Welcome back
            </Text>
            <Text
              style={[
                Typography.body,
                { color: colors.textSecondary, marginBottom: 36 },
              ]}
            >
              Sign in to keep the memes coming.
            </Text>

            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              leftIcon="mail-outline"
              placeholder="johndoe@gmail.com"
            />

            <AuthInput
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              error={errors.password}
              placeholder="Enter your password"
              leftIcon="lock-closed-outline"
              rightIcon={showPassword ? "eye-off-outline" : "eye-outline"}
              onRightIconPress={() => setShowPassword((c) => !c)}
            />

            {errors.form ? (
              <Text
                style={[
                  Typography.small,
                  { color: colors.error, marginBottom: 12 },
                ]}
              >
                {errors.form}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={() => router.replace("/(auth)/ForgotPassword")}
              style={{ alignSelf: "flex-end", marginBottom: 28 }}
              hitSlop={8}
            >
              <Text
                style={{
                  fontFamily: Fonts.semiBold,
                  fontSize: 13,
                  color: colors.accent,
                }}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* Primary button — Fredoka */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={submitting}
              activeOpacity={0.85}
              style={{
                height: 56,
                borderRadius: Radius.full,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 28,
              }}
            >
              {submitting ? (
                <ActivityIndicator size={24} color={colors.textInverse} />
              ) : (
                <Text
                  style={{
                    fontFamily: Fonts.friendly,
                    fontSize: 16,
                    letterSpacing: 0.3,
                    color: colors.textInverse,
                  }}
                >
                  Log in
                </Text>
              )}
            </TouchableOpacity>

            <OAuthButtons onGoogle={handleGoogle} onApple={handleApple} showDivider />

            <View style={{ flex: 1 }} />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "center",
                paddingTop: 20,
              }}
            >
              <Text style={[Typography.body, { color: colors.textSecondary }]}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.replace("/(auth)/Register")}
                hitSlop={8}
              >
                <Text
                  style={{
                    fontFamily: Fonts.friendly,
                    fontSize: 15,
                    color: colors.accent,
                  }}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
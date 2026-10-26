/**
 * VerificationRequest — verified badge request screen.
 *
 * Shows current status, lets users submit a request with a reason,
 * and lets them cancel a pending request.
 */
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  SealCheck,
  XCircle,
  WarningCircle,
} from "phosphor-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Fonts, Radius } from "../../constants/theme";
import { useTheme } from "../../context/ThemeContext";
import { useToast } from "../../context/ToastContext";
import { useAuth } from "../../hooks/useAuth";
import api from "../../lib/api";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

async function getVerificationStatus() {
  const r = await api.get("/verification/status");
  return r.data;
}
async function submitRequest(reason) {
  const r = await api.post("/verification/request", { reason });
  return r.data;
}
async function cancelRequest() {
  const r = await api.post("/verification/cancel");
  return r.data;
}

const STATUS_CONFIG = {
  none: {
    Icon: SealCheck, iconColor: "#A5A399", bg: null,
    title: "Get Verified",
    description: "A verified badge shows your followers this is your authentic account.",
  },
  pending: {
    Icon: Clock, iconColor: "#8A6D1B", bg: "#FBF1D4",
    title: "Request Pending",
    description: "Your request is under review. We'll notify you of the outcome.",
  },
  approved: {
    Icon: CheckCircle, iconColor: "#2F6B4F", bg: "#E8F5EE",
    title: "You're Verified!",
    description: "Your account has the blue verified badge.",
  },
  rejected: {
    Icon: XCircle, iconColor: "#E5484D", bg: "#FFE8E8",
    title: "Request Declined",
    description: "Your request wasn't approved this time. You can reapply.",
  },
};

export default function VerificationRequestScreen() {
  const { colors, isDark } = useTheme();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reason, setReason] = useState("");

  const { data: statusData, isLoading } = useQuery({
    queryKey: ["verification-status"],
    queryFn: getVerificationStatus,
  });

  const { mutate: submit, isPending: submitting } = useMutation({
    mutationFn: () => submitRequest(reason.trim()),
    onSuccess: () => {
      toast.success("Request submitted! We'll review it soon.");
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
      setReason("");
    },
    onError: (e) => toast.error(e?.response?.data?.message ?? "Couldn't submit. Try again."),
  });

  const { mutate: cancel, isPending: cancelling } = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      toast.info("Request cancelled.");
      queryClient.invalidateQueries({ queryKey: ["verification-status"] });
    },
    onError: () => toast.error("Couldn't cancel. Try again."),
  });

  const currentStatus = user?.verification_status == "approved"
    ? "approved"
    : (() => {
        const vs = statusData?.verification_status ?? user?.verification_status ?? "none";
        if (vs === "pending")  return "pending";
        if (vs === "rejected" || vs === "declined") return "rejected";
        return "none";
      })();

  const config = STATUS_CONFIG[currentStatus] ?? STATUS_CONFIG.none;
  const { Icon, iconColor, bg, title, description } = config;

  const canSubmit = !["pending", "approved"].includes(currentStatus);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.bg} />
      <SafeAreaView style={{ flex: 1 }} edges={["top", "bottom"]}>

        {/* Header */}
        <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 14 }}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={12}
            style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.bgCard, alignItems: "center", justifyContent: "center" }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} weight="bold" />
          </TouchableOpacity>
          <Text style={{ fontFamily: Fonts.friendly, fontSize: 20, letterSpacing: -0.1, color: colors.textPrimary }}>
            Verification
          </Text>
        </View>

        {isLoading ? (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

            {/* Status card */}
            <Animated.View
              entering={FadeInDown.duration(350).springify()}
              style={{
                borderRadius: Radius.xl,
                backgroundColor: bg ?? colors.bgCard,
                borderWidth: 1,
                borderColor: bg ? iconColor + "33" : colors.border,
                padding: 24,
                alignItems: "center",
                marginBottom: 32,
              }}
            >
              <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: bg ?? colors.bg, alignItems: "center", justifyContent: "center", marginBottom: 16, borderWidth: bg ? 0 : 1, borderColor: colors.border }}>
                <Icon size={32} color={iconColor} weight="duotone" />
              </View>
              <Text style={{ fontFamily: Fonts.friendly, fontSize: 22, color: colors.textPrimary, marginBottom: 8, textAlign: "center" }}>
                {title}
              </Text>
              <Text style={{ fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary, textAlign: "center" }}>
                {description}
              </Text>
            </Animated.View>

            {/* Requirements */}
            {canSubmit && (
              <Animated.View entering={FadeInDown.delay(100).duration(350).springify()}>
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.textMuted, marginBottom: 14 }}>
                  Requirements
                </Text>
                {[
                  "Notable or well-known account",
                  "Authentic — represents a real person or brand",
                  "Complete profile with bio and avatar",
                  "Active in the last 30 days",
                ].map((req, i) => (
                  <View key={i} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 }}>
                    <CheckCircle size={18} color={colors.accent} weight="duotone" style={{ marginTop: 1 }} />
                    <Text style={{ fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22, color: colors.textSecondary, flex: 1 }}>
                      {req}
                    </Text>
                  </View>
                ))}

                {/* Reason field */}
                <Text style={{ fontFamily: Fonts.semiBold, fontSize: 11, letterSpacing: 1.4, textTransform: "uppercase", color: colors.textMuted, marginTop: 24, marginBottom: 10 }}>
                  Why should you be verified?
                </Text>
                <View style={{
                  borderRadius: Radius.lg,
                  borderWidth: 1.5,
                  borderColor: reason.length > 0 ? colors.accent : colors.border,
                  backgroundColor: colors.bgInput,
                  marginBottom: 8,
                }}>
                  <TextInput
                    value={reason}
                    onChangeText={setReason}
                    placeholder="Tell us about your account and why it should be verified…"
                    placeholderTextColor={colors.textMuted}
                    multiline
                    maxLength={500}
                    style={{
                      fontFamily: Fonts.regular, fontSize: 14, lineHeight: 22,
                      color: colors.textPrimary, padding: 14, minHeight: 120,
                      textAlignVertical: "top",
                    }}
                  />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginBottom: 24 }}>
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: reason.length > 450 ? colors.error : colors.textMuted }}>
                    {reason.length}/500
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={() => submit()}
                  disabled={submitting || reason.trim().length < 20}
                  activeOpacity={0.85}
                  style={{
                    height: 54, borderRadius: Radius.full,
                    backgroundColor: reason.trim().length >= 20 ? colors.accent : colors.bgCard,
                    alignItems: "center", justifyContent: "center",
                  }}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={{ fontFamily: Fonts.friendly, fontSize: 16, color: reason.trim().length >= 20 ? "#fff" : colors.textMuted }}>
                      Submit Request
                    </Text>
                  )}
                </TouchableOpacity>
                {reason.trim().length < 20 && reason.length > 0 && (
                  <Text style={{ fontFamily: Fonts.regular, fontSize: 12, color: colors.textMuted, textAlign: "center", marginTop: 8 }}>
                    Add a few more words ({20 - reason.trim().length} more needed)
                  </Text>
                )}
              </Animated.View>
            )}

            {/* Cancel pending request */}
            {currentStatus === "pending" && (
              <Animated.View entering={FadeInDown.delay(150).duration(350).springify()}>
                <TouchableOpacity
                  onPress={() => cancel()}
                  disabled={cancelling}
                  activeOpacity={0.7}
                  style={{
                    height: 50, borderRadius: Radius.full, borderWidth: 1.5,
                    borderColor: colors.error, alignItems: "center", justifyContent: "center",
                    marginTop: 16,
                  }}
                >
                  {cancelling ? (
                    <ActivityIndicator size="small" color={colors.error} />
                  ) : (
                    <Text style={{ fontFamily: Fonts.semiBold, fontSize: 15, color: colors.error }}>
                      Cancel Request
                    </Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

import * as Haptics from "expo-haptics";
import { ActivityIndicator, Text, TouchableOpacity } from "react-native";
import { Fonts, Radius } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function AppButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  style,
  textStyle,
}) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;
  const isSecondary = variant === "secondary";

  function handlePress() {
    if (isDisabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress?.();
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={loading}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          width: "100%",
          minHeight: 56,
          paddingHorizontal: 24,
          borderRadius: Radius.full,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isSecondary ? colors.bgElevated : colors.accent,
          borderWidth: isSecondary ? 1.5 : 0,
          borderColor: colors.border,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isSecondary ? colors.textPrimary : colors.textInverse}
        />
      ) : (
        <Text
          style={[
            {
              fontFamily: Fonts.friendly,
              fontSize: 16,
              letterSpacing: 0.3,
              color: isSecondary ? colors.textPrimary : colors.textInverse,
            },
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

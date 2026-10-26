/**
 * AuthInput — reusable animated text input for auth and settings forms.
 *
 * Uses Phosphor icons exclusively. Animated border on focus.
 */
import {
  Eye,
  EyeSlash,
  EnvelopeSimple,
  Lock,
  User,
  Phone,
  MagnifyingGlass,
  At,
} from "phosphor-react-native";
import { Text, TextInput, TouchableOpacity, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { Fonts, Radius } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

// Map Ionicons names (legacy) → Phosphor components
const ICON_MAP = {
  "mail-outline":        EnvelopeSimple,
  "lock-closed-outline": Lock,
  "person-outline":      User,
  "phone-portrait-outline": Phone,
  "search-outline":      MagnifyingGlass,
  "at-outline":          At,
  "eye-outline":         Eye,
  "eye-off-outline":     EyeSlash,
};

function FieldIcon({ name, size = 19, color }) {
  const Icon = ICON_MAP[name];
  if (!Icon) return null;
  // Eye/EyeSlash need "regular" weight; others look better "duotone"
  const isEye = name === "eye-outline" || name === "eye-off-outline";
  return <Icon size={size} color={color} weight={isEye ? "regular" : "duotone"} />;
}

export default function AuthInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline,
  helper,
  placeholder,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
}) {
  const { colors } = useTheme();
  const focus = useSharedValue(0);

  const containerStyle = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focus.value,
      [0, 1],
      [
        error ? colors.error : colors.border,
        error ? colors.error : colors.accent,
      ]
    ),
  }));

  return (
    <View style={{ marginBottom: 18 }}>
      {label ? (
        <Text
          style={{
            fontFamily: Fonts.semiBold,
            fontSize: 11,
            letterSpacing: 1.4,
            color: colors.textSecondary,
            marginBottom: 8,
            marginLeft: 4,
            textTransform: "uppercase",
          }}
        >
          {label}
        </Text>
      ) : null}

      <Animated.View
        style={[
          {
            flexDirection: "row",
            alignItems: multiline ? "flex-start" : "center",
            minHeight: multiline ? 80 : 56,
            borderRadius: Radius.lg,
            borderWidth: 1.5,
            borderColor: colors.border,
            backgroundColor: colors.bgInput,
            paddingRight: 10,
            overflow: "hidden",
          },
          containerStyle,
        ]}
      >
        {leftIcon && (
          <View
            style={{
              width: 42,
              height: 42,
              marginLeft: 6,
              marginTop: multiline ? 7 : 0,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FieldIcon name={leftIcon} color={colors.accent} />
          </View>
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize ?? "none"}
          autoCorrect={autoCorrect}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          onFocus={() => (focus.value = withTiming(1, { duration: 150 }))}
          onBlur={() => (focus.value = withTiming(0, { duration: 150 }))}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          style={{
            fontFamily: Fonts.regular,
            fontSize: 15,
            lineHeight: 22,
            flex: 1,
            color: colors.textPrimary,
            paddingHorizontal: 10,
            paddingVertical: multiline ? 12 : 0,
            minHeight: multiline ? 70 : 54,
            textAlignVertical: multiline ? "top" : "center",
            outlineStyle: "none",
          }}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            hitSlop={10}
            activeOpacity={0.7}
            style={{ width: 38, height: 42, alignItems: "center", justifyContent: "center" }}
          >
            <FieldIcon name={rightIcon} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </Animated.View>

      {error ? (
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18, color: colors.error, marginTop: 6, marginLeft: 4 }}>
          {error}
        </Text>
      ) : helper ? (
        <Text style={{ fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18, color: colors.textMuted, marginTop: 6, marginLeft: 4 }}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

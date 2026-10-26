import { Text, TouchableOpacity, View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Fonts, Radius } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

function GoogleLogo({ size = 22 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path fill="#4285F4" d="M21.35 12.27c0-.71-.06-1.39-.18-2.05H12v3.88h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.69 2.91-4.18 2.91-7.22Z" />
      <Path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.36l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.75 9.75 0 0 0 12 21.75Z" />
      <Path fill="#FBBC05" d="M6.54 13.83a5.86 5.86 0 0 1 0-3.66V7.64H3.3a9.75 9.75 0 0 0 0 8.72l3.24-2.53Z" />
      <Path fill="#EA4335" d="M12 6.14c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.22 14.63 2.25 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.24 2.53C7.31 7.86 9.46 6.14 12 6.14Z" />
    </Svg>
  );
}

function AppleLogo({ size = 28, color }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        fill={color}
        d="M17.05 12.54c-.02-2.09 1.71-3.1 1.79-3.15a3.84 3.84 0 0 0-3.02-1.63c-1.27-.13-2.5.76-3.15.76-.66 0-1.67-.74-2.75-.72a4.05 4.05 0 0 0-3.4 2.07c-1.47 2.55-.37 6.3 1.04 8.36.7 1.01 1.52 2.14 2.61 2.1 1.05-.04 1.45-.67 2.73-.67 1.27 0 1.63.67 2.74.65 1.14-.02 1.85-1.02 2.54-2.04a8.35 8.35 0 0 0 1.16-2.36 3.66 3.66 0 0 1-2.29-3.37ZM14.98 6.41c.58-.7.97-1.67.86-2.66-.84.03-1.85.56-2.45 1.26-.53.61-.99 1.6-.87 2.54.94.07 1.88-.48 2.46-1.14Z"
      />
    </Svg>
  );
}

function OAuthButton({ provider, label, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        height: 50,
        borderRadius: Radius.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.bgElevated,
        gap: 10,
      }}
    >
      {provider === "google" ? (
        <GoogleLogo />
      ) : (
        <AppleLogo color={colors.textPrimary} />
      )}
      <Text
        style={{
          fontFamily: Fonts.friendly,
          fontSize: 15,
          letterSpacing: 0.2,
          color: colors.textPrimary,
        }}
      >
        Continue with {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function OAuthButtons({ onGoogle, onApple, showDivider = false }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: showDivider ? 0 : 28 }}>
      {showDivider && (
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 16 }}>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
          <Text
            style={{
              fontFamily: Fonts.regular,
              fontSize: 11,
              letterSpacing: 1,
              color: colors.textSecondary,
              marginHorizontal: 14,
            }}
          >
            OR CONTINUE WITH
          </Text>
          <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
        </View>
      )}

      <View style={{ gap: 12 }}>
        <OAuthButton provider="google" label="Google" onPress={onGoogle} colors={colors} />
        <OAuthButton provider="apple"  label="Apple"  onPress={onApple}  colors={colors} />
      </View>
    </View>
  );
}

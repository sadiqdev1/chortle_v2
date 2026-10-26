import { useEffect } from "react";
import { Image, StatusBar, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { logoIcon } from "../constants/data";
import { Fonts } from "../constants/theme";
import { useTheme } from "../context/ThemeContext";

export default function SplashScreen() {
  const { colors, isDark } = useTheme();

  const logoOpacity    = useSharedValue(0);
  const logoScale      = useSharedValue(0.75);
  const wordmarkOpacity = useSharedValue(0);
  const taglineOpacity  = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value    = withTiming(1, { duration: 450 });
    logoScale.value      = withTiming(1, { duration: 450 });
    wordmarkOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    taglineOpacity.value  = withDelay(600, withSequence(withTiming(1, { duration: 350 })));
  }, []);

  const logoStyle     = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ scale: logoScale.value }] }));
  const wordmarkStyle = useAnimatedStyle(() => ({ opacity: wordmarkOpacity.value }));
  const taglineStyle  = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        alignItems: "center",
        justifyContent: "center",
        gap: 14,
      }}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.bg}
      />

      <Animated.View style={logoStyle}>
        <Image source={logoIcon} style={{ width: 80, height: 80 }} resizeMode="contain" />
      </Animated.View>

      <Animated.Text
        style={[
          {
            fontFamily: Fonts.display,
            fontSize: 44,
            letterSpacing: 1,
            lineHeight: 50,
            color: colors.textPrimary,
          },
          wordmarkStyle,
        ]}
      >
        Chortle
      </Animated.Text>

      <Animated.Text
        style={[
          {
            fontFamily: Fonts.friendly,
            fontSize: 14,
            letterSpacing: 0.4,
            color: colors.textMuted,
          },
          taglineStyle,
        ]}
      >
        Memes. Laughs. Community.
      </Animated.Text>
    </View>
  );
}

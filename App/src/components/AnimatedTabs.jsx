import { useEffect, useRef } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Fonts } from "../constants/theme";

export default function AnimatedTabs({
  tabs,
  active,
  onChange,
  colors,
  memesCount = 0,
}) {
  const activeIndex = Math.max(0, tabs.indexOf(active));
  const indicatorX = useSharedValue(0);
  const tabWidth = useRef(0);

  useEffect(() => {
    if (tabWidth.current > 0) {
      indicatorX.value = withTiming(activeIndex * tabWidth.current, {
        duration: 250,
      });
    }
  }, [activeIndex, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      style={{
        flexDirection: "row",
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        position: "relative",
      }}
      onLayout={(e) => {
        const width = e.nativeEvent.layout.width / tabs.length;

        tabWidth.current = width;
        indicatorX.value = activeIndex * width;
      }}
    >
      {tabs.map((tab) => {
        const isActive = active === tab;

        return (
          <TouchableOpacity
            key={tab}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(tab);
            }}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 14,
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              style={{
                fontFamily: Fonts.semiBold,
                fontSize: 14,
                color: isActive ? colors.accent : colors.textMuted,
              }}
            >
              {tab}
              {tab === "Posts" ? ` (${memesCount})` : ""}
            </Text>
          </TouchableOpacity>
        );
      })}

      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            bottom: 0,
            height: 3,
            width: `${100 / tabs.length}%`,
            borderRadius: 3,
            backgroundColor: colors.accent,
          },
          indicatorStyle,
        ]}
      />
    </View>
  );
}
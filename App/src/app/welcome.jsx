import { router } from "expo-router";
import { Image, StatusBar, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeInDown } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

import { logoWithSmile } from "../constants/data";
import { Fonts, Shadow } from "../constants/theme";
import { useNavigation } from "expo-router/build/react-navigation";

// Brand hero palette — local to this screen
const BRAND_BG = "#341B77";
const BLOB = "#3D1E8F";

const BLOBS = [
  { size: 190, top: -90, left: -75, opacity: 1 },
  { size: 150, top: 35, right: -85, opacity: 0.75 },
  { size: 170, bottom: -85, left: -70, opacity: 1 },
  { size: 210, bottom: -110, right: -80, opacity: 0.85 },
];

function DecorativeBlobs() {
  return (
    <>
      {BLOBS.map((b, i) => (
        <View
          key={i}
          pointerEvents="none"
          className="absolute"
          style={{
            width: b.size,
            height: b.size,
            borderRadius: b.size / 2,
            backgroundColor: BLOB,
            opacity: b.opacity,
            top: "top" in b ? b.top : undefined,
            bottom: "bottom" in b ? b.bottom : undefined,
            left: "left" in b ? b.left : undefined,
            right: "right" in b ? b.right : undefined,
          }}
        />
      ))}
    </>
  );
}

export default function WelcomeScreen() {
  const navigation = useNavigation();
  return (
    <View className="flex-1 overflow-hidden" style={{ backgroundColor: BRAND_BG }}>
      <StatusBar barStyle="light-content" backgroundColor={BRAND_BG} />

      <DecorativeBlobs />

      <SafeAreaView className="flex-1" edges={["top", "bottom"]}>
        <View className="flex-1 px-7 pt-[55px] pb-9 items-center justify-between">
          {/* Logo + wordmark */}
          <Animated.View
            entering={FadeIn.duration(500)}
            className="items-center gap-3.5"
          >
            <Image
              source={logoWithSmile}
              className="w-[150px] h-[150px]"
              resizeMode="contain"
              accessibilityLabel="Chortle logo"
            />

            {/* Lilita One — cartoon wordmark */}
            <Text
              className="text-center"
              style={{
                fontFamily: Fonts.display,
                fontSize: 52,
                lineHeight: 58,
                letterSpacing: 1,
                color: "#FFFFFF",
              }}
            >
              Chortle
            </Text>

            {/* Fredoka — friendly tagline */}
            <Text
              className="text-center"
              style={{
                fontFamily: Fonts.friendly,
                fontSize: 16,
                lineHeight: 24,
                letterSpacing: 0.2,
                color: "rgba(255,255,255,0.85)",
                maxWidth: 300,
              }}
            >
              Memes. laughs. Community.
            </Text>
          </Animated.View>

          {/* CTA */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            className="w-full items-center gap-[18px]"
          >
            <TouchableOpacity
              onPress={() => router.push("/(auth)/Register")}
              // onPress={()=> navigation.navigate('register')}
              activeOpacity={0.88}
              accessibilityRole="button"
              accessibilityLabel="Get started"
              className="w-full h-[54px] rounded-full bg-white items-center justify-center"
              style={Shadow.card}
            >
              <Text
                style={{
                  fontFamily: Fonts.friendly,
                  fontSize: 16,
                  lineHeight: 22,
                  letterSpacing: 0.3,
                  color: "#3D1B83",
                }}
              >
                Get Started  
              </Text>
            </TouchableOpacity>

            <View className="flex-row items-center gap-1.5">
              <Text
                style={{
                  fontFamily: Fonts.regular,
                  fontSize: 14,
                  lineHeight: 20,
                  color: "rgba(255,255,255,0.75)",
                }}
              >
                Already have an account?
              </Text>

              <TouchableOpacity
                onPress={() => router.push("/(auth)/Login")}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Log in"
              >
                <Text
                  style={{
                    fontFamily: Fonts.friendly,
                    fontSize: 15,
                    lineHeight: 20,
                    letterSpacing: 0.3,
                    color: "#FFFFFF",
                  }}
                >
                  Log in
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </SafeAreaView>
    </View>
  );
}
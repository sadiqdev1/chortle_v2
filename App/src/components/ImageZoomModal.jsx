/**
 * ImageZoomModal — Facebook-style full-screen image viewer.
 * Pinch-to-zoom, pan, double-tap-to-zoom, swipe-down-to-dismiss.
 */
import { StyleSheet } from "react-native";
import { useEffect } from "react";
import { Dimensions, Image, Modal, StatusBar, TouchableOpacity, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { X } from "phosphor-react-native";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const MAX_SCALE = 4;
const MIN_SCALE = 1;

export default function ImageZoomModal({ visible, imageUrl, onClose }) {
  const insets = useSafeAreaInsets();

  const scale       = useSharedValue(1);
  const savedScale  = useSharedValue(1);
  const translateX  = useSharedValue(0);
  const translateY  = useSharedValue(0);
  const savedTransX = useSharedValue(0);
  const savedTransY = useSharedValue(0);
  const bgOpacity   = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      scale.value      = withSpring(1, { damping: 15 });
      bgOpacity.value  = withTiming(1, { duration: 200 });
      translateX.value = 0;
      translateY.value = 0;
      savedTransX.value = 0;
      savedTransY.value = 0;
      savedScale.value  = 1;
    }
  }, [visible]);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = Math.min(Math.max(savedScale.value * e.scale, MIN_SCALE), MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value < MIN_SCALE) {
        scale.value = withSpring(MIN_SCALE);
        savedScale.value = MIN_SCALE;
      }
    });

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      if (scale.value > 1) {
        translateX.value = savedTransX.value + e.translationX;
        translateY.value = savedTransY.value + e.translationY;
      } else {
        translateY.value = Math.max(0, e.translationY);
        bgOpacity.value = 1 - Math.min(translateY.value / 200, 1) * 0.7;
      }
    })
    .onEnd((e) => {
      if (scale.value > 1) {
        savedTransX.value = translateX.value;
        savedTransY.value = translateY.value;
      } else if (translateY.value > 120 || e.velocityY > 800) {
        bgOpacity.value = withTiming(0, { duration: 180 });
        translateY.value = withTiming(SCREEN_H, { duration: 250 }, () => {
          runOnJS(onClose)();
          scale.value = 1; savedScale.value = 1;
          translateX.value = 0; translateY.value = 0;
          savedTransX.value = 0; savedTransY.value = 0;
        });
      } else {
        translateY.value = withSpring(0);
        bgOpacity.value  = withSpring(1);
      }
    });

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((e) => {
      if (scale.value > 1) {
        scale.value = withSpring(1); savedScale.value = 1;
        translateX.value = withSpring(0); translateY.value = withSpring(0);
        savedTransX.value = 0; savedTransY.value = 0;
      } else {
        const tx = -(e.x - SCREEN_W / 2) * 1.5;
        const ty = -(e.y - SCREEN_H / 2) * 1.5;
        scale.value = withSpring(2.5); savedScale.value = 2.5;
        translateX.value = withSpring(tx); translateY.value = withSpring(ty);
        savedTransX.value = tx; savedTransY.value = ty;
      }
    });

  const composed = Gesture.Simultaneous(
    Gesture.Race(doubleTap, pan),
    pinch
  );

  const imgStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const bgStyle = useAnimatedStyle(() => ({ opacity: bgOpacity.value }));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />

      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: "#000" }, bgStyle]} />

      <TouchableOpacity
        onPress={onClose}
        style={{
          position: "absolute", top: insets.top + 12, right: 16, zIndex: 10,
          width: 40, height: 40, borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center",
        }}
      >
        <X size={20} color="#fff" weight="bold" />
      </TouchableOpacity>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <GestureDetector gesture={composed}>
          <Animated.View style={imgStyle}>
            <Image
              source={{ uri: imageUrl }}
              style={{ width: SCREEN_W, height: SCREEN_W }}
              resizeMode="contain"
            />
          </Animated.View>
        </GestureDetector>
      </View>
    </Modal>
  );
}

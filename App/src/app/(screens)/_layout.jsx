import { Stack } from "expo-router";

export default function ScreensLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="EditProfile" />
      <Stack.Screen name="leaderboard" />
      <Stack.Screen name="PostView" />
      <Stack.Screen name="Settings" />
      <Stack.Screen name="UserProfile" />
      <Stack.Screen name="VerificationRequest" />
    </Stack>
  );
}

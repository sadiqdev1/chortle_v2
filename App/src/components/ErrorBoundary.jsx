/**
 * ErrorBoundary — catches runtime errors and shows a recovery screen
 * instead of a blank white crash.
 *
 * Usage: Wrap any screen or the root layout.
 *   <ErrorBoundary>
 *     <YourScreen />
 *   </ErrorBoundary>
 */
import { Component } from "react";
import {
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // Log to your error reporting service here (e.g. Sentry)
    console.error("[ErrorBoundary] Caught:", error?.message, info?.componentStack);
  }

  handleReset() {
    this.setState({ hasError: false, error: null });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    const { fallback } = this.props;
    if (fallback) return fallback;

    // Default recovery UI
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#090812",
          alignItems: "center",
          justifyContent: "center",
          padding: 32,
        }}
      >
        <Text style={{ fontSize: 52, marginBottom: 20 }}>💀</Text>
        <Text
          style={{
            fontFamily: "Fredoka_600SemiBold",
            fontSize: 24,
            color: "#F7F5FF",
            marginBottom: 12,
            textAlign: "center",
          }}
        >
          Something broke
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 15,
            lineHeight: 22,
            color: "#A6A0C0",
            textAlign: "center",
            marginBottom: 32,
          }}
        >
          An unexpected error occurred. Tap below to try recovering.
        </Text>
        <TouchableOpacity
          onPress={() => this.handleReset()}
          activeOpacity={0.85}
          style={{
            paddingHorizontal: 32,
            paddingVertical: 14,
            borderRadius: 999,
            backgroundColor: "#7B4BE8",
          }}
        >
          <Text
            style={{
              fontFamily: "Fredoka_600SemiBold",
              fontSize: 16,
              color: "#FFFFFF",
              letterSpacing: 0.3,
            }}
          >
            Try again
          </Text>
        </TouchableOpacity>

        {__DEV__ && this.state.error && (
          <Text
            style={{
              marginTop: 24,
              fontFamily: "Inter_400Regular",
              fontSize: 11,
              color: "#555",
              textAlign: "center",
            }}
            numberOfLines={4}
          >
            {this.state.error?.message}
          </Text>
        )}
      </View>
    );
  }
}

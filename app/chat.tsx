import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

// Import the main UI component we created earlier
import AIAssistantUI from "../components/AIAssistantUI";

export default function ChatPage() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const isDark = systemScheme === "dark";

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem("accessToken");
        if (token) {
          setIsAuthenticated(true);
        } else {
          // Use 'replace' to prevent going back to the loading screen
          // Cast to 'any' to avoid strict route typing issues during dev
          router.replace("/login" as any);
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.replace("/login" as any);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: isDark ? "#09090b" : "#f8fafc" }]}>
        <ActivityIndicator size="large" color={isDark ? "#ffffff" : "#000000"} />
        <Text style={[styles.loadingText, { color: isDark ? "#a1a1aa" : "#52525b" }]}>
          Loading...
        </Text>
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return (
    // SafeAreaProvider is often needed at the root of a screen if not already in _layout
    <SafeAreaProvider>
      <View style={[styles.container, { backgroundColor: isDark ? "#09090b" : "#f8fafc" }]}>
        <AIAssistantUI />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
});
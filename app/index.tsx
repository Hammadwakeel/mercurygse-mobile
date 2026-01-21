// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1. Check if token exists
        const token = await AsyncStorage.getItem("accessToken");

        if (token) {
          // ✅ User is logged in -> Go to Chat
          // We use replace so they can't "back" into the loading screen
          router.replace("/chat" as any);
        } else {
          // ❌ No token -> Go to Login
          router.replace("/login" as any);
        }
      } catch (e) {
        // Safety fallback
        router.replace("/login" as any);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return (
    <SafeAreaView style={styles.center}>
      <ActivityIndicator size="large" color="#f97316" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#fff" 
  },
});
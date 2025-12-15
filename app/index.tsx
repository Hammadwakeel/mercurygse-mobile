// app/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, StyleSheet } from "react-native";
// ✅ FIX: Import from safe-area-context, not react-native
import { SafeAreaView } from "react-native-safe-area-context";

export default function Index() {
  useEffect(() => {
    (async () => {
      try {
        // Clear old data to force login (as requested previously)
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("authToken");
      } catch (error) {
        console.warn("Failed to clear auth storage", error);
      }
      
      // Redirect to login page
      router.replace("/login");
    })();
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
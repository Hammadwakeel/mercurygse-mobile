// app/login.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Label } from "../components/Label";
import { login } from "../lib/api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const response = await login(email, password);

      // Persist tokens for routing + API usage
      await AsyncStorage.setItem("accessToken", response.access_token);
      await AsyncStorage.setItem("refreshToken", response.refresh_token);
      await AsyncStorage.setItem("tokenType", response.token_type);

      await AsyncStorage.setItem(
        "authToken",
        JSON.stringify({
          email,
          authenticated: true,
          timestamp: Date.now(),
          accessToken: response.access_token,
        })
      );

      // Navigate to chat after successful login
      router.replace("/chat");
    } catch (err: any) {
      const message = err?.message || "Login failed";
      setError(message);
      Alert.alert("Login Error", message);
      console.error("[Login Error]:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = () => {
    console.log("[v0] Social login with Microsoft (placeholder)");
    Alert.alert("Microsoft Login", "Microsoft OAuth needs implementation.");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.headerTitle}>Welcome Back</Text>
          <Text style={styles.headerSubtitle}>Sign in to your account</Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Label>Email Address</Label>
          <Input
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />

          <Label>Password</Label>
          <Input
            placeholder="Enter your password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button
            title={isLoading ? "Signing in..." : "Sign In"}
            onPress={handleLogin}
            disabled={isLoading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>Or continue with</Text>
            <View style={styles.divider} />
          </View>

          <Button title="Microsoft" variant="outline" onPress={handleSocialLogin} />

          <TouchableOpacity onPress={() => router.push("/signup")}>
            <Text style={styles.signupText}>
              Don't have an account? Sign up
            </Text>
          </TouchableOpacity>

          {isLoading && (
            <View style={styles.loading}>
              <ActivityIndicator size="small" />
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 18,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#111",
    textAlign: "center",
  },
  headerSubtitle: {
    textAlign: "center",
    color: "#666",
    marginBottom: 16,
  },
  error: {
    color: "#b91c1c",
    padding: 10,
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    marginBottom: 12,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 18,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#e5e7eb",
  },
  orText: {
    marginHorizontal: 12,
    color: "#666",
  },
  signupText: {
    marginTop: 18,
    color: "#f97316",
    textAlign: "center",
    fontWeight: "600",
  },
  loading: {
    marginTop: 12,
  },
});

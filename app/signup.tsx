// app/signup.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { JSX, useMemo, useState } from "react";
import {
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
import { signup } from "../lib/api";

export default function SignupPage(): JSX.Element {
  const [fullName, setFullName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // password checks
  const checks = useMemo(() => {
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const minLength = password.length >= 8;
    return { hasLower, hasUpper, hasNumber, hasSpecial, minLength };
  }, [password]);

  const strengthScore = useMemo(
    () => Object.values(checks).filter(Boolean).length,
    [checks]
  );

  const strengthLabel = useMemo(() => {
    switch (strengthScore) {
      case 0:
      case 1:
        return "Very weak";
      case 2:
        return "Weak";
      case 3:
        return "Fair";
      case 4:
        return "Good";
      case 5:
        return "Strong";
      default:
        return "";
    }
  }, [strengthScore]);

  const strengthColor = useMemo(() => {
    if (strengthScore <= 1) return "#ef4444";
    if (strengthScore === 2) return "#f59e0b";
    if (strengthScore === 3) return "#fbbf24";
    if (strengthScore === 4) return "#84cc16";
    return "#10b981";
  }, [strengthScore]);

  const percent = Math.round((strengthScore / 5) * 100);

  const handleSignup = async () => {
    setError("");

    if (!fullName.trim() || !email.trim() || !password) {
      setError("Please fill all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    // require all checks
    if (
      !checks.hasLower ||
      !checks.hasUpper ||
      !checks.hasNumber ||
      !checks.hasSpecial ||
      !checks.minLength
    ) {
      setError(
        "Password must be at least 8 characters and include lowercase, uppercase, number, and special character."
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await signup(fullName, email, password);

      // store tokens
      await AsyncStorage.setItem("accessToken", response.access_token);
      await AsyncStorage.setItem("refreshToken", response.refresh_token);
      await AsyncStorage.setItem("tokenType", response.token_type);
      await AsyncStorage.setItem(
        "authToken",
        JSON.stringify({
          email,
          fullName,
          authenticated: true,
          timestamp: Date.now(),
        })
      );

      // redirect → CHAT PAGE
      router.push("/chat");
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create account";
      setError(errorMessage);
      Alert.alert("Signup error", errorMessage);
      console.error("[v0] Signup error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = () => {
    Alert.alert("Microsoft", "Microsoft OAuth not implemented yet");
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to get started</Text>
        </View>

        <View style={styles.card}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Label>Full Name</Label>
          <Input
            placeholder="John Doe"
            value={fullName}
            onChangeText={setFullName}
          />

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
            placeholder="Create a strong password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {/* Strength */}
          <View style={styles.strengthRow}>
            <View style={styles.strengthTrack}>
              <View
                style={[
                  styles.strengthFill,
                  { width: `${percent}%`, backgroundColor: strengthColor },
                ]}
              />
            </View>
            <View style={styles.strengthMeta}>
              <Text style={styles.strengthLabel}>{strengthLabel}</Text>
              <Text style={styles.strengthPercent}>{percent}%</Text>
            </View>
          </View>

          {/* Checklist */}
          <View style={styles.checklist}>
            <CheckItem text="At least 8 characters" ok={checks.minLength} />
            <CheckItem text="Lowercase letter (a-z)" ok={checks.hasLower} />
            <CheckItem text="Uppercase letter (A-Z)" ok={checks.hasUpper} />
            <CheckItem text="Number (0-9)" ok={checks.hasNumber} />
            <CheckItem text="Special character (!@#$%)" ok={checks.hasSpecial} />
          </View>

          <Label>Confirm Password</Label>
          <Input
            placeholder="Confirm your password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            title={isLoading ? "Creating Account..." : "Sign Up"}
            onPress={handleSignup}
            disabled={isLoading}
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.orText}>Or sign up with</Text>
            <View style={styles.divider} />
          </View>

          <Button
            title="Sign up with Microsoft"
            variant="outline"
            onPress={handleSocialSignup}
          />

          <TouchableOpacity onPress={() => router.push("/login")}>
            <Text style={styles.signinText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function CheckItem({ text, ok }: { text: string; ok: boolean }) {
  return (
    <View style={styles.checkRow}>
      <View
        style={[
          styles.checkDot,
          { backgroundColor: ok ? "#10b981" : "#e5e7eb" },
        ]}
      />
      <Text style={[styles.checkText, { color: ok ? "#374151" : "#9ca3af" }]}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 36, backgroundColor: "#fff" },
  header: { marginBottom: 12 },
  title: { fontSize: 28, fontWeight: "700" },
  subtitle: { color: "#666", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    padding: 18,
    borderRadius: 14,
  },
  error: {
    color: "#b91c1c",
    backgroundColor: "#fee2e2",
    padding: 10,
    borderRadius: 6,
    marginBottom: 12,
  },
  strengthRow: { marginTop: 8 },
  strengthTrack: {
    height: 8,
    backgroundColor: "#eee",
    borderRadius: 999,
    overflow: "hidden",
  },
  strengthFill: { height: 8 },
  strengthMeta: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  strengthLabel: { fontSize: 12 },
  strengthPercent: { fontSize: 12 },
  checklist: { marginVertical: 10 },
  checkRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  checkDot: { width: 14, height: 14, borderRadius: 7 },
  checkText: { fontSize: 13 },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 14,
  },
  divider: { flex: 1, height: 1, backgroundColor: "#ececec" },
  orText: { marginHorizontal: 12, color: "#666" },
  signinText: {
    textAlign: "center",
    marginTop: 10,
    fontWeight: "600",
    color: "#f97316",
  },
});

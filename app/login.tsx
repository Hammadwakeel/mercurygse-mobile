import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from "react-native";
import { api } from "../lib/api"; // Ensure this path is correct relative to app/login.tsx

// --- Theme Toggle Component ---
import ThemeToggle from "../components/ThemeToggle"; // Reusing the toggle you created

export default function LoginPage() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  
  // Simple local state for theme toggle demo (in real app, use Context)
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme || "light");
  const isDark = theme === "dark";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await api.auth.login(email, password);
      
      // Save tokens
      await AsyncStorage.setItem("accessToken", response.access_token);
      await AsyncStorage.setItem("refreshToken", response.refresh_token);
      await AsyncStorage.setItem("tokenType", response.token_type);
      await AsyncStorage.setItem("user", JSON.stringify(response.user));
      
      // Navigate Home
      router.replace("/");
      
    } catch (err: any) {
      console.error("Login Error:", err);
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    Alert.alert("Coming Soon", `Social login with ${provider} is not yet implemented.`);
  };

  const styles = getStyles(isDark);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Background Layer (Simulating the gradient with solid color for simplicity) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* Theme Toggle Positioned Top Right */}
      <View style={styles.topRight}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            
            {/* CARD */}
            <View style={styles.card}>
              
              {/* Header */}
              <View style={styles.cardHeader}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account to continue</Text>
              </View>

              {/* Error Message */}
              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Form */}
              <View style={styles.form}>
                
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"} // Zinc 500 / 400
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Password</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                  />
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  onPress={handleLogin}
                  disabled={isLoading}
                  style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                  activeOpacity={0.8}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Sign In</Text>
                  )}
                </TouchableOpacity>

              </View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Login */}
              <TouchableOpacity
                onPress={() => handleSocialLogin("Google")}
                style={styles.socialBtn}
                activeOpacity={0.8}
              >
                {/* Google Icon SVG Placeholder - Using Text 'G' or Image */}
                <View style={styles.googleIconContainer}>
                   <Image 
                     source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                     // Note: SVGs need library support, using simple View logic or remote PNG usually easier for quick prototype
                     // Here we just use a simple colored 'G' text for simplicity if image fails load
                   />
                   <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4285F4' }}>G</Text>
                </View>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/signup" as any)}>
                  <Text style={styles.linkText}>Sign up</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// --- STYLES ---

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#09090b" : "#f8fafc", // Zinc 950 / 50
    },
    topRight: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 20,
      zIndex: 10,
    },
    contentContainer: {
      flex: 1,
      justifyContent: 'center',
      padding: 20,
    },
    card: {
      backgroundColor: isDark ? "#18181b" : "#ffffff", // Zinc 900 / White
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? "#27272a" : "#e4e4e7", // Zinc 800 / 200
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.1,
      shadowRadius: 20,
      elevation: 5,
      overflow: 'hidden',
    },
    cardHeader: {
      paddingHorizontal: 24,
      paddingTop: 32,
      paddingBottom: 24,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#27272a" : "#f4f4f5", // Zinc 800 / 100
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDark ? "#f4f4f5" : "#18181b", // Zinc 100 / 900
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#a1a1aa" : "#52525b", // Zinc 400 / 600
    },
    form: {
      padding: 24,
      gap: 20,
    },
    inputGroup: {
      gap: 8,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#d4d4d8" : "#3f3f46", // Zinc 300 / 700
    },
    input: {
      backgroundColor: isDark ? "#000000" : "#ffffff", // Black / White
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7", // Zinc 700 / 200
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14, // Taller inputs
      fontSize: 16,
      color: isDark ? "#f4f4f5" : "#18181b",
    },
    primaryBtn: {
      marginTop: 8,
      backgroundColor: "#9333ea", // Purple 600
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      shadowColor: "#9333ea",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    primaryBtnText: {
      color: "#ffffff",
      fontSize: 16,
      fontWeight: "bold",
    },
    errorBox: {
      marginHorizontal: 24,
      marginTop: 24,
      padding: 12,
      backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2", // Red 900/20 / Red 50
      borderWidth: 1,
      borderColor: isDark ? "#7f1d1d" : "#fecaca", // Red 800 / 200
      borderRadius: 8,
    },
    errorText: {
      color: isDark ? "#fca5a5" : "#b91c1c", // Red 300 / 700
      fontSize: 14,
      textAlign: 'center',
      fontWeight: "500",
    },
    dividerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: 24,
      marginBottom: 24,
      gap: 12,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: isDark ? "#27272a" : "#e4e4e7",
    },
    dividerText: {
      fontSize: 13,
      color: isDark ? "#71717a" : "#a1a1aa", // Zinc 500 / 400
      fontWeight: "500",
    },
    socialBtn: {
      marginHorizontal: 24,
      marginBottom: 32,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: isDark ? "#000000" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      paddingVertical: 14,
      borderRadius: 8,
      gap: 10,
    },
    socialBtnText: {
      fontSize: 15,
      fontWeight: "600",
      color: isDark ? "#e4e4e7" : "#3f3f46",
    },
    googleIconContainer: {
      width: 20, 
      height: 20, 
      alignItems: 'center', 
      justifyContent: 'center'
    },
    footer: {
      paddingBottom: 24,
      flexDirection: 'row',
      justifyContent: 'center',
    },
    footerText: {
      color: isDark ? "#a1a1aa" : "#52525b",
      fontSize: 14,
    },
    linkText: {
      color: isDark ? "#c084fc" : "#9333ea", // Purple 400 / 600
      fontWeight: "bold",
      fontSize: 14,
    },
  });
}
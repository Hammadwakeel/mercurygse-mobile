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
// Remove AsyncStorage import since we don't need it here anymore
import ThemeToggle from "../components/ThemeToggle";
import { api } from "../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  
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
      // ✅ FIX: Just call api.auth.login(). 
      // It now handles saving tokens to AsyncStorage internally and safely.
      await api.auth.login(email, password);
      
      // Navigate Home
      // Cast to 'any' to bypass strict typing if routes aren't generated yet
      router.replace("/" as any);
      
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
      
      <View style={StyleSheet.absoluteFill} pointerEvents="none" />

      <View style={styles.topRight}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1, justifyContent: 'center' }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.contentContainer}>
            
            <View style={styles.card}>
              
              <View style={styles.cardHeader}>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Sign in to your account to continue</Text>
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.form}>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

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

              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>Or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => handleSocialLogin("Google")}
                style={styles.socialBtn}
                activeOpacity={0.8}
              >
                <View style={styles.googleIconContainer}>
                   <Image 
                     source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                     style={{ width: 20, height: 20 }}
                     resizeMode="contain"
                   />
                </View>
                <Text style={styles.socialBtnText}>Google</Text>
              </TouchableOpacity>

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

function getStyles(isDark: boolean) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: isDark ? "#09090b" : "#f8fafc",
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
      backgroundColor: isDark ? "#18181b" : "#ffffff",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? "#27272a" : "#e4e4e7",
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
      borderBottomColor: isDark ? "#27272a" : "#f4f4f5",
      alignItems: 'center',
    },
    title: {
      fontSize: 28,
      fontWeight: "bold",
      color: isDark ? "#f4f4f5" : "#18181b",
      marginBottom: 8,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#a1a1aa" : "#52525b",
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
      color: isDark ? "#d4d4d8" : "#3f3f46",
    },
    input: {
      backgroundColor: isDark ? "#000000" : "#ffffff",
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: isDark ? "#f4f4f5" : "#18181b",
    },
    primaryBtn: {
      marginTop: 8,
      backgroundColor: "#9333ea",
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
      backgroundColor: isDark ? "rgba(127, 29, 29, 0.2)" : "#fef2f2",
      borderWidth: 1,
      borderColor: isDark ? "#7f1d1d" : "#fecaca",
      borderRadius: 8,
    },
    errorText: {
      color: isDark ? "#fca5a5" : "#b91c1c",
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
      color: isDark ? "#71717a" : "#a1a1aa",
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
      color: isDark ? "#c084fc" : "#9333ea",
      fontWeight: "bold",
      fontSize: 14,
    },
  });
}
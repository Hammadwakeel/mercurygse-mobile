import { useRouter } from "expo-router";
import { CheckCircle2, Mail } from "lucide-react-native"; // Icons
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useColorScheme,
  View
} from "react-native";

import ThemeToggle from "../components/ThemeToggle";
import { signup } from "../lib/api";

export default function SignupPage() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme || "light");
  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSignup = async () => {
    setError("");
    Keyboard.dismiss();

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    
    setIsLoading(true);
    try {
      await signup(fullName, email, password);
      setIsSuccess(true);
    } catch (err: any) {
      console.error("Signup error:", err);
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialSignup = (provider: string) => {
    Alert.alert("Coming Soon", `Social signup with ${provider} is not yet implemented.`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Background Layer */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* Theme Toggle */}
      <View style={styles.topRight}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"} 
        style={{ flex: 1 }}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            
            <View style={styles.card}>
              
              {/* --- SUCCESS VIEW --- */}
              {isSuccess ? (
                <View style={styles.successContainer}>
                   <View style={styles.successIconCircle}>
                     <CheckCircle2 size={32} color={isDark ? "#4ade80" : "#16a34a"} />
                   </View>
                   
                   <Text style={styles.successTitle}>Account Created!</Text>
                   
                   <Text style={styles.successDesc}>
                      We've sent a confirmation link to:
                   </Text>
                   <Text style={styles.successEmail}>{email}</Text>

                   <View style={styles.infoBox}>
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Mail size={20} color={isDark ? "#60a5fa" : "#2563eb"} style={{ marginTop: 2 }} />
                        <Text style={styles.infoBoxText}>
                          Please check your inbox (and spam folder) and click the link to activate your account.
                        </Text>
                      </View>
                   </View>

                   <TouchableOpacity
                      // Cast to 'any' to avoid strict router typing issues during dev
                      onPress={() => router.push("/login" as any)}
                      style={[styles.primaryBtn, { width: '100%' }]}
                   >
                      <Text style={styles.primaryBtnText}>Go to Login</Text>
                   </TouchableOpacity>
                </View>
              ) : (
                /* --- SIGNUP FORM VIEW --- */
                <>
                  <View style={styles.cardHeader}>
                    <Text style={styles.title}>Create Account</Text>
                    <Text style={styles.subtitle}>Join us to get started</Text>
                  </View>

                  <View style={styles.form}>
                    
                    {error ? (
                      <View style={styles.errorBox}>
                        <Text style={styles.errorText}>{error}</Text>
                      </View>
                    ) : null}

                    {/* Full Name */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Full Name</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="John Doe"
                        placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>

                    {/* Email */}
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
                      />
                    </View>

                    {/* Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Create a strong password"
                        placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                      />
                    </View>

                    {/* Confirm Password */}
                    <View style={styles.inputGroup}>
                      <Text style={styles.label}>Confirm Password</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="Confirm your password"
                        placeholderTextColor={isDark ? "#71717a" : "#a1a1aa"}
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        secureTextEntry
                      />
                    </View>

                    {/* Sign Up Button */}
                    <TouchableOpacity
                      onPress={handleSignup}
                      disabled={isLoading}
                      style={[styles.primaryBtn, isLoading && styles.btnDisabled]}
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#fff" />
                      ) : (
                        <Text style={styles.primaryBtnText}>Sign Up</Text>
                      )}
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.dividerContainer}>
                      <View style={styles.dividerLine} />
                      <Text style={styles.dividerText}>Or sign up with</Text>
                      <View style={styles.dividerLine} />
                    </View>

                    {/* Social Button */}
                    <TouchableOpacity
                      onPress={() => handleSocialSignup("Google")}
                      style={styles.socialBtn}
                    >
                       <Image 
                         source={{ uri: "https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" }}
                         style={{ width: 20, height: 20 }}
                         resizeMode="contain"
                       />
                       <Text style={styles.socialBtnText}>Google</Text>
                    </TouchableOpacity>

                    {/* Footer Link */}
                    <View style={styles.footer}>
                      <Text style={styles.footerText}>Already have an account? </Text>
                      <TouchableOpacity onPress={() => router.push("/login" as any)}>
                        <Text style={styles.linkText}>Sign in</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                </>
              )}

            </View>
          </ScrollView>
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
      backgroundColor: isDark ? "#09090b" : "#f8fafc",
    },
    topRight: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 20,
      zIndex: 10,
    },
    scrollContent: {
      flexGrow: 1,
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
    // Success View Styles
    successContainer: {
      padding: 32,
      alignItems: 'center',
    },
    successIconCircle: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: isDark ? "rgba(22, 163, 74, 0.3)" : "#f0fdf4", // green-900/30 / green-50
      borderWidth: 1,
      borderColor: isDark ? "#166534" : "#dcfce7",
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 24,
    },
    successTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      color: isDark ? "#f4f4f5" : "#18181b",
      marginBottom: 16,
    },
    successDesc: {
      fontSize: 14,
      color: isDark ? "#d4d4d8" : "#52525b",
      marginBottom: 4,
    },
    successEmail: {
      fontSize: 16,
      fontWeight: 'bold',
      color: isDark ? "#fff" : "#000",
      marginBottom: 24,
    },
    infoBox: {
      backgroundColor: isDark ? "rgba(30, 58, 138, 0.2)" : "#eff6ff", // blue-900/20 / blue-50
      padding: 16,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#1e40af" : "#dbeafe",
      marginBottom: 32,
      width: '100%',
    },
    infoBoxText: {
      fontSize: 14,
      color: isDark ? "#bfdbfe" : "#1e40af", // blue-200 / blue-800
      flex: 1,
    },
    // Form Styles
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
      marginVertical: 12,
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
    footer: {
      marginTop: 12,
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
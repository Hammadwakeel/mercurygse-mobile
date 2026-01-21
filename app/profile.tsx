import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { ArrowLeft, Upload, User as UserIcon } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

import ThemeToggle from "../components/ThemeToggle";
import { api } from "../lib/api";

export default function ProfilePage() {
  const router = useRouter();
  const systemScheme = useColorScheme();
  // Simple local theme toggle state (demo purpose)
  const [theme, setTheme] = useState<"light" | "dark">(systemScheme || "light");
  const isDark = theme === "dark";
  const styles = getStyles(isDark);

  // State
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // --- 1. Load User Data ---
  useEffect(() => {
    setMounted(true);
    const loadUserData = async () => {
      try {
        const user = await api.user.getProfile();
        
        setFormData((prev) => ({
          ...prev,
          name: user.full_name || "",
          email: user.email || "",
        }));

        if (user.avatar_url) {
          setProfileImage(user.avatar_url);
        }
      } catch (err) {
        console.error("Error loading user:", err);
        // Cast to 'any' to fix router typing issue
        router.replace("/login" as any);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // --- 2. Handlers ---

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const pickImage = async () => {
    // Request permission first
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Sorry, we need camera roll permissions to make this work!');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
      base64: true, // We need base64 for preview/upload simulation
    });

    if (!result.canceled) {
      const asset = result.assets[0];
      
      // Simulate data URL format for preview
      const dataUri = `data:${asset.mimeType};base64,${asset.base64}`;
      setPreviewImage(dataUri);
      setErrors((prev) => ({ ...prev, profileImage: "" }));
    }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setErrors({});
    setSuccessMessage("");

    try {
      const newErrors: Record<string, string> = {};
      if (!formData.name.trim()) newErrors.name = "Name is required";
      
      if (formData.newPassword || formData.confirmPassword) {
        if (formData.newPassword.length < 6) {
          newErrors.newPassword = "Password must be at least 6 characters";
        }
        if (formData.newPassword !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
      }

      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        setIsSaving(false);
        return;
      }

      const payload: { full_name?: string; avatar_url?: string; password?: string } = {
        full_name: formData.name,
      };

      if (previewImage) {
        payload.avatar_url = previewImage;
      }

      if (formData.newPassword) {
        payload.password = formData.newPassword;
      }

      // Call API
      const updatedUser = await api.user.updateProfile(payload);

      if (updatedUser.avatar_url) {
        setProfileImage(updatedUser.avatar_url);
      }
      setPreviewImage(null);
      
      // Update Cache
      const cachedUser = await AsyncStorage.getItem("user");
      if (cachedUser) {
        const parsed = JSON.parse(cachedUser);
        await AsyncStorage.setItem("user", JSON.stringify({ 
          ...parsed, 
          ...updatedUser 
        }));
      }

      setFormData((prev) => ({
        ...prev,
        newPassword: "",
        confirmPassword: "",
      }));

      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

    } catch (error: any) {
      console.error("Save error:", error);
      Alert.alert("Error", error.message || "Failed to save profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await api.auth.logout();
    router.replace("/login" as any);
  };

  // --- 3. Loading State ---
  if (!mounted || isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={isDark ? "#fff" : "#000"} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      
      {/* Background (Solid color for performance) */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none" />

      {/* Theme Toggle Top Right */}
      <View style={styles.topRight}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </View>

      {/* Back Button Top Left */}
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.topLeft}
      >
        <ArrowLeft size={20} color={isDark ? "#a1a1aa" : "#52525b"} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          
          <View style={styles.card}>
            
            {/* Header */}
            <View style={styles.cardHeader}>
              <Text style={styles.title}>Profile Settings</Text>
              <Text style={styles.subtitle}>Manage your account information</Text>
            </View>

            <View style={styles.cardBody}>
              
              {/* Success Message */}
              {successMessage ? (
                <View style={styles.successBox}>
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              ) : null}

              {/* Avatar Section */}
              <View style={styles.avatarSection}>
                <View style={styles.avatarWrapper}>
                  {previewImage || profileImage ? (
                    <Image 
                      source={{ uri: previewImage || profileImage || "" }} 
                      style={styles.avatarImage} 
                    />
                  ) : (
                    <View style={styles.avatarPlaceholder}>
                      <UserIcon size={48} color={isDark ? "#71717a" : "#a1a1aa"} />
                    </View>
                  )}
                  
                  {/* Upload Button Overlay */}
                  <TouchableOpacity
                    onPress={pickImage}
                    style={styles.uploadBtn}
                    activeOpacity={0.8}
                  >
                    <Upload size={16} color={isDark ? "#000" : "#fff"} />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.avatarHint}>Tap icon to change photo</Text>
                {errors.profileImage ? (
                   <Text style={styles.errorText}>{errors.profileImage}</Text>
                ) : null}
              </View>

              <View style={styles.divider} />

              {/* Form Fields */}
              <View style={styles.formGroup}>
                <Text style={styles.label}>Full Name</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(val) => handleInputChange('name', val)}
                  placeholderTextColor={isDark ? "#52525b" : "#a1a1aa"}
                />
                {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput
                  style={[styles.input, styles.disabledInput]}
                  value={formData.email}
                  editable={false}
                />
              </View>

              {/* Password Section */}
              <View style={styles.passwordSection}>
                <Text style={styles.sectionTitle}>Change Password</Text>
                
                <View style={styles.formGroup}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? "#000" : "#fff" }]}
                    placeholder="••••••"
                    placeholderTextColor={isDark ? "#52525b" : "#a1a1aa"}
                    secureTextEntry
                    value={formData.newPassword}
                    onChangeText={(val) => handleInputChange('newPassword', val)}
                  />
                  {errors.newPassword ? <Text style={styles.errorText}>{errors.newPassword}</Text> : null}
                </View>

                <View style={styles.formGroup}>
                  <Text style={styles.label}>Confirm New Password</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? "#000" : "#fff" }]}
                    placeholder="••••••"
                    placeholderTextColor={isDark ? "#52525b" : "#a1a1aa"}
                    secureTextEntry
                    value={formData.confirmPassword}
                    onChangeText={(val) => handleInputChange('confirmPassword', val)}
                  />
                  {errors.confirmPassword ? <Text style={styles.errorText}>{errors.confirmPassword}</Text> : null}
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actions}>
                <TouchableOpacity
                  onPress={handleSaveProfile}
                  disabled={isSaving}
                  style={[styles.btn, styles.primaryBtn, isSaving && styles.btnDisabled]}
                >
                  {isSaving ? (
                     <ActivityIndicator color={isDark ? "#000" : "#fff"} />
                  ) : (
                     <Text style={[styles.btnText, styles.primaryBtnText]}>Save Changes</Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={handleLogout}
                  style={[styles.btn, styles.outlineBtn]}
                >
                  <Text style={[styles.btnText, styles.outlineBtnText]}>Sign Out</Text>
                </TouchableOpacity>
              </View>

            </View>
          </View>
        </ScrollView>
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
    center: {
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      marginTop: 12,
      color: isDark ? "#a1a1aa" : "#52525b",
    },
    topRight: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 20 : 40,
      right: 20,
      zIndex: 10,
    },
    topLeft: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 20 : 40,
      left: 20,
      zIndex: 10,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 8,
    },
    backText: {
      marginLeft: 6,
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#a1a1aa" : "#52525b",
    },
    scrollContent: {
      padding: 20,
      paddingTop: 80, 
    },
    card: {
      backgroundColor: isDark ? "#18181b" : "#ffffff",
      borderRadius: 24,
      borderWidth: 1,
      borderColor: isDark ? "#27272a" : "#e4e4e7",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 4,
      overflow: 'hidden',
    },
    cardHeader: {
      padding: 24,
      borderBottomWidth: 1,
      borderBottomColor: isDark ? "#27272a" : "#f4f4f5",
      alignItems: 'center',
    },
    title: {
      fontSize: 24,
      fontWeight: "bold",
      color: isDark ? "#f4f4f5" : "#18181b",
      marginBottom: 4,
    },
    subtitle: {
      fontSize: 14,
      color: isDark ? "#a1a1aa" : "#52525b",
    },
    cardBody: {
      padding: 24,
    },
    successBox: {
      backgroundColor: isDark ? "rgba(22, 163, 74, 0.2)" : "#f0fdf4",
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: isDark ? "#14532d" : "#bbf7d0",
      marginBottom: 24,
    },
    successText: {
      color: isDark ? "#86efac" : "#15803d",
      textAlign: 'center',
      fontWeight: "600",
    },
    avatarSection: {
      alignItems: 'center',
      marginBottom: 24,
    },
    avatarWrapper: {
      width: 120,
      height: 120,
      borderRadius: 60,
      padding: 4,
      backgroundColor: isDark ? "#000" : "#f4f4f5",
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      position: 'relative',
    },
    avatarImage: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
    },
    avatarPlaceholder: {
      width: '100%',
      height: '100%',
      borderRadius: 60,
      backgroundColor: isDark ? "#27272a" : "#e4e4e7",
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadBtn: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      backgroundColor: isDark ? "#f4f4f5" : "#18181b",
      width: 36,
      height: 36,
      borderRadius: 18,
      justifyContent: 'center',
      alignItems: 'center',
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    avatarHint: {
      marginTop: 12,
      fontSize: 12,
      color: isDark ? "#71717a" : "#a1a1aa",
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#27272a" : "#f4f4f5",
      marginBottom: 24,
    },
    formGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 14,
      fontWeight: "600",
      color: isDark ? "#e4e4e7" : "#3f3f46",
      marginBottom: 8,
    },
    input: {
      backgroundColor: isDark ? "#000" : "#fff",
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: isDark ? "#f4f4f5" : "#18181b",
    },
    disabledInput: {
      backgroundColor: isDark ? "rgba(39, 39, 42, 0.5)" : "#f8fafc",
      color: isDark ? "#71717a" : "#94a3b8",
    },
    errorText: {
      marginTop: 4,
      fontSize: 12,
      color: isDark ? "#fca5a5" : "#dc2626",
    },
    passwordSection: {
      marginTop: 16,
      padding: 16,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(39, 39, 42, 0.3)" : "#f8fafc",
      borderWidth: 1,
      borderColor: isDark ? "#27272a" : "#e4e4e7",
      marginBottom: 24,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: "600",
      color: isDark ? "#f4f4f5" : "#18181b",
      marginBottom: 16,
    },
    actions: {
      gap: 12,
    },
    btn: {
      paddingVertical: 16,
      borderRadius: 8,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // ✅ FIX: Added the missing btnText style here
    btnText: {
      fontSize: 16,
      fontWeight: "600",
      textAlign: "center",
    },
    primaryBtn: {
      backgroundColor: isDark ? "#f4f4f5" : "#18181b",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    primaryBtnText: {
      color: isDark ? "#18181b" : "#ffffff",
      fontWeight: "bold",
    },
    outlineBtn: {
      borderWidth: 1,
      borderColor: isDark ? "#3f3f46" : "#e4e4e7",
      backgroundColor: "transparent",
    },
    outlineBtnText: {
      color: isDark ? "#d4d4d8" : "#3f3f46",
    },
    btnDisabled: {
      opacity: 0.7,
    }
  });
}
// app/profile.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { getMe, updateMe } from "../lib/api";

/**
 * Updated Profile screen:
 * - Uses launchImageLibraryAsync without referencing deprecated constants
 * - Guards against missing/undefined uri from the picker result
 * - Uses functional setState when updating from async effects
 * - Shows clearer error messages and logs server responses for debugging
 */

export default function ProfileScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [profileImageUri, setProfileImageUri] = useState(null as string | null);
  const [previewUri, setPreviewUri] = useState(null as string | null);
  const [avatarForUpload, setAvatarForUpload] = useState<any | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState("");

  // Load user data
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const tokenJson = await AsyncStorage.getItem("authToken");
        const accessToken =
          (await AsyncStorage.getItem("accessToken")) ??
          (tokenJson ? JSON.parse(tokenJson).accessToken : null);

        if (!accessToken) {
          router.replace("/login");
          return;
        }

        const user = await getMe(accessToken);
        if (!mounted) return;

        setIsAuthenticated(true);
        // use functional update to avoid stale closure
        setFormData((prev) => ({ ...prev, name: user.name ?? "", email: user.email ?? "" }));

        if (user.avatar) {
          const maybeFileId = user.avatar.split("/").pop();
          const baseUrl = "https://hammad712-rohde-auth.hf.space";
          setProfileImageUri(maybeFileId ? `${baseUrl}/auth/avatar/${maybeFileId}` : user.avatar);
        }
      } catch (err) {
        console.error("[v0] load user error:", err);
        // If fetching user fails, route to login (session might be invalid)
        router.replace("/login");
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Image picker (updated to tolerate different expo-image-picker versions)
  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission required", "Permission to access photos is required.");
          return;
        }
      }

      // Do not reference deprecated constants. Passing only quality + allowsEditing is safe.
      const res = await ImagePicker.launchImageLibraryAsync({
        quality: 0.8,
        allowsEditing: true,
        aspect: [1, 1],
      });

      // new API returns { canceled, assets: [{ uri, ... }] }
      if (res.canceled) {
        return;
      }

      const asset = (res as any).assets?.[0];
      const uri = asset?.uri ?? (res as any).uri ?? null;

      if (!uri) {
        console.warn("Image picker returned no uri:", res);
        Alert.alert("Error", "Could not read the selected image. Please try again.");
        return;
      }

      // compute filename/mime safely
      const maybeName = uri.split("/").pop() ?? `avatar.jpg`;
      const match = /\.(\w+)$/.exec(maybeName);
      const ext = match ? match[1].toLowerCase() : "jpg";
      const mime = ext === "png" ? "image/png" : "image/jpeg";

      // On Android content URIs may be like content://..., still accepted by RN fetch when appended to FormData
      const avatarObject = {
        uri,
        name: maybeName,
        type: mime,
      };

      setPreviewUri(uri);
      setAvatarForUpload(avatarObject);
    } catch (err) {
      console.error("Image pick error:", err);
      Alert.alert("Error", "Could not pick image.");
    }
  };

  // Input handler
  const handleChange = (key: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  // Save profile: call updateMe from lib/api which expects a File-like object for avatar (RN accepts {uri,name,type})
  const handleSave = async () => {
    setErrors({});
    setSuccessMessage("");

    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email";

    if (formData.newPassword || formData.confirmPassword) {
      if (!formData.currentPassword) newErrors.currentPassword = "Current password required";
      if (formData.newPassword.length > 0 && formData.newPassword.length < 8)
        newErrors.newPassword = "Password must be at least 8 characters";
      if (formData.newPassword !== formData.confirmPassword)
        newErrors.confirmPassword = "Passwords do not match";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSaving(true);
    try {
      const tokenJson = await AsyncStorage.getItem("authToken");
      const accessToken =
        (await AsyncStorage.getItem("accessToken")) ??
        (tokenJson ? JSON.parse(tokenJson).accessToken : null);
      if (!accessToken) {
        router.replace("/login");
        return;
      }

      // If avatarForUpload exists, make sure it has uri,name,type — this is what fetch + FormData expects in RN
      const avatarToSend = avatarForUpload
        ? { uri: avatarForUpload.uri, name: avatarForUpload.name, type: avatarForUpload.type }
        : undefined;

      // call lib/api.updateMe which constructs a FormData and sends it
      // Cast avatarToSend to 'any' to bypass strict File/Blob type check in RN environment
      await updateMe(
        accessToken,
        formData.name,
        formData.email,
        formData.newPassword || undefined,
        avatarToSend as any
      );

      // show newly selected preview (local) as profile picture
      if (previewUri) {
        setProfileImageUri(previewUri);
        setPreviewUri(null);
        setAvatarForUpload(null);
      }

      setFormData((p) => ({ ...p, currentPassword: "", newPassword: "", confirmPassword: "" }));
      setSuccessMessage("Profile updated successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err: unknown) {
      // Provide more debugging info for upload failures
      console.error("[v0] save profile:", err);
      let msg = "Failed to save profile";
      if (err instanceof Error) msg = err.message;
      // show a helpful alert with the error message
      Alert.alert("Error", msg);
      setErrors({ submit: msg });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.multiRemove(["accessToken", "refreshToken", "tokenType", "authToken"]);
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <Text style={styles.headerSubtitle}>Manage your account information and preferences</Text>

        {successMessage ? <View style={styles.successBox}><Text style={styles.successText}>{successMessage}</Text></View> : null}
        {errors.submit ? <View style={styles.errorBox}><Text style={styles.errorText}>{errors.submit}</Text></View> : null}

        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatarOuter}>
            {previewUri || profileImageUri ? (
              <Image source={{ uri: previewUri || profileImageUri! }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>No image</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={pickImage} style={styles.avatarButton}>
            <Text style={styles.avatarButtonText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Name */}
        <Label>Full Name</Label>
        <Input value={formData.name} onChangeText={(v) => handleChange("name", v)} placeholder="Your full name" />
        {errors.name ? <Text style={styles.fieldError}>{errors.name}</Text> : null}

        {/* Email */}
        <Label>Email Address</Label>
        <Input
          value={formData.email}
          onChangeText={(v) => handleChange("email", v)}
          placeholder="you@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        {errors.email ? <Text style={styles.fieldError}>{errors.email}</Text> : null}

        {/* Password */}
        <View style={styles.passwordBox}>
          <Text style={styles.passwordTitle}>Change Password (Optional)</Text>

          <Label>Current Password</Label>
          <Input secureTextEntry value={formData.currentPassword} onChangeText={(v) => handleChange("currentPassword", v)} placeholder="Enter your current password" />
          {errors.currentPassword ? <Text style={styles.fieldError}>{errors.currentPassword}</Text> : null}

          <Label>New Password</Label>
          <Input secureTextEntry value={formData.newPassword} onChangeText={(v) => handleChange("newPassword", v)} placeholder="Enter your new password" />
          {errors.newPassword ? <Text style={styles.fieldError}>{errors.newPassword}</Text> : null}

          <Label>Confirm New Password</Label>
          <Input secureTextEntry value={formData.confirmPassword} onChangeText={(v) => handleChange("confirmPassword", v)} placeholder="Confirm your new password" />
          {errors.confirmPassword ? <Text style={styles.fieldError}>{errors.confirmPassword}</Text> : null}
        </View>

        <View style={styles.actionsRow}>
          <Button title={isSaving ? "Saving..." : "Save Changes"} onPress={handleSave} disabled={isSaving} />
          <Button title="Sign Out" variant="outline" onPress={handleLogout} />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingBottom: 40, backgroundColor: "#fff" },
  card: { backgroundColor: "#fff", borderRadius: 14, padding: 16, shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  headerTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  headerSubtitle: { textAlign: "center", color: "#6b7280", marginBottom: 12 },
  successBox: { backgroundColor: "#ecfdf5", padding: 10, borderRadius: 8, marginBottom: 10 },
  successText: { color: "#065f46" },
  errorBox: { backgroundColor: "#fee2e2", padding: 10, borderRadius: 8, marginBottom: 10 },
  errorText: { color: "#991b1b" },
  avatarWrap: { alignItems: "center", marginBottom: 12 },
  avatarOuter: { width: 120, height: 120, borderRadius: 60, overflow: "hidden", backgroundColor: "#f3f4f6", marginBottom: 8 },
  avatarImage: { width: "100%", height: "100%", resizeMode: "cover" },
  avatarPlaceholder: { flex: 1, justifyContent: "center", alignItems: "center" },
  avatarPlaceholderText: { color: "#9ca3af" },
  avatarButton: { backgroundColor: "#f97316", paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 },
  avatarButtonText: { color: "#fff", fontWeight: "700" },
  fieldError: { color: "#b91c1c", marginBottom: 8 },
  passwordBox: { backgroundColor: "#f9fafb", padding: 12, borderRadius: 10, marginTop: 12 },
  passwordTitle: { fontWeight: "600", marginBottom: 8 },
  actionsRow: { flexDirection: "row", gap: 10, justifyContent: "space-between", marginTop: 14 },
  loadingWrap: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 120 },
  loadingText: { marginTop: 8, color: "#6b7280" },
});
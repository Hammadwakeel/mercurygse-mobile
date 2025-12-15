// components/Sidebar.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import React, { useState } from "react";
import {
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ConversationRow from "./ConversationRow";
import SearchModal from "./SearchModal";
import SidebarSection from "./SidebarSection";
import ThemeToggle from "./ThemeToggle";

type Conversation = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string | number;
  pinned?: boolean;
  messages?: any[];
  messageCount?: number;
  folder?: string | null;
};

type Props = {
  conversations?: Conversation[];
  pinned?: Conversation[];
  recent?: Conversation[];
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  togglePin?: (id: string) => void;
  createNewChat?: () => void;
  userData?: { name?: string; role?: string } | null;
  userAvatar?: string | null;
  theme?: "light" | "dark";
  setTheme?: (t: "light" | "dark") => void;
  onClose?: () => void;
};

export default function Sidebar({
  conversations = [],
  pinned = [],
  recent = [],
  selectedId = null,
  onSelect = () => {},
  togglePin = () => {},
  createNewChat = () => {},
  userData = null,
  userAvatar = null,
  theme = "light",
  setTheme,
  onClose,
}: Props) {
  const router = useRouter();
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();

  const colors = {
    bg: isDarkMode ? "#09090b" : "#ffffff",
    border: isDarkMode ? "#27272a" : "#e6e6e6",
    text: isDarkMode ? "#e4e4e7" : "#0f172a",
    textMuted: isDarkMode ? "#a1a1aa" : "#6b7280",
    icon: isDarkMode ? "#e4e4e7" : "#111827",
    hoverBg: isDarkMode ? "#27272a" : "#f4f4f5",
    inputBg: isDarkMode ? "#18181b" : "#ffffff",
  };

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [query, setQuery] = useState("");

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0] ?? "").join("").toUpperCase().slice(0, 2);
  };

  const handleProfilePress = () => {
    router.push("/profile");
  };

  const pinnedList = pinned.length ? pinned : conversations.filter((c) => c.pinned);
  const recentList = recent.length ? recent : conversations.slice(0, 12);

  const containerStyle = [
    styles.container, 
    { 
      backgroundColor: colors.bg, 
      // CHANGED: Removed "+ 10" to reduce top space
      paddingTop: 10, 
      paddingBottom: insets.bottom 
    }
  ];

  return (
    <View style={containerStyle}>
      {/* Header: Brand + Close Button */}
      <View style={[styles.header, { borderColor: colors.border }]}>
        <View style={styles.brandRow}>
          <Image source={require("../assets/images/logo.jpeg")} style={styles.logo} />
          <Text style={[styles.brandText, { color: colors.text }]}>AI Mechanic</Text>
        </View>

        <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
          <X size={24} color={colors.icon} />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchWrap, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        <Ionicons name="search" size={16} color={colors.textMuted} style={{ marginLeft: 8 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search…"
          placeholderTextColor={colors.textMuted}
          style={[styles.searchInput, { color: colors.text }]}
          onFocus={() => setShowSearchModal(true)}
        />
      </View>

      <View style={styles.newChatWrap}>
        <TouchableOpacity onPress={createNewChat} style={styles.newChatBtn}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.newChatText}>Start New Chat</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.nav} contentContainerStyle={{ paddingBottom: 20 }}>
        <SidebarSection
          title="PINNED CHATS"
          icon={<Ionicons name="star" size={16} color={colors.textMuted} />}
          collapsed={false}
          onToggle={() => {}}
        >
          {pinnedList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Pin important threads.</Text>
            </View>
          ) : (
            pinnedList.map((c) => (
              <ConversationRow
                key={c.id}
                data={c}
                active={c.id === selectedId}
                onSelect={() => onSelect(c.id)}
                onTogglePin={() => togglePin(c.id)}
                showMeta={false}
              />
            ))
          )}
        </SidebarSection>

        <SidebarSection
          title="RECENT"
          icon={<Ionicons name="time" size={16} color={colors.textMuted} />}
          collapsed={false}
          onToggle={() => {}}
        >
          {recentList.length === 0 ? (
            <View style={[styles.emptyBox, { borderColor: colors.border }]}>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No conversations yet.</Text>
            </View>
          ) : (
            recentList.map((c) => (
              <ConversationRow
                key={c.id}
                data={c}
                active={c.id === selectedId}
                onSelect={() => onSelect(c.id)}
                onTogglePin={() => togglePin(c.id)}
                showMeta
              />
            ))
          )}
        </SidebarSection>
      </ScrollView>

      <View style={[styles.bottom, { borderColor: colors.border }]}>
        <View style={styles.bottomRow}>
          <TouchableOpacity style={styles.iconBtn}>
            <Ionicons name="settings-outline" size={18} color={colors.icon} />
          </TouchableOpacity>

          <View style={{ marginLeft: "auto" }}>
            <ThemeToggle theme={theme} setTheme={setTheme!} />
          </View>
        </View>

        {userData ? (
          <TouchableOpacity style={[styles.profileBtn, { backgroundColor: isDarkMode ? colors.hoverBg : '#f8fafc' }]} onPress={handleProfilePress}>
            <View style={styles.avatarWrap}>
              {userAvatar ? (
                <Image source={{ uri: userAvatar }} style={styles.avatar} />
              ) : (
                <View style={styles.initials}>
                  <Text style={styles.initialsText}>{getInitials(userData.name)}</Text>
                </View>
              )}
            </View>
            <View style={styles.profileTextWrap}>
              <Text numberOfLines={1} style={[styles.profileName, { color: colors.text }]}>
                {userData.name ?? "User"}
              </Text>
              <Text numberOfLines={1} style={[styles.profileRole, { color: colors.textMuted }]}>
                {userData.role === "user" ? "User" : userData.role ?? ""}
              </Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/login")}>
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>

      <SearchModal
        isVisible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        onSelect={(id) => { onSelect(id); setShowSearchModal(false); }}
        createNewChat={() => { createNewChat(); setShowSearchModal(false); }}
        selectedId={selectedId ?? undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
  },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 as any },
  logo: { width: 36, height: 36, borderRadius: 8, resizeMode: "cover" },
  brandText: { marginLeft: 8, fontWeight: "700", fontSize: 18 },
  
  searchWrap: {
    marginTop: 10,
    marginHorizontal: 12,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, marginLeft: 6, marginRight: 12, fontSize: 14 },
  
  newChatWrap: { paddingHorizontal: 12, paddingTop: 12 },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8 as any,
    backgroundColor: "#111827",
    paddingVertical: 10,
    borderRadius: 999,
  },
  newChatText: { color: "#fff", fontWeight: "600", marginLeft: 8 },
  
  nav: { marginTop: 12, paddingHorizontal: 8 },
  
  emptyBox: {
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 10,
    borderRadius: 10,
    margin: 8,
  },
  emptyText: { textAlign: "center", fontSize: 12 },
  
  bottom: {
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  bottomRow: { flexDirection: "row", alignItems: "center" },
  
  profileBtn: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10 as any,
    padding: 8,
    borderRadius: 12,
  },
  avatarWrap: {
    width: 44, height: 44, borderRadius: 22, overflow: "hidden",
    backgroundColor: "#111827", alignItems: "center", justifyContent: "center"
  },
  avatar: { width: "100%", height: "100%", resizeMode: "cover" },
  initials: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  initialsText: { color: "#fff", fontWeight: "700" },
  profileTextWrap: { flex: 1 },
  profileName: { fontWeight: "700", fontSize: 14 },
  profileRole: { fontSize: 12 },
  
  loginBtn: {
    marginTop: 10,
    backgroundColor: "#111827",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontWeight: "700" },
});
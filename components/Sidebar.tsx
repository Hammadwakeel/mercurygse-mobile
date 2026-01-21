import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import {
  Clock,
  Database,
  LogIn,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Search as SearchIcon
} from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

// Components
import ConversationRow from "./ConversationRow";
import SearchModal from "./SearchModal";
import SidebarSection from "./SidebarSection";
import ThemeToggle from "./ThemeToggle";

// API
import { api, ChatSession, User } from "../lib/api";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
  theme: "light" | "dark";
  setTheme: (theme: "light" | "dark") => void;
  collapsed: { recent: boolean; pinned?: boolean };
  setCollapsed: React.Dispatch<React.SetStateAction<any>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  sidebarCollapsed?: boolean;
  setSidebarCollapsed?: (collapsed: boolean) => void;
  conversations?: ChatSession[];
  userData: User | null;
  // ✅ FIX: Added userAvatar to props to satisfy the parent component
  userAvatar?: string; 
  onDeleteChat: (id: string) => void;
  createNewChat?: () => void;
}

let cachedConversations: ChatSession[] | null = null;
let cachedUser: User | null = null;

export default function Sidebar({
  open,
  onClose,
  theme,
  setTheme,
  collapsed,
  setCollapsed,
  selectedId,
  onSelect,
  sidebarCollapsed = false,
  setSidebarCollapsed = () => {},
  conversations: propConversations = [],
  userData: propUserData = null,
  // userAvatar is destructured but ignored in favor of userData
  userAvatar, 
  onDeleteChat,
  createNewChat
}: SidebarProps) {
  const router = useRouter();
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || "light";
  const isDark = currentTheme === "dark";

  const [mounted, setMounted] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const [internalConversations, setInternalConversations] = useState<ChatSession[]>(
    propConversations.length > 0 ? propConversations : (cachedConversations || [])
  );
  const [internalUser, setInternalUser] = useState<User | null>(cachedUser);
  const [loading, setLoading] = useState(!cachedConversations);

  const conversations = internalConversations;
  const userData = propUserData || internalUser;
  const hasFetched = useRef(!!cachedConversations);

  useEffect(() => {
    if (propConversations.length > 0) {
      setInternalConversations(propConversations);
    }
  }, [propConversations]);

  useEffect(() => {
    setMounted(true);

    if (propConversations.length === 0) {
      const fetchData = async () => {
        if (hasFetched.current) {
          setLoading(false);
          return;
        }
        hasFetched.current = true;

        const localUser = await AsyncStorage.getItem("user");
        if (localUser && !cachedUser) {
          try {
            const parsed = JSON.parse(localUser);
            setInternalUser(parsed);
            cachedUser = parsed;
          } catch (e) {}
        }

        try {
          setLoading(true);
          const [chatsResult, profileResult] = await Promise.allSettled([
            api.chat.list().catch(() => []),
            api.user.getProfile().catch(() => null)
          ]);

          if (chatsResult.status === "fulfilled") {
            const newChats = chatsResult.value || [];
            setInternalConversations(newChats);
            cachedConversations = newChats;
          }

          if (profileResult.status === "fulfilled" && profileResult.value) {
            setInternalUser(profileResult.value);
            cachedUser = profileResult.value;
            await AsyncStorage.setItem("user", JSON.stringify(profileResult.value));
          } else if (profileResult.status === "fulfilled" && !profileResult.value) {
            setInternalUser(null);
            cachedUser = null;
          }
        } catch (error) {
          console.error("Failed to fetch sidebar data", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    } else {
      setLoading(false);
    }
  }, [propConversations.length]);

  const handleCreateChat = () => {
    if (createNewChat) createNewChat();
    else onSelect(null);
    onClose(); 
  };

  const handleDeleteChat = async (id: string) => {
    if (onDeleteChat) {
      onDeleteChat(id);
    } else {
      try {
        const updated = internalConversations.filter((c) => c.id !== id);
        setInternalConversations(updated);
        cachedConversations = updated;

        if (selectedId === id) onSelect(null);
        await api.chat.delete(id);
        const chats = await api.chat.list();
        setInternalConversations(chats);
        cachedConversations = chats;
      } catch (e) {
        console.error("Delete failed", e);
      }
    }
  };

  const handleRenameChat = async (id: string, newTitle: string) => {
    try {
      const updated = internalConversations.map((c) =>
        c.id === id ? { ...c, title: newTitle } : c
      );
      setInternalConversations(updated);
      cachedConversations = updated;
      await api.chat.rename(id, newTitle);
      const chats = await api.chat.list();
      setInternalConversations(chats);
      cachedConversations = chats;
    } catch (e) {
      console.error("Rename failed", e);
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const styles = getStyles(isDark);
  const iconColor = isDark ? "#a1a1aa" : "#71717a";

  const renderUserSection = () => {
    if (!mounted) return <View style={styles.loadingUser} />;

    if (userData) {
      return (
        <TouchableOpacity
          // ✅ FIX: Cast route to 'any' to bypass strict typing if file is missing
          onPress={() => router.push("/profile" as any)}
          style={styles.userRow}
        >
          <View style={styles.avatarContainer}>
            {userData.avatar_url ? (
              <Image
                source={{ uri: userData.avatar_url }}
                style={styles.avatarImage}
              />
            ) : (
              <Text style={styles.avatarText}>
                {getInitials(userData.full_name || userData.email)}
              </Text>
            )}
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>
              {userData.full_name || "User"}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {userData.email}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <TouchableOpacity
        // ✅ FIX: Cast route to 'any'
        onPress={() => router.push("/login" as any)}
        style={styles.loginBtn}
      >
        <LogIn size={16} color="#fff" style={{ marginRight: 8 }} />
        <Text style={styles.loginText}>Log In</Text>
      </TouchableOpacity>
    );
  };

  if (sidebarCollapsed) {
    return (
        <View style={styles.collapsedContainer}>
             <TouchableOpacity onPress={() => setSidebarCollapsed(false)} style={styles.iconBtn}>
                 <PanelLeftOpen size={20} color={iconColor} />
             </TouchableOpacity>
             <View style={{ gap: 16, marginTop: 16, alignItems: 'center' }}>
                <TouchableOpacity onPress={handleCreateChat} style={styles.iconBtn}>
                    <Plus size={20} color={iconColor} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowSearchModal(true)} style={styles.iconBtn}>
                    <SearchIcon size={20} color={iconColor} />
                </TouchableOpacity>
                {userData?.role === 'admin' && (
                    // ✅ FIX: Cast route to 'any'
                    <TouchableOpacity onPress={() => router.push('/admin' as any)} style={styles.iconBtn}>
                        <Database size={20} color={iconColor} />
                    </TouchableOpacity>
                )}
             </View>
        </View>
    )
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => setShowSearchModal(true)}
            style={styles.iconBtn}
          >
            <SearchIcon size={20} color={iconColor} />
          </TouchableOpacity>

          <View style={styles.headerRight}>
            <TouchableOpacity
              onPress={() => setSidebarCollapsed(true)}
              style={[styles.iconBtn, { display: Platform.OS === 'web' ? 'flex' : 'none' }]} 
            >
              <PanelLeftClose size={20} color={iconColor} />
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <PanelLeftClose size={20} color={iconColor} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={{ padding: 12 }}>
          <TouchableOpacity
            onPress={handleCreateChat}
            style={styles.newChatBtn}
          >
            <Plus size={16} color={isDark ? "#000" : "#fff"} />
            <Text style={styles.newChatText}>Start New Chat</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollArea}>
          <SidebarSection
            icon={<Clock size={16} color={iconColor} />}
            title={"RECENT CHATS"}
            collapsed={collapsed.recent}
            onToggle={() => setCollapsed((s: any) => ({ ...s, recent: !s.recent }))}
            theme={theme}
          >
            {!mounted || (loading && !cachedConversations && propConversations.length === 0) ? (
              <ActivityIndicator size="small" color={iconColor} style={{ margin: 20 }} />
            ) : conversations.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No conversations yet.</Text>
              </View>
            ) : (
              conversations.map((c) => (
                <ConversationRow
                  key={c.id}
                  data={c}
                  active={c.id === selectedId}
                  onSelect={() => {
                    onSelect(c.id);
                    onClose();
                  }}
                  onRename={(newTitle: string) => handleRenameChat(c.id, newTitle)}
                  onDelete={() => handleDeleteChat(c.id)}
                  showMeta={true}
                  theme={theme}
                />
              ))
            )}
          </SidebarSection>
        </ScrollView>

        <View style={styles.footer}>
          <View style={styles.footerControls}>
            {userData?.role === "admin" && (
              <TouchableOpacity
                // ✅ FIX: Cast route to 'any'
                onPress={() => router.push("/admin" as any)}
                style={styles.iconBtn}
              >
                <Database size={20} color={iconColor} />
              </TouchableOpacity>
            )}
            <View style={userData?.role !== "admin" ? { marginLeft: 'auto' } : {}}>
                 <ThemeToggle theme={theme} setTheme={setTheme} />
            </View>
          </View>

          {renderUserSection()}
        </View>
      </View>

      <SearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        conversations={conversations}
        onSelect={onSelect}
        createNewChat={handleCreateChat}
        theme={theme}
      />
    </>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? "#09090b" : "#ffffff",
    borderRightWidth: 1,
    borderRightColor: isDark ? "#27272a" : "#e4e4e7",
  },
  collapsedContainer: {
    width: 64,
    height: '100%',
    alignItems: 'center',
    paddingTop: 12,
    backgroundColor: isDark ? "#09090b" : "#ffffff",
    borderRightWidth: 1,
    borderRightColor: isDark ? "#27272a" : "#e4e4e7",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 12,
  },
  headerRight: {
    flexDirection: "row",
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? "#27272a" : "#e4e4e7",
  },
  iconBtn: {
    padding: 8,
    borderRadius: 8,
  },
  newChatBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: isDark ? "#ffffff" : "#18181b",
    paddingVertical: 12,
    borderRadius: 999,
    gap: 8,
  },
  newChatText: {
    color: isDark ? "#000000" : "#ffffff",
    fontWeight: "600",
    fontSize: 14,
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 8,
  },
  emptyBox: {
    padding: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: isDark ? "#27272a" : "#e4e4e7",
    borderRadius: 8,
    alignItems: 'center',
  },
  emptyText: {
    color: isDark ? "#71717a" : "#a1a1aa",
    fontSize: 12,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: isDark ? "#27272a" : "#e4e4e7",
    padding: 12,
  },
  footerControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  loadingUser: {
    height: 48,
    backgroundColor: isDark ? "#27272a" : "#f4f4f5",
    borderRadius: 12,
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: isDark ? "#18181b" : "#f4f4f5",
    borderRadius: 12,
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: isDark ? "#ffffff" : "#18181b",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarText: {
    fontSize: 10,
    fontWeight: "bold",
    color: isDark ? "#000" : "#fff",
  },
  userInfo: {
    marginLeft: 8,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "500",
    color: isDark ? "#fff" : "#000",
  },
  userEmail: {
    fontSize: 12,
    color: isDark ? "#a1a1aa" : "#71717a",
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 12,
    borderRadius: 12,
  },
  loginText: {
    color: "#ffffff",
    fontWeight: "600",
  },
});
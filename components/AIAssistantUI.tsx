// components/AIAssistantUI.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    BackHandler,
    Platform,
    StatusBar,
    StyleSheet,
    TouchableOpacity,
    useWindowDimensions,
    View
} from "react-native";

import ChatPane from "./ChatPane";
import Header from "./Header";
import Sidebar from "./Sidebar";

import { getAvatarImage, getMe } from "../lib/api";
import {
    INITIAL_CONVERSATIONS,
    INITIAL_FOLDERS,
    INITIAL_TEMPLATES,
} from "./mockData";

// --- TEMPORARY: Basic GhostIconButton ---
function GhostIconButton({ label, children, onPress }: any) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
      {children}
    </TouchableOpacity>
  );
}

type Conversation = any;

export default function AIAssistantUI() {
  const { width } = useWindowDimensions();
  // We treat all screens as "mobile-like" for this full-screen drawer behavior
  const isMobile = true; 

  const [userData, setUserData] = useState<any | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  const [theme, setTheme] = useState<"light" | "dark">("light");

  // load theme
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem("theme");
        if (saved === "dark" || saved === "light") setTheme(saved);
        else setTheme("light");
      } catch {}
    })();
  }, []);

  // persist theme
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem("theme", theme);
      } catch {}
    })();
  }, [theme]);

  // user fetch
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const accessToken = await AsyncStorage.getItem("accessToken");
        if (accessToken) {
          const user = await getMe(accessToken);
          if (!mounted) return;
          setUserData(user);
          if (user?.avatar) {
            try {
              const avatarUrl = await getAvatarImage(user.avatar);
              if (avatarUrl && mounted) setUserAvatar(avatarUrl);
            } catch (err) {
              console.warn("avatar load failed", err);
            }
          }
        }
      } catch (error) {
        console.error("[v0] Error fetching user data:", error);
      } finally {
        if (mounted) setLoadingUser(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);
  
  const [conversations, setConversations] = useState<Conversation[]>(INITIAL_CONVERSATIONS || []);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES || []);
  const [folders, setFolders] = useState(INITIAL_FOLDERS || []);

  const [query, setQuery] = useState("");
  
  // State to toggle between Sidebar View and Chat View
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [isThinking, setIsThinking] = useState(false);
  const [thinkingConvId, setThinkingConvId] = useState<string | null>(null);

  // Handle hardware back button on Android to close sidebar instead of exiting app
  useEffect(() => {
    const backAction = () => {
      if (sidebarOpen) {
        setSidebarOpen(false);
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [sidebarOpen]);

  // derived lists
  const filtered = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        (c.title || "").toLowerCase().includes(q) ||
        (c.preview || "").toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const pinned = useMemo(
    () =>
      filtered
        .filter((c) => c.pinned)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)),
    [filtered]
  );

  const recent = useMemo(
    () =>
      filtered
        .filter((c) => !c.pinned)
        .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
        .slice(0, 10),
    [filtered]
  );

  useEffect(() => {
    if (!selectedId && conversations.length > 0) {
       setSelectedId(conversations[0].id);
    } else if (conversations.length === 0) {
       createNewChat();
    }
  }, []);

  // actions
  function togglePin(id: string) {
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)));
  }

  function createNewChat() {
    const id = Math.random().toString(36).slice(2);
    const now = new Date().toISOString();
    const item: Conversation = {
      id,
      title: "New Chat",
      updatedAt: now,
      messageCount: 0,
      preview: "Say hello to start...",
      pinned: false,
      folder: null,
      messages: [],
    };
    setConversations((prev) => [item, ...prev]);
    setSelectedId(id);
    setSidebarOpen(false); // Switch to chat view after creating
  }

  function createFolder() {
    if (Platform.OS === "ios" && Alert.prompt) {
      Alert.prompt("Folder name", undefined, (name) => {
        if (!name) return;
        if (folders.some((f) => f.name.toLowerCase() === name.toLowerCase())) {
          Alert.alert("Folder exists", "Folder already exists.");
          return;
        }
        setFolders((prev) => [...prev, { id: Math.random().toString(36).slice(2), name }]);
      });
      return;
    }
    Alert.alert("Create folder", "Feature not supported on this platform.", [{ text: "Ok" }]);
  }

  function sendMessage(convId: string, content: string) {
    if (!content.trim()) return;
    const now = new Date().toISOString();
    const userMsg = { id: Math.random().toString(36).slice(2), role: "user", content, createdAt: now };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = [...(c.messages || []), userMsg];
        return {
          ...c,
          messages: msgs,
          updatedAt: now,
          messageCount: msgs.length,
          preview: content.slice(0, 80),
        };
      })
    );

    setIsThinking(true);
    setThinkingConvId(convId);

    const currentConvId = convId;
    setTimeout(() => {
      setIsThinking(false);
      setThinkingConvId(null);
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== currentConvId) return c;
          const ack = `Got it — I'll help with that.`;
          const asstMsg = {
            id: Math.random().toString(36).slice(2),
            role: "assistant",
            content: ack,
            createdAt: new Date().toISOString(),
          };
          const msgs = [...(c.messages || []), asstMsg];
          return {
            ...c,
            messages: msgs,
            updatedAt: new Date().toISOString(),
            messageCount: msgs.length,
            preview: asstMsg.content.slice(0, 80),
          };
        })
      );
    }, 1200);
  }

  function editMessage(convId: string, messageId: string, newContent: string) {
    const now = new Date().toISOString();
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const msgs = (c.messages || []).map((m: any) =>
          m.id === messageId ? { ...m, content: newContent, editedAt: now } : m
        );
        return {
          ...c,
          messages: msgs,
          preview: msgs[msgs.length - 1]?.content?.slice(0, 80) || c.preview,
        };
      })
    );
  }

  function resendMessage(convId: string, messageId: string) {
    const conv = conversations.find((c) => c.id === convId);
    const msg = conv?.messages?.find((m: any) => m.id === messageId);
    if (!msg) return;
    sendMessage(convId, msg.content);
  }

  function pauseThinking() {
    setIsThinking(false);
    setThinkingConvId(null);
  }

  const composerRef = useRef<any>(null);
  const selected = conversations.find((c) => c.id === selectedId) || null;

  return (
    <View style={[styles.container, theme === "dark" ? styles.dark : styles.light]}>
      <StatusBar 
        translucent 
        backgroundColor="transparent" 
        barStyle={theme === "dark" ? "light-content" : "dark-content"} 
      />
      
      {/* LOGIC:
        If sidebarOpen is TRUE, we show ONLY the Sidebar (Fullscreen).
        If sidebarOpen is FALSE, we show ONLY the Chat (Fullscreen).
      */}

      {sidebarOpen ? (
        <Sidebar
          theme={theme}
          setTheme={setTheme}
          conversations={conversations}
          pinned={pinned}
          recent={recent}
          selectedId={selectedId}
          onSelect={(id: string) => {
            setSelectedId(id);
            setSidebarOpen(false); // Close sidebar on selection
          }}
          togglePin={togglePin}
          createNewChat={createNewChat}
          userData={userData}
          userAvatar={userAvatar}
          // Pass a prop to let Sidebar know how to close itself
          onClose={() => setSidebarOpen(false)}
        />
      ) : (
        <View style={styles.main}>
          {/* Header controls opening the sidebar now */}
          <Header 
            theme={theme} // <--- Pass theme here
            onOpenSidebar={() => setSidebarOpen(true)} 
          />
          <ChatPane
            ref={composerRef}
            conversation={selected}
            onSend={(content: string) => selected && sendMessage(selected.id, content)}
            onEditMessage={(messageId: string, newContent: string) => selected && editMessage(selected.id, messageId, newContent)}
            onResendMessage={(messageId: string) => selected && resendMessage(selected.id, messageId)}
            isThinking={isThinking && thinkingConvId === selected?.id}
            onPauseThinking={pauseThinking}
            userName={userData?.name}
            theme={theme}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  light: { backgroundColor: "#F8FAFB" },
  dark: { backgroundColor: "#0B1220" },
  main: {
    flex: 1,
    backgroundColor: "transparent",
  },
});
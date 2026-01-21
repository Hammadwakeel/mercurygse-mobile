// components/AIAssistantUI.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Components
import ChatPane from "./ChatPane";
import Header from "./Header";
import Sidebar from "./Sidebar";

// API
import { api, ChatSession, Message, User } from "../lib/api";

// Helper for UUID generation in RN if crypto is not polyfilled
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function AIAssistantUI() {
  const systemScheme = useColorScheme();
  const [mounted, setMounted] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);
  
  const [conversations, setConversations] = useState<ChatSession[]>([]);
  
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  
  // Refs for stream control
  const isStreamingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // On mobile, "collapsed" usually doesn't apply cleanly like desktop, 
  // but we keep the state to satisfy child prop requirements.
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false); 
  
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const composerRef = useRef<any>(null);

  // 1. Initialization
  useEffect(() => {
    setMounted(true);
    
    const init = async () => {
      // Theme Logic
      try {
        const savedTheme = await AsyncStorage.getItem("theme");
        if (savedTheme === 'dark' || savedTheme === 'light') {
          setTheme(savedTheme);
        } else {
          setTheme(systemScheme === 'dark' ? 'dark' : 'light');
        }

        const savedSidebar = await AsyncStorage.getItem("sidebar-collapsed-state");
        if (savedSidebar) setSidebarCollapsed(JSON.parse(savedSidebar));
      } catch (e) {}

      fetchData();
    };

    init();
  }, []);

  // 2. Persist Theme
  useEffect(() => {
    if (!mounted) return;
    AsyncStorage.setItem("theme", theme).catch(() => {});
  }, [theme, mounted]);

  const fetchData = async () => {
    try {
      const [user, chats] = await Promise.all([
        api.user.getProfile().catch(() => null),
        api.chat.list().catch(() => [])
      ]);
      
      if (user) setUserData(user);
      if (chats) setConversations(chats);
    } catch (e) { console.error(e); }
  };

  const refreshConversations = async () => {
     const chats = await api.chat.list().catch(() => []);
     setConversations(chats);
  };

  // Prevent clearing messages if AI is currently streaming
  useEffect(() => {
    if (isStreamingRef.current) return; 

    if (!selectedId || selectedId.startsWith("new_")) {
        setMessages([]);
        return;
    }

    const loadMessages = async () => {
      try {
        const msgs = await api.chat.getDetails(selectedId);
        setMessages(msgs || []);
      } catch (e) {
        console.error("Failed to load messages", e);
      }
    };
    loadMessages();
  }, [selectedId]);

  const createNewChat = () => {
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setSelectedId(null);
    setMessages([]);
    setSidebarOpen(false);
  };

  const handlePauseThinking = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
    }
    setIsThinking(false);
    isStreamingRef.current = false;
  };

  const handleSend = async (content: string) => {
    if (!content.trim()) return;

    if (abortControllerRef.current) abortControllerRef.current.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    const tempUserMsg: Message = {
      id: generateUUID(), 
      chat_id: selectedId || "temp",
      role: "user",
      content: content,
      created_at: new Date().toISOString(),
      is_summarized: false
    };
    
    const tempAiMsg: Message = {
      id: generateUUID(),
      chat_id: selectedId || "temp",
      role: "assistant",
      content: "",
      created_at: new Date().toISOString(),
      is_summarized: false
    };

    isStreamingRef.current = true;
    setIsThinking(true);
    setMessages(prev => [...prev, tempUserMsg, tempAiMsg]);

    let currentResponse = "";
    let activeThreadId = selectedId;

    await api.streamMessage(
      content,
      selectedId,
      (chunk, newThreadId) => {
        currentResponse += chunk;
        if (newThreadId && !activeThreadId) {
            activeThreadId = newThreadId;
            setSelectedId(newThreadId);
            refreshConversations(); 
        }
        setMessages(prev => {
            const newArr = [...prev];
            const lastIdx = newArr.length - 1;
            if (lastIdx >= 0 && newArr[lastIdx].role === "assistant") {
                newArr[lastIdx] = { ...newArr[lastIdx], content: currentResponse };
            }
            return newArr;
        });
      },
      (error) => {
        console.error("Stream error:", error);
        setMessages(prev => [...prev, { 
            id: "err", chat_id: "err", role: "assistant", 
            content: "Error: " + error, created_at: new Date().toISOString(), is_summarized: false 
        }]);
      },
      async () => {
        setIsThinking(false);
        isStreamingRef.current = false;
        abortControllerRef.current = null;
        
        // Refresh to get real IDs from DB
        if (activeThreadId) {
            try {
                const fresh = await api.chat.getDetails(activeThreadId);
                if (fresh) setMessages(fresh);
            } catch (e) {}
        }
      },
      ac.signal
    );
  };

  const handleEditMessage = async (msgId: string, newContent: string) => {
    // 1. Abort any running streams
    if (abortControllerRef.current) abortControllerRef.current.abort();
    const ac = new AbortController();
    abortControllerRef.current = ac;

    // 2. Manipulate State
    setMessages(prev => {
        const msgIndex = prev.findIndex(m => m.id === msgId);
        if (msgIndex === -1) return prev;

        const history = prev.slice(0, msgIndex);
        const updatedUserMsg = { ...prev[msgIndex], content: newContent };

        const newAiMsg: Message = {
            id: generateUUID(),
            chat_id: selectedId || "",
            role: "assistant",
            content: "",
            created_at: new Date().toISOString(),
            is_summarized: false
        };

        return [...history, updatedUserMsg, newAiMsg];
    });
    
    // 3. Set flags for UI
    isStreamingRef.current = true;
    setIsThinking(true);

    let currentResponse = "";

    // 4. Call API
    await api.editMessage(
        msgId, 
        newContent,
        (chunk) => {
            currentResponse += chunk;
            setMessages(prev => {
                const newArr = [...prev];
                const lastIdx = newArr.length - 1;
                if (lastIdx >= 0 && newArr[lastIdx].role === "assistant") {
                    newArr[lastIdx] = { ...newArr[lastIdx], content: currentResponse };
                }
                return newArr;
            });
        },
        async () => {
            setIsThinking(false);
            isStreamingRef.current = false;
            abortControllerRef.current = null;

            if (selectedId) {
                try {
                    const freshMsgs = await api.chat.getDetails(selectedId);
                    if (freshMsgs) setMessages(freshMsgs);
                } catch (e) { console.error(e); }
            }
        },
        ac.signal
    );
  };

  const handleDeleteChat = async (id: string) => {
    try {
        await api.chat.delete(id);
        setConversations(prev => prev.filter(c => c.id !== id));
        if (selectedId === id) {
            setSelectedId(null);
            setMessages([]);
        }
    } catch (e) { console.error(e); }
  };

  if (!mounted) {
    // Loading state
    return <View style={[styles.container, styles.loadingBg]} />;
  }
  
  const activeConversation = {
      id: selectedId || "new",
      title: selectedId ? "Chat" : "New Chat",
      messages: messages,
      updatedAt: new Date().toISOString(),
      preview: "",
      pinned: false,
      folder: "",
      messageCount: messages.length
  };

  const activeChat = conversations.find(c => c.id === selectedId);
  const displayTitle = activeChat ? activeChat.title : (selectedId ? "Chat" : "New Chat");

  const isDark = theme === 'dark';
  const bgStyle = { backgroundColor: isDark ? "#09090b" : "#F8FAFB" };

  return (
    <SafeAreaView style={[styles.container, bgStyle]}>
      <StatusBar 
        barStyle={isDark ? "light-content" : "dark-content"} 
        backgroundColor={isDark ? "#09090b" : "#F8FAFB"}
      />
      
      {/* Layout Strategy: 
        1. Main Chat Area serves as the base layer.
        2. Sidebar sits on top (absolute) if visible.
      */}
      
      <View style={styles.mainContent}>
        <Header 
             sidebarCollapsed={sidebarCollapsed} 
             // In RN, we usually "open" the sidebar, so logic might differ slightly from desktop toggle
             setSidebarOpen={() => setSidebarOpen(true)} 
             title={displayTitle} 
             userData={userData}
             createNewChat={createNewChat}
             theme={theme}
        />
        
        <ChatPane
          ref={composerRef}
          conversation={activeConversation}
          onSend={handleSend}
          onEditMessage={handleEditMessage} 
          onResendMessage={() => {}} 
          isThinking={isThinking}
          onPauseThinking={handlePauseThinking}
          userName={userData?.full_name}
          theme={theme}
        />
      </View>

      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <View style={StyleSheet.absoluteFill}>
            {/* Transparent backdrop to close on click */}
            <View 
                style={styles.backdrop} 
                onTouchEnd={() => setSidebarOpen(false)} 
            />
            {/* The Sidebar Itself - We constrain width to 80% */}
            <View style={[styles.sidebarWrapper, { backgroundColor: isDark ? "#18181b" : "#fff" }]}>
                <Sidebar
                    open={sidebarOpen}
                    onClose={() => setSidebarOpen(false)}
                    theme={theme}
                    setTheme={setTheme}
                    collapsed={{ recent: false }} 
                    setCollapsed={() => {}}
                    selectedId={selectedId}
                    onSelect={(id) => {
                        setSelectedId(id);
                        setSidebarOpen(false); 
                    }}
                    sidebarCollapsed={sidebarCollapsed}
                    setSidebarCollapsed={(v) => {
                        setSidebarCollapsed(v);
                        AsyncStorage.setItem("sidebar-collapsed-state", JSON.stringify(v)).catch(()=>{});
                    }}
                    conversations={conversations} 
                    userData={userData}
                    userAvatar={userData?.avatar_url}
                    onDeleteChat={handleDeleteChat}
                    createNewChat={createNewChat}
                />
            </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingBg: {
    backgroundColor: "#F8FAFB",
  },
  mainContent: {
    flex: 1,
    flexDirection: 'column',
    position: 'relative',
    zIndex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  sidebarWrapper: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: '85%', // Mobile drawer width
    maxWidth: 320,
    zIndex: 100,
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  }
});
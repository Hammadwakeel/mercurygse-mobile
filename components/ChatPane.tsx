import * as Clipboard from 'expo-clipboard';
import { Bot, Check, Copy, Pencil, Sparkles } from 'lucide-react-native';
import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import Markdown from 'react-native-markdown-display';

// API Types
import { Message as MessageType } from "../lib/api";

import Composer, { ComposerHandle } from "./Composer";

export interface ChatPaneHandle {
  insertTemplate: (content: string) => void;
  focus: () => void;
}

interface ChatPaneProps {
  conversation: {
    id: string
    title: string
    messages: MessageType[]
    updatedAt: string
    preview: string
    pinned: boolean
    folder: string
    messageCount: number
  } | null
  onSend: (content: string) => void
  onEditMessage: (messageId: string, newContent: string) => void
  onResendMessage: (messageId: string) => void
  isThinking: boolean
  onPauseThinking: () => void
  userName?: string
  userAvatar?: string
  theme?: "light" | "dark" // Keeping strict type here
}

const ChatPane = forwardRef<ChatPaneHandle, ChatPaneProps>(function ChatPane(
  { conversation, onSend, onEditMessage, onResendMessage, isThinking, onPauseThinking, userName, userAvatar, theme },
  ref,
) {
  const systemScheme = useColorScheme();
  
  // ✅ FIX: Safer logic for determining dark mode
  // If 'theme' prop is provided, use it. Otherwise fallback to systemScheme.
  // We default to 'light' if both are undefined/null.
  const activeScheme = theme ?? systemScheme ?? "light";
  const isDark = activeScheme === "dark";

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  
  const scrollViewRef = useRef<ScrollView>(null);
  const internalComposerRef = useRef<ComposerHandle>(null);

  const scrollToBottom = () => {
    if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
        scrollToBottom();
    }, 100);
    return () => clearTimeout(timer);
  }, [conversation?.messages, isThinking]);

  useImperativeHandle(ref, () => ({
      insertTemplate: (templateContent: string) => {
        internalComposerRef.current?.insertTemplate(templateContent);
      },
      focus: () => {
        internalComposerRef.current?.focus();
      }
  }), []);

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const styles = getStyles(isDark);
  const markdownStyles = getMarkdownStyles(isDark);

  if (!conversation) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Sparkles size={32} color={isDark ? "#a1a1aa" : "#a1a1aa"} />
        </View>
        <Text style={styles.emptyTitle}>AI Assistant</Text>
        <Text style={styles.emptyDesc}>
          Select a conversation from the sidebar or start a new chat to begin.
        </Text>
      </View>
    );
  }

  const messages = conversation.messages || [];

  return (
    <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0} 
    >
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        onContentSizeChange={() => scrollToBottom()} 
      >
        {messages.map((msg, index) => {
            // const isLastMessage = index === messages.length - 1; // Unused
            const isUser = msg.role === "user";

            return (
            <View 
              key={msg.id} 
              style={[
                styles.messageRow, 
                isUser ? styles.rowReverse : styles.row
              ]}
            >
              
              <View style={[
                styles.avatarContainer,
                isUser ? styles.avatarUser : styles.avatarBot
              ]}>
                {isUser ? (
                    userAvatar ? (
                        <Image source={{ uri: userAvatar }} style={styles.avatarImage} />
                    ) : (
                        <Text style={styles.avatarText}>{getInitials(userName)}</Text>
                    )
                ) : (
                    <Bot size={16} color={isDark ? "#60a5fa" : "#2563eb"} />
                )}
              </View>

              <View style={[
                  styles.contentWrapper,
                  isUser ? styles.alignEnd : styles.alignStart
              ]}>

                {editingId === msg.id ? (
                  <View style={styles.editContainer}>
                    <TextInput
                      value={draft}
                      onChangeText={setDraft}
                      multiline
                      style={styles.editInput}
                      autoFocus
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.actionBtn, styles.saveBtn]} 
                        onPress={() => {
                            onEditMessage(msg.id, draft);
                            setEditingId(null);
                        }}
                      >
                        <Check size={14} color={isDark ? "#000" : "#fff"} />
                        <Text style={styles.saveBtnText}>Save</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={styles.actionBtn} 
                        onPress={() => setEditingId(null)}
                      >
                         <Text style={styles.cancelBtnText}>Cancel</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View style={[
                      styles.bubble,
                      isUser ? styles.bubbleUser : styles.bubbleBot
                  ]}>
                     {msg.content ? (
                        <View style={styles.markdownWrapper}>
                            <Markdown style={markdownStyles}>
                                {msg.content}
                            </Markdown>
                        </View>
                     ) : (
                        <View style={styles.thinkingContainer}>
                             <Text style={styles.thinkingText}>Thinking</Text>
                             <ActivityIndicator size="small" color="#9ca3af" style={{marginLeft: 8}} />
                        </View>
                     )}
                  </View>
                )}
                
                {!editingId && !isThinking && (
                   <View style={[
                       styles.metaActions,
                       isUser ? styles.justifyEnd : styles.justifyStart
                   ]}>
                      {isUser && (
                         <TouchableOpacity 
                            onPress={() => { setEditingId(msg.id); setDraft(msg.content); }} 
                            style={styles.iconBtn}
                         >
                           <Pencil size={14} color="#9ca3af" />
                         </TouchableOpacity>
                      )}
                      {!isUser && (
                         <TouchableOpacity 
                            onPress={() => handleCopy(msg.content)} 
                            style={styles.iconBtn}
                         >
                             <Copy size={14} color="#9ca3af" />
                         </TouchableOpacity>
                      )}
                   </View>
                )}
              </View>
            </View>
            );
        })}
      </ScrollView>

      <View style={styles.composerWrapper}>
         <Composer 
            ref={internalComposerRef} 
            onSend={onSend} 
            busy={isThinking} 
            theme={isDark ? 'dark' : 'light'}
         />
      </View>
    </KeyboardAvoidingView>
  );
});

export default ChatPane;

// --- STYLES ---

const getStyles = (isDark: boolean) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: isDark ? "#09090b" : "#ffffff",
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: isDark ? "#09090b" : "#ffffff",
    },
    emptyIconCircle: {
        marginBottom: 16,
        padding: 16,
        borderRadius: 999,
        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        color: isDark ? "#f4f4f5" : "#18181b",
    },
    emptyDesc: {
        maxWidth: 300,
        textAlign: 'center',
        fontSize: 14,
        color: "#71717a",
    },
    scrollArea: {
        flex: 1,
    },
    scrollContent: {
        paddingVertical: 16,
        paddingHorizontal: 12,
        paddingBottom: 40,
    },
    messageRow: {
        flexDirection: 'row',
        marginBottom: 24,
        width: '100%',
        maxWidth: 800, // Tablet constraint
        alignSelf: 'center',
    },
    row: {
        flexDirection: 'row',
    },
    rowReverse: {
        flexDirection: 'row-reverse',
    },
    avatarContainer: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        marginTop: 4,
        overflow: 'hidden',
    },
    avatarUser: {
        marginLeft: 12,
        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
        borderColor: isDark ? "#27272a" : "#e4e4e7",
    },
    avatarBot: {
        marginRight: 12,
        backgroundColor: isDark ? "#172554" : "#eff6ff",
        borderColor: isDark ? "#1e3a8a" : "#bfdbfe",
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: isDark ? "#a1a1aa" : "#71717a",
    },
    contentWrapper: {
        flex: 1,
        flexDirection: 'column',
    },
    alignStart: {
        alignItems: 'flex-start',
    },
    alignEnd: {
        alignItems: 'flex-end',
    },
    bubble: {
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 16,
        borderWidth: 1,
        maxWidth: '100%',
    },
    bubbleUser: {
        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderTopRightRadius: 2,
    },
    bubbleBot: {
        backgroundColor: "transparent",
        borderColor: "transparent", 
        borderTopLeftRadius: 2,
        paddingLeft: 0, 
    },
    markdownWrapper: {
        // minWidth: 50, // Removed to prevent layout shifts
    },
    thinkingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
    },
    thinkingText: {
        color: "#9ca3af",
        fontSize: 14,
    },
    metaActions: {
        flexDirection: 'row',
        marginTop: 4,
        opacity: 0.8,
    },
    justifyStart: {
        justifyContent: 'flex-start',
    },
    justifyEnd: {
        justifyContent: 'flex-end',
    },
    iconBtn: {
        padding: 6,
    },
    editContainer: {
        width: '100%',
        maxWidth: '85%',
        marginTop: 8,
    },
    editInput: {
        backgroundColor: isDark ? "#18181b" : "#ffffff",
        color: isDark ? "#fff" : "#000",
        borderWidth: 1,
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderRadius: 8,
        padding: 10,
        minHeight: 100,
        textAlignVertical: 'top',
    },
    editActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 8,
        gap: 8,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    saveBtn: {
        backgroundColor: isDark ? "#fff" : "#000",
    },
    saveBtnText: {
        color: isDark ? "#000" : "#fff",
        fontSize: 12,
        fontWeight: '600',
        marginLeft: 4,
    },
    cancelBtnText: {
        color: isDark ? "#a1a1aa" : "#71717a",
        fontSize: 12,
    },
    composerWrapper: {
        padding: 16,
        borderTopWidth: 1,
        borderTopColor: isDark ? "#27272a" : "#e4e4e7",
        backgroundColor: isDark ? "#09090b" : "#ffffff",
    }
});

const getMarkdownStyles = (isDark: boolean) => StyleSheet.create({
    body: {
        color: isDark ? "#e4e4e7" : "#18181b",
        fontSize: 15,
        lineHeight: 24,
    },
    heading1: {
        color: isDark ? "#fff" : "#000",
        fontSize: 22,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    heading2: {
        color: isDark ? "#fff" : "#000",
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 10,
        marginBottom: 8,
    },
    code_inline: {
        backgroundColor: isDark ? "#27272a" : "#f4f4f5",
        color: isDark ? "#e4e4e7" : "#18181b",
        borderRadius: 4,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    },
    code_block: {
        backgroundColor: isDark ? "#18181b" : "#27272a",
        borderRadius: 8,
        padding: 12,
        marginVertical: 8,
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderWidth: 1,
    },
    fence: {
        backgroundColor: isDark ? "#18181b" : "#27272a",
        borderColor: isDark ? "#3f3f46" : "#e4e4e7",
        borderRadius: 8,
        padding: 10,
        color: isDark ? "#e4e4e7" : "#e4e4e7",
    },
    link: {
        color: "#3b82f6",
    },
    list_item: {
        marginVertical: 4,
    }
});
// components/ChatPane.tsx
import { Check, Pencil, Square, X } from "lucide-react-native";
import React, {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
} from "react";
import {
    Animated, // <--- ADDED THIS IMPORT
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";
import Composer from "./Composer";
import Message from "./Message";

type MessageItem = {
  id: string;
  role: "user" | "assistant" | string;
  content: string;
};

type Conversation = {
  id: string;
  title?: string;
  updatedAt?: string;
  messages?: MessageItem[];
  messageCount?: number;
};

type Props = {
  conversation?: Conversation | null;
  onSend?: (text: string) => Promise<void> | void;
  onEditMessage?: (id: string, newContent: string) => void;
  onResendMessage?: (id: string) => void;
  isThinking?: boolean;
  onPauseThinking?: () => void;
  userName?: string;
  theme?: "light" | "dark"; 
};

const ChatPane = forwardRef(function ChatPane(
  {
    conversation,
    onSend,
    onEditMessage,
    onResendMessage,
    isThinking,
    onPauseThinking,
    userName,
    theme = "light",
  }: Props,
  ref,
) {
  const isDarkMode = theme === 'dark';

  const colors = {
    bg: isDarkMode ? "#09090b" : "#ffffff",      
    text: isDarkMode ? "#e4e4e7" : "#0f172a",    
    textMuted: isDarkMode ? "#a1a1aa" : "#6b7280", 
    border: isDarkMode ? "#27272a" : "#e5e7eb",  
    cardBg: isDarkMode ? "#18181b" : "#fafafa",  
    icon: isDarkMode ? "#e4e4e7" : "#111827",    
    inputBg: isDarkMode ? "#18181b" : "#ffffff",
    placeholder: isDarkMode ? "#71717a" : "#9ca3af",
  };

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const composerRef = useRef<any>(null);
  const scrollRef = useRef<ScrollView | null>(null);
  const inputRef = useRef<TextInput | null>(null);

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        composerRef.current?.insertTemplate?.(templateContent);
      },
    }),
    [],
  );

  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 120);
  }, [conversation?.messages?.length, isThinking]);

  if (!conversation) return null;

  const messages: MessageItem[] = Array.isArray(conversation.messages)
    ? conversation.messages
    : [];

  function startEdit(m: MessageItem) {
    setEditingId(m.id);
    setDraft(m.content);
    setTimeout(() => inputRef.current?.focus?.(), 100);
  }
  function cancelEdit() {
    setEditingId(null);
    setDraft("");
    Keyboard.dismiss();
  }
  function saveEdit() {
    if (!editingId) return;
    onEditMessage?.(editingId, draft);
    cancelEdit();
  }
  function saveAndResend() {
    if (!editingId) return;
    onEditMessage?.(editingId, draft);
    onResendMessage?.(editingId);
    cancelEdit();
  }

  return (
    <KeyboardAvoidingView 
      style={[styles.container, { backgroundColor: colors.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messagesWrap}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 ? (
          <View style={styles.emptyWrap} />
        ) : (
          <>
            {messages.map((m) => (
              <View key={m.id} style={styles.messageRow}>
                {editingId === m.id ? (
                  <View style={[styles.editBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
                    <TextInput
                      ref={inputRef}
                      value={draft}
                      onChangeText={setDraft}
                      style={[styles.editInput, { color: colors.text }]}
                      placeholderTextColor={colors.placeholder}
                      multiline
                      placeholder="Edit message..."
                    />
                    <View style={styles.editActions}>
                      <TouchableOpacity 
                        style={[styles.saveBtn, { backgroundColor: colors.icon }]} 
                        onPress={saveEdit}
                      >
                        <Check size={16} color={isDarkMode ? "#000" : "#fff"} />
                        <Text style={[styles.saveBtnText, { color: isDarkMode ? "#000" : "#fff" }]}> Save</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[styles.saveResendBtn, { borderColor: colors.border }]} 
                        onPress={saveAndResend}
                      >
                        <Text style={[styles.saveResendText, { color: colors.text }]}> Save & Resend</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelEdit}>
                        <X size={18} color={colors.icon} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <Message role={m.role}>
                    {/* Vertical Stack: Text Top, Icon Bottom */}
                    <View style={{ flexDirection: 'column' }}>
                      <Text style={{ color: m.role === "user" ? "#fff" : colors.text }}>
                        {m.content}
                      </Text>

                      {m.role === "user" && (
                        <View style={styles.msgMeta}>
                          <TouchableOpacity onPress={() => startEdit(m)} style={styles.metaBtn}>
                            <Pencil size={14} color="rgba(255,255,255,0.6)" />
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </Message>
                )}
              </View>
            ))}

            {isThinking && <ThinkingMessage onPause={onPauseThinking} colors={colors} />}
          </>
        )}
      </ScrollView>

      <Composer
        ref={composerRef}
        onSend={async (text: string) => {
          if (!text.trim()) return;
          setBusy(true);
          await onSend?.(text);
          setBusy(false);
        }}
        busy={busy}
        theme={theme} 
      />
    </KeyboardAvoidingView>
  );
});

export default ChatPane;

function ThinkingMessage({ onPause, colors }: { onPause?: () => void, colors: any }) {
  const anim1 = useRef(new Animated.Value(0)).current;
  const anim2 = useRef(new Animated.Value(0)).current;
  const anim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay = 0) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true, delay }),
          Animated.timing(anim, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ).start();

    createPulse(anim1, 0);
    createPulse(anim2, 120);
    createPulse(anim3, 240);

    return () => {
      anim1.stopAnimation();
      anim2.stopAnimation();
      anim3.stopAnimation();
    };
  }, []);

  return (
    <Message role="assistant">
      <View style={thinkingStyles.container}>
        <View style={thinkingStyles.dots}>
          <Animated.View style={[thinkingStyles.dot, { opacity: anim1, backgroundColor: colors.textMuted }]} />
          <Animated.View style={[thinkingStyles.dot, { opacity: anim2, marginHorizontal: 6, backgroundColor: colors.textMuted }]} />
          <Animated.View style={[thinkingStyles.dot, { opacity: anim3, backgroundColor: colors.textMuted }]} />
        </View>

        <Text style={[thinkingStyles.text, { color: colors.textMuted }]}>AI is thinking...</Text>

        <TouchableOpacity style={thinkingStyles.pauseBtn} onPress={onPause}>
          <Square size={14} color={colors.text} />
          <Text style={[thinkingStyles.pauseText, { color: colors.text }]}> Pause</Text>
        </TouchableOpacity>
      </View>
    </Message>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  messagesWrap: { paddingTop: 0, paddingBottom: 8 },
  emptyWrap: { flex: 1 }, 
  messageRow: { paddingHorizontal: 6 },
  editBox: { borderRadius: 10, borderWidth: 1, padding: 8 },
  editInput: { minHeight: 56, maxHeight: 180, padding: 8, textAlignVertical: "top" },
  editActions: { flexDirection: "row", marginTop: 8, alignItems: "center" },
  saveBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, flexDirection: "row", alignItems: "center" },
  saveBtnText: { fontWeight: "600", marginLeft: 6 },
  saveResendBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, borderWidth: 1, marginLeft: 8, flexDirection: "row", alignItems: "center" },
  saveResendText: { marginLeft: 6 },
  cancelBtn: { marginLeft: 8, padding: 6 },
  
  // Icon aligned to the right, under text
  msgMeta: { 
    flexDirection: "row", 
    marginTop: 4, 
    alignSelf: 'flex-end', 
  },
  metaBtn: { 
    padding: 4, 
  },
});

const thinkingStyles = StyleSheet.create({
  container: { flexDirection: "row", alignItems: "center", gap: 10 as any },
  dots: { flexDirection: "row", alignItems: "center" },
  dot: { width: 8, height: 8, borderRadius: 8 },
  text: { marginLeft: 10 },
  pauseBtn: { marginLeft: "auto", flexDirection: "row", alignItems: "center" },
  pauseText: { marginLeft: 6 },
});
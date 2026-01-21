import { Clock, Plus, Search as SearchIcon, X } from "lucide-react-native";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SectionList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { ChatSession } from "../lib/api";

// --- Utils ---
function getTimeGroup(dateString: string) {
  if (!dateString) return "Older";
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "Previous 7 Days";
  return "Older";
}

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: ChatSession[];
  onSelect: (id: string) => void;
  createNewChat: () => void;
  theme?: "light" | "dark";
}

export default function SearchModal({
  isOpen,
  onClose,
  conversations,
  onSelect,
  createNewChat,
  theme,
}: SearchModalProps) {
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || "light";
  const isDark = currentTheme === "dark";
  const styles = getStyles(isDark);

  const [query, setQuery] = useState("");

  // --- Data Logic ---
  // 1. Filter
  const filteredConversations = useMemo(() => {
    if (!query.trim()) return conversations;
    const q = query.toLowerCase();
    return conversations.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        // Fix: Cast to 'any' to check preview if it exists at runtime, or fallback to false
        ((c as any).preview && (c as any).preview.toLowerCase().includes(q))
    );
  }, [conversations, query]);

  // 2. Group for SectionList
  const sections = useMemo(() => {
    const groups: Record<string, ChatSession[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    // Sort and bucket
    filteredConversations
      .slice() // Clone to avoid mutating props
      .sort((a, b) => {
        // Fix: Use created_at since updatedAt doesn't exist on type
        const dateA = new Date(a.created_at).getTime();
        const dateB = new Date(b.created_at).getTime();
        return dateB - dateA;
      }) 
      .forEach((conv) => {
        // Fix: Use created_at
        const group = getTimeGroup(conv.created_at || new Date().toISOString());
        if (groups[group]) groups[group].push(conv);
        else groups["Older"].push(conv); 
      });

    // Transform to SectionList format: [{ title: 'Today', data: [...] }]
    const results = Object.entries(groups)
      .map(([title, data]) => ({ title, data }))
      .filter((section) => section.data.length > 0);

    return results;
  }, [filteredConversations]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  const handleNewChat = () => {
    createNewChat();
    handleClose();
  };

  const handleSelectConversation = (id: string) => {
    onSelect(id);
    handleClose();
  };

  // --- Render Components ---

  const renderSectionHeader = ({ section: { title } }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderItem = ({ item }: { item: ChatSession }) => (
    <TouchableOpacity
      onPress={() => handleSelectConversation(item.id)}
      style={styles.row}
    >
      <Clock size={16} color="#a1a1aa" style={styles.rowIcon} />
      <View style={styles.rowContent}>
        <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.rowPreview} numberOfLines={1}>
           {/* Fix: Check if preview exists, otherwise use fallback */}
          {(item as any).preview || "No preview available"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      {/* Backdrop */}
      <View style={styles.backdrop}>
        {/* Close on tap outside */}
        <Pressable style={styles.backdropPressable} onPress={handleClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
          pointerEvents="box-none"
        >
          {/* Modal Content */}
          <View style={styles.modalCard}>
            
            {/* Header */}
            <View style={styles.header}>
              <SearchIcon size={20} color="#a1a1aa" style={{ marginRight: 10 }} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search chats..."
                placeholderTextColor="#a1a1aa"
                style={styles.input}
                autoFocus={true} // Auto focus when modal opens
                clearButtonMode="while-editing"
              />
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <X size={20} color={isDark ? "#fff" : "#000"} />
              </TouchableOpacity>
            </View>

            {/* List Content */}
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              stickySectionHeadersEnabled={false}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              
              // "New Chat" button as the List Header
              ListHeaderComponent={
                <TouchableOpacity onPress={handleNewChat} style={styles.newChatRow}>
                  <Plus size={20} color="#71717a" />
                  <Text style={styles.newChatText}>New chat</Text>
                </TouchableOpacity>
              }

              // Empty State
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  {query.trim() ? (
                    <>
                      <SearchIcon size={48} color={isDark ? "#52525b" : "#d4d4d8"} />
                      <Text style={styles.emptyTitle}>No chats found</Text>
                      <Text style={styles.emptySub}>Try different keywords</Text>
                    </>
                  ) : (
                    conversations.length === 0 && (
                      <>
                        <Text style={styles.emptyTitle}>No conversations yet</Text>
                        <Text style={styles.emptySub}>Start a new chat to begin</Text>
                      </>
                    )
                  )}
                </View>
              }
            />
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

// --- STYLES ---

const getStyles = (isDark: boolean) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-start", // Top alignment
    paddingTop: Platform.OS === 'ios' ? 80 : 60, // Top offset similar to "top-[20%]"
    paddingHorizontal: 16,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFillObject,
  },
  keyboardContainer: {
    flex: 1,
    width: "100%",
    maxHeight: "70%", // Don't take full height
    alignSelf: 'center',
    maxWidth: 600,
  },
  modalCard: {
    flex: 1,
    backgroundColor: isDark ? "#18181b" : "#ffffff", // Zinc 900 / White
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: isDark ? "#27272a" : "#e4e4e7", // Zinc 800 / 200
    // Shadows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: isDark ? "#fff" : "#000",
    padding: 0, // Reset default padding
  },
  closeBtn: {
    padding: 4,
    marginLeft: 8,
  },
  listContent: {
    paddingBottom: 20,
  },
  // New Chat Row
  newChatRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#27272a" : "#e4e4e7",
  },
  newChatText: {
    marginLeft: 12,
    fontSize: 16,
    fontWeight: "500",
    color: isDark ? "#f4f4f5" : "#18181b",
  },
  // Section Headers
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 4,
    backgroundColor: isDark ? "#18181b" : "#ffffff", // Sticky header bg
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "600",
    color: isDark ? "#a1a1aa" : "#71717a", // Zinc 400 / 500
    textTransform: "uppercase",
  },
  // Items
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rowIcon: {
    marginRight: 12,
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: isDark ? "#f4f4f5" : "#18181b",
    marginBottom: 2,
  },
  rowPreview: {
    fontSize: 12,
    color: isDark ? "#a1a1aa" : "#71717a",
  },
  // Empty State
  emptyState: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginTop: 16,
    color: isDark ? "#f4f4f5" : "#18181b",
  },
  emptySub: {
    fontSize: 14,
    marginTop: 8,
    color: isDark ? "#a1a1aa" : "#71717a",
  },
});
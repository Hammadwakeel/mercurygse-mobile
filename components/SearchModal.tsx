// components/SearchModal.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
    Animated,
    BackHandler,
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    SectionList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

type Conversation = {
  id: string;
  title: string;
  preview?: string;
  updatedAt: string | number; // ISO string or timestamp
  pinned?: boolean;
};

type Props = {
  isVisible: boolean;
  onClose: () => void;
  conversations: Conversation[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
  togglePin?: (id: string) => void;
  createNewChat?: () => void;
};

function getTimeGroup(dateValue: string | number) {
  const date = new Date(dateValue);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  if (date >= today) return "Today";
  if (date >= yesterday) return "Yesterday";
  if (date >= sevenDaysAgo) return "Previous 7 Days";
  return "Older";
}

export default function SearchModal({
  isVisible,
  onClose,
  conversations,
  selectedId,
  onSelect,
  togglePin,
  createNewChat,
}: Props) {
  const [query, setQuery] = useState("");
  const fade = useMemo(() => new Animated.Value(0), []);

  useEffect(() => {
    if (isVisible) {
      Animated.timing(fade, { toValue: 1, duration: 160, useNativeDriver: true }).start();
      const b = BackHandler.addEventListener("hardwareBackPress", () => {
        onClose();
        return true;
      });
      return () => {
        b.remove();
        fade.setValue(0);
      };
    } else {
      fade.setValue(0);
    }
  }, [isVisible, fade, onClose]);

  useEffect(() => {
    if (!isVisible) setQuery("");
  }, [isVisible]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        (c.title ?? "").toLowerCase().includes(q) ||
        (c.preview ?? "").toLowerCase().includes(q)
    );
  }, [conversations, query]);

  const groupedSections = useMemo(() => {
    const groups: Record<string, Conversation[]> = {
      Today: [],
      Yesterday: [],
      "Previous 7 Days": [],
      Older: [],
    };

    filtered
      .slice()
      .sort((a, b) => Number(new Date(b.updatedAt)) - Number(new Date(a.updatedAt)))
      .forEach((c) => {
        const group = getTimeGroup(c.updatedAt);
        if (!groups[group]) groups[group] = [];
        groups[group].push(c);
      });

    // Build section list only for groups that have items
    const sections = Object.entries(groups)
      .filter(([, arr]) => arr.length > 0)
      .map(([title, data]) => ({ title, data }));

    return sections;
  }, [filtered]);

  const handleSelect = (id: string) => {
    onSelect(id);
    onClose();
  };

  const handleNew = () => {
    createNewChat?.();
    onClose();
  };

  const handleBackdrop = () => {
    Keyboard.dismiss();
    onClose();
  };

  return (
    <Modal animationType="fade" visible={isVisible} transparent onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={handleBackdrop}>
        <View style={styles.backdrop} />
      </TouchableWithoutFeedback>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.centerContainer}
      >
        <Animated.View style={[styles.modalBox, { opacity: fade }]}>
          <View style={styles.header}>
            <View style={styles.searchRow}>
              <Text style={styles.searchIcon}>🔎</Text>
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search chats..."
                placeholderTextColor="#9ca3af"
                style={styles.input}
                autoFocus
                returnKeyType="search"
              />
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.topActionRow}>
            <TouchableOpacity onPress={handleNew} style={styles.newChatBtn}>
              <Text style={styles.newChatIcon}>＋</Text>
              <Text style={styles.newChatText}>New chat</Text>
            </TouchableOpacity>
            <View style={{ flex: 1 }} />
          </View>

          <View style={styles.listWrap}>
            {groupedSections.length === 0 ? (
              query.trim() ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🔍</Text>
                  <Text style={styles.emptyTitle}>No chats found</Text>
                  <Text style={styles.emptySub}>Try searching with different keywords</Text>
                </View>
              ) : (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No conversations yet</Text>
                  <Text style={styles.emptySub}>Start a new chat to begin</Text>
                </View>
              )
            ) : (
              <SectionList
                sections={groupedSections}
                keyExtractor={(item) => item.id}
                renderSectionHeader={({ section: { title } }) => (
                  <View style={styles.sectionHeader}><Text style={styles.sectionHeaderText}>{title}</Text></View>
                )}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    onPress={() => handleSelect(item.id)}
                    style={styles.row}
                    activeOpacity={0.7}
                  >
                    <View style={styles.rowLeft}>
                      <View style={[styles.dot, item.pinned ? styles.dotPinned : null]} />
                    </View>

                    <View style={styles.rowBody}>
                      <Text style={styles.rowTitle} numberOfLines={1}>{item.title}</Text>
                      {item.preview ? <Text style={styles.rowPreview} numberOfLines={1}>{item.preview}</Text> : null}
                    </View>

                    <View style={styles.rowRight}>
                      <Text style={styles.rowTime}>
                        {new Date(item.updatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </Text>

                      {togglePin ? (
                        <TouchableOpacity
                          onPress={() => togglePin(item.id)}
                          style={styles.pinBtn}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.pinText}>{item.pinned ? "📌" : "📍"}</Text>
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                )}
                contentContainerStyle={{ paddingBottom: 14 }}
              />
            )}
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  centerContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    top: Platform.OS === "ios" ? 80 : 60,
    alignItems: "center",
  },
  modalBox: {
    width: "92%",
    maxHeight: "75%",
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e6e6e6",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#eef2f7",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 8,
    paddingVertical: 6,
  },
  searchIcon: { marginRight: 8, fontSize: 18, color: "#94a3b8" },
  input: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontSize: 16,
    color: "#111827",
  },
  closeBtn: { padding: 8 },
  closeText: { fontSize: 18, color: "#374151" },

  topActionRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    flexDirection: "row",
    alignItems: "center",
  },
  newChatBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  newChatIcon: { backgroundColor: "#111827", color: "#fff", paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8 },
  newChatText: { marginLeft: 8, color: "#0f172a", fontWeight: "600" },

  listWrap: { paddingHorizontal: 8, paddingVertical: 6 },

  sectionHeader: { paddingHorizontal: 8, paddingVertical: 6, backgroundColor: "transparent" },
  sectionHeaderText: { color: "#6b7280", fontSize: 12, fontWeight: "600" },

  row: { flexDirection: "row", alignItems: "center", padding: 10, borderRadius: 8, marginBottom: 6 },
  rowLeft: { width: 36, alignItems: "center", justifyContent: "center" },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: "#cbd5e1" },
  dotPinned: { backgroundColor: "#f97316" },

  rowBody: { flex: 1, paddingHorizontal: 8 },
  rowTitle: { fontSize: 15, fontWeight: "600", color: "#0f172a" },
  rowPreview: { marginTop: 2, fontSize: 13, color: "#6b7280" },

  rowRight: { alignItems: "flex-end", gap: 6, width: 74 },
  rowTime: { fontSize: 11, color: "#94a3b8" },
  pinBtn: { marginTop: 6 },
  pinText: { fontSize: 18 },

  empty: { alignItems: "center", justifyContent: "center", padding: 28 },
  emptyIcon: { fontSize: 28, color: "#cbd5e1", marginBottom: 8 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  emptySub: { marginTop: 6, color: "#6b7280" },
});

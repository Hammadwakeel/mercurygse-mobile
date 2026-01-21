import { MessageSquare, Pencil, Trash2 } from "lucide-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";
import { ChatSession } from "../lib/api";
import { timeAgo } from "./utils"; // Assuming this utility is portable to RN

interface ConversationRowProps {
  data: ChatSession;
  active: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onRename?: (newTitle: string) => void;
  showMeta?: boolean;
  theme?: "light" | "dark"; // Optional explicit theme prop
}

export default function ConversationRow({
  data,
  active,
  onSelect,
  onDelete,
  onRename,
  showMeta = true,
  theme,
}: ConversationRowProps) {
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || "light";
  const isDark = currentTheme === "dark";

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(data.title);
  const inputRef = useRef<TextInput>(null);

  // Auto-focus when entering rename mode
  useEffect(() => {
    if (isRenaming) {
      // Small timeout ensures component is rendered before focus
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isRenaming]);

  const handleRenameSubmit = () => {
    if (renameValue.trim() && onRename) {
      onRename(renameValue.trim());
    } else {
      setRenameValue(data.title); // Revert if empty
    }
    setIsRenaming(false);
  };

  const handleCancelRename = () => {
    setRenameValue(data.title);
    setIsRenaming(false);
  };

  const styles = getStyles(isDark, active);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => !isRenaming && onSelect()}
      activeOpacity={0.7}
    >
      <View style={styles.topRow}>
        {/* Icon & Title Area */}
        <View style={styles.leftContent}>
          <MessageSquare
            size={16}
            color={active ? (isDark ? "#f4f4f5" : "#18181b") : (isDark ? "#71717a" : "#a1a1aa")}
            style={styles.icon}
          />
          
          {isRenaming ? (
            // ✅ Rename Input Mode
            <TextInput
              ref={inputRef}
              value={renameValue}
              onChangeText={setRenameValue}
              style={styles.renameInput}
              onSubmitEditing={handleRenameSubmit} // "Enter" key
              onBlur={handleCancelRename} // Tap away
              returnKeyType="done"
              autoCapitalize="sentences"
            />
          ) : (
            // ✅ Standard Title Mode
            <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
              {data.title || "New Chat"}
            </Text>
          )}
        </View>

        {/* Actions (Visible when Active or if specific prop passed) */}
        {!isRenaming && active && (
          <View style={styles.actions}>
            {onRename && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation(); // Prevent row selection
                  setIsRenaming(true);
                }}
                style={styles.actionBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 5 }}
              >
                <Pencil size={14} color={isDark ? "#a1a1aa" : "#71717a"} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              style={[styles.actionBtn, styles.deleteBtn]}
              hitSlop={{ top: 10, bottom: 10, left: 5, right: 10 }}
            >
              <Trash2 size={14} color={isDark ? "#f87171" : "#ef4444"} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Meta Info */}
      {showMeta && !isRenaming && (
        <View style={styles.metaRow}>
          <Text style={styles.timeText}>
            {timeAgo(data.created_at || new Date().toISOString())}
          </Text>
          
          {data.message_count && data.message_count > 0 ? (
             <View style={styles.badge}>
               <Text style={styles.badgeText}>{data.message_count}</Text>
             </View>
          ) : null}
        </View>
      )}
    </TouchableOpacity>
  );
}

// --- STYLES ---

const getStyles = (isDark: boolean, active: boolean) => StyleSheet.create({
  container: {
    flexDirection: 'column',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
    backgroundColor: active 
      ? (isDark ? "#27272a" : "#f4f4f5") // Zinc 800 / Zinc 100
      : "transparent",
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  leftContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  icon: {
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: active ? '600' : '400',
    color: active 
      ? (isDark ? "#f4f4f5" : "#18181b") 
      : (isDark ? "#d4d4d8" : "#3f3f46"),
    flex: 1,
  },
  renameInput: {
    flex: 1,
    fontSize: 14,
    color: isDark ? "#fff" : "#000",
    backgroundColor: isDark ? "#09090b" : "#fff",
    borderWidth: 1,
    borderColor: isDark ? "#3f3f46" : "#e4e4e7",
    borderRadius: 4,
    paddingVertical: 2, // Compact
    paddingHorizontal: 6,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    padding: 4,
  },
  deleteBtn: {
    marginLeft: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 24, // Align with title (Icon is 16 + Margin 8)
  },
  timeText: {
    fontSize: 11,
    color: isDark ? "#71717a" : "#a1a1aa", // Zinc 500 / 400
  },
  badge: {
    backgroundColor: isDark ? "#27272a" : "#e4e4e7", // Zinc 800 / 200
    borderRadius: 999,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: isDark ? "#a1a1aa" : "#71717a",
  }
});
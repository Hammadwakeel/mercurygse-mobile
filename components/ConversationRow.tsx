// components/ConversationRow.tsx
import React, { useState } from "react";
import {
    GestureResponderEvent,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

/**
 * If you already have a `timeAgo` util, import it:
 * import { timeAgo } from "../lib/utils";
 *
 * If not, the small fallback implementation below will be used.
 */
// import { timeAgo } from "../lib/utils";

function timeAgoFallback(dateValue: string | number) {
  const now = Date.now();
  const past = new Date(dateValue).getTime();
  const seconds = Math.max(1, Math.floor((now - past) / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

type ConversationData = {
  id: string;
  title: string;
  updatedAt: string | number;
  preview?: string;
  messages?: any[];
  messageCount?: number;
  pinned?: boolean;
};

type Props = {
  data: ConversationData;
  active?: boolean;
  onSelect: (e?: GestureResponderEvent) => void;
  onTogglePin: () => void;
  showMeta?: boolean;
};

export default function ConversationRow({
  data,
  active = false,
  onSelect,
  onTogglePin,
  showMeta = false,
}: Props) {
  const [previewVisible, setPreviewVisible] = useState(false);

  const count = Array.isArray(data.messages) ? data.messages.length : data.messageCount ?? 0;
  const time = ((): string => {
    try {
      // use your util if available - replace this line with import if present
      // return timeAgo(data.updatedAt)
      return timeAgoFallback(data.updatedAt);
    } catch {
      return timeAgoFallback(data.updatedAt);
    }
  })();

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={onSelect}
        onLongPress={() => setPreviewVisible(true)}
        android_ripple={{ color: "#e6e6e6" }}
        style={({ pressed }) => [
          styles.row,
          active ? styles.rowActive : null,
          pressed ? styles.rowPressed : null,
        ]}>
        <View style={styles.left}>
          <View style={[styles.dot, data.pinned ? styles.dotPinned : null]} />
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.titleText, active ? styles.titleActive : null]}>
              {data.title ?? "Untitled"}
            </Text>
            <Text style={styles.timeText}>{time}</Text>
          </View>

          {showMeta && (
            <Text numberOfLines={1} style={styles.metaText}>
              {count} messages
            </Text>
          )}
        </View>

        <TouchableOpacity
          onPress={(e) => {
            // stop parent press (Pressable) from triggering (RN Pressable doesn't bubble same as web)
            e.stopPropagation?.();
            onTogglePin();
          }}
          accessibilityLabel={data.pinned ? "Unpin conversation" : "Pin conversation"}
          style={styles.pinBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={[styles.pinIcon, data.pinned ? styles.pinIconPinned : null]}>
            {data.pinned ? "★" : "☆"}
          </Text>
        </TouchableOpacity>
      </Pressable>

      {/* Preview modal shown on long press (mobile alternative to web tooltip) */}
      <Modal
        visible={previewVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPreviewVisible(false)}>
        <Pressable style={styles.previewBackdrop} onPress={() => setPreviewVisible(false)}>
          <View style={styles.previewCard}>
            <Text style={styles.previewTitle}>{data.title}</Text>
            <Text style={styles.previewText}>{data.preview ?? "No preview available."}</Text>

            <View style={styles.previewFooter}>
              <Text style={styles.previewFooterText}>{time}</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    backgroundColor: "transparent",
  },
  rowPressed: {
    backgroundColor: "#f3f4f6",
  },
  rowActive: {
    backgroundColor: "#eef2ff",
  },
  left: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#cbd5e1",
  },
  dotPinned: {
    backgroundColor: "#f97316",
  },
  body: {
    flex: 1,
    paddingHorizontal: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  titleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#0f172a",
    flexShrink: 1,
    marginRight: 8,
  },
  titleActive: {
    color: "#0b5cff",
  },
  timeText: {
    fontSize: 11,
    color: "#64748b",
  },
  metaText: {
    marginTop: 4,
    fontSize: 12,
    color: "#64748b",
  },
  pinBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  pinIcon: {
    fontSize: 18,
    color: "#475569",
  },
  pinIconPinned: {
    color: "#b45309",
  },

  // Preview modal
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "center",
    padding: 20,
  },
  previewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
    color: "#0f172a",
  },
  previewText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
  },
  previewFooter: {
    marginTop: 12,
    alignItems: "flex-end",
  },
  previewFooterText: {
    fontSize: 12,
    color: "#64748b",
  },
});

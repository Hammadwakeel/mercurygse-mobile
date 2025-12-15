// components/Message.tsx
import React from "react";
import { StyleSheet, Text, View } from "react-native";

type MessageProps = {
  role: "user" | "assistant" | string;
  children: React.ReactNode;
  small?: boolean;
};

export default function Message({ role, children }: MessageProps) {
  const isUser = role === "user";

  return (
    <View style={[styles.row, isUser ? styles.rowUser : styles.rowAssistant]}>
      {!isUser && (
        <View style={styles.avatarAI}>
          <Text style={styles.avatarText}>AI</Text>
        </View>
      )}

      <View style={[styles.bubble, isUser ? styles.bubbleUser : styles.bubbleAI]}>
        <Text style={[styles.bubbleText, isUser ? styles.bubbleTextUser : styles.bubbleTextAI]}>
          {children}
        </Text>
      </View>

      {isUser && (
        <View style={styles.avatarUser}>
          <Text style={styles.avatarTextSmall}>JD</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    paddingHorizontal: 12,
    marginVertical: 6,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8 as any,
  },
  rowUser: { justifyContent: "flex-end" },
  rowAssistant: { justifyContent: "flex-start" },

  avatarAI: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarUser: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  avatarTextSmall: { color: "#fff", fontWeight: "700", fontSize: 11 },

  bubble: {
    maxWidth: "80%",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  bubbleUser: { backgroundColor: "#111827" },
  bubbleAI: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb" },

  bubbleText: { fontSize: 15, lineHeight: 20 },
  bubbleTextUser: { color: "#fff" },
  bubbleTextAI: { color: "#0f172a" },
});

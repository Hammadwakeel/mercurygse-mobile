// components/Composer.tsx
import { Entypo, MaterialIcons } from "@expo/vector-icons";
import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import ComposerActionsPopover from "./ComposerActionsPopover";

export type ComposerRef = {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
};

type Props = {
  onSend?: (text: string) => Promise<void> | void;
  busy?: boolean;
  theme?: "light" | "dark";
};

const Composer = forwardRef<ComposerRef, Props>(function Composer(
  { onSend, busy = false, theme = "light" },
  ref
) {
  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const [inputHeight, setInputHeight] = useState<number>(40);
  const inputRef = useRef<TextInput | null>(null);
  
  const isDarkMode = theme === 'dark';

  // Dynamic Colors
  const colors = {
    // Main background: Black in dark mode
    barBg: isDarkMode ? "#09090b" : "#ffffff", 
    // Input Pill background: Darker gray in dark mode
    inputBg: isDarkMode ? "#18181b" : "#f3f4f6", 
    border: isDarkMode ? "#27272a" : "#e5e7eb",
    text: isDarkMode ? "#e4e4e7" : "#0f172a",
    placeholder: isDarkMode ? "#71717a" : "#6b7280",
    icon: isDarkMode ? "#a1a1aa" : "#6b7280",
    sendBtnBg: isDarkMode ? "#e4e4e7" : "#111827",
    sendBtnIcon: isDarkMode ? "#000" : "#fff",
    hint: isDarkMode ? "#52525b" : "#9ca3af",
  };

  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent;
          setTimeout(() => {
            inputRef.current?.focus();
          }, 100);
          return newValue;
        });
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }),
    []
  );

  async function handleSend() {
    if (!value.trim() || sending || busy) return;
    setSending(true);
    try {
      await onSend?.(value.trim());
      setValue("");
      inputRef.current?.focus();
    } catch (err) {
      console.error("send error", err);
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.barBg, borderTopColor: colors.border }]}>
      
      {/* Input Row Wrapper */}
      <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
        
        {/* Attachment Button (Left) */}
        <View style={styles.actionBtnWrap}>
          <ComposerActionsPopover theme={theme}>
            <TouchableOpacity
              style={styles.iconBtn}
              accessibilityLabel="Attachments"
              onPress={() => {}}
            >
              <Entypo name="attachment" size={20} color={colors.icon} />
            </TouchableOpacity>
          </ComposerActionsPopover>
        </View>

        {/* Text Input (Middle) */}
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder="Ask anything"
          placeholderTextColor={colors.placeholder}
          multiline
          onContentSizeChange={(e) => {
            const h = e.nativeEvent.contentSize.height;
            const min = 36;
            const max = 120; // Limit max height
            const newH = Math.min(Math.max(min, h), max);
            setInputHeight(newH);
          }}
          style={[styles.input, { 
            height: Math.max(36, inputHeight),
            color: colors.text
          }]}
          returnKeyType={Platform.OS === "ios" ? "default" : "send"}
          blurOnSubmit={false}
        />

        {/* Send Button (Right) */}
        <View style={styles.actionBtnWrap}>
          <TouchableOpacity
            onPress={handleSend}
            disabled={sending || busy || !value.trim()}
            style={[
              styles.sendBtn,
              { backgroundColor: colors.sendBtnBg },
              (sending || busy || !value.trim()) && { opacity: 0.5 },
            ]}
          >
            {sending || busy ? (
              <ActivityIndicator size="small" color={colors.sendBtnIcon} />
            ) : (
              <MaterialIcons name="arrow-upward" size={18} color={colors.sendBtnIcon} />
            )}
          </TouchableOpacity>
        </View>

      </View>

      {/* Tiny Hint Text */}
      <View style={styles.hintWrap}>
        <Text style={[styles.hintText, { color: colors.hint }]}>
          AI can make mistakes. Check important info.
        </Text>
      </View>
    </View>
  );
});

export default Composer;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end", // Aligns buttons to bottom when input grows
    borderRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 6, 
    minHeight: 50,
  },
  actionBtnWrap: {
    marginBottom: 4, // Aligns with the first line of text visually
    justifyContent: 'center',
    height: 36, // Fixed height for button area
    width: 36,
    alignItems: 'center',
  },
  iconBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 8,
    paddingTop: 8, // Center text vertically in the row
    paddingBottom: 8,
    textAlignVertical: "top",
    marginHorizontal: 4,
  },
  sendBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  hintWrap: {
    marginTop: 6,
    alignItems: "center",
  },
  hintText: {
    fontSize: 10,
  },
});
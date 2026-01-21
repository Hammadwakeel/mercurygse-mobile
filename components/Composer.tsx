import { Send } from "lucide-react-native";
import React, { forwardRef, useImperativeHandle, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

export interface ComposerHandle {
  insertTemplate: (templateContent: string) => void;
  focus: () => void;
}

interface ComposerProps {
  onSend: (text: string) => Promise<void> | void;
  busy: boolean;
  theme?: "light" | "dark"; // Optional prop to force theme
}

const Composer = forwardRef<ComposerHandle, ComposerProps>(function Composer(
  { onSend, busy, theme }, 
  ref
) {
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || 'light';
  const isDark = currentTheme === 'dark';

  const [value, setValue] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Expose methods to parent via ref
  useImperativeHandle(
    ref,
    () => ({
      insertTemplate: (templateContent: string) => {
        setValue((prev) => {
          const newValue = prev ? `${prev}\n\n${templateContent}` : templateContent;
          // Tiny timeout to ensure UI updates before focus
          setTimeout(() => {
            inputRef.current?.focus();
          }, 50);
          return newValue;
        });
      },
      focus: () => {
        inputRef.current?.focus();
      },
    }),
    [],
  );

  async function handleSend() {
    if (!value.trim() || sending || busy) return;
    
    const textToSend = value; 
    setSending(true);
    setValue(""); // Optimistic clear
    
    try {
      await onSend?.(textToSend);
      // Keep keyboard open usually
    } catch (e) {
      console.error(e);
      setValue(textToSend); // Restore on failure
    } finally {
      setSending(false);
    }
  }

  // Styles based on theme
  const styles = getStyles(isDark);
  const placeholderColor = isDark ? "#a1a1aa" : "#a1a1aa";
  const iconColor = isDark ? "#000" : "#fff"; // Icon inside the dark button/light button

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={setValue}
          placeholder="Message..."
          placeholderTextColor={placeholderColor}
          multiline
          style={styles.input}
          textAlignVertical="center" // 'top' if you want it starting at top
        />

        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || busy || !value.trim()}
          activeOpacity={0.7}
          style={[
            styles.sendBtn,
            (sending || busy || !value.trim()) && styles.disabledBtn
          ]}
        >
          {sending || busy ? (
            <ActivityIndicator size="small" color={iconColor} />
          ) : (
            // Small visual adjustment for the Send icon to look centered
            <Send size={18} color={iconColor} style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
});

export default Composer;

// --- STYLES ---

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: isDark ? "#27272a" : "#f4f4f5", // zinc-800 / zinc-100
    backgroundColor: isDark ? "#09090b" : "#ffffff",
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Aligns button to bottom if text grows
    backgroundColor: isDark ? "#09090b" : "#ffffff",
    borderWidth: 1,
    borderColor: isDark ? "#3f3f46" : "#e4e4e7", // zinc-700 / zinc-200
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 6,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    // Elevation for Android
    elevation: 1,
  },
  input: {
    flex: 1,
    color: isDark ? "#fff" : "#000",
    fontSize: 16,
    paddingHorizontal: 10,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    maxHeight: 120, // Stop growing after ~5 lines
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: isDark ? "#ffffff" : "#18181b", // Invert colors for contrast
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2, // Align with single line text
    marginLeft: 6,
  },
  disabledBtn: {
    opacity: 0.5,
    backgroundColor: isDark ? "#52525b" : "#d4d4d8", // Gray out
  }
});
import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  ViewStyle
} from "react-native";

interface GhostIconButtonProps {
  label: string;
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function GhostIconButton({ 
  label, 
  children, 
  onPress, 
  style 
}: GhostIconButtonProps) {
  const isDark = useColorScheme() === "dark";

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityRole="button"
      activeOpacity={0.7}
      style={[
        styles.container,
        isDark ? styles.dark : styles.light,
        style
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 9999, // rounded-full
    borderWidth: 1,     // border
    padding: 8,         // p-2
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start', // behaves like inline-flex
  },
  light: {
    borderColor: "#e4e4e7", // zinc-200
    backgroundColor: "rgba(255, 255, 255, 0.7)", // bg-white/70
  },
  dark: {
    borderColor: "#27272a", // zinc-800
    backgroundColor: "rgba(24, 24, 27, 0.7)", // bg-zinc-900/70
  }
});
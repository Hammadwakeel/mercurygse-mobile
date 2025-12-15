import React from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  ViewStyle
} from 'react-native';

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
  const theme = useColorScheme();
  const isDarkMode = theme === 'dark';
  const { width } = useWindowDimensions();

  // Logic: "hidden md:inline-flex"
  // If width is smaller than standard tablet/desktop breakpoint (768px), hide it.
  if (width < 768) {
    return null;
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      accessibilityLabel={label}
      style={[
        styles.base,
        isDarkMode ? styles.dark : styles.light,
        style
      ]}
    >
      {children}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,           // p-2
    borderRadius: 999,    // rounded-full
    borderWidth: 1,
    flexDirection: 'row',
  },
  light: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // bg-white/70
    borderColor: '#e4e4e7', // zinc-200
    // Note: Text/Icon color must be handled by passing a color prop to the child Icon
  },
  dark: {
    backgroundColor: 'rgba(24, 24, 27, 0.7)',    // bg-zinc-900/70
    borderColor: '#27272a', // zinc-800
  },
});
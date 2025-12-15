// components/Header.tsx
import { Menu } from 'lucide-react-native';
import React from 'react';
import {
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  onOpenSidebar: () => void;
  theme?: "light" | "dark";
}

export default function Header({
  onOpenSidebar,
  theme = "light"
}: HeaderProps) {
  const isDarkMode = theme === 'dark';
  const insets = useSafeAreaInsets();
  
  const iconColor = isDarkMode ? '#e4e4e7' : '#18181b'; 

  const colors = {
    bg: isDarkMode ? 'rgba(24, 24, 27, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    // Border color definition removed
  };

  return (
    <View style={[
      styles.container,
      { 
        backgroundColor: colors.bg, 
        // borderBottomColor removed
        paddingTop: 10, // ensuring it covers status bar area correctly
      }
    ]}>
      <TouchableOpacity
        onPress={onOpenSidebar}
        style={styles.button}
        accessibilityLabel="Open sidebar"
      >
        <Menu color={iconColor} size={24} />
      </TouchableOpacity>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    // borderBottomWidth: 1, <--- REMOVED
    zIndex: 30,
  },
  spacer: {
    marginLeft: 'auto', 
  },
  button: {
    padding: 0,
    marginVertical: 4, 
    justifyContent: 'center',
    alignItems: 'center',
  },
});
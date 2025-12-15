import { Monitor, Moon, Sun } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  useWindowDimensions,
  View
} from 'react-native';

interface ThemeToggleProps {
  theme: string;
  // Changed from (theme: string) => void to (theme: any) => void
  // This allows passing a stricter function like (t: "light" | "dark") => void without TS errors.
  setTheme: (theme: any) => void; 
}

export default function ThemeToggle({ theme, setTheme }: ThemeToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const systemScheme = useColorScheme(); // 'light' or 'dark'
  const { width } = useWindowDimensions();
  
  // Logic: Only show text label on "Desktop" (Tablet+) widths
  const showLabel = width >= 768; 

  // Determine active colors based on current effective theme
  const isDarkMode = 
    theme === 'dark' || (theme === 'system' && systemScheme === 'dark');

  const iconColor = isDarkMode ? '#e4e4e7' : '#18181b'; // zinc-200 / zinc-900

  const options = [
    { value: 'light', label: 'Light', Icon: Sun },
    { value: 'dark', label: 'Dark', Icon: Moon },
    { value: 'system', label: 'System', Icon: Monitor },
  ];

  const current = options.find((o) => o.value === theme) || options[0];
  const CurrentIcon = current.Icon;

  return (
    <View style={styles.container}>
      
      {/* --- Trigger Button --- */}
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          styles.triggerBtn,
          isDarkMode ? styles.btnDark : styles.btnLight
        ]}
      >
        <CurrentIcon size={18} color={iconColor} />
        {showLabel && (
          <Text style={[styles.btnText, isDarkMode ? styles.textDark : styles.textLight]}>
            {current.label}
          </Text>
        )}
      </TouchableOpacity>

      {/* --- Dropdown Modal --- */}
      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setIsOpen(false)}>
          
          <View style={[
            styles.dropdown,
            isDarkMode ? styles.dropdownDark : styles.dropdownLight
          ]}>
            {options.map((opt) => {
              const Icon = opt.Icon;
              const isActive = opt.value === theme;
              
              return (
                <TouchableOpacity
                  key={opt.value}
                  onPress={() => {
                    setTheme(opt.value);
                    setIsOpen(false);
                  }}
                  style={[
                    styles.optionBtn,
                    isActive && (isDarkMode ? styles.activeDark : styles.activeLight)
                  ]}
                >
                  <Icon size={16} color={iconColor} style={styles.optionIcon} />
                  <Text style={[
                    styles.optionText, 
                    isDarkMode ? styles.textDark : styles.textLight
                  ]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    zIndex: 50,
  },
  triggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  // Modal Overlay Styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end', 
    paddingTop: 60, 
    paddingRight: 16,
  },
  dropdown: {
    width: 128, 
    borderRadius: 12, 
    borderWidth: 1,
    paddingVertical: 4, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12, 
    paddingVertical: 10,  
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
  },

  // Themes
  btnLight: { backgroundColor: 'transparent' }, 
  btnDark: { backgroundColor: 'transparent' },

  dropdownLight: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e4e7', 
  },
  dropdownDark: {
    backgroundColor: '#18181b', 
    borderColor: '#27272a', 
  },

  textLight: { color: '#09090b' },
  textDark: { color: '#e4e4e7' },

  activeLight: { backgroundColor: '#f4f4f5' }, 
  activeDark: { backgroundColor: '#27272a' }, 
});
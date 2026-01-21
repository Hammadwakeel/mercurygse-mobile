import { Moon, Sun } from "lucide-react-native";
import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  TouchableOpacity,
  useColorScheme,
  View
} from "react-native";

interface ThemeToggleProps {
  theme?: "light" | "dark";
  // We accept toggleTheme to match your requested code, 
  // or setTheme to match the previous Sidebar component.
  toggleTheme?: () => void;
  setTheme?: (theme: "light" | "dark") => void;
}

export default function ThemeToggle({ theme: propTheme, toggleTheme, setTheme }: ThemeToggleProps) {
  const systemScheme = useColorScheme();
  const [mounted, setMounted] = useState(false);

  // Determine effective theme
  const theme = propTheme || systemScheme || "light";
  const isDark = theme === "dark";

  // Handle mounting state (hydration equivalent)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper to handle the toggle action regardless of which prop is passed
  const handleToggle = () => {
    if (toggleTheme) {
      toggleTheme();
    } else if (setTheme) {
      setTheme(isDark ? "light" : "dark");
    }
  };

  if (!mounted) {
    return <View style={styles.placeholder} />;
  }

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      style={[
        styles.container,
        isDark ? styles.containerDark : styles.containerLight
      ]}
    >
      {/* Logic Match: 
        If Light Mode -> Show Moon (to switch to Dark)
        If Dark Mode  -> Show Sun (to switch to Light)
      */}
      {!isDark ? (
        <Moon size={20} color="#1f2937" fill="#1f2937" /> // text-gray-800
      ) : (
        <Sun size={20} color="#facc15" fill="#facc15" />  // text-yellow-400
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    width: 40,
    height: 40,
  },
  container: {
    width: 44, // roughly w-10 + padding
    height: 44,
    padding: 10,
    borderRadius: 8, // rounded-lg
    borderWidth: 2, // border-2
    alignItems: 'center',
    justifyContent: 'center',
    // Shadow / Elevation (shadow-lg)
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  containerLight: {
    backgroundColor: "rgba(255, 255, 255, 0.9)", // bg-white/80
    borderColor: "#d1d5db", // border-gray-300
  },
  containerDark: {
    backgroundColor: "rgba(30, 41, 59, 0.9)", // bg-slate-800/80
    borderColor: "#475569", // border-slate-600
  },
});
import { ChevronDown, ChevronRight } from "lucide-react-native";
import React, { useEffect } from "react";
import {
  LayoutAnimation,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View
} from "react-native";

// Enable LayoutAnimation on Android
if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SidebarSectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  collapsed: boolean;
  onToggle: () => void;
  theme?: "light" | "dark";
}

export default function SidebarSection({
  icon,
  title,
  children,
  collapsed,
  onToggle,
  theme = "light",
}: SidebarSectionProps) {
  const isDark = theme === "dark";
  const styles = getStyles(isDark);
  const iconColor = isDark ? "#a1a1aa" : "#71717a"; // Zinc 400 / 500

  // Trigger animation when 'collapsed' state changes
  useEffect(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }, [collapsed]);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.7}
        style={styles.header}
        accessibilityRole="button"
        accessibilityState={{ expanded: !collapsed }}
      >
        <View style={styles.headerLeft}>
          {/* Chevron */}
          <View style={styles.chevronWrapper}>
            {collapsed ? (
              <ChevronRight size={14} color={iconColor} />
            ) : (
              <ChevronDown size={14} color={iconColor} />
            )}
          </View>
          
          {/* Label */}
          <View style={styles.labelWrapper}>
            <View style={styles.iconWrapper}>{icon}</View>
            <Text style={styles.titleText}>{title}</Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Content Area */}
      {!collapsed && (
        <View style={styles.content}>
            {children}
        </View>
      )}
    </View>
  );
}

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    // Mimic the "sticky" feel with a background color
    backgroundColor: isDark ? "rgba(24, 24, 27, 0.9)" : "rgba(255, 255, 255, 0.9)", // Zinc 900 / White
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  chevronWrapper: {
    marginRight: 6,
    width: 14,
    alignItems: 'center',
  },
  labelWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconWrapper: {
    marginRight: 8,
    opacity: 0.7,
  },
  titleText: {
    fontSize: 11,
    fontWeight: "700", // Semibold
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: isDark ? "#a1a1aa" : "#71717a", // Zinc 400 / 500
  },
  content: {
    overflow: "hidden", // Important for animations
    marginTop: 2,
    marginLeft: 0, 
  },
});
import {
  BookOpen,
  Bot,
  ChevronDown,
  ChevronRight,
  Globe,
  MoreHorizontal,
  Palette,
  Paperclip,
  Search,
} from "lucide-react-native";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";

// --- Types ---
interface ActionItem {
  icon: any; // Lucide Icon or Custom Component
  label: string;
  badge?: string;
  action: () => void;
  isCustomIcon?: boolean;
}

interface ComposerActionsPopoverProps {
  children: React.ReactNode;
  theme?: "light" | "dark";
}

export default function ComposerActionsPopover({
  children,
  theme,
}: ComposerActionsPopoverProps) {
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || "light";
  const isDark = currentTheme === "dark";

  const [visible, setVisible] = useState(false);
  const [showMore, setShowMore] = useState(false);

  // --- Custom Icons for Connectors ---
  const GoogleIcon = () => (
    <View style={[styles.customIconBase, { backgroundColor: "#4285F4" }]}>
      <View style={styles.customIconDot} />
    </View>
  );

  const OneDriveIcon = () => (
    <View style={[styles.customIconBase, { backgroundColor: "#0078D4" }]}>
      <View style={styles.customIconDot} />
    </View>
  );

  const SharepointIcon = () => (
    <View style={[styles.customIconBase, { backgroundColor: "#037A76" }]}>
      <View style={styles.customIconDot} />
    </View>
  );

  // --- Data ---
  const mainActions: ActionItem[] = [
    {
      icon: Paperclip,
      label: "Add photos & files",
      action: () => console.log("Add photos & files"),
    },
    {
      icon: Bot,
      label: "Agent mode",
      badge: "NEW",
      action: () => console.log("Agent mode"),
    },
    {
      icon: Search,
      label: "Deep research",
      action: () => console.log("Deep research"),
    },
    {
      icon: Palette,
      label: "Create image",
      action: () => console.log("Create image"),
    },
    {
      icon: BookOpen,
      label: "Study and learn",
      action: () => console.log("Study and learn"),
    },
  ];

  const moreActions: ActionItem[] = [
    {
      icon: Globe,
      label: "Web search",
      action: () => console.log("Web search"),
    },
    {
      icon: Palette,
      label: "Canvas",
      action: () => console.log("Canvas"),
    },
    {
      icon: GoogleIcon,
      label: "Connect Google Drive",
      action: () => console.log("Connect Google Drive"),
      isCustomIcon: true,
    },
    {
      icon: OneDriveIcon,
      label: "Connect OneDrive",
      action: () => console.log("Connect OneDrive"),
      isCustomIcon: true,
    },
    {
      icon: SharepointIcon,
      label: "Connect Sharepoint",
      action: () => console.log("Connect Sharepoint"),
      isCustomIcon: true,
    },
  ];

  const handleAction = (action: () => void) => {
    action();
    closeMenu();
  };

  const closeMenu = () => {
    setVisible(false);
    // Small delay to reset state after animation closes
    setTimeout(() => setShowMore(false), 300);
  };

  // --- Render Helpers ---
  const styles = getStyles(isDark);
  const iconColor = isDark ? "#e4e4e7" : "#18181b"; // Zinc 200 / Zinc 900

  const renderActionRow = (item: ActionItem, index: number) => {
    const Icon = item.icon;
    return (
      <TouchableOpacity
        key={index}
        style={styles.actionRow}
        onPress={() => handleAction(item.action)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          {item.isCustomIcon ? (
            <Icon />
          ) : (
            <Icon size={20} color={iconColor} strokeWidth={2} />
          )}
        </View>
        <Text style={styles.actionLabel}>{item.label}</Text>
        {item.badge && (
          <View style={styles.badgeContainer}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Trigger: We wrap children in a Pressable to open modal */}
      <Pressable onPress={() => setVisible(true)}>{children}</Pressable>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.overlay} onPress={closeMenu}>
          {/* Menu Container */}
          <Pressable 
            style={styles.menuContainer} 
            onPress={(e) => e.stopPropagation()} // Prevent click-through closing
          >
            <ScrollView 
                bounces={false} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
            >
              {/* Main Actions */}
              {mainActions.map(renderActionRow)}

              {/* The "More" Logic */}
              {!showMore ? (
                <TouchableOpacity
                  style={[styles.actionRow, styles.moreRow]}
                  onPress={() => setShowMore(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.iconContainer}>
                    <MoreHorizontal size={20} color={iconColor} />
                  </View>
                  <Text style={styles.actionLabel}>More</Text>
                  <ChevronRight size={16} color={isDark ? "#71717a" : "#a1a1aa"} />
                </TouchableOpacity>
              ) : (
                <>
                  {/* Divider */}
                  <View style={styles.divider} />
                  
                  {/* Extra Actions Header or Continuation */}
                  <View style={styles.moreHeader}>
                    <Text style={styles.moreHeaderText}>Integrations & Tools</Text>
                  </View>

                  {/* More Actions List */}
                  {moreActions.map(renderActionRow)}
                  
                  {/* Option to collapse */}
                   <TouchableOpacity
                      style={[styles.actionRow, styles.collapseRow]}
                      onPress={() => setShowMore(false)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.iconContainer}>
                        <ChevronDown size={20} color={iconColor} />
                      </View>
                      <Text style={styles.actionLabel}>Show Less</Text>
                    </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

// --- STYLES ---

const getStyles = (isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end", // Bottom sheet style
      // For centered dialog style, change to 'center' and add padding
    },
    menuContainer: {
      width: "100%",
      backgroundColor: isDark ? "#18181b" : "#ffffff", // Zinc 900 / White
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      paddingBottom: Platform.OS === "ios" ? 40 : 20, // Safe area for bottom
      paddingTop: 16,
      maxHeight: "80%", // Don't take full screen
    },
    scrollContent: {
      paddingHorizontal: 16,
    },
    actionRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 14,
      borderRadius: 12,
    },
    moreRow: {
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: isDark ? "#27272a" : "#f4f4f5",
    },
    collapseRow: {
       marginTop: 8,
       opacity: 0.7
    },
    iconContainer: {
      width: 24,
      alignItems: "center",
      marginRight: 16,
    },
    actionLabel: {
      flex: 1,
      fontSize: 16,
      color: isDark ? "#f4f4f5" : "#18181b",
      fontWeight: "500",
    },
    badgeContainer: {
      backgroundColor: isDark ? "#1e3a8a" : "#eff6ff", // Blue 900 / Blue 50
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 999,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "bold",
      color: isDark ? "#93c5fd" : "#2563eb", // Blue 300 / Blue 600
    },
    divider: {
      height: 1,
      backgroundColor: isDark ? "#27272a" : "#f4f4f5",
      marginVertical: 8,
    },
    moreHeader: {
      paddingVertical: 8,
    },
    moreHeaderText: {
      fontSize: 12,
      color: isDark ? "#71717a" : "#a1a1aa",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
    // Custom Icon Styles
    customIconBase: {
      width: 18,
      height: 18,
      borderRadius: 4,
      justifyContent: "center",
      alignItems: "center",
    },
    customIconDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: "#ffffff",
    },
  });
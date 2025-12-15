// components/ComposerActionsPopover.tsx
import { Feather, FontAwesome5, Ionicons, MaterialIcons } from "@expo/vector-icons";
import React, { ReactNode, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

type Action = {
  id: string;
  label: string;
  icon?: any;
  badge?: string;
  action: () => void;
};

// Add theme prop
export default function ComposerActionsPopover({ 
  children, 
  theme = "light" 
}: { 
  children: ReactNode;
  theme?: "light" | "dark";
}) {
  const [open, setOpen] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const isDarkMode = theme === 'dark';

  // Dynamic Colors
  const colors = {
    bg: isDarkMode ? "#18181b" : "#ffffff",
    text: isDarkMode ? "#e4e4e7" : "#111827",
    icon: isDarkMode ? "#9ca3af" : "#374151",
    border: isDarkMode ? "#27272a" : "#e5e7eb",
    badgeBg: isDarkMode ? "#1e3a8a" : "#dbeafe",
    badgeText: isDarkMode ? "#93c5fd" : "#1e40af",
    overlay: "rgba(0,0,0,0.5)",
  };

  const mainActions: Action[] = [
    {
      id: "files",
      label: "Add photos & files",
      icon: MaterialIcons,
      action: () => console.log("Add photos & files"),
    },
    {
      id: "agent",
      label: "Agent mode",
      icon: FontAwesome5,
      badge: "NEW",
      action: () => console.log("Agent mode"),
    },
    {
      id: "deep",
      label: "Deep research",
      icon: Feather,
      action: () => console.log("Deep research"),
    },
    {
      id: "image",
      label: "Create image",
      icon: Ionicons,
      action: () => console.log("Create image"),
    },
    {
      id: "study",
      label: "Study and learn",
      icon: MaterialIcons,
      action: () => console.log("Study and learn"),
    },
  ];

  const moreActions: Action[] = [
    {
      id: "web",
      label: "Web search",
      icon: Feather,
      action: () => console.log("Web search"),
    },
    {
      id: "canvas",
      label: "Canvas",
      icon: MaterialIcons,
      action: () => console.log("Canvas"),
    },
    {
      id: "gdrive",
      label: "Connect Google Drive",
      icon: null, // Custom render in list
      action: () => console.log("Connect Google Drive"),
    },
  ];

  const handleAction = (fn: () => void) => {
    fn();
    setOpen(false);
    setShowMore(false);
  };

  const renderIcon = (item: Action) => {
     if (item.id === 'gdrive') {
       return (
        <View style={[styles.iconDot, { backgroundColor: "#06b6d4" }]}>
          <View style={styles.iconDotInner} />
        </View>
       );
     }
     const IconComp = item.icon || MaterialIcons;
     const name = item.icon ? (item.id === 'files' ? 'attach-file' : item.id === 'image' ? 'image' : 'circle') : 'insert-drive-file';
     
     // Lucide/Vector icons usually take a 'name' prop. 
     // To keep it simple based on your previous code logic:
     return <IconComp name={name} size={18} color={colors.icon} />;
  };

  return (
    <>
      <Pressable onPress={() => setOpen(true)}>{children}</Pressable>

      <Modal visible={open} animationType="fade" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={[styles.modalOverlay, { backgroundColor: colors.overlay }]} onPress={() => setOpen(false)}>
          {/* Stop propagation on card press */}
          <Pressable 
            style={[styles.modalCard, { backgroundColor: colors.bg }]} 
            onPress={(e) => e.stopPropagation()}
          >
            {!showMore ? (
              <>
                <FlatList
                  data={mainActions}
                  keyExtractor={(i) => i.id}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.actionRow}
                      onPress={() => handleAction(item.action)}
                    >
                      {/* Simple Icon Logic */}
                      {item.icon ? (
                        <item.icon 
                            name={item.id === 'files' ? 'attach-file' : item.id === 'agent' ? 'robot' : item.id === 'deep' ? 'search' : item.id === 'image' ? 'image' : 'school'} 
                            size={18} 
                            color={colors.icon} 
                        />
                      ) : (
                        <MaterialIcons name="insert-drive-file" size={18} color={colors.icon} />
                      )}
                      
                      <Text style={[styles.actionLabel, { color: colors.text }]}>{item.label}</Text>
                      {item.badge ? (
                        <View style={[styles.badge, { backgroundColor: colors.badgeBg }]}>
                          <Text style={[styles.badgeText, { color: colors.badgeText }]}>{item.badge}</Text>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  )}
                  ItemSeparatorComponent={() => <View style={{ height: 4 }} />}
                />

                <TouchableOpacity
                  style={[styles.actionRow, styles.moreBtn, { borderTopColor: colors.border }]}
                  onPress={() => setShowMore(true)}
                >
                  <Feather name="more-horizontal" size={18} color={colors.icon} />
                  <Text style={[styles.actionLabel, { color: colors.text }]}>More</Text>
                  <Ionicons name="chevron-forward" size={18} color={colors.icon} style={{ marginLeft: "auto" }} />
                </TouchableOpacity>
              </>
            ) : (
              // Simplified "More" view for compactness
              <View>
                 <TouchableOpacity
                  style={[styles.actionRow, { paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 5 }]}
                  onPress={() => setShowMore(false)}
                >
                  <Ionicons name="chevron-back" size={18} color={colors.icon} />
                  <Text style={[styles.actionLabel, { color: colors.text }]}>Back</Text>
                </TouchableOpacity>

                <FlatList
                    data={moreActions}
                    keyExtractor={(i) => i.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.actionRow}
                        onPress={() => handleAction(item.action)}
                      >
                         {item.id === 'web' && <Feather name="globe" size={18} color={colors.icon} />}
                         {item.id === 'canvas' && <MaterialIcons name="brush" size={18} color={colors.icon} />}
                         {item.id === 'gdrive' && (
                            <View style={[styles.iconDot, { backgroundColor: "#06b6d4" }]}>
                                <View style={styles.iconDotInner} />
                            </View>
                         )}
                         {item.id === 'onedrive' && (
                            <View style={[styles.iconDot, { backgroundColor: "#2563eb" }]}>
                                <View style={styles.iconDotInner} />
                            </View>
                         )}

                        <Text style={[styles.actionLabel, { color: colors.text }]}>{item.label}</Text>
                      </TouchableOpacity>
                    )}
                  />
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    width: "85%", // Much smaller width
    maxWidth: 320, // Strict max width for tablet/desktop
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    // strong shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12, // slightly taller touch targets
  },
  actionLabel: {
    marginLeft: 12,
    fontSize: 15,
    flex: 1,
    fontWeight: "500",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
  },
  moreBtn: {
    borderTopWidth: 1,
    marginTop: 4,
    paddingTop: 12,
  },
  iconDot: {
    width: 18,
    height: 18,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  iconDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
  },
});
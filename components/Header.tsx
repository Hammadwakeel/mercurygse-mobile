import { PanelLeft, PlusSquare, User as UserIcon } from 'lucide-react-native';
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View
} from 'react-native';
// If using Expo Router:
import { useRouter } from 'expo-router';

interface HeaderProps {
  sidebarCollapsed: boolean;
  setSidebarOpen: (open: boolean) => void;
  title?: string;
  userData?: {
    full_name?: string;
    email?: string;
    avatar_url?: string;
  } | null;
  createNewChat: () => void;
  theme?: 'light' | 'dark';
}

export default function Header({ 
  setSidebarOpen, 
  title, 
  userData,
  createNewChat,
  theme 
}: HeaderProps) {
  const router = useRouter(); // Optional: remove if not using expo-router
  const systemScheme = useColorScheme();
  const currentTheme = theme || systemScheme || 'light';
  const isDark = currentTheme === 'dark';

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const styles = getStyles(isDark);
  const iconColor = isDark ? "#e4e4e7" : "#18181b"; // Zinc 200 / 900

  return (
    <View style={styles.container}>
      {/* This View acts as the "sticky" header container. 
        It has a bottom border and background color.
      */}
      
      {/* Left: Sidebar Toggle + Brand */}
      <View style={styles.leftSection}>
        <TouchableOpacity
          onPress={() => setSidebarOpen(true)}
          style={styles.iconBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <PanelLeft size={24} color={iconColor} />
        </TouchableOpacity>
        
        {/* On mobile, usually only show the title or the brand, not both if space is tight. 
            Here we prioritize the current Chat Title if available, else Brand name. */}
        <Text style={styles.brandText} numberOfLines={1}>
          {title || "R&D Chatbot"}
        </Text>
      </View>

      {/* Right: Actions (New Chat + Profile) */}
      <View style={styles.rightSection}>
        
        {/* New Chat Shortcut */}
        <TouchableOpacity 
          onPress={createNewChat} 
          style={[styles.iconBtn, { marginRight: 4 }]}
        >
           <PlusSquare size={22} color={iconColor} />
        </TouchableOpacity>

        {/* Profile Avatar */}
        <TouchableOpacity 
          onPress={() => router.push('/profile')} 
          style={styles.profileBtn}
        >
          {userData ? (
             userData.avatar_url ? (
               <Image 
                 source={{ uri: userData.avatar_url }} 
                 style={styles.avatarImage} 
               />
             ) : (
               <View style={styles.avatarFallback}>
                 <Text style={styles.avatarText}>
                   {getInitials(userData.full_name || userData.email)}
                 </Text>
               </View>
             )
          ) : (
             <View style={styles.avatarPlaceholder}>
               <UserIcon size={16} color="#71717a" />
             </View>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

// --- STYLES ---

const getStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    height: Platform.OS === 'ios' ? 56 : 60, // Standard app bar height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: isDark ? "#27272a" : "#e4e4e7", // Zinc 800 / 200
    backgroundColor: isDark ? "#09090b" : "#ffffff", // Zinc 950 / White
    zIndex: 30,
    // Add shadow/elevation
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1, // Takes available space
    paddingRight: 16,
  },
  iconBtn: {
    padding: 4,
    marginRight: 12,
  },
  brandText: {
    fontSize: 16,
    fontWeight: '600',
    color: isDark ? "#f4f4f5" : "#18181b",
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: isDark ? "#27272a" : "#f4f4f5",
    borderWidth: 1,
    borderColor: isDark ? "#3f3f46" : "transparent",
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: isDark ? "#f4f4f5" : "#18181b",
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 12,
    fontWeight: '700',
    color: isDark ? "#18181b" : "#ffffff",
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: isDark ? "#27272a" : "#f4f4f5",
    justifyContent: 'center',
    alignItems: 'center',
  },
});
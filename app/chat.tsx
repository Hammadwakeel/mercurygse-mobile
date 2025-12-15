import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  useColorScheme,
  View
} from 'react-native';

// Assuming you have this component converted
import AIAssistantUI from '@/components/AIAssistantUI';

export default function ChatScreen() {
  // CHANGED: We use <any> here to bypass strict typing if you don't have the stack types installed
  const navigation = useNavigation<any>(); 
  const isDarkMode = useColorScheme() === 'dark';
  
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      let auth = false;
      try {
        const authToken = await AsyncStorage.getItem('authToken');
        
        if (authToken) {
          const parsed = JSON.parse(authToken);
          auth = Boolean(parsed?.authenticated);
        }
      } catch (err) {
        console.warn('Failed to parse authToken', err);
        auth = false;
      }

      setIsAuthenticated(auth);
      setIsLoading(false);

      if (!auth) {
        // Ensure your Login screen is named 'Login' in your Navigator
        navigation.replace('Login');
      }
    };

    checkAuth();
  }, [navigation]);

  if (isLoading || isAuthenticated === null) {
    return (
      <View style={[
        styles.container, 
        isDarkMode ? styles.containerDark : styles.containerLight
      ]}>
        <View style={styles.centerContent}>
          <ActivityIndicator 
            size="large" 
            color={isDarkMode ? '#ffffff' : '#18181b'} 
          />
          <Text style={[
            styles.loadingText,
            isDarkMode ? styles.textDark : styles.textLight
          ]}>
            Checking authentication...
          </Text>
        </View>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <SafeAreaView style={[
      styles.screenContainer,
      isDarkMode ? styles.containerDark : styles.containerLight
    ]}>
      <AIAssistantUI />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenContainer: {
    flex: 1,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16, 
    fontSize: 14,
  },
  containerLight: {
    backgroundColor: '#fafafa', 
  },
  textLight: {
    color: '#52525b',
  },
  containerDark: {
    backgroundColor: '#09090b', 
  },
  textDark: {
    color: '#a1a1aa',
  },
});
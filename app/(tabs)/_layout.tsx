import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/app/contexts/AuthContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Wait for authentication state to be determined
  useEffect(() => {
    if (user !== undefined) {
      setIsInitialized(true);
    }
  }, [user]);

  // Don't render tabs until we know the user type
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determine which third tab to show based on user type
  const ThirdTab = () => {
    const isCook = user?.userType === 'cook';
    
    if (isCook) {
      return (
        <Tabs.Screen
          name="cook/meals"
          options={{
            title: 'My Meals',
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant-outline" size={28} color={color} />
            ),
          }}
        />
      );
    } else {
      return (
        <Tabs.Screen
          name="orders"
          options={{
            title: 'My Orders',
            tabBarIcon: ({ color }) => (
              <Ionicons name="receipt-outline" size={28} color={color} />
            ),
          }}
        />
      );
    }
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarBackground: TabBarBackground,
        tabBarStyle: Platform.select({
          ios: {
            position: 'absolute',
          },
          default: {},
        }),
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Ionicons name="home-outline" size={28} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: 'Browse',
          tabBarIcon: ({ color }) => (
            <Ionicons name="search-outline" size={28} color={color} />
          ),
        }}
      />
      
      {/* Dynamically insert the third tab based on user type */}
      {ThirdTab()}
      
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-outline" size={28} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
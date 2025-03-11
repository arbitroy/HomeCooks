import { Tabs } from 'expo-router';
import React, { useEffect, useState, useMemo } from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/app/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

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

  // Use useMemo to avoid recreating tab screens on every render
  const screenOptions = useMemo(() => ({
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
  }), [colorScheme]);

  // Don't render tabs until we know the user type
  if (!isInitialized) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Determine whether to show cook-specific tabs
  const isCook = user?.userType === 'cook';

  return (
    <Tabs screenOptions={screenOptions}>
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
      
      {/* Only include one dashboard tab for cooks */}
      {isCook && (
        <Tabs.Screen
          name="cook-dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => (
              <Ionicons name="grid-outline" size={28} color={color} />
            ),
          }}
        />
      )}
      
      {/* Only include meals tab for cooks */}
      {isCook && (
        <Tabs.Screen
          name="cook/meals"
          options={{
            title: 'My Meals',
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant-outline" size={28} color={color} />
            ),
          }}
        />
      )}
      
      {/* One orders tab for all users */}
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Orders',
          tabBarIcon: ({ color }) => (
            <Ionicons name="receipt-outline" size={28} color={color} />
          ),
        }}
      />
      
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
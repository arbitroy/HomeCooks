
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, View, ActivityIndicator } from 'react-native';

import { HapticTab } from '@/components/HapticTab';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors, COLORS } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useAuth } from '@/app/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { user, loading } = useAuth();
  
  // Only render tabs once loading is complete AND we have user data
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Directly check if the user is a cook - this is safer than using a state variable
  const isCook = user?.userType === 'cook';

  // Screen options with consistent style
  const screenOptions = {
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
  };


  if (isCook) {
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
        
        <Tabs.Screen
          name="cook/meals"
          options={{
            title: 'My Meals',
            tabBarIcon: ({ color }) => (
              <Ionicons name="restaurant-outline" size={28} color={color} />
            ),
          }}
        />
        
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
  } else {
    // Customer-specific tabs (unchanged)
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
}
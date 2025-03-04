import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Slot, Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './providers/ThemeProvider';
import { COLORS } from '@/constants/Colors';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <AuthProvider>
      <ThemeProvider>
        <NavigationThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <AuthenticationGuard>
            <StatusBar style="auto" />
          </AuthenticationGuard>
        </NavigationThemeProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

// Authentication guard component to handle protected routes
function AuthenticationGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  // This effect is used to redirect users based on their authentication status
  useEffect(() => {
    // Skip when app is initializing
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    // If user is logged in and tries to access auth screens, redirect to home
    if (user && inAuthGroup) {
      router.replace('/(tabs)/');
    }

    // If user is not logged in and tries to access protected screens, redirect to login
    else if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    }
  }, [user, loading, segments]);

  // Show loading screen while determining auth state
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // Render the app content
  return <Slot />;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
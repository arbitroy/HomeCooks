// app/_layout.tsx (Update existing root layout to handle redirects)

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
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from './config/firebase';
import { User } from './services/auth';

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
  const segments: string[] = useSegments();
  const router = useRouter();

  async function checkCookProfileCompletion(user: User) {
    if (user?.userType === 'cook') {
      try {
        const cookProfileRef = doc(firestore, 'cook_profiles', user.uid);
        const cookProfileSnap = await getDoc(cookProfileRef);

        // If profile doesn't exist or is incomplete
        if (!cookProfileSnap.exists() ||
          !cookProfileSnap.data().bio ||
          !cookProfileSnap.data().cuisineTypes ||
          cookProfileSnap.data().cuisineTypes.length === 0) {

          // Check if user is already on profile setup page
          const onProfileSetup = segments.includes('cook') && segments.includes('profile-setup');

          // If not on profile setup page and not on the initial login flow, redirect
          if (!onProfileSetup && segments[0] !== 'auth') {
            router.replace('/cook/profile-setup');
            return;
          }
        }
      } catch (error) {
        console.error('Error checking cook profile:', error);
      }
    }
  }

  // This effect is used to redirect users based on their authentication status
  useEffect(() => {
    // Skip when app is initializing
    if (loading) return;

    const inAuthGroup = segments[0] === 'auth';

    // Handle redirect for the old cook-dashboard tab (if anyone tries to access it directly)
    if (segments.length >= 2 && segments[0] === '(tabs)' && segments[1] === 'cook-dashboard') {
      if (user?.userType === 'cook') {
        router.replace('/cook/dashboard');
      } else {
        router.replace('/(tabs)');
      }
      return;
    }

    // If user is logged in and tries to access auth screens, redirect to home
    if (user && inAuthGroup) {
      router.replace('/(tabs)');
    }

    // If user is not logged in and tries to access protected screens, redirect to login
    else if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    }

    // If logged in user is a cook, check profile completion
    else if (user) {
      checkCookProfileCompletion(user);
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
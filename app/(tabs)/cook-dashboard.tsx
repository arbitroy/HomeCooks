// app/(tabs)/cook-dashboard.tsx
import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Stack } from 'expo-router';

// Import the dashboard components directly
import {
  renderCookDashboardContent,  // This would be a function we'll create
  loadDashboardData          // This would be a function we'll create
} from '../cook/dashboard';    // Import from the dashboard file

/**
 * This keeps the dashboard within the tab structure by rendering
 * the dashboard content directly rather than redirecting.
 */
export default function CookDashboardTab() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    // Load dashboard data
    useEffect(() => {
        async function fetchData() {
            if (user?.userType === 'cook') {
                setLoading(true);
                try {
                    // Call the load function from the dashboard file
                    const data = await loadDashboardData(user);
                    setDashboardData(data);
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            } else if (user) {
                // Redirect non-cooks to home
                router.replace('/(tabs)');
            }
        }
        
        fetchData();
    }, [user]);

    // Show loading state while auth is being checked
    if (!user || loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // For cooks, render the dashboard content directly in the tabs layout
    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Cook Dashboard', headerShown: true }} />
            <ScrollView style={styles.scrollView}>
                {renderCookDashboardContent(dashboardData, user, router)}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
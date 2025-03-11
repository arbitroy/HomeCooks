import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * This is a direct navigation to the dashboard screen.
 * Instead of redirecting, it directly renders the dashboard content.
 */
export default function CookDashboardTab() {
    const { user } = useAuth();

    // Show loading state while auth is being checked
    if (!user) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // Redirect non-cooks to home
    if (user.userType !== 'cook') {
        return <Redirect href="/(tabs)" />;
    }

    // For cooks, redirect to the actual dashboard content
    // This is a one-time navigation, not a circular reference
    return <Redirect href="/cook/dashboard" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
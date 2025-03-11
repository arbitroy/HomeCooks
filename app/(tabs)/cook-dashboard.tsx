import React, { useEffect } from 'react';
import { Redirect, useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * This component serves as a redirect that maintains compatibility with 
 * the tab navigation structure. It simply forwards to the dashboard page.
 */
export default function CookDashboardTab() {
    const { user } = useAuth();
    const router = useRouter();

    // Use a direct return for safety
    if (!user) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // If not a cook, redirect to home
    if (user.userType !== 'cook') {
        return <Redirect href="/(tabs)/" />;
    }

    // Redirect to the actual dashboard page
    return <Redirect href="/cook/dashboard" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
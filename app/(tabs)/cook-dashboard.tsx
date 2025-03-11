import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Stack } from 'expo-router';

import {
    renderCookDashboardContent,
    loadDashboardData
} from '../cook/dashboard';

export default function CookDashboardTab() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState(null);

    // Protect route - immediately redirect non-cook users
    useEffect(() => {
        if (user && user.userType !== 'cook') {
            Alert.alert('Access Denied', 'This area is only available to cooks');
            router.replace('/(tabs)');
        }
    }, [user, router]);

    // Load dashboard data for cooks
    useEffect(() => {
        async function fetchData() {
            if (user?.userType === 'cook') {
                setLoading(true);
                try {
                    const data = await loadDashboardData(user);
                    setDashboardData(data);
                } catch (error) {
                    console.error('Error loading dashboard data:', error);
                } finally {
                    setLoading(false);
                }
            }
        }

        if (user?.userType === 'cook') {
            fetchData();
        }
    }, [user]);

    // If not a cook, show nothing (will be redirected)
    if (user && user.userType !== 'cook') {
        return null;
    }

    // Show loading state while auth is being checked
    if (!user || loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={COLORS.primary} />
            </View>
        );
    }

    // For cooks, render the dashboard content
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
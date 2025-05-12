import React from 'react';
import { StyleSheet, View, TouchableOpacity, Image, Alert, ScrollView } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    const router = useRouter();

    // Determine if user is a cook (safely with fallback)
    const isCook = user?.userType === 'cook';

    const handleLogout = async () => {
        try {
            await logout();
            // Navigation will be handled by the root layout based on auth state
        } catch (error) {
            console.error('Error logging out:', error);
            Alert.alert('Error', 'Failed to log out. Please try again.');
        }
    };

    const confirmLogout = () => {
        Alert.alert(
            'Logout',
            'Are you sure you want to log out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Logout', onPress: handleLogout, style: 'destructive' }
            ]
        );
    };

    const navigateToEditProfile = () => {
        router.push('/profile/edit');
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'My Profile', headerShown: true }} />

            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        {user?.photoURL ? (
                            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <ThemedText style={styles.avatarText}>
                                    {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                                </ThemedText>
                            </View>
                        )}
                    </View>

                    <ThemedText type="title" style={styles.name}>
                        {user?.displayName || 'User'}
                    </ThemedText>
                    <ThemedText style={styles.email}>{user?.email}</ThemedText>
                    <ThemedText style={styles.userType}>
                        {user?.userType === 'cook' ? 'Home Cook' : 'Customer'}
                    </ThemedText>

                    <TouchableOpacity
                        style={styles.editButton}
                        onPress={navigateToEditProfile}
                    >
                        <ThemedText style={styles.editButtonText}>Edit Profile</ThemedText>
                    </TouchableOpacity>
                </View>

                <View style={styles.menuContainer}>
                    {/* Dashboard menu item for cooks - prominently displayed at the top */}
                    {isCook && (
                        <TouchableOpacity
                            style={[styles.menuItem, styles.dashboardMenuItem]}
                            onPress={() => router.push('/cook/dashboard')}
                        >
                            <Ionicons name="grid-outline" size={24} color="#fff" style={styles.dashboardMenuIcon} />
                            <ThemedText style={styles.dashboardMenuText}>Cook Dashboard</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#fff" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/orders')}>
                        <Ionicons name="receipt-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
                        <ThemedText style={styles.menuText}>My Orders</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    {/* Only show cook-specific menu items for cooks */}
                    {isCook && (
                        <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/cook/meals')}>
                            <Ionicons name="restaurant-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
                            <ThemedText style={styles.menuText}>My Meals</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    )}

                    {isCook && (
                        <TouchableOpacity
                            style={styles.menuItem}
                            onPress={() => router.push('/cook/profile-setup')}
                        >
                            <Ionicons
                                name="person-outline"
                                size={24}
                                color={COLORS.primary}
                                style={styles.menuIcon}
                            />
                            <ThemedText style={styles.menuText}>Cook Profile Setup</ThemedText>
                            <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}>
                        <Ionicons name="heart-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
                        <ThemedText style={styles.menuText}>Favorites</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}>
                        <Ionicons name="settings-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
                        <ThemedText style={styles.menuText}>Settings</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.menuItem} onPress={() => Alert.alert('Coming Soon', 'This feature will be available soon.')}>
                        <Ionicons name="help-circle-outline" size={24} color={COLORS.primary} style={styles.menuIcon} />
                        <ThemedText style={styles.menuText}>Help & Support</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.logoutButton} onPress={confirmLogout}>
                    <Ionicons name="log-out-outline" size={20} color={COLORS.error} style={styles.logoutIcon} />
                    <ThemedText style={styles.logoutText}>Logout</ThemedText>
                </TouchableOpacity>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 30, // Add some padding at the bottom
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    avatarContainer: {
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarText: {
        color: '#fff',
        fontSize: 40,
        fontWeight: 'bold',
    },
    name: {
        fontSize: 24,
        marginBottom: 4,
    },
    email: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    userType: {
        fontSize: 14,
        color: COLORS.primary,
        marginBottom: 16,
        fontWeight: '500',
    },
    editButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        backgroundColor: COLORS.primary,
    },
    editButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    menuContainer: {
        marginTop: 20,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    // Special styling for dashboard menu item to make it stand out
    dashboardMenuItem: {
        backgroundColor: COLORS.primary,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderBottomWidth: 0,
    },
    menuIcon: {
        marginRight: 16,
    },
    dashboardMenuIcon: {
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
    },
    dashboardMenuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 30,
        marginBottom: 30,
        paddingVertical: 12,
    },
    logoutIcon: {
        marginRight: 8,
    },
    logoutText: {
        color: COLORS.error,
        fontSize: 16,
        fontWeight: '500',
    },
});
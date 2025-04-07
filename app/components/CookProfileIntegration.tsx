import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getCookProfile } from '@/app/services/cookProfile';

/**
 * Custom hook to check cook profile completion status
 * This can be used across multiple components
 */
export const useCookProfileStatus = () => {
    const { user } = useAuth();
    const [profileComplete, setProfileComplete] = useState<boolean | null>(null);
    const [loading, setLoading] = useState(true);

    // Use callback to prevent recreation on each render
    const checkProfile = useCallback(async () => {
        try {
            if (user?.userType !== 'cook') {
                setProfileComplete(null);
                setLoading(false);
                return;
            }

            setLoading(true);
            const profile = await getCookProfile(user.uid);
            setProfileComplete(
                !!profile &&
                !!profile.bio &&
                profile.cuisineTypes.length > 0
            );
        } catch (error) {
            console.error('Error checking profile:', error);
            setProfileComplete(false);
        } finally {
            setLoading(false);
        }
    }, [user?.userType, user?.uid]);

    // Only run the effect when user changes
    React.useEffect(() => {
        if (user) {
            checkProfile();
        }
    }, [user, checkProfile]);

    return { profileComplete, loading, refreshStatus: checkProfile };
};

/**
 * Profile Setup Button Component
 * Can be used in multiple places like profile page, dashboard, etc.
 */
export const ProfileSetupButton = React.memo(() => {
    const router = useRouter();
    const { user } = useAuth();
    const { profileComplete, loading } = useCookProfileStatus();

    if (user?.userType !== 'cook' || loading || profileComplete === true) {
        return null;
    }

    return (
        <TouchableOpacity
            style={styles.profileSetupButton}
            onPress={() => router.push('/cook/profile-setup')}
        >
            <Ionicons name="person-add-outline" size={20} color="#fff" />
            <ThemedText style={styles.buttonText}>
                {profileComplete === false ? 'Complete' : 'Set Up'} Cook Profile
            </ThemedText>
        </TouchableOpacity>
    );
});

/**
 * Alert Banner Component for incomplete profile
 * Can be used on dashboard or other cook-specific screens
 */
export const ProfileIncompleteAlert = React.memo(({ onPress }: { onPress?: () => void }) => {
    const router = useRouter();
    const { profileComplete, loading } = useCookProfileStatus();

    if (loading || profileComplete !== false) {
        return null;
    }

    const handlePress = () => {
        if (onPress) {
            onPress();
        } else {
            router.push('/cook/profile-setup');
        }
    };

    return (
        <TouchableOpacity style={styles.alertBanner} onPress={handlePress}>
            <Ionicons name="alert-circle" size={24} color="#fff" />
            <ThemedText style={styles.alertText}>
                Complete your cook profile to attract more customers
            </ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
    );
});

// Ensure component display names are set for better debugging
ProfileSetupButton.displayName = 'ProfileSetupButton';
ProfileIncompleteAlert.displayName = 'ProfileIncompleteAlert';

const styles = StyleSheet.create({
    profileSetupButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 12,
    },
    buttonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
    alertBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.secondary,
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginBottom: 16,
    },
    alertText: {
        flex: 1,
        color: '#fff',
        marginHorizontal: 12,
    },
});

// Add a default export combining both components
const CookProfileIntegration = {
    ProfileSetupButton,
    ProfileIncompleteAlert,
    useCookProfileStatus
};

export default CookProfileIntegration;
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    Platform,
    ScrollView,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function EditProfileScreen() {
    const { user, updateUserProfile, loading: authLoading } = useAuth();
    const router = useRouter();
    const [displayName, setDisplayName] = useState<string>(user?.displayName || '');
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // Initialize the form with user data
        if (user) {
            setDisplayName(user.displayName || '');
            // If user has a profile image, we could set it here, but we'd need to download it
            // from Firebase storage first
        }
    }, [user]);
    
    // Request permissions for image picker
    const requestMediaLibraryPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'Please grant camera roll permissions to upload a profile photo.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    // Handle image picking
    const handlePickImage = async () => {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            allowsMultipleSelection: false,
            aspect: [1, 1],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Handle form submission
    const handleSubmit = async () => {
        if (!user) return;
        
        if (!displayName.trim()) {
            Alert.alert('Error', 'Please enter a display name');
            return;
        }

        try {
            setLoading(true);
            // For now, only update display name as it's more reliable
            await updateUserProfile({
                displayName: displayName.trim()
                // Skip photo update for now
                // photoURI: imageUri
            });
            
            Alert.alert(
                'Success',
                'Your profile has been updated successfully',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error updating profile:', error);
            let errorMessage = 'Failed to update profile';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Edit Profile' }} />
            
            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Profile Image */}
                <View style={styles.imageContainer}>
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={styles.profileImage} />
                    ) : user?.photoURL ? (
                        <Image source={{ uri: user.photoURL }} style={styles.profileImage} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <ThemedText style={styles.avatarText}>
                                {user?.displayName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
                            </ThemedText>
                        </View>
                    )}
                    
                    <TouchableOpacity
                        style={styles.changePhotoButton}
                        onPress={handlePickImage}
                    >
                        <Ionicons name="camera-outline" size={20} color="#fff" />
                        <ThemedText style={styles.changePhotoText}>
                            Change Photo
                        </ThemedText>
                    </TouchableOpacity>
                </View>
                
                {/* Form Fields */}
                <View style={styles.formContainer}>
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Display Name</ThemedText>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Enter your display name"
                            placeholderTextColor="#999"
                        />
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Email</ThemedText>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.email || ''}
                            editable={false}
                        />
                        <ThemedText style={styles.helperText}>
                            Email cannot be changed
                        </ThemedText>
                    </View>
                    
                    <View style={styles.inputContainer}>
                        <ThemedText style={styles.label}>Account Type</ThemedText>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={user?.userType === 'cook' ? 'Home Cook' : 'Customer'}
                            editable={false}
                        />
                        <ThemedText style={styles.helperText}>
                            Account type cannot be changed
                        </ThemedText>
                    </View>
                    
                    {/* Submit Button */}
                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={handleSubmit}
                        disabled={loading || authLoading}
                    >
                        {loading || authLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.saveButtonText}>
                                Save Changes
                            </ThemedText>
                        )}
                    </TouchableOpacity>
                    
                    {/* Cancel Button */}
                    <TouchableOpacity
                        style={styles.cancelButton}
                        onPress={() => router.back()}
                        disabled={loading || authLoading}
                    >
                        <ThemedText style={styles.cancelButtonText}>
                            Cancel
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 50,
        alignItems: 'center',
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        color: '#fff',
        fontSize: 48,
        fontWeight: 'bold',
    },
    changePhotoButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
    },
    changePhotoText: {
        color: '#fff',
        marginLeft: 6,
        fontWeight: '500',
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    disabledInput: {
        backgroundColor: '#f5f5f5',
        color: '#666',
    },
    helperText: {
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 12,
    },
    cancelButtonText: {
        color: COLORS.primary,
        fontSize: 16,
        fontWeight: '500',
    },
});
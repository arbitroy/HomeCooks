// app/cook/profile-setup.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TextInput,
    TouchableOpacity,
    Switch,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { 
    CookProfile, 
    CookProfileInput, 
    CUISINE_TYPES, 
    getCookProfile, 
    updateCookProfile 
} from '@/app/services/cookProfile';
import { 
    getCurrentLocation, 
    LocationCoordinates, 
    getAddressFromCoordinates, 
    requestLocationPermissions 
} from '@/app/services/location';

// Days of the week for availability
const DAYS_OF_WEEK = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'
];

// Validation schema
const ProfileSchema = Yup.object().shape({
    bio: Yup.string()
        .required('Bio is required')
        .min(20, 'Bio must be at least 20 characters')
        .max(500, 'Bio must be less than 500 characters'),
    cuisineTypes: Yup.array()
        .of(Yup.string())
        .min(1, 'Select at least one cuisine type'),
    deliveryAvailable: Yup.boolean(),
    deliveryRadius: Yup.number()
        .when('deliveryAvailable', {
            is: true,
            then: Yup.number()
                .required('Delivery radius is required')
                .min(1, 'Minimum radius is 1 km')
                .max(50, 'Maximum radius is 50 km')
        }),
    deliveryFee: Yup.number()
        .when('deliveryAvailable', {
            is: true,
            then: Yup.number()
                .required('Delivery fee is required')
                .min(0, 'Delivery fee cannot be negative')
        }),
    minimumOrderAmount: Yup.number()
        .min(0, 'Minimum order amount cannot be negative')
});

export default function CookProfileSetupScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [profile, setProfile] = useState<CookProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
    const [userAddress, setUserAddress] = useState<string>('');
    const [locationLoading, setLocationLoading] = useState(false);

    // Initial profile load
    useEffect(() => {
        const loadProfile = async () => {
            try {
                setLoading(true);
                
                if (!user) {
                    Alert.alert('Error', 'You must be logged in to set up your profile');
                    router.replace('/auth/login');
                    return;
                }
                
                if (user.userType !== 'cook') {
                    Alert.alert('Error', 'Only cooks can access this screen');
                    router.replace('/(tabs)');
                    return;
                }
                
                // Try to load existing profile
                const existingProfile = await getCookProfile(user.uid);
                if (existingProfile) {
                    setProfile(existingProfile);
                }
                
                // Get user location
                await loadUserLocation();
            } catch (error) {
                console.error('Error loading profile:', error);
                Alert.alert('Error', 'Failed to load profile data');
            } finally {
                setLoading(false);
            }
        };
        
        loadProfile();
    }, [user]);

    // Load user location
    const loadUserLocation = async () => {
        try {
            setLocationLoading(true);
            
            // Request location permissions
            const hasPermission = await requestLocationPermissions();
            
            if (!hasPermission) {
                Alert.alert(
                    'Location Permission Required',
                    'We need your location to provide better services to nearby customers.'
                );
                return;
            }
            
            // Get current location
            const location = await getCurrentLocation();
            
            if (location) {
                setUserLocation(location);
                
                // Get address from coordinates
                const address = await getAddressFromCoordinates(location);
                if (address && address.formattedAddress) {
                    setUserAddress(address.formattedAddress);
                }
            }
        } catch (error) {
            console.error('Error getting location:', error);
        } finally {
            setLocationLoading(false);
        }
    };

    // Handle form submission
    const handleSubmit = async (values: any) => {
        try {
            if (!user) {
                Alert.alert('Error', 'You must be logged in to save your profile');
                return;
            }
            
            setSubmitting(true);
            
            const profileInput: CookProfileInput = {
                bio: values.bio,
                cuisineTypes: values.cuisineTypes,
                deliveryAvailable: values.deliveryAvailable,
                deliveryRadius: values.deliveryAvailable ? values.deliveryRadius : undefined,
                deliveryFee: values.deliveryAvailable ? values.deliveryFee : undefined,
                minimumOrderAmount: values.minimumOrderAmount || 0,
                availableDays: values.availableDays || DAYS_OF_WEEK,
                coordinates: userLocation
            };
            
            await updateCookProfile(user, profileInput);
            
            Alert.alert(
                'Profile Saved',
                'Your cook profile has been successfully saved.',
                [
                    { 
                        text: 'OK', 
                        onPress: () => router.replace('/(tabs)/cook/meals') 
                    }
                ]
            );
        } catch (error) {
            console.error('Error saving profile:', error);
            Alert.alert('Error', 'Failed to save profile. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    // Get initial form values
    const getInitialValues = () => {
        if (profile) {
            return {
                bio: profile.bio || '',
                cuisineTypes: profile.cuisineTypes || [],
                deliveryAvailable: profile.deliveryAvailable || false,
                deliveryRadius: profile.deliveryRadius || 5,
                deliveryFee: profile.deliveryFee || 5,
                minimumOrderAmount: profile.minimumOrderAmount || 10,
                availableDays: profile.availableDays || DAYS_OF_WEEK
            };
        }
        
        return {
            bio: '',
            cuisineTypes: [],
            deliveryAvailable: false,
            deliveryRadius: 5,
            deliveryFee: 5,
            minimumOrderAmount: 10,
            availableDays: DAYS_OF_WEEK
        };
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading profile data...</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Set Up Cook Profile' }} />
            
            <Formik
                initialValues={getInitialValues()}
                validationSchema={ProfileSchema}
                onSubmit={handleSubmit}
                enableReinitialize
            >
                {({
                    handleChange,
                    handleBlur,
                    handleSubmit,
                    setFieldValue,
                    values,
                    errors,
                    touched
                }) => (
                    <ScrollView 
                        style={styles.scrollView}
                        contentContainerStyle={styles.scrollContent}
                    >
                        <View style={styles.sectionContainer}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                About You
                            </ThemedText>
                            
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Bio</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={values.bio}
                                    onChangeText={handleChange('bio')}
                                    onBlur={handleBlur('bio')}
                                    placeholder="Tell customers about yourself, your cooking experience, and what makes your food special."
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                                {touched.bio && errors.bio && (
                                    <ThemedText style={styles.errorText}>{errors.bio}</ThemedText>
                                )}
                                <ThemedText style={styles.charCount}>
                                    {values.bio.length}/500
                                </ThemedText>
                            </View>
                        </View>
                        
                        <View style={styles.sectionContainer}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Cuisine Specialties
                            </ThemedText>
                            <ThemedText style={styles.sectionDescription}>
                                Select the cuisines you specialize in (at least one):
                            </ThemedText>
                            
                            <View style={styles.cuisineGrid}>
                                {CUISINE_TYPES.map((cuisine) => (
                                    <TouchableOpacity
                                        key={cuisine}
                                        style={[
                                            styles.cuisineItem,
                                            values.cuisineTypes.includes(cuisine) && styles.selectedCuisine
                                        ]}
                                        onPress={() => {
                                            const currentCuisines = [...values.cuisineTypes];
                                            if (currentCuisines.includes(cuisine)) {
                                                setFieldValue(
                                                    'cuisineTypes',
                                                    currentCuisines.filter(c => c !== cuisine)
                                                );
                                            } else {
                                                setFieldValue(
                                                    'cuisineTypes',
                                                    [...currentCuisines, cuisine]
                                                );
                                            }
                                        }}
                                    >
                                        <ThemedText
                                            style={[
                                                styles.cuisineText,
                                                values.cuisineTypes.includes(cuisine) && styles.selectedCuisineText
                                            ]}
                                        >
                                            {cuisine}
                                        </ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                            
                            {touched.cuisineTypes && errors.cuisineTypes && (
                                <ThemedText style={styles.errorText}>{errors.cuisineTypes}</ThemedText>
                            )}
                        </View>
                        
                        <View style={styles.sectionContainer}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Your Kitchen Location
                            </ThemedText>
                            
                            <View style={styles.locationContainer}>
                                <View style={styles.locationHeader}>
                                    <Ionicons name="location" size={24} color={COLORS.primary} />
                                    <ThemedText style={styles.locationHeaderText}>
                                        Current Location
                                    </ThemedText>
                                </View>
                                
                                {locationLoading ? (
                                    <View style={styles.locationLoading}>
                                        <ActivityIndicator size="small" color={COLORS.primary} />
                                        <ThemedText style={styles.locationLoadingText}>
                                            Getting your location...
                                        </ThemedText>
                                    </View>
                                ) : userLocation ? (
                                    <View>
                                        <ThemedText style={styles.locationText}>
                                            {userAddress || 'Location detected'}
                                        </ThemedText>
                                        <TouchableOpacity
                                            style={styles.refreshLocationButton}
                                            onPress={loadUserLocation}
                                        >
                                            <Ionicons name="refresh" size={16} color={COLORS.primary} />
                                            <ThemedText style={styles.refreshLocationText}>
                                                Refresh Location
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View>
                                        <ThemedText style={styles.locationErrorText}>
                                            Location not available
                                        </ThemedText>
                                        <TouchableOpacity
                                            style={styles.getLocationButton}
                                            onPress={loadUserLocation}
                                        >
                                            <ThemedText style={styles.getLocationText}>
                                                Get Current Location
                                            </ThemedText>
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        </View>
                        
                        <View style={styles.sectionContainer}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Delivery Options
                            </ThemedText>
                            
                            <View style={styles.switchContainer}>
                                <ThemedText style={styles.switchLabel}>
                                    Offer Delivery
                                </ThemedText>
                                <Switch
                                    value={values.deliveryAvailable}
                                    onValueChange={(value) => setFieldValue('deliveryAvailable', value)}
                                    trackColor={{ false: '#ccc', true: COLORS.primary }}
                                    thumbColor={Platform.OS === 'android' ? COLORS.primary : '#fff'}
                                />
                            </View>
                            
                            {values.deliveryAvailable && (
                                <>
                                    <View style={styles.inputContainer}>
                                        <ThemedText style={styles.label}>
                                            Delivery Radius (km)
                                        </ThemedText>
                                        <TextInput
                                            style={styles.input}
                                            value={values.deliveryRadius.toString()}
                                            onChangeText={(text) => {
                                                const value = parseFloat(text) || 0;
                                                setFieldValue('deliveryRadius', value);
                                            }}
                                            onBlur={handleBlur('deliveryRadius')}
                                            placeholder="Enter delivery radius in kilometers"
                                            placeholderTextColor="#999"
                                            keyboardType="decimal-pad"
                                        />
                                        {touched.deliveryRadius && errors.deliveryRadius && (
                                            <ThemedText style={styles.errorText}>
                                                {errors.deliveryRadius}
                                            </ThemedText>
                                        )}
                                    </View>
                                    
                                    <View style={styles.inputContainer}>
                                        <ThemedText style={styles.label}>
                                            Delivery Fee ($)
                                        </ThemedText>
                                        <TextInput
                                            style={styles.input}
                                            value={values.deliveryFee.toString()}
                                            onChangeText={(text) => {
                                                const value = parseFloat(text) || 0;
                                                setFieldValue('deliveryFee', value);
                                            }}
                                            onBlur={handleBlur('deliveryFee')}
                                            placeholder="Enter delivery fee"
                                            placeholderTextColor="#999"
                                            keyboardType="decimal-pad"
                                        />
                                        {touched.deliveryFee && errors.deliveryFee && (
                                            <ThemedText style={styles.errorText}>
                                                {errors.deliveryFee}
                                            </ThemedText>
                                        )}
                                    </View>
                                </>
                            )}
                            
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>
                                    Minimum Order Amount ($)
                                </ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={values.minimumOrderAmount.toString()}
                                    onChangeText={(text) => {
                                        const value = parseFloat(text) || 0;
                                        setFieldValue('minimumOrderAmount', value);
                                    }}
                                    onBlur={handleBlur('minimumOrderAmount')}
                                    placeholder="Enter minimum order amount"
                                    placeholderTextColor="#999"
                                    keyboardType="decimal-pad"
                                />
                                {touched.minimumOrderAmount && errors.minimumOrderAmount && (
                                    <ThemedText style={styles.errorText}>
                                        {errors.minimumOrderAmount}
                                    </ThemedText>
                                )}
                            </View>
                        </View>
                        
                        <View style={styles.sectionContainer}>
                            <ThemedText type="subtitle" style={styles.sectionTitle}>
                                Availability Days
                            </ThemedText>
                            <ThemedText style={styles.sectionDescription}>
                                Select days when you're available to cook:
                            </ThemedText>
                            
                            <View style={styles.daysContainer}>
                                {DAYS_OF_WEEK.map((day) => (
                                    <TouchableOpacity
                                        key={day}
                                        style={styles.dayRow}
                                        onPress={() => {
                                            const currentDays = [...values.availableDays];
                                            if (currentDays.includes(day)) {
                                                setFieldValue(
                                                    'availableDays',
                                                    currentDays.filter(d => d !== day)
                                                );
                                            } else {
                                                setFieldValue(
                                                    'availableDays',
                                                    [...currentDays, day]
                                                );
                                            }
                                        }}
                                    >
                                        <View style={[
                                            styles.checkbox,
                                            values.availableDays.includes(day) && styles.checkboxChecked
                                        ]}>
                                            {values.availableDays.includes(day) && (
                                                <Ionicons name="checkmark" size={16} color="#fff" />
                                            )}
                                        </View>
                                        <ThemedText style={styles.dayText}>{day}</ThemedText>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                        
                        <View style={styles.buttonContainer}>
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={() => handleSubmit()}
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.saveButtonText}>
                                        {profile ? 'Update Profile' : 'Save Profile'}
                                    </ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                )}
            </Formik>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 50,
    },
    sectionContainer: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        marginBottom: 12,
    },
    sectionDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    inputContainer: {
        marginBottom: 16,
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
    textArea: {
        height: 120,
        paddingTop: 12,
        paddingBottom: 12,
        textAlignVertical: 'top',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    charCount: {
        textAlign: 'right',
        fontSize: 12,
        color: '#666',
        marginTop: 4,
    },
    cuisineGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    cuisineItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        margin: 4,
    },
    selectedCuisine: {
        backgroundColor: COLORS.primary,
    },
    cuisineText: {
        color: COLORS.primary,
    },
    selectedCuisineText: {
        color: '#fff',
    },
    locationContainer: {
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        padding: 16,
    },
    locationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    locationHeaderText: {
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 8,
    },
    locationLoading: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationLoadingText: {
        marginLeft: 8,
        color: '#666',
    },
    locationText: {
        color: '#666',
        marginBottom: 8,
    },
    locationErrorText: {
        color: COLORS.error,
        marginBottom: 8,
    },
    refreshLocationButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    refreshLocationText: {
        color: COLORS.primary,
        marginLeft: 4,
    },
    getLocationButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    getLocationText: {
        color: '#fff',
    },
    switchContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    switchLabel: {
        fontSize: 16,
    },
    daysContainer: {
        marginTop: 8,
    },
    dayRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        fontSize: 16,
    },
    buttonContainer: {
        marginTop: 24,
        marginBottom: 40,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
// app/cook/discovery.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    RefreshControl,
    ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import {
    getCurrentLocation,
    findNearbyCooks,
    LocationCoordinates,
    calculateDistance
} from '@/app/services/location';
import { User } from '@/app/services/auth';
import { CookProfile, getCookProfile, CUISINE_TYPES } from '@/app/services/cookProfile';

// Extended User type with cook profile and distance
interface CookWithProfile extends User {
    profile?: CookProfile;
    distance?: number;
}

// Distance filter options in kilometers
const DISTANCE_FILTERS = [
    { label: 'Any Distance', value: 0 },
    { label: '5 km', value: 5 },
    { label: '10 km', value: 10 },
    { label: '20 km', value: 20 },
    { label: '50 km', value: 50 }
];

export default function CookDiscoveryScreen() {
    const { user } = useAuth();
    const router = useRouter();
    
    const [cooks, setCooks] = useState<CookWithProfile[]>([]);
    const [filteredCooks, setFilteredCooks] = useState<CookWithProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
    const [selectedDistance, setSelectedDistance] = useState<number>(10); // Default 10km
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);

    // Load nearby cooks
    const loadNearbyCooks = async () => {
        try {
            setLoading(true);
            
            // Get user's current location
            const location = await getCurrentLocation();
            if (!location) {
                setLocationPermissionGranted(false);
                Alert.alert(
                    'Location Required',
                    'Please enable location services to find nearby cooks.'
                );
                setLoading(false);
                return;
            }

            setUserLocation(location);
            setLocationPermissionGranted(true);

            // Find nearby cooks
            const nearbyUsers = await findNearbyCooks(location, selectedDistance || 50);
            
            // Get cook profiles for each user
            const cooksWithProfiles = await Promise.all(
                nearbyUsers.map(async (cookUser) => {
                    try {
                        const profile = await getCookProfile(cookUser.uid);
                        return {
                            ...cookUser,
                            profile
                        } as CookWithProfile;
                    } catch (error) {
                        console.error(`Error loading profile for cook ${cookUser.uid}:`, error);
                        return {
                            ...cookUser,
                            profile: undefined
                        } as CookWithProfile;
                    }
                })
            );

            // Filter out cooks without profiles and sort by distance
            const validCooks = cooksWithProfiles
                .filter(cook => cook.profile)
                .sort((a, b) => (a.distance || 0) - (b.distance || 0));

            setCooks(validCooks);
            setFilteredCooks(validCooks);
        } catch (error) {
            console.error('Error loading nearby cooks:', error);
            Alert.alert('Error', 'Failed to load nearby cooks. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadNearbyCooks();
    }, [selectedDistance]);

    // Apply filters
    useEffect(() => {
        let filtered = [...cooks];

        // Apply distance filter
        if (selectedDistance > 0) {
            filtered = filtered.filter(cook => (cook.distance || 0) <= selectedDistance);
        }

        // Apply cuisine filter
        if (selectedCuisine) {
            filtered = filtered.filter(cook => 
                cook.profile?.cuisineTypes.includes(selectedCuisine)
            );
        }

        setFilteredCooks(filtered);
    }, [cooks, selectedDistance, selectedCuisine]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadNearbyCooks();
    };

    // Handle distance filter change
    const handleDistanceFilter = (distance: number) => {
        setSelectedDistance(distance);
    };

    // Handle cuisine filter change
    const handleCuisineFilter = (cuisine: string) => {
        if (cuisine === selectedCuisine) {
            setSelectedCuisine(null); // Deselect if already selected
        } else {
            setSelectedCuisine(cuisine);
        }
    };

    // Render cook card
    const renderCookCard = ({ item }: { item: CookWithProfile }) => (
        <TouchableOpacity
            style={styles.cookCard}
            onPress={() => router.push(`/cook/${item.uid}`)}
        >
            <View style={styles.cookHeader}>
                <View style={styles.cookAvatar}>
                    <ThemedText style={styles.cookInitial}>
                        {item.displayName?.charAt(0) || item.email?.charAt(0)?.toUpperCase() || '?'}
                    </ThemedText>
                </View>
                
                <View style={styles.cookInfo}>
                    <ThemedText type="defaultSemiBold" style={styles.cookName}>
                        {item.displayName || `Chef ${item.uid.substring(0, 8)}`}
                    </ThemedText>
                    
                    {item.profile?.averageRating !== undefined && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={16} color="#FFD700" />
                            <ThemedText style={styles.ratingText}>
                                {item.profile.averageRating.toFixed(1)} ({item.profile.totalReviews} reviews)
                            </ThemedText>
                        </View>
                    )}
                    
                    {item.distance !== undefined && (
                        <View style={styles.distanceContainer}>
                            <Ionicons name="location-outline" size={16} color={COLORS.primary} />
                            <ThemedText style={styles.distanceText}>
                                {item.distance < 1 
                                    ? `${(item.distance * 1000).toFixed(0)} m` 
                                    : `${item.distance.toFixed(1)} km`}
                            </ThemedText>
                        </View>
                    )}
                </View>
            </View>

            {/* Cuisine types */}
            <View style={styles.cuisineContainer}>
                {item.profile?.cuisineTypes.slice(0, 3).map((cuisine, index) => (
                    <View key={index} style={styles.cuisineTag}>
                        <ThemedText style={styles.cuisineTagText}>{cuisine}</ThemedText>
                    </View>
                ))}
                {item.profile && item.profile.cuisineTypes.length > 3 && (
                    <View style={styles.cuisineTag}>
                        <ThemedText style={styles.cuisineTagText}>
                            +{item.profile.cuisineTypes.length - 3}
                        </ThemedText>
                    </View>
                )}
            </View>

            {/* Service info */}
            <View style={styles.serviceInfo}>
                <View style={styles.serviceItem}>
                    <Ionicons 
                        name={item.profile?.deliveryAvailable ? "bicycle-outline" : "restaurant-outline"} 
                        size={16} 
                        color={COLORS.primary} 
                    />
                    <ThemedText style={styles.serviceText}>
                        {item.profile?.deliveryAvailable ? 'Delivery' : 'Pickup Only'}
                    </ThemedText>
                </View>
                
                {item.profile?.minimumOrderAmount && (
                    <View style={styles.serviceItem}>
                        <Ionicons name="receipt-outline" size={16} color={COLORS.primary} />
                        <ThemedText style={styles.serviceText}>
                            Min. ${item.profile.minimumOrderAmount.toFixed(2)}
                        </ThemedText>
                    </View>
                )}
            </View>
        </TouchableOpacity>
    );

    // Render empty state
    const renderEmptyState = () => {
        if (loading) return null;

        if (!locationPermissionGranted) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="location-outline" size={64} color="#ccc" />
                    <ThemedText style={styles.emptyTitle}>Location Required</ThemedText>
                    <ThemedText style={styles.emptyText}>
                        Enable location services to find nearby cooks.
                    </ThemedText>
                    <TouchableOpacity style={styles.retryButton} onPress={loadNearbyCooks}>
                        <ThemedText style={styles.retryButtonText}>Try Again</ThemedText>
                    </TouchableOpacity>
                </View>
            );
        }

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color="#ccc" />
                <ThemedText style={styles.emptyTitle}>No Cooks Found</ThemedText>
                <ThemedText style={styles.emptyText}>
                    {selectedCuisine || selectedDistance > 0
                        ? 'Try adjusting your filters or increasing the search radius.'
                        : 'No cooks available in your area right now.'}
                </ThemedText>
                {(selectedCuisine || selectedDistance > 0) && (
                    <TouchableOpacity
                        style={styles.clearFiltersButton}
                        onPress={() => {
                            setSelectedCuisine(null);
                            setSelectedDistance(10);
                        }}
                    >
                        <ThemedText style={styles.clearFiltersText}>Clear Filters</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Nearby Cooks' }} />

            {/* Filters */}
            <View style={styles.filtersContainer}>
                {/* Distance filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    <ThemedText style={styles.filterLabel}>Distance:</ThemedText>
                    {DISTANCE_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={`distance-${filter.value}`}
                            style={[
                                styles.filterChip,
                                selectedDistance === filter.value && styles.selectedFilterChip
                            ]}
                            onPress={() => handleDistanceFilter(filter.value)}
                        >
                            <ThemedText
                                style={[
                                    styles.filterChipText,
                                    selectedDistance === filter.value && styles.selectedFilterChipText
                                ]}
                            >
                                {filter.label}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Cuisine filters */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterScrollContent}
                >
                    <ThemedText style={styles.filterLabel}>Cuisine:</ThemedText>
                    {CUISINE_TYPES.slice(0, 10).map((cuisine) => (
                        <TouchableOpacity
                            key={`cuisine-${cuisine}`}
                            style={[
                                styles.filterChip,
                                selectedCuisine === cuisine && styles.selectedFilterChip
                            ]}
                            onPress={() => handleCuisineFilter(cuisine)}
                        >
                            <ThemedText
                                style={[
                                    styles.filterChipText,
                                    selectedCuisine === cuisine && styles.selectedFilterChipText
                                ]}
                            >
                                {cuisine}
                            </ThemedText>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Results count */}
            {!loading && locationPermissionGranted && (
                <View style={styles.resultsHeader}>
                    <ThemedText style={styles.resultsText}>
                        {filteredCooks.length} cook{filteredCooks.length !== 1 ? 's' : ''} found
                    </ThemedText>
                </View>
            )}

            {/* Cook list */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <ThemedText style={styles.loadingText}>Finding nearby cooks...</ThemedText>
                </View>
            ) : (
                <FlatList
                    data={filteredCooks}
                    renderItem={renderCookCard}
                    keyExtractor={(item) => item.uid}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyState}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            colors={[COLORS.primary]}
                        />
                    }
                />
            )}
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
        color: '#666',
    },
    filtersContainer: {
        backgroundColor: '#fff',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    filterScrollContent: {
        paddingHorizontal: 16,
        paddingVertical: 4,
        alignItems: 'center',
    },
    filterLabel: {
        fontSize: 14,
        color: '#666',
        marginRight: 12,
        fontWeight: '500',
    },
    filterChip: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 8,
    },
    selectedFilterChip: {
        backgroundColor: COLORS.primary,
    },
    filterChipText: {
        fontSize: 13,
        color: COLORS.primary,
    },
    selectedFilterChipText: {
        color: '#fff',
    },
    resultsHeader: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#fff',
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    resultsText: {
        fontSize: 14,
        color: '#666',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
        flexGrow: 1,
    },
    cookCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cookHeader: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    cookAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cookInitial: {
        color: '#fff',
        fontSize: 24,
        fontWeight: 'bold',
    },
    cookInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    cookName: {
        fontSize: 18,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    cuisineContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 12,
    },
    cuisineTag: {
        backgroundColor: '#f0f0f0',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 6,
        marginBottom: 4,
    },
    cuisineTagText: {
        fontSize: 12,
        color: '#666',
    },
    serviceInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    serviceItem: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    serviceText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 6,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    retryButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    clearFiltersButton: {
        backgroundColor: COLORS.secondary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    clearFiltersText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
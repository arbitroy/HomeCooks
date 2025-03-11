import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    TextInput,
    ActivityIndicator,
    Alert,
    RefreshControl,
    Platform,
    ScrollView
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getAvailableMeals, Meal } from '@/app/services/meals';
import { CUISINE_TYPES } from '@/app/services/cookProfile';
import { 
    getCurrentLocation, 
    LocationCoordinates, 
    calculateDistance 
} from '@/app/services/location';

// Type for meal with distance info
interface MealWithDistance extends Meal {
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

export default function BrowseMealsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState<MealWithDistance[]>([]);
    const [filteredMeals, setFilteredMeals] = useState<MealWithDistance[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
    const [locationPermissionGranted, setLocationPermissionGranted] = useState<boolean>(false);
    const [selectedDistanceFilter, setSelectedDistanceFilter] = useState<number>(0); // 0 means no distance filter
    const [sortByDistance, setSortByDistance] = useState<boolean>(true);
    const [locationLoading, setLocationLoading] = useState<boolean>(true);

    // Load meals
    const loadMeals = async () => {
        try {
            setLoading(true);
            
            // Get user's current location
            setLocationLoading(true);
            const location = await getCurrentLocation();
            setUserLocation(location);
            setLocationPermissionGranted(!!location);
            setLocationLoading(false);
            
            const availableMeals = await getAvailableMeals();
            
            // Calculate distance for each meal if location is available
            let mealsWithDistance: MealWithDistance[] = availableMeals;
            
            if (location) {
                mealsWithDistance = availableMeals.map(meal => {
                    let distance: number | undefined = undefined;
                    
                    // If meal has location, calculate distance
                    if (meal.location) {
                        const mealCoords: LocationCoordinates = {
                            latitude: meal.location.latitude,
                            longitude: meal.location.longitude
                        };
                        distance = calculateDistance(location, mealCoords);
                    }
                    
                    return {
                        ...meal,
                        distance
                    };
                });
                
                // Sort by distance if option is selected
                if (sortByDistance) {
                    mealsWithDistance.sort((a, b) => {
                        // If both have distance, compare them
                        if (a.distance !== undefined && b.distance !== undefined) {
                            return a.distance - b.distance;
                        }
                        // If only a has distance, a comes first
                        if (a.distance !== undefined) return -1;
                        // If only b has distance, b comes first
                        if (b.distance !== undefined) return 1;
                        // If neither has distance, keep original order
                        return 0;
                    });
                }
            }
            
            setMeals(mealsWithDistance);
            setFilteredMeals(mealsWithDistance);
        } catch (error) {
            console.error('Error loading meals:', error);
            Alert.alert('Error', 'Failed to load available meals');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadMeals();
    }, []);

    // Refresh handler
    const handleRefresh = () => {
        setRefreshing(true);
        loadMeals();
    };

    // Apply filters effect
    useEffect(() => {
        if (meals.length === 0) return;
        
        let filtered = [...meals];
        
        // Apply search filter
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(meal => 
                meal.name.toLowerCase().includes(query) || 
                meal.description.toLowerCase().includes(query) ||
                meal.ingredients.some(ingredient => ingredient.toLowerCase().includes(query)) ||
                meal.cuisineType.toLowerCase().includes(query)
            );
        }
        
        // Apply cuisine filter
        if (selectedCuisine) {
            filtered = filtered.filter(meal => meal.cuisineType === selectedCuisine);
        }
        
        // Apply distance filter
        if (selectedDistanceFilter > 0 && userLocation) {
            filtered = filtered.filter(meal => {
                if (meal.distance === undefined) return false;
                return meal.distance <= selectedDistanceFilter;
            });
        }
        
        setFilteredMeals(filtered);
    }, [searchQuery, selectedCuisine, selectedDistanceFilter, meals, userLocation]);

    // Toggle sort by distance
    const toggleDistanceSort = () => {
        const newSortByDistance = !sortByDistance;
        setSortByDistance(newSortByDistance);
        
        if (newSortByDistance && userLocation) {
            // Sort meals by distance
            const sorted = [...filteredMeals].sort((a, b) => {
                if (a.distance !== undefined && b.distance !== undefined) {
                    return a.distance - b.distance;
                }
                if (a.distance !== undefined) return -1;
                if (b.distance !== undefined) return 1;
                return 0;
            });
            setFilteredMeals(sorted);
        } else {
            // Default sort (by creation date, newest first)
            const sorted = [...filteredMeals].sort((a, b) => 
                b.createdAt.getTime() - a.createdAt.getTime()
            );
            setFilteredMeals(sorted);
        }
    };

    // Select distance filter
    const handleDistanceFilter = (distance: number) => {
        setSelectedDistanceFilter(distance);
    };

    // Search by cuisine type
    const handleCuisineFilter = (cuisine: string) => {
        if (cuisine === selectedCuisine) {
            // Deselect current cuisine
            setSelectedCuisine(null);
        } else {
            setSelectedCuisine(cuisine);
        }
    };

    // Render meal item
    const renderMealItem = ({ item }: { item: MealWithDistance }) => (
        <TouchableOpacity 
            style={styles.mealCard}
            onPress={() => router.push(`/meal/${item.id}`)}
        >
            <Image
                source={{ uri: item.imageUrl || '/api/placeholder/400/200' }}
                style={styles.mealImage}
                defaultSource={require('@/assets/images/placeholder-meal.png')}
            />
            
            <View style={styles.mealContent}>
                <View style={styles.cuisineTag}>
                    <ThemedText style={styles.cuisineText}>{item.cuisineType}</ThemedText>
                </View>
                
                <ThemedText type="defaultSemiBold" style={styles.mealName}>
                    {item.name}
                </ThemedText>
                
                <ThemedText numberOfLines={2} style={styles.mealDescription}>
                    {item.description}
                </ThemedText>
                
                <View style={styles.mealFooter}>
                    <ThemedText style={styles.mealPrice}>
                        ${item.price.toFixed(2)}
                    </ThemedText>
                    
                    <View style={styles.mealDetailsContainer}>
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
                        
                        <View style={styles.prepTimeContainer}>
                            <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                            <ThemedText style={styles.prepTimeText}>
                                {item.preparationTime} min
                            </ThemedText>
                        </View>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render empty list
    const renderEmptyList = () => {
        if (loading) return null;
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color={COLORS.gray} />
                <ThemedText style={styles.emptyText}>
                    {searchQuery || selectedCuisine || selectedDistanceFilter > 0
                        ? 'No meals match your search criteria'
                        : 'No meals available at the moment'}
                </ThemedText>
                {(searchQuery || selectedCuisine || selectedDistanceFilter > 0) && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setSelectedCuisine(null);
                            setSelectedDistanceFilter(0);
                        }}
                    >
                        <ThemedText style={styles.clearButtonText}>Clear Filters</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ 
                title: 'Browse Meals',
                headerShown: true,
            }} />

            {/* Search bar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchInputContainer}>
                    <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for meals, ingredients..."
                        placeholderTextColor="#999"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity
                            style={styles.clearSearch}
                            onPress={() => setSearchQuery('')}
                        >
                            <Ionicons name="close-circle" size={20} color="#999" />
                        </TouchableOpacity>
                    )}
                </View>
            </View>

            {/* Filter tabs section */}
            <View style={styles.filterTabsContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filterTabsContent}
                >
                    {/* Distance filters */}
                    {userLocation && !locationLoading && (
                        <>
                            <ThemedText style={styles.filterLabel}>Distance:</ThemedText>
                            {DISTANCE_FILTERS.map((filter) => (
                                <TouchableOpacity
                                    key={`distance-${filter.value}`}
                                    style={[
                                        styles.filterTab,
                                        selectedDistanceFilter === filter.value && styles.selectedFilterTab
                                    ]}
                                    onPress={() => handleDistanceFilter(filter.value)}
                                >
                                    <ThemedText
                                        style={[
                                            styles.filterTabText,
                                            selectedDistanceFilter === filter.value && styles.selectedFilterTabText
                                        ]}
                                    >
                                        {filter.label}
                                    </ThemedText>
                                </TouchableOpacity>
                            ))}
                            
                            {/* Sort toggle */}
                            <TouchableOpacity
                                style={[
                                    styles.filterTab,
                                    sortByDistance && styles.selectedFilterTab,
                                    { flexDirection: 'row', alignItems: 'center' }
                                ]}
                                onPress={toggleDistanceSort}
                            >
                                <Ionicons 
                                    name="locate-outline" 
                                    size={16} 
                                    color={sortByDistance ? '#fff' : COLORS.primary} 
                                />
                                <ThemedText
                                    style={[
                                        styles.filterTabText,
                                        sortByDistance && styles.selectedFilterTabText,
                                        { marginLeft: 4 }
                                    ]}
                                >
                                    Nearby First
                                </ThemedText>
                            </TouchableOpacity>
                        </>
                    )}
                    
                    {/* Location loading indicator */}
                    {locationLoading && (
                        <View style={styles.locationLoadingContainer}>
                            <ActivityIndicator size="small" color={COLORS.primary} />
                            <ThemedText style={styles.locationLoadingText}>
                                Getting your location...
                            </ThemedText>
                        </View>
                    )}
                    
                    {/* Location permission denied message */}
                    {!locationLoading && !locationPermissionGranted && (
                        <TouchableOpacity 
                            style={styles.locationPermissionButton}
                            onPress={loadMeals}
                        >
                            <Ionicons name="location-outline" size={16} color="#fff" />
                            <ThemedText style={styles.locationPermissionText}>
                                Enable location for nearby meals
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                </ScrollView>
            </View>

            {/* Cuisine filters */}
            <View style={styles.cuisineFiltersContainer}>
                <FlatList
                    horizontal
                    data={CUISINE_TYPES}
                    keyExtractor={(item) => item}
                    showsHorizontalScrollIndicator={false}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.cuisineFilterItem,
                                selectedCuisine === item && styles.selectedCuisineFilter
                            ]}
                            onPress={() => handleCuisineFilter(item)}
                        >
                            <ThemedText
                                style={[
                                    styles.cuisineFilterText,
                                    selectedCuisine === item && styles.selectedCuisineFilterText
                                ]}
                            >
                                {item}
                            </ThemedText>
                        </TouchableOpacity>
                    )}
                    contentContainerStyle={styles.cuisineFiltersList}
                />
            </View>

            {/* Meal list */}
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredMeals}
                    renderItem={renderMealItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
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
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    searchInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: 8,
        paddingHorizontal: 12,
    },
    searchIcon: {
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        height: 40,
        fontSize: 16,
        color: '#333',
    },
    clearSearch: {
        padding: 4,
    },
    filterTabsContainer: {
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    filterTabsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    filterLabel: {
        marginRight: 8,
        fontSize: 14,
        color: '#666',
    },
    filterTab: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 8,
    },
    selectedFilterTab: {
        backgroundColor: COLORS.primary,
    },
    filterTabText: {
        fontSize: 13,
        color: COLORS.primary,
    },
    selectedFilterTabText: {
        color: '#fff',
    },
    locationLoadingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    locationLoadingText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    locationPermissionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    locationPermissionText: {
        color: '#fff',
        marginLeft: 6,
        fontSize: 13,
    },
    cuisineFiltersContainer: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    cuisineFiltersList: {
        paddingHorizontal: 16,
    },
    cuisineFilterItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 8,
    },
    selectedCuisineFilter: {
        backgroundColor: COLORS.primary,
    },
    cuisineFilterText: {
        color: COLORS.primary,
    },
    selectedCuisineFilterText: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    mealImage: {
        width: '100%',
        height: 150,
        resizeMode: 'cover',
    },
    mealContent: {
        padding: 12,
    },
    cuisineTag: {
        position: 'absolute',
        top: -140,
        right: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    cuisineText: {
        color: '#fff',
        fontSize: 12,
    },
    mealName: {
        fontSize: 18,
        marginBottom: 4,
    },
    mealDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    mealFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mealPrice: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    mealDetailsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    distanceContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 8,
    },
    distanceText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    prepTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prepTimeText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginBottom: 16,
    },
    clearButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.primary,
        borderRadius: 4,
    },
    clearButtonText: {
        color: '#fff',
        fontWeight: '600',
    },
});
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
    RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getAvailableMeals, Meal, searchMealsByCuisine } from '@/app/services/meals';
import { CUISINE_TYPES } from '@/app/services/cookProfile';
import { getCurrentLocation, LocationCoordinates } from '@/app/services/location';

export default function BrowseMealsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCuisine, setSelectedCuisine] = useState<string | null>(null);
    const [userLocation, setUserLocation] = useState<LocationCoordinates | null>(null);
    
    // Load meals
    const loadMeals = async () => {
        try {
            setLoading(true);
            const availableMeals = await getAvailableMeals();
            setMeals(availableMeals);
            setFilteredMeals(availableMeals);
            
            // Get user location
            const location = await getCurrentLocation();
            setUserLocation(location);
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

    // Search handler
    useEffect(() => {
        if (searchQuery.trim() === '' && !selectedCuisine) {
            setFilteredMeals(meals);
            return;
        }

        let filtered = meals;
        
        // Filter by search text
        if (searchQuery.trim() !== '') {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(meal => 
                meal.name.toLowerCase().includes(query) || 
                meal.description.toLowerCase().includes(query) ||
                meal.ingredients.some(ingredient => ingredient.toLowerCase().includes(query))
            );
        }
        
        // Filter by cuisine
        if (selectedCuisine) {
            filtered = filtered.filter(meal => meal.cuisineType === selectedCuisine);
        }
        
        setFilteredMeals(filtered);
    }, [searchQuery, selectedCuisine, meals]);

    // Search by cuisine type
    const handleCuisineFilter = async (cuisine: string) => {
        if (cuisine === selectedCuisine) {
            // Deselect current cuisine
            setSelectedCuisine(null);
            return;
        }

        setSelectedCuisine(cuisine);
    };

    // Render meal item
    const renderMealItem = ({ item }: { item: Meal }) => (
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
                    
                    <View style={styles.prepTimeContainer}>
                        <Ionicons name="time-outline" size={16} color={COLORS.primary} />
                        <ThemedText style={styles.prepTimeText}>
                            {item.preparationTime} min
                        </ThemedText>
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
                    {searchQuery || selectedCuisine
                        ? 'No meals match your search criteria'
                        : 'No meals available at the moment'}
                </ThemedText>
                {(searchQuery || selectedCuisine) && (
                    <TouchableOpacity
                        style={styles.clearButton}
                        onPress={() => {
                            setSearchQuery('');
                            setSelectedCuisine(null);
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
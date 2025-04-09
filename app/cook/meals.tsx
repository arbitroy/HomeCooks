import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    Alert,
    ActivityIndicator,
    Animated
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Meal, getMealsByCook, deleteMeal } from '@/app/services/meals';
import { Ionicons } from '@expo/vector-icons';

export default function CookMealsScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [fabAnimation] = useState(new Animated.Value(0));

    // Protect route - immediately redirect non-cook users
    useEffect(() => {
        if (user && user.userType !== 'cook') {
            Alert.alert('Access Denied', 'This area is only available to cooks');
            router.replace('/(tabs)');
        }
    }, [user, router]);

    // Load cook's meals
    const loadMeals = async () => {
        try {
            setLoading(true);
            if (user && user.userType === 'cook') {
                const cookMeals = await getMealsByCook(user.uid);
                setMeals(cookMeals);
            }
        } catch (error) {
            console.error('Error loading meals:', error);
            Alert.alert('Error', 'Failed to load your meals. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        if (user?.userType === 'cook') {
            loadMeals();
        }
    }, [user]);

    // Animate FAB on mount
    useEffect(() => {
        Animated.spring(fabAnimation, {
            toValue: 1,
            friction: 6,
            tension: 50,
            useNativeDriver: true
        }).start();
    }, []);

    // If not a cook, show nothing (will be redirected)
    if (user && user.userType !== 'cook') {
        return null;
    }

    // Show loading state
    if (loading && !refreshing) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading your meals...</ThemedText>
            </View>
        );
    }

    // The rest of your component remains the same...
    // For brevity, I'm not including the entire component code since we're just adding the route protection

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadMeals();
    };

    // Navigate to add meal screen
    const navigateToAddMeal = () => {
        router.push('/cook/addMeal');
    };

    // Handle delete
    const handleDelete = async (mealId: string) => {
        Alert.alert(
            'Delete Meal',
            'Are you sure you want to delete this meal? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            if (user) {
                                await deleteMeal(user, mealId);
                                // Update the local state
                                setMeals(meals.filter(meal => meal.id !== mealId));
                                Alert.alert('Success', 'Meal deleted successfully');
                            }
                        } catch (error) {
                            console.error('Error deleting meal:', error);
                            Alert.alert('Error', 'Failed to delete meal. Please try again.');
                        }
                    }
                }
            ]
        );
    };

    // Handle availability toggle
    const handleAvailabilityToggle = (meal: Meal) => {
        router.push(`/cook/editMeal?id=${meal.id}&toggleAvailability=true`);
    };

    // Render meal item
    const renderMealItem = ({ item }: { item: Meal }) => (
        <View style={styles.mealCard}>
            <TouchableOpacity
                style={styles.mealImageContainer}
                onPress={() => router.push(`/meal/${item.id}`)}
            >
                <Image
                    source={{ uri: item.imageUrl || '/api/placeholder/400/200' }}
                    style={styles.mealImage}
                    defaultSource={require('@/assets/images/placeholder-meal.png')}
                />

                <View style={styles.cuisineTag}>
                    <ThemedText style={styles.cuisineText}>{item.cuisineType}</ThemedText>
                </View>

                <View style={[
                    styles.statusBadge,
                    { backgroundColor: item.available ? COLORS.success : COLORS.gray }
                ]}>
                    <ThemedText style={styles.statusText}>
                        {item.available ? 'Available' : 'Unavailable'}
                    </ThemedText>
                </View>
            </TouchableOpacity>

            <View style={styles.mealInfo}>
                <ThemedText type="defaultSemiBold" style={styles.mealName}>
                    {item.name}
                </ThemedText>

                <ThemedText numberOfLines={2} style={styles.mealDescription}>
                    {item.description}
                </ThemedText>

                <View style={styles.mealDetails}>
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

                <View style={styles.actionsContainer}>
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleAvailabilityToggle(item)}
                    >
                        <Ionicons
                            name={item.available ? "eye-off-outline" : "eye-outline"}
                            size={24}
                            color={COLORS.primary}
                        />
                        <ThemedText style={styles.actionButtonText}>
                            {item.available ? 'Hide' : 'Show'}
                        </ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => router.push(`/cook/editMeal?id=${item.id}`)}
                    >
                        <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                        <ThemedText style={styles.actionButtonText}>Edit</ThemedText>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDelete(item.id)}
                    >
                        <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                        <ThemedText style={[styles.actionButtonText, { color: COLORS.error }]}>
                            Delete
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen
                options={{
                    title: 'My Meals',
                    headerRight: () => (
                        <TouchableOpacity
                            style={styles.headerButton}
                            onPress={navigateToAddMeal}
                        >
                            <Ionicons name="add-circle" size={28} color={COLORS.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <FlatList
                data={meals}
                renderItem={renderMealItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                onRefresh={handleRefresh}
                refreshing={refreshing}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="restaurant-outline" size={80} color={COLORS.gray} />
                        <ThemedText style={styles.emptyTitle}>No Meals Yet</ThemedText>
                        <ThemedText style={styles.emptyText}>
                            Start adding delicious meals to your menu and attract hungry customers.
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.addFirstMealButton}
                            onPress={navigateToAddMeal}
                        >
                            <Ionicons name="add-circle-outline" size={24} color="#fff" />
                            <ThemedText style={styles.addFirstMealButtonText}>
                                Create Your First Meal
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Floating Action Button */}
            {meals.length > 0 && (
                <Animated.View
                    style={[
                        styles.fab,
                        {
                            transform: [
                                { scale: fabAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0, 1]
                                }) },
                                { rotate: fabAnimation.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: ['0deg', '360deg']
                                }) }
                            ]
                        }
                    ]}
                >
                    <TouchableOpacity
                        style={styles.fabButton}
                        onPress={navigateToAddMeal}
                    >
                        <Ionicons name="add" size={30} color="#fff" />
                    </TouchableOpacity>
                </Animated.View>
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
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    listContent: {
        flexGrow: 1,
        padding: 16,
        paddingBottom: 80,
    },
    mealCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        margin: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mealImageContainer: {
        position: 'relative',
    },
    mealImage: {
        width: '100%',
        height: 180,
        resizeMode: 'cover',
    },
    cuisineTag: {
        position: 'absolute',
        top: 12,
        left: 12,
        backgroundColor: 'rgba(0,0,0,0.7)',
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    cuisineText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 16,
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: '600',
    },
    mealInfo: {
        padding: 16,
    },
    mealName: {
        fontSize: 18,
        marginBottom: 8,
    },
    mealDescription: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    mealDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    mealPrice: {
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.primary,
    },
    prepTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    prepTimeText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    actionButton: {
        alignItems: 'center',
        padding: 8,
    },
    actionButtonText: {
        marginTop: 4,
        fontSize: 12,
        color: COLORS.primary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        marginTop: 80,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        marginTop: 16,
        marginBottom: 8,
    },
    emptyText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 24,
    },
    addFirstMealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
    },
    addFirstMealButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    headerButton: {
        padding: 8,
        marginRight: 8,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
    },
    fabButton: {
        backgroundColor: COLORS.primary,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
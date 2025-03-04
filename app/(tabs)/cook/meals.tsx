import React, { useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, TouchableOpacity, Image, Alert, ActivityIndicator } from 'react-native';
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

    // Load cook's meals
    const loadMeals = async () => {
        try {
            setLoading(true);
            if (user) {
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
        loadMeals();
    }, [user]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadMeals();
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
            <Image
                source={{ uri: item.imageUrl || '/api/placeholder/400/200' }}
                style={styles.mealImage}
                defaultSource={require('@/assets/images/placeholder-meal.png')}
            />
            
            <View style={styles.mealInfo}>
                <ThemedText type="defaultSemiBold" style={styles.mealName}>
                    {item.name}
                </ThemedText>
                
                <ThemedText style={styles.mealPrice}>
                    ${item.price.toFixed(2)}
                </ThemedText>
                
                <View style={styles.mealStatusContainer}>
                    <View style={[
                        styles.statusIndicator,
                        { backgroundColor: item.available ? COLORS.success : COLORS.gray }
                    ]} />
                    <ThemedText style={styles.mealStatus}>
                        {item.available ? 'Available' : 'Unavailable'}
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
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => router.push(`/cook/editMeal?id=${item.id}`)}
                >
                    <Ionicons name="create-outline" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.actionButton}
                    onPress={() => handleDelete(item.id)}
                >
                    <Ionicons name="trash-outline" size={24} color={COLORS.error} />
                </TouchableOpacity>
            </View>
        </View>
    );

    // Empty list message
    const renderEmptyList = () => {
        if (loading) return null;
        
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="restaurant-outline" size={64} color={COLORS.gray} />
                <ThemedText style={styles.emptyText}>
                    You haven't added any meals yet
                </ThemedText>
                <TouchableOpacity 
                    style={styles.addButton}
                    onPress={() => router.push('/cook/addMeal')}
                >
                    <ThemedText style={styles.addButtonText}>Add Your First Meal</ThemedText>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    title: 'My Meals',
                    headerRight: () => (
                        <TouchableOpacity 
                            style={styles.headerButton}
                            onPress={() => router.push('/cook/addMeal')}
                        >
                            <Ionicons name="add" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    ),
                }} 
            />
            
            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={meals}
                    renderItem={renderMealItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={renderEmptyList}
                    onRefresh={handleRefresh}
                    refreshing={refreshing}
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
    listContent: {
        padding: 16,
        paddingBottom: 80,
        flexGrow: 1,
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
    mealInfo: {
        padding: 12,
    },
    mealName: {
        fontSize: 18,
        marginBottom: 4,
    },
    mealPrice: {
        fontSize: 16,
        color: COLORS.primary,
        marginBottom: 8,
    },
    mealStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusIndicator: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    mealStatus: {
        fontSize: 14,
        color: '#777',
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 8,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    actionButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        marginTop: 16,
        fontSize: 16,
        color: '#777',
        marginBottom: 24,
    },
    addButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    headerButton: {
        padding: 8,
        marginRight: 8,
    },
});
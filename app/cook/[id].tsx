// app/cook/[id].tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    FlatList
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { CookProfile, getCookProfile } from '@/app/services/cookProfile';
import { Meal, getMealsByCook } from '@/app/services/meals';
import { Review, getReviewsForCook } from '@/app/services/reviews';

export default function CookProfileScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const cookId = params.id as string;

    const [cookProfile, setCookProfile] = useState<CookProfile | null>(null);
    const [cookMeals, setCookMeals] = useState<Meal[]>([]);
    const [cookReviews, setCookReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'meals' | 'reviews'>('meals');

    // Load cook data
    useEffect(() => {
        const loadCookData = async () => {
            try {
                setLoading(true);
                
                if (!cookId) {
                    Alert.alert('Error', 'Cook ID not provided');
                    router.back();
                    return;
                }

                // Load cook profile, meals, and reviews in parallel
                const [profile, meals, reviews] = await Promise.all([
                    getCookProfile(cookId),
                    getMealsByCook(cookId),
                    getReviewsForCook(cookId, 5)
                ]);

                if (!profile) {
                    Alert.alert('Error', 'Cook profile not found');
                    router.back();
                    return;
                }

                setCookProfile(profile);
                setCookMeals(meals.filter(meal => meal.available)); // Only show available meals
                setCookReviews(reviews);
            } catch (error) {
                console.error('Error loading cook data:', error);
                Alert.alert('Error', 'Failed to load cook profile');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadCookData();
    }, [cookId]);

    // Render meal item
    const renderMealItem = ({ item }: { item: Meal }) => (
        <TouchableOpacity
            style={styles.mealCard}
            onPress={() => router.push(`/meal/${item.id}`)}
        >
            <Image
                source={{ uri: item.imageUrl || '/api/placeholder/150/150' }}
                style={styles.mealImage}
                defaultSource={require('@/assets/images/placeholder-meal.png')}
            />
            <View style={styles.mealInfo}>
                <ThemedText type="defaultSemiBold" style={styles.mealName} numberOfLines={1}>
                    {item.name}
                </ThemedText>
                <ThemedText style={styles.mealPrice}>${item.price.toFixed(2)}</ThemedText>
                <View style={styles.mealMeta}>
                    <View style={styles.prepTimeContainer}>
                        <Ionicons name="time-outline" size={14} color="#666" />
                        <ThemedText style={styles.prepTimeText}>{item.preparationTime}min</ThemedText>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );

    // Render review item
    const renderReviewItem = ({ item }: { item: Review }) => (
        <View style={styles.reviewItem}>
            <View style={styles.reviewHeader}>
                <ThemedText type="defaultSemiBold">{item.customerName}</ThemedText>
                <View style={styles.reviewRating}>
                    {[...Array(5)].map((_, i) => (
                        <Ionicons
                            key={i}
                            name={i < item.rating ? "star" : "star-outline"}
                            size={16}
                            color="#FFD700"
                        />
                    ))}
                </View>
            </View>
            <ThemedText style={styles.reviewDate}>
                {format(item.createdAt, 'MMM d, yyyy')}
            </ThemedText>
            <ThemedText style={styles.reviewComment}>{item.comment}</ThemedText>
        </View>
    );

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading cook profile...</ThemedText>
            </ThemedView>
        );
    }

    if (!cookProfile) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ThemedText>Cook profile not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Cook Profile' }} />

            <ScrollView style={styles.scrollView}>
                {/* Cook Header */}
                <View style={styles.headerContainer}>
                    <View style={styles.cookAvatar}>
                        <ThemedText style={styles.cookInitial}>
                            {cookProfile.uid.charAt(0).toUpperCase()}
                        </ThemedText>
                    </View>
                    
                    <ThemedText type="title" style={styles.cookName}>
                        Chef {cookProfile.uid.substring(0, 8)}
                    </ThemedText>
                    
                    {cookProfile.averageRating !== undefined && (
                        <View style={styles.ratingContainer}>
                            <Ionicons name="star" size={20} color="#FFD700" />
                            <ThemedText style={styles.ratingText}>
                                {cookProfile.averageRating.toFixed(1)} ({cookProfile.totalReviews} reviews)
                            </ThemedText>
                        </View>
                    )}

                    {/* Cuisine Types */}
                    <View style={styles.cuisineContainer}>
                        {cookProfile.cuisineTypes.slice(0, 3).map((cuisine, index) => (
                            <View key={index} style={styles.cuisineTag}>
                                <ThemedText style={styles.cuisineText}>{cuisine}</ThemedText>
                            </View>
                        ))}
                        {cookProfile.cuisineTypes.length > 3 && (
                            <View style={styles.cuisineTag}>
                                <ThemedText style={styles.cuisineText}>+{cookProfile.cuisineTypes.length - 3}</ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Cook Bio */}
                <View style={styles.bioContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>About</ThemedText>
                    <ThemedText style={styles.bioText}>{cookProfile.bio}</ThemedText>
                </View>

                {/* Delivery Info */}
                <View style={styles.deliveryContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Service Details</ThemedText>
                    
                    <View style={styles.deliveryInfo}>
                        <View style={styles.deliveryItem}>
                            <Ionicons name="bicycle-outline" size={20} color={COLORS.primary} />
                            <ThemedText style={styles.deliveryText}>
                                {cookProfile.deliveryAvailable ? 'Delivery Available' : 'Pickup Only'}
                            </ThemedText>
                        </View>
                        
                        {cookProfile.deliveryAvailable && cookProfile.deliveryRadius && (
                            <View style={styles.deliveryItem}>
                                <Ionicons name="location-outline" size={20} color={COLORS.primary} />
                                <ThemedText style={styles.deliveryText}>
                                    Within {cookProfile.deliveryRadius}km
                                </ThemedText>
                            </View>
                        )}
                        
                        {cookProfile.minimumOrderAmount && (
                            <View style={styles.deliveryItem}>
                                <Ionicons name="receipt-outline" size={20} color={COLORS.primary} />
                                <ThemedText style={styles.deliveryText}>
                                    Min. order ${cookProfile.minimumOrderAmount.toFixed(2)}
                                </ThemedText>
                            </View>
                        )}
                    </View>
                </View>

                {/* Tab Selector */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'meals' && styles.activeTab]}
                        onPress={() => setActiveTab('meals')}
                    >
                        <ThemedText style={[styles.tabText, activeTab === 'meals' && styles.activeTabText]}>
                            Meals ({cookMeals.length})
                        </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                        style={[styles.tab, activeTab === 'reviews' && styles.activeTab]}
                        onPress={() => setActiveTab('reviews')}
                    >
                        <ThemedText style={[styles.tabText, activeTab === 'reviews' && styles.activeTabText]}>
                            Reviews ({cookReviews.length})
                        </ThemedText>
                    </TouchableOpacity>
                </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                    {activeTab === 'meals' ? (
                        cookMeals.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="restaurant-outline" size={48} color="#ccc" />
                                <ThemedText style={styles.emptyText}>No available meals</ThemedText>
                            </View>
                        ) : (
                            <FlatList
                                key="meals-list"
                                data={cookMeals}
                                renderItem={renderMealItem}
                                keyExtractor={(item) => item.id}
                                numColumns={2}
                                columnWrapperStyle={styles.mealRow}
                                scrollEnabled={false}
                                contentContainerStyle={styles.mealsGrid}
                            />
                        )
                    ) : (
                        cookReviews.length === 0 ? (
                            <View style={styles.emptyContainer}>
                                <Ionicons name="chatbubble-outline" size={48} color="#ccc" />
                                <ThemedText style={styles.emptyText}>No reviews yet</ThemedText>
                            </View>
                        ) : (
                            <FlatList
                                key="reviews-list"
                                data={cookReviews}
                                renderItem={renderReviewItem}
                                keyExtractor={(item) => item.id}
                                scrollEnabled={false}
                            />
                        )
                    )}
                </View>
            </ScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f7fa',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f7fa',
    },
    loadingText: {
        marginTop: 12,
    },
    scrollView: {
        flex: 1,
    },
    headerContainer: {
        alignItems: 'center',
        padding: 24,
        backgroundColor: COLORS.primary,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    cookAvatar: {
        width: 90,
        height: 90,
        borderRadius: 45,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    cookInitial: {
        color: COLORS.primary,
        fontSize: 36,
        fontWeight: 'bold',
    },
    cookName: {
        fontSize: 24,
        marginBottom: 8,
        color: '#fff',
        fontWeight: 'bold',
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    ratingText: {
        marginLeft: 6,
        fontSize: 16,
        color: '#fff',
        fontWeight: '500',
    },
    cuisineContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
    },
    cuisineTag: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        margin: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    cuisineText: {
        color: COLORS.primary,
        fontSize: 13,
        fontWeight: '600',
    },
    bioContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 12,
        color: '#2c3e50',
        fontWeight: 'bold',
    },
    bioText: {
        fontSize: 16,
        lineHeight: 24,
        color: '#5a6c7d',
    },
    deliveryContainer: {
        padding: 20,
        backgroundColor: '#fff',
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    deliveryInfo: {
        gap: 16,
    },
    deliveryItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        padding: 12,
        borderRadius: 12,
    },
    deliveryText: {
        marginLeft: 12,
        fontSize: 16,
        color: '#2c3e50',
        fontWeight: '500',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        marginTop: 12,
        marginHorizontal: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden',
    },
    tab: {
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
        fontWeight: '600',
    },
    contentContainer: {
        backgroundColor: '#fff',
        minHeight: 200,
        marginTop: 2,
        marginHorizontal: 16,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    mealsGrid: {
        padding: 16,
    },
    mealRow: {
        justifyContent: 'space-between',
    },
    mealCard: {
        width: '48%',
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 4,
        borderWidth: 1,
        borderColor: '#e9ecef',
    },
    mealImage: {
        width: '100%',
        height: 120,
        resizeMode: 'cover',
    },
    mealInfo: {
        padding: 12,
        backgroundColor: '#fff',
    },
    mealName: {
        fontSize: 14,
        marginBottom: 4,
        color: '#2c3e50',
        fontWeight: '600',
    },
    mealPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.primary,
        marginBottom: 4,
    },
    mealMeta: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    prepTimeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8f9fa',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 8,
    },
    prepTimeText: {
        fontSize: 12,
        color: '#666',
        marginLeft: 4,
        fontWeight: '500',
    },
    reviewItem: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#e9ecef',
        backgroundColor: '#fff',
    },
    reviewHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    reviewRating: {
        flexDirection: 'row',
    },
    reviewDate: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    reviewComment: {
        fontSize: 14,
        lineHeight: 20,
        color: '#5a6c7d',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 48,
        backgroundColor: '#fff',
    },
    emptyText: {
        marginTop: 12,
        fontSize: 16,
        color: '#999',
    },
});
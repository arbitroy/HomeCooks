import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    Image,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Modal,
    TextInput,
    Platform
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Meal, getMealById } from '@/app/services/meals';
import { getCookProfile, CookProfile } from '@/app/services/cookProfile';
import { createOrder, OrderInput, DeliveryMethod } from '@/app/services/orders';
import { getReviewsForMeal, Review } from '@/app/services/reviews';
import { LocationAddress, getAddressFromCoordinates, getCurrentLocation } from '@/app/services/location';
import { format } from 'date-fns';

export default function MealDetailScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const mealId = params.id as string;

    const [meal, setMeal] = useState<Meal | null>(null);
    const [cookProfile, setCookProfile] = useState<CookProfile | null>(null);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [orderModalVisible, setOrderModalVisible] = useState(false);
    const [quantity, setQuantity] = useState(1);
    const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('pickup');
    const [deliveryAddress, setDeliveryAddress] = useState<LocationAddress | null>(null);
    const [specialInstructions, setSpecialInstructions] = useState('');
    const [selectedTime, setSelectedTime] = useState<Date>(new Date());
    const [submitting, setSubmitting] = useState(false);

    // Load meal data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                // Load meal details
                const mealData = await getMealById(mealId);
                if (!mealData) {
                    Alert.alert('Error', 'Meal not found');
                    router.back();
                    return;
                }
                setMeal(mealData);
                
                // Load cook profile
                const cookData = await getCookProfile(mealData.cookId);
                setCookProfile(cookData);
                
                // Load reviews
                const mealReviews = await getReviewsForMeal(mealId);
                setReviews(mealReviews);
                
                // Get user location for delivery
                if (user?.userType === 'customer') {
                    const location = await getCurrentLocation();
                    if (location) {
                        const address = await getAddressFromCoordinates(location);
                        setDeliveryAddress(address);
                    }
                }
            } catch (error) {
                console.error('Error loading meal details:', error);
                Alert.alert('Error', 'Failed to load meal details');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [mealId]);

    // Increment quantity
    const incrementQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    // Decrement quantity
    const decrementQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    // Toggle delivery method
    const toggleDeliveryMethod = () => {
        setDeliveryMethod(prev => prev === 'pickup' ? 'delivery' : 'pickup');
    };

    // Set order time - add 1 hour to current time
    useEffect(() => {
        const date = new Date();
        date.setHours(date.getHours() + 1);
        setSelectedTime(date);
    }, []);

    // Calculate total price
    const calculateTotal = () => {
        if (!meal) return 0;
        
        let total = meal.price * quantity;
        
        // Add delivery fee if applicable
        if (deliveryMethod === 'delivery' && cookProfile?.deliveryFee) {
            total += cookProfile.deliveryFee;
        }
        
        return total;
    };

    // Handle order submission
    const handlePlaceOrder = async () => {
        try {
            if (!user) {
                Alert.alert('Error', 'You must be logged in to place an order');
                return;
            }

            if (user.userType !== 'customer') {
                Alert.alert('Error', 'Only customers can place orders');
                return;
            }

            if (!meal) {
                Alert.alert('Error', 'Meal information is missing');
                return;
            }

            // Validate delivery address if delivery method is selected
            if (deliveryMethod === 'delivery' && !deliveryAddress) {
                Alert.alert('Error', 'Please provide a delivery address');
                return;
            }

            // Minimum order validation
            if (cookProfile?.minimumOrderAmount && calculateTotal() < cookProfile.minimumOrderAmount) {
                Alert.alert(
                    'Minimum Order Required',
                    `This cook requires a minimum order of $${cookProfile.minimumOrderAmount.toFixed(2)}`
                );
                return;
            }

            setSubmitting(true);

            const orderInput: OrderInput = {
                mealId,
                quantity,
                deliveryMethod,
                deliveryAddress: deliveryMethod === 'delivery' ? deliveryAddress || undefined : undefined,
                specialInstructions: specialInstructions.trim() || undefined,
                requestedTime: selectedTime
            };

            await createOrder(user, orderInput);
            
            setOrderModalVisible(false);
            Alert.alert(
                'Order Placed Successfully',
                'Your order has been sent to the cook for confirmation.',
                [{ text: 'View My Orders', onPress: () => router.push('/orders') }]
            );
        } catch (error) {
            console.error('Error placing order:', error);
            let errorMessage = 'Failed to place order';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading meal details...</ThemedText>
            </ThemedView>
        );
    }

    if (!meal) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ThemedText>Meal not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen 
                options={{
                    title: meal.name,
                    headerRight: () => (
                        <TouchableOpacity
                            style={styles.shareButton}
                            onPress={() => Alert.alert('Share', 'Sharing functionality to be implemented')}
                        >
                            <Ionicons name="share-outline" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    ),
                }}
            />

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
                {/* Meal Image */}
                <Image
                    source={{ uri: meal.imageUrl || '/api/placeholder/800/400' }}
                    style={styles.mealImage}
                    defaultSource={require('@/assets/images/placeholder-meal.png')}
                />

                {/* Meal Details */}
                <View style={styles.detailsContainer}>
                    <View style={styles.headerRow}>
                        <ThemedText type="title" style={styles.mealName}>
                            {meal.name}
                        </ThemedText>
                        <ThemedText style={styles.mealPrice}>
                            ${meal.price.toFixed(2)}
                        </ThemedText>
                    </View>

                    <View style={styles.cuisineContainer}>
                        <ThemedText style={styles.cuisineText}>{meal.cuisineType}</ThemedText>
                    </View>

                    <ThemedText style={styles.mealDescription}>
                        {meal.description}
                    </ThemedText>

                    {/* Preparation Time */}
                    <View style={styles.infoRow}>
                        <Ionicons name="time-outline" size={18} color="#666" />
                        <ThemedText style={styles.infoText}>
                            Preparation Time: {meal.preparationTime} minutes
                        </ThemedText>
                    </View>

                    {/* Availability Status */}
                    <View style={styles.infoRow}>
                        <Ionicons
                            name={meal.available ? "checkmark-circle-outline" : "close-circle-outline"}
                            size={18}
                            color={meal.available ? COLORS.success : COLORS.error}
                        />
                        <ThemedText style={styles.infoText}>
                            {meal.available ? 'Available Now' : 'Currently Unavailable'}
                        </ThemedText>
                    </View>

                    {/* Ingredients Section */}
                    <View style={styles.sectionContainer}>
                        <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                            Ingredients
                        </ThemedText>
                        <View style={styles.tagsContainer}>
                            {meal.ingredients.map((ingredient, index) => (
                                <View key={index} style={styles.tag}>
                                    <ThemedText style={styles.tagText}>{ingredient}</ThemedText>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* Allergens Section */}
                    {meal.allergens.length > 0 && (
                        <View style={styles.sectionContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                Allergens
                            </ThemedText>
                            <View style={styles.tagsContainer}>
                                {meal.allergens.map((allergen, index) => (
                                    <View key={index} style={[styles.tag, styles.allergenTag]}>
                                        <ThemedText style={styles.tagText}>{allergen}</ThemedText>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Cook Information */}
                    {cookProfile && (
                        <View style={styles.cookContainer}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                About the Cook
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.cookProfileRow}
                                onPress={() => router.push(`/cook/${meal.cookId}`)}
                            >
                                <View style={styles.cookAvatar}>
                                    <ThemedText style={styles.cookInitial}>
                                        {cookProfile.uid.charAt(0).toUpperCase()}
                                    </ThemedText>
                                </View>
                                <View style={styles.cookInfo}>
                                    <ThemedText type="defaultSemiBold" style={styles.cookName}>
                                        {/* Use user.displayName from the meal object or fallback */}
                                        Chef {meal.cookId.substring(0, 8)}
                                    </ThemedText>
                                    {cookProfile.averageRating !== undefined && (
                                        <View style={styles.ratingContainer}>
                                            <Ionicons name="star" size={16} color="#FFD700" />
                                            <ThemedText style={styles.ratingText}>
                                                {cookProfile.averageRating.toFixed(1)} ({cookProfile.totalReviews} reviews)
                                            </ThemedText>
                                        </View>
                                    )}
                                </View>
                                <Ionicons name="chevron-forward" size={20} color="#999" />
                            </TouchableOpacity>
                            <ThemedText style={styles.cookBio}>
                                {cookProfile.bio}
                            </ThemedText>
                        </View>
                    )}

                    {/* Reviews Section */}
                    <View style={styles.sectionContainer}>
                        <View style={styles.sectionHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                                Reviews ({reviews.length})
                            </ThemedText>
                            {reviews.length > 3 && (
                                <TouchableOpacity onPress={() => router.push(`/meal/${mealId}/reviews`)}>
                                    <ThemedText style={styles.seeAllText}>See All</ThemedText>
                                </TouchableOpacity>
                            )}
                        </View>
                        
                        {reviews.length === 0 ? (
                            <ThemedText style={styles.noReviewsText}>
                                No reviews yet for this meal.
                            </ThemedText>
                        ) : (
                            <View style={styles.reviewsContainer}>
                                {reviews.slice(0, 3).map((review, index) => (
                                    <View key={index} style={styles.reviewItem}>
                                        <View style={styles.reviewHeader}>
                                            <ThemedText type="defaultSemiBold">{review.customerName}</ThemedText>
                                            <View style={styles.reviewRating}>
                                                {[...Array(5)].map((_, i) => (
                                                    <Ionicons
                                                        key={i}
                                                        name={i < review.rating ? "star" : "star-outline"}
                                                        size={16}
                                                        color="#FFD700"
                                                    />
                                                ))}
                                            </View>
                                        </View>
                                        <ThemedText style={styles.reviewDate}>
                                            {format(review.createdAt, 'MMM d, yyyy')}
                                        </ThemedText>
                                        <ThemedText style={styles.reviewComment}>
                                            {review.comment}
                                        </ThemedText>
                                    </View>
                                ))}
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            {/* Order Button */}
            {user?.userType === 'customer' && meal.available && (
                <View style={styles.orderButtonContainer}>
                    <TouchableOpacity
                        style={styles.orderButton}
                        onPress={() => setOrderModalVisible(true)}
                    >
                        <ThemedText style={styles.orderButtonText}>Order Now</ThemedText>
                    </TouchableOpacity>
                </View>
            )}

            {/* Order Modal */}
            <Modal
                visible={orderModalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setOrderModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContainer}>
                        <View style={styles.modalHeader}>
                            <ThemedText type="defaultSemiBold" style={styles.modalTitle}>
                                Place Your Order
                            </ThemedText>
                            <TouchableOpacity
                                style={styles.closeButton}
                                onPress={() => setOrderModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#000" />
                            </TouchableOpacity>
                        </View>

                        <ScrollView style={styles.modalContent}>
                            {/* Meal Summary */}
                            <View style={styles.orderSummaryContainer}>
                                <Image
                                    source={{ uri: meal.imageUrl || '/api/placeholder/400/200' }}
                                    style={styles.orderMealImage}
                                    defaultSource={require('@/assets/images/placeholder-meal.png')}
                                />
                                <View style={styles.orderMealInfo}>
                                    <ThemedText type="defaultSemiBold" style={styles.orderMealName}>
                                        {meal.name}
                                    </ThemedText>
                                    <ThemedText style={styles.orderMealPrice}>
                                        ${meal.price.toFixed(2)}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Quantity Selector */}
                            <View style={styles.orderSection}>
                                <ThemedText style={styles.orderSectionTitle}>Quantity</ThemedText>
                                <View style={styles.quantitySelector}>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={decrementQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <Ionicons
                                            name="remove"
                                            size={20}
                                            color={quantity <= 1 ? '#ccc' : COLORS.primary}
                                        />
                                    </TouchableOpacity>
                                    <ThemedText style={styles.quantityText}>{quantity}</ThemedText>
                                    <TouchableOpacity
                                        style={styles.quantityButton}
                                        onPress={incrementQuantity}
                                    >
                                        <Ionicons name="add" size={20} color={COLORS.primary} />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Delivery Method */}
                            <View style={styles.orderSection}>
                                <ThemedText style={styles.orderSectionTitle}>Delivery Method</ThemedText>
                                <View style={styles.deliveryToggleContainer}>
                                    <TouchableOpacity
                                        style={[
                                            styles.deliveryOption,
                                            deliveryMethod === 'pickup' && styles.selectedDeliveryOption
                                        ]}
                                        onPress={() => setDeliveryMethod('pickup')}
                                    >
                                        <Ionicons
                                            name="restaurant-outline"
                                            size={20}
                                            color={deliveryMethod === 'pickup' ? '#fff' : COLORS.primary}
                                        />
                                        <ThemedText
                                            style={[
                                                styles.deliveryOptionText,
                                                deliveryMethod === 'pickup' && styles.selectedDeliveryOptionText
                                            ]}
                                        >
                                            Pickup
                                        </ThemedText>
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={[
                                            styles.deliveryOption,
                                            deliveryMethod === 'delivery' && styles.selectedDeliveryOption
                                        ]}
                                        onPress={() => setDeliveryMethod('delivery')}
                                        disabled={!cookProfile?.deliveryAvailable}
                                    >
                                        <Ionicons
                                            name="bicycle-outline"
                                            size={20}
                                            color={
                                                !cookProfile?.deliveryAvailable
                                                    ? '#ccc'
                                                    : deliveryMethod === 'delivery'
                                                    ? '#fff'
                                                    : COLORS.primary
                                            }
                                        />
                                        <ThemedText
                                            style={[
                                                styles.deliveryOptionText,
                                                !cookProfile?.deliveryAvailable && styles.disabledDeliveryOptionText,
                                                deliveryMethod === 'delivery' && styles.selectedDeliveryOptionText
                                            ]}
                                        >
                                            Delivery 
                                            {cookProfile?.deliveryFee 
                                                ? ` (+$${cookProfile.deliveryFee.toFixed(2)})`
                                                : ''
                                            }
                                        </ThemedText>
                                    </TouchableOpacity>
                                </View>
                                
                                {!cookProfile?.deliveryAvailable && (
                                    <ThemedText style={styles.deliveryUnavailableText}>
                                        This cook does not offer delivery
                                    </ThemedText>
                                )}
                                
                                {cookProfile?.deliveryAvailable && deliveryMethod === 'delivery' && (
                                    <View style={styles.deliveryAddressContainer}>
                                        <ThemedText style={styles.deliveryAddressLabel}>
                                            Delivery Address
                                        </ThemedText>
                                        <TextInput
                                            style={styles.deliveryAddressInput}
                                            multiline
                                            numberOfLines={3}
                                            value={deliveryAddress?.formattedAddress || ''}
                                            onChangeText={(text) => 
                                                setDeliveryAddress(prev => ({
                                                    ...prev as any,
                                                    formattedAddress: text
                                                }))
                                            }
                                            placeholder="Enter your delivery address"
                                            placeholderTextColor="#999"
                                        />
                                    </View>
                                )}
                            </View>

                            {/* Requested Time */}
                            <View style={styles.orderSection}>
                                <ThemedText style={styles.orderSectionTitle}>Requested Time</ThemedText>
                                <View style={styles.timeSelector}>
                                    <TouchableOpacity
                                        style={styles.timeOption}
                                        onPress={() => {
                                            const date = new Date();
                                            date.setHours(date.getHours() + 1);
                                            setSelectedTime(date);
                                        }}
                                    >
                                        <ThemedText style={styles.timeOptionText}>
                                            ASAP (~1 hour)
                                        </ThemedText>
                                    </TouchableOpacity>
                                    
                                    {/* We'd typically add a date/time picker here for custom times */}
                                    <ThemedText style={styles.selectedTimeText}>
                                        {format(selectedTime, 'EEEE, h:mm a')}
                                    </ThemedText>
                                </View>
                            </View>

                            {/* Special Instructions */}
                            <View style={styles.orderSection}>
                                <ThemedText style={styles.orderSectionTitle}>Special Instructions (Optional)</ThemedText>
                                <TextInput
                                    style={styles.specialInstructionsInput}
                                    multiline
                                    numberOfLines={4}
                                    value={specialInstructions}
                                    onChangeText={setSpecialInstructions}
                                    placeholder="Add any special requests or instructions for the cook"
                                    placeholderTextColor="#999"
                                    textAlignVertical="top"
                                />
                            </View>

                            {/* Order Summary */}
                            <View style={styles.orderSummary}>
                                <View style={styles.summaryRow}>
                                    <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
                                    <ThemedText style={styles.summaryValue}>
                                        ${(meal.price * quantity).toFixed(2)}
                                    </ThemedText>
                                </View>
                                
                                {deliveryMethod === 'delivery' && cookProfile?.deliveryFee && (
                                    <View style={styles.summaryRow}>
                                        <ThemedText style={styles.summaryLabel}>Delivery Fee</ThemedText>
                                        <ThemedText style={styles.summaryValue}>
                                            ${cookProfile.deliveryFee.toFixed(2)}
                                        </ThemedText>
                                    </View>
                                )}
                                
                                <View style={styles.summaryRow}>
                                    <ThemedText type="defaultSemiBold" style={styles.totalLabel}>
                                        Total
                                    </ThemedText>
                                    <ThemedText type="defaultSemiBold" style={styles.totalValue}>
                                        ${calculateTotal().toFixed(2)}
                                    </ThemedText>
                                </View>
                            </View>
                        </ScrollView>

                        {/* Place Order Button */}
                        <TouchableOpacity
                            style={styles.placeOrderButton}
                            onPress={handlePlaceOrder}
                            disabled={submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <ThemedText style={styles.placeOrderButtonText}>
                                    Place Order - ${calculateTotal().toFixed(2)}
                                </ThemedText>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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
        paddingBottom: 80,
    },
    mealImage: {
        width: '100%',
        height: 250,
        resizeMode: 'cover',
    },
    detailsContainer: {
        padding: 16,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    mealName: {
        flex: 1,
        fontSize: 24,
        marginRight: 8,
    },
    mealPrice: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
    },
    cuisineContainer: {
        marginBottom: 16,
    },
    cuisineText: {
        fontSize: 16,
        color: COLORS.secondary,
    },
    mealDescription: {
        fontSize: 16,
        lineHeight: 24,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    infoText: {
        marginLeft: 8,
        fontSize: 14,
        color: '#666',
    },
    sectionContainer: {
        marginTop: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 12,
    },
    seeAllText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    tag: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginRight: 8,
        marginBottom: 8,
    },
    allergenTag: {
        backgroundColor: COLORS.secondary,
    },
    tagText: {
        color: '#fff',
        fontSize: 14,
    },
    cookContainer: {
        marginTop: 24,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    cookProfileRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    cookAvatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cookInitial: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    cookInfo: {
        flex: 1,
    },
    cookName: {
        fontSize: 16,
        marginBottom: 4,
    },
    ratingContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 14,
        color: '#666',
        marginLeft: 4,
    },
    cookBio: {
        fontSize: 14,
        lineHeight: 20,
        color: '#666',
    },
    reviewsContainer: {
        marginTop: 8,
    },
    noReviewsText: {
        fontStyle: 'italic',
        color: '#999',
    },
    reviewItem: {
        paddingBottom: 16,
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
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
    },
    orderButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 4,
    },
    orderButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    orderButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
    shareButton: {
        padding: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    modalTitle: {
        fontSize: 18,
    },
    closeButton: {
        padding: 4,
    },
    modalContent: {
        padding: 16,
        maxHeight: '70%',
    },
    orderSummaryContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        padding: 12,
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
    },
    orderMealImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 12,
    },
    orderMealInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    orderMealName: {
        fontSize: 16,
        marginBottom: 4,
    },
    orderMealPrice: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
    },
    orderSection: {
        marginBottom: 24,
    },
    orderSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    quantitySelector: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        alignSelf: 'flex-start',
        overflow: 'hidden',
    },
    quantityButton: {
        padding: 10,
        borderRightWidth: 1,
        borderLeftWidth: 1,
        borderColor: '#ccc',
    },
    quantityText: {
        paddingHorizontal: 20,
        fontSize: 16,
    },
    deliveryToggleContainer: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    deliveryOption: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: COLORS.primary,
        borderRadius: 8,
        marginRight: 12,
        flex: 1,
    },
    selectedDeliveryOption: {
        backgroundColor: COLORS.primary,
    },
    deliveryOptionText: {
        color: COLORS.primary,
        marginLeft: 8,
        fontWeight: '500',
    },
    selectedDeliveryOptionText: {
        color: '#fff',
    },
    disabledDeliveryOptionText: {
        color: '#ccc',
    },
    deliveryUnavailableText: {
        fontSize: 12,
        color: '#999',
        fontStyle: 'italic',
        marginBottom: 8,
    },
    deliveryAddressContainer: {
        marginTop: 12,
    },
    deliveryAddressLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    deliveryAddressInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 80,
        textAlignVertical: 'top',
        backgroundColor: '#fff',
    },
    timeSelector: {
        marginBottom: 8,
    },
    timeOption: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        backgroundColor: COLORS.lightGray,
        borderRadius: 8,
        marginBottom: 12,
        alignSelf: 'flex-start',
    },
    timeOptionText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    selectedTimeText: {
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.primary,
    },
    specialInstructionsInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 12,
        fontSize: 14,
        minHeight: 100,
        backgroundColor: '#fff',
    },
    orderSummary: {
        backgroundColor: '#f9f9f9',
        borderRadius: 8,
        padding: 16,
        marginTop: 16,
        marginBottom: 24,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
    },
    totalLabel: {
        fontSize: 16,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    totalValue: {
        fontSize: 16,
        color: COLORS.primary,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    placeOrderButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeOrderButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
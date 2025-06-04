// app/review/create.tsx
import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Image,
    ScrollView
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Order, getOrderById } from '@/app/services/orders';
import { createReview, ReviewInput } from '@/app/services/reviews';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

export default function CreateReviewScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [rating, setRating] = useState<number>(0);
    const [comment, setComment] = useState<string>('');
    const [hoveredStar, setHoveredStar] = useState<number>(0);

    // Load order details
    useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);

                if (!user || !orderId) {
                    Alert.alert('Error', 'Unable to load order details');
                    router.back();
                    return;
                }

                if (user.userType !== 'customer') {
                    Alert.alert('Error', 'Only customers can leave reviews');
                    router.back();
                    return;
                }

                const orderData = await getOrderById(user, orderId);
                if (!orderData) {
                    Alert.alert('Error', 'Order not found');
                    router.back();
                    return;
                }

                if (orderData.status !== 'completed') {
                    Alert.alert('Error', 'You can only review completed orders');
                    router.back();
                    return;
                }

                setOrder(orderData);
            } catch (error) {
                console.error('Error loading order:', error);
                Alert.alert('Error', 'Failed to load order details');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        loadOrder();
    }, [orderId, user]);

    // Handle star rating
    const handleStarPress = (starIndex: number) => {
        setRating(starIndex);
    };

    // Validate form
    const validateForm = (): boolean => {
        if (rating === 0) {
            Alert.alert('Rating Required', 'Please select a rating before submitting your review.');
            return false;
        }

        if (comment.trim().length < 10) {
            Alert.alert('Comment Required', 'Please write at least 10 characters for your review comment.');
            return false;
        }

        return true;
    };

    // Submit review
    const handleSubmitReview = async () => {
        if (!validateForm() || !user || !order) return;

        try {
            setSubmitting(true);

            const reviewInput: ReviewInput = {
                orderId: order.id,
                rating: rating,
                comment: comment.trim()
            };

            await createReview(user, reviewInput);

            Alert.alert(
                'Review Submitted',
                'Thank you for your feedback! Your review has been submitted successfully.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            console.error('Error submitting review:', error);
            let errorMessage = 'Failed to submit review';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Get rating description
    const getRatingDescription = (rating: number): string => {
        switch (rating) {
            case 1: return 'Poor';
            case 2: return 'Fair';
            case 3: return 'Good';
            case 4: return 'Very Good';
            case 5: return 'Excellent';
            default: return 'Select a rating';
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading order details...</ThemedText>
            </ThemedView>
        );
    }

    if (!order) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ThemedText>Order not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Leave a Review' }} />

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Order Summary */}
                <View style={styles.orderSummaryCard}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Your Order
                    </ThemedText>
                    
                    <View style={styles.orderHeader}>
                        <Image
                            source={{ uri: order.mealImageUrl || '/api/placeholder/80/80' }}
                            style={styles.mealImage}
                            defaultSource={require('@/assets/images/placeholder-meal.png')}
                        />
                        
                        <View style={styles.orderInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.mealName}>
                                {order.mealName}
                            </ThemedText>
                            <ThemedText style={styles.cookName}>
                                by {order.cookName}
                            </ThemedText>
                            <ThemedText style={styles.orderDate}>
                                {format(order.createdAt, 'MMM d, yyyy')}
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Rating Section */}
                <View style={styles.ratingCard}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        How was your experience?
                    </ThemedText>
                    
                    <View style={styles.starsContainer}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                style={styles.starButton}
                                onPress={() => handleStarPress(star)}
                                onPressIn={() => setHoveredStar(star)}
                                onPressOut={() => setHoveredStar(0)}
                            >
                                <Ionicons
                                    name={
                                        star <= (hoveredStar || rating) 
                                            ? "star" 
                                            : "star-outline"
                                    }
                                    size={40}
                                    color={
                                        star <= (hoveredStar || rating) 
                                            ? "#FFD700" 
                                            : "#ccc"
                                    }
                                />
                            </TouchableOpacity>
                        ))}
                    </View>
                    
                    <ThemedText style={styles.ratingDescription}>
                        {getRatingDescription(hoveredStar || rating)}
                    </ThemedText>
                </View>

                {/* Comment Section */}
                <View style={styles.commentCard}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Tell us more (optional)
                    </ThemedText>
                    
                    <TextInput
                        style={styles.commentInput}
                        value={comment}
                        onChangeText={setComment}
                        placeholder="Share details about your experience, food quality, delivery, etc."
                        placeholderTextColor="#999"
                        multiline
                        numberOfLines={6}
                        textAlignVertical="top"
                        maxLength={500}
                    />
                    
                    <View style={styles.characterCount}>
                        <ThemedText style={styles.characterCountText}>
                            {comment.length}/500 characters
                        </ThemedText>
                    </View>
                </View>

                {/* Helpful Tips */}
                <View style={styles.tipsCard}>
                    <View style={styles.tipsHeader}>
                        <Ionicons name="bulb-outline" size={20} color={COLORS.primary} />
                        <ThemedText type="defaultSemiBold" style={styles.tipsTitle}>
                            Review Tips
                        </ThemedText>
                    </View>
                    
                    <View style={styles.tipsList}>
                        <View style={styles.tipItem}>
                            <ThemedText style={styles.tipBullet}>•</ThemedText>
                            <ThemedText style={styles.tipText}>
                                Rate the overall experience including food quality and service
                            </ThemedText>
                        </View>
                        <View style={styles.tipItem}>
                            <ThemedText style={styles.tipBullet}>•</ThemedText>
                            <ThemedText style={styles.tipText}>
                                Be honest and constructive in your feedback
                            </ThemedText>
                        </View>
                        <View style={styles.tipItem}>
                            <ThemedText style={styles.tipBullet}>•</ThemedText>
                            <ThemedText style={styles.tipText}>
                                Help other customers make informed decisions
                            </ThemedText>
                        </View>
                    </View>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                    style={[
                        styles.submitButton,
                        (rating === 0 || submitting) && styles.submitButtonDisabled
                    ]}
                    onPress={handleSubmitReview}
                    disabled={rating === 0 || submitting}
                >
                    {submitting ? (
                        <ActivityIndicator color="#fff" size="small" />
                    ) : (
                        <>
                            <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
                            <ThemedText style={styles.submitButtonText}>
                                Submit Review
                            </ThemedText>
                        </>
                    )}
                </TouchableOpacity>

                {/* Cancel Button */}
                <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={() => router.back()}
                    disabled={submitting}
                >
                    <ThemedText style={styles.cancelButtonText}>
                        Cancel
                    </ThemedText>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
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
    scrollContent: {
        padding: 16,
        paddingBottom: 50,
    },
    orderSummaryCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 16,
        color: '#2c3e50',
    },
    orderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    mealImage: {
        width: 80,
        height: 80,
        borderRadius: 12,
        marginRight: 16,
    },
    orderInfo: {
        flex: 1,
    },
    mealName: {
        fontSize: 16,
        marginBottom: 4,
        color: '#2c3e50',
    },
    cookName: {
        fontSize: 14,
        color: COLORS.primary,
        marginBottom: 4,
        fontWeight: '500',
    },
    orderDate: {
        fontSize: 12,
        color: '#666',
    },
    ratingCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    starsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 12,
    },
    starButton: {
        padding: 8,
        marginHorizontal: 4,
    },
    ratingDescription: {
        fontSize: 16,
        color: COLORS.primary,
        fontWeight: '600',
        textAlign: 'center',
        minHeight: 20,
    },
    commentCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    commentInput: {
        borderWidth: 1,
        borderColor: '#e1e8ed',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        backgroundColor: '#f8f9fa',
        minHeight: 120,
        textAlignVertical: 'top',
    },
    characterCount: {
        alignItems: 'flex-end',
        marginTop: 8,
    },
    characterCountText: {
        fontSize: 12,
        color: '#666',
    },
    tipsCard: {
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tipsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    tipsTitle: {
        fontSize: 16,
        marginLeft: 8,
        color: '#2c3e50',
    },
    tipsList: {
        gap: 8,
    },
    tipItem: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },
    tipBullet: {
        fontSize: 16,
        color: COLORS.primary,
        marginRight: 8,
        marginTop: 2,
    },
    tipText: {
        flex: 1,
        fontSize: 14,
        color: '#5a6c7d',
        lineHeight: 20,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        borderRadius: 12,
        marginBottom: 12,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
    submitButtonDisabled: {
        backgroundColor: '#ccc',
        shadowOpacity: 0,
        elevation: 0,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
    cancelButton: {
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '500',
    },
});
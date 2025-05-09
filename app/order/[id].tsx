import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    Image,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Order, getOrderById, updateOrderStatus } from '@/app/services/orders';

export default function OrderDetailScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const orderId = params.id as string;
    
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    // Load order data
    useEffect(() => {
        const loadOrder = async () => {
            try {
                setLoading(true);
                
                if (!user || !orderId) {
                    Alert.alert('Error', 'Unable to load order details');
                    router.back();
                    return;
                }
                
                const orderData = await getOrderById(user, orderId);
                if (!orderData) {
                    Alert.alert('Error', 'Order not found');
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

    // Format status text
    const formatStatus = (status: string) => {
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };
    
    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'new':
                return '#9c88ff'; // Purple
            case 'confirmed':
                return '#4cd137'; // Green
            case 'preparing':
                return '#fbc531'; // Yellow
            case 'ready':
                return '#00a8ff'; // Blue
            case 'out_for_delivery':
                return '#487eb0'; // Blue-green
            case 'delivered':
                return '#0097e6'; // Light blue
            case 'completed':
                return '#44bd32'; // Bright green
            case 'cancelled':
                return '#e84118'; // Red
            default:
                return '#7f8fa6'; // Gray
        }
    };

    // Handle cancel order
    const handleCancelOrder = async () => {
        if (!user || !order) return;
        
        Alert.alert(
            'Cancel Order',
            'Are you sure you want to cancel this order?',
            [
                { text: 'No', style: 'cancel' },
                {
                    text: 'Yes, Cancel',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setUpdating(true);
                            await updateOrderStatus(user, order.id, 'cancelled');
                            setOrder({ ...order, status: 'cancelled' });
                            Alert.alert('Success', 'Order cancelled successfully');
                        } catch (error) {
                            console.error('Error cancelling order:', error);
                            Alert.alert('Error', 'Failed to cancel order');
                        } finally {
                            setUpdating(false);
                        }
                    },
                },
            ]
        );
    };

    // Check if order can be cancelled
    const canCancel = order && ['new', 'confirmed'].includes(order.status);

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
            <Stack.Screen options={{ title: 'Order Details' }} />
            
            <ScrollView style={styles.scrollView}>
                {/* Order Status */}
                <View style={[styles.statusContainer, { backgroundColor: getStatusColor(order.status) }]}>
                    <ThemedText style={styles.statusText}>
                        {formatStatus(order.status)}
                    </ThemedText>
                    <ThemedText style={styles.statusDescription}>
                        {order.status === 'new' && 'Your order has been received and is waiting for confirmation.'}
                        {order.status === 'confirmed' && 'Your order has been confirmed by the cook.'}
                        {order.status === 'preparing' && 'The cook is now preparing your meal.'}
                        {order.status === 'ready' && 'Your meal is ready for pickup.'}
                        {order.status === 'out_for_delivery' && 'Your meal is on the way.'}
                        {order.status === 'delivered' && 'Your order has been delivered.'}
                        {order.status === 'completed' && 'Your order is complete. Thank you!'}
                        {order.status === 'cancelled' && 'This order has been cancelled.'}
                    </ThemedText>
                </View>
                
                {/* Order Details */}
                <View style={styles.orderDetailsContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Order Information
                    </ThemedText>
                    
                    <View style={styles.orderInfoRow}>
                        <ThemedText style={styles.orderInfoLabel}>Order ID:</ThemedText>
                        <ThemedText style={styles.orderInfoValue}>{order.id.substring(0, 8)}</ThemedText>
                    </View>
                    
                    <View style={styles.orderInfoRow}>
                        <ThemedText style={styles.orderInfoLabel}>Order Date:</ThemedText>
                        <ThemedText style={styles.orderInfoValue}>
                            {format(order.createdAt, 'MMM d, yyyy h:mm a')}
                        </ThemedText>
                    </View>
                    
                    <View style={styles.orderInfoRow}>
                        <ThemedText style={styles.orderInfoLabel}>Delivery Method:</ThemedText>
                        <ThemedText style={styles.orderInfoValue}>
                            {order.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </ThemedText>
                    </View>
                    
                    <View style={styles.orderInfoRow}>
                        <ThemedText style={styles.orderInfoLabel}>Requested Time:</ThemedText>
                        <ThemedText style={styles.orderInfoValue}>
                            {format(order.requestedTime, 'MMM d, yyyy h:mm a')}
                        </ThemedText>
                    </View>
                    
                    {order.deliveryMethod === 'delivery' && order.deliveryAddress && (
                        <View style={styles.orderInfoRow}>
                            <ThemedText style={styles.orderInfoLabel}>Delivery Address:</ThemedText>
                            <ThemedText style={styles.orderInfoValue}>
                                {order.deliveryAddress.formattedAddress}
                            </ThemedText>
                        </View>
                    )}
                    
                    {order.specialInstructions && (
                        <View style={styles.orderInfoRow}>
                            <ThemedText style={styles.orderInfoLabel}>Special Instructions:</ThemedText>
                            <ThemedText style={styles.orderInfoValue}>
                                {order.specialInstructions}
                            </ThemedText>
                        </View>
                    )}
                </View>
                
                {/* Order Items */}
                <View style={styles.itemsContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Order Items
                    </ThemedText>
                    
                    <View style={styles.orderItemCard}>
                        <Image
                            source={{ uri: order.mealImageUrl || '/api/placeholder/400/200' }}
                            style={styles.mealImage}
                            defaultSource={require('@/assets/images/placeholder-meal.png')}
                        />
                        
                        <View style={styles.mealInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.mealName}>
                                {order.mealName}
                            </ThemedText>
                            
                            <View style={styles.mealDetails}>
                                <ThemedText style={styles.mealPrice}>
                                    ${(order.totalAmount / order.quantity).toFixed(2)}
                                </ThemedText>
                                <ThemedText style={styles.mealQuantity}>
                                    Quantity: {order.quantity}
                                </ThemedText>
                            </View>
                            
                            <TouchableOpacity
                                style={styles.viewMealButton}
                                onPress={() => router.push(`/meal/${order.mealId}`)}
                            >
                                <ThemedText style={styles.viewMealText}>View Meal Details</ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
                
                {/* Cook Information */}
                <View style={styles.cookContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Cook Information
                    </ThemedText>
                    
                    <TouchableOpacity
                        style={styles.cookCard}
                        onPress={() => router.push(`/cook/${order.cookId}`)}
                    >
                        <View style={styles.cookAvatar}>
                            <ThemedText style={styles.cookInitial}>
                                {order.cookName.charAt(0).toUpperCase()}
                            </ThemedText>
                        </View>
                        
                        <View style={styles.cookInfo}>
                            <ThemedText type="defaultSemiBold" style={styles.cookName}>
                                {order.cookName}
                            </ThemedText>
                        </View>
                        
                        <Ionicons name="chevron-forward" size={20} color="#999" />
                    </TouchableOpacity>
                </View>
                
                {/* Order Summary */}
                <View style={styles.summaryContainer}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Order Summary
                    </ThemedText>
                    
                    <View style={styles.summaryRow}>
                        <ThemedText style={styles.summaryLabel}>Subtotal</ThemedText>
                        <ThemedText style={styles.summaryValue}>
                            ${(order.totalAmount).toFixed(2)}
                        </ThemedText>
                    </View>
                    
                    <View style={styles.summaryRow}>
                        <ThemedText type="defaultSemiBold" style={styles.totalLabel}>
                            Total
                        </ThemedText>
                        <ThemedText type="defaultSemiBold" style={styles.totalValue}>
                            ${order.totalAmount.toFixed(2)}
                        </ThemedText>
                    </View>
                </View>
                
                {/* Action Buttons */}
                {canCancel && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={handleCancelOrder}
                            disabled={updating}
                        >
                            {updating ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <>
                                    <Ionicons name="close-circle-outline" size={20} color="#fff" />
                                    <ThemedText style={styles.buttonText}>Cancel Order</ThemedText>
                                </>
                            )}
                        </TouchableOpacity>
                    </View>
                )}
                
                {order.status === 'completed' && (
                    <View style={styles.actionButtonsContainer}>
                        <TouchableOpacity
                            style={styles.reviewButton}
                            onPress={() => router.push(`/review/create?orderId=${order.id}`)}
                        >
                            <Ionicons name="star-outline" size={20} color="#fff" />
                            <ThemedText style={styles.buttonText}>Leave a Review</ThemedText>
                        </TouchableOpacity>
                        
                        <TouchableOpacity
                            style={styles.reorderButton}
                            onPress={() => router.push(`/meal/${order.mealId}`)}
                        >
                            <Ionicons name="refresh-outline" size={20} color="#fff" />
                            <ThemedText style={styles.buttonText}>Order Again</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
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
    statusContainer: {
        padding: 16,
        alignItems: 'center',
    },
    statusText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 4,
    },
    statusDescription: {
        color: '#fff',
        textAlign: 'center',
    },
    orderDetailsContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 16,
    },
    orderInfoRow: {
        flexDirection: 'row',
        marginBottom: 12,
    },
    orderInfoLabel: {
        width: 140,
        color: '#666',
    },
    orderInfoValue: {
        flex: 1,
        fontWeight: '500',
    },
    itemsContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    orderItemCard: {
        flexDirection: 'row',
        backgroundColor: '#339A4A',
        borderRadius: 8,
        overflow: 'hidden',
    },
    mealImage: {
        width: 100,
        height: 100,
        resizeMode: 'cover',
    },
    mealInfo: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    mealName: {
        fontSize: 16,
        marginBottom: 8,
    },
    mealDetails: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    mealPrice: {
        fontWeight: '500',
    },
    mealQuantity: {
        color: '#666',
    },
    viewMealButton: {
        alignSelf: 'flex-start',
    },
    viewMealText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    cookContainer: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    cookCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
    },
    cookAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
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
    },
    summaryContainer: {
        padding: 16,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    summaryLabel: {
        color: '#666',
    },
    summaryValue: {
        fontWeight: '500',
    },
    totalLabel: {
        fontSize: 16,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    totalValue: {
        fontSize: 16,
        color: COLORS.primary,
        marginTop: 8,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#eee',
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: '#fff',
        justifyContent: 'space-between',
    },
    cancelButton: {
        backgroundColor: COLORS.error,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        flex: 1,
    },
    reviewButton: {
        backgroundColor: COLORS.secondary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 8,
    },
    reorderButton: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 8,
    },
    buttonText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
});
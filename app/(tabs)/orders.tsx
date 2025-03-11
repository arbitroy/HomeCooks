import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    FlatList,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    RefreshControl
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Order, getCustomerOrders, updateOrderStatus } from '@/app/services/orders';

export default function OrdersScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Load orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            if (user) {
                const userOrders = await getCustomerOrders(user.uid);
                setOrders(userOrders);
            }
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'Failed to load your orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Initial load
    useEffect(() => {
        loadOrders();
    }, [user]);

    // Handle refresh
    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders();
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

    // Format status text
    const formatStatus = (status: string) => {
        return status
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    // Cancel order
    const handleCancelOrder = async (orderId: string) => {
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
                            if (user) {
                                await updateOrderStatus(user, orderId, 'cancelled');
                                // Update local state
                                setOrders(
                                    orders.map(order =>
                                        order.id === orderId ? { ...order, status: 'cancelled' } : order
                                    )
                                );
                                Alert.alert('Success', 'Order cancelled successfully');
                            }
                        } catch (error) {
                            console.error('Error cancelling order:', error);
                            Alert.alert('Error', 'Failed to cancel order. Please try again.');
                        }
                    },
                },
            ]
        );
    };

    // Render order item
    const renderOrderItem = ({ item }: { item: Order }) => {
        const canCancel = ['new', 'confirmed'].includes(item.status);

        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/order/${item.id}`)}
            >
                <View style={styles.orderHeader}>
                    <View>
                        <ThemedText style={styles.orderDate}>
                            {format(item.createdAt, 'MMM d, yyyy · h:mm a')}
                        </ThemedText>
                        <View style={styles.orderStatusContainer}>
                            <View
                                style={[
                                    styles.statusDot,
                                    { backgroundColor: getStatusColor(item.status) },
                                ]}
                            />
                            <ThemedText style={styles.orderStatus}>
                                {formatStatus(item.status)}
                            </ThemedText>
                        </View>
                    </View>
                    <ThemedText type="defaultSemiBold" style={styles.orderPrice}>
                        ${item.totalAmount.toFixed(2)}
                    </ThemedText>
                </View>

                <View style={styles.orderContent}>
                    <Image
                        source={{ uri: item.mealImageUrl || '/api/placeholder/100/100' }}
                        style={styles.mealImage}
                        defaultSource={require('@/assets/images/placeholder-meal.png')}
                    />
                    <View style={styles.orderDetails}>
                        <ThemedText type="defaultSemiBold" style={styles.mealName}>
                            {item.mealName}
                        </ThemedText>
                        <ThemedText style={styles.orderQuantity}>
                            Quantity: {item.quantity}
                        </ThemedText>
                        <ThemedText style={styles.cookName}>
                            Cook: {item.cookName}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    {canCancel && (
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelOrder(item.id)}
                        >
                            <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                            <ThemedText style={styles.cancelButtonText}>Cancel Order</ThemedText>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity style={styles.detailsButton}>
                        <ThemedText style={styles.detailsButtonText}>View Details</ThemedText>
                        <Ionicons name="chevron-forward" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        );
    };

    // Empty list message
    const renderEmptyList = () => {
        if (loading) return null;

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.gray} />
                <ThemedText style={styles.emptyText}>
                    You haven't placed any orders yet
                </ThemedText>
                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push('/browse')}
                >
                    <ThemedText style={styles.browseButtonText}>Browse Meals</ThemedText>
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'My Orders', headerShown: true }} />

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={orders}
                    renderItem={renderOrderItem}
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
    listContent: {
        padding: 16,
        paddingBottom: 80,
    },
    orderCard: {
        backgroundColor: '#fff',
        borderRadius: 8,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        padding: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    orderDate: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    orderStatusContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '500',
    },
    orderPrice: {
        fontSize: 16,
        color: COLORS.primary,
    },
    orderContent: {
        flexDirection: 'row',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
        marginBottom: 12,
    },
    mealImage: {
        width: 70,
        height: 70,
        borderRadius: 8,
        marginRight: 12,
    },
    orderDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    mealName: {
        fontSize: 16,
        marginBottom: 4,
    },
    orderQuantity: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    cookName: {
        fontSize: 14,
        color: '#666',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
        paddingTop: 12,
    },
    cancelButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        color: COLORS.error,
        marginLeft: 4,
    },
    detailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    detailsButtonText: {
        fontSize: 14,
        color: COLORS.primary,
        marginRight: 4,
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
    browseButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
    },
    browseButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
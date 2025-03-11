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
import { 
    Order, 
    getCustomerOrders, 
    getCookOrders, 
    getActiveCookOrders,
    updateOrderStatus,
    OrderStatus
} from '@/app/services/orders';

// Tab for cook order filtering
type OrderTab = 'active' | 'all' | 'history';

export default function OrdersScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [orders, setOrders] = useState<Order[]>([]);
    const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<OrderTab>('active');
    const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

    // Load orders
    const loadOrders = async () => {
        try {
            setLoading(true);
            
            if (!user) {
                Alert.alert('Error', 'You must be logged in to view orders');
                return;
            }
            
            let fetchedOrders: Order[] = [];
            
            if (user.userType === 'cook') {
                // Load cook orders
                if (activeTab === 'active') {
                    fetchedOrders = await getActiveCookOrders(user.uid);
                } else {
                    fetchedOrders = await getCookOrders(user.uid);
                }
                
                // Filter based on active tab
                filterCookOrders(fetchedOrders, activeTab);
            } else {
                // Load customer orders
                fetchedOrders = await getCustomerOrders(user.uid);
                
                // Sort by newest first
                fetchedOrders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                setFilteredOrders(fetchedOrders);
            }
            
            setOrders(fetchedOrders);
        } catch (error) {
            console.error('Error loading orders:', error);
            Alert.alert('Error', 'Failed to load your orders. Please try again.');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Filter orders for cook based on active tab
    const filterCookOrders = (orderList: Order[], tab: OrderTab) => {
        let filtered: Order[] = [];
        
        switch (tab) {
            case 'active':
                filtered = orderList.filter(order => 
                    !['completed', 'cancelled'].includes(order.status)
                );
                // Sort active orders by newest first
                filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
            case 'all':
                // All orders sorted by newest first
                filtered = [...orderList].sort(
                    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
                );
                break;
            case 'history':
                // Completed and cancelled orders
                filtered = orderList.filter(order => 
                    ['completed', 'cancelled'].includes(order.status)
                );
                // Sort history by newest first
                filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
                break;
        }
        
        setFilteredOrders(filtered);
    };

    // Initial load
    useEffect(() => {
        loadOrders();
    }, [user]);

    // Handle tab change for cook
    useEffect(() => {
        if (user?.userType === 'cook') {
            filterCookOrders(orders, activeTab);
        }
    }, [activeTab]);

    // Refresh handler
    const handleRefresh = () => {
        setRefreshing(true);
        loadOrders();
    };

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

    // For cooks: Update order status
    const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
        try {
            if (!user || user.userType !== 'cook') {
                Alert.alert('Error', 'Only cooks can update order status');
                return;
            }
            
            setUpdatingOrderId(orderId);
            
            await updateOrderStatus(user, orderId, status);
            
            // Update local state
            const updatedOrders = orders.map(order => 
                order.id === orderId 
                    ? { ...order, status, updatedAt: new Date() } 
                    : order
            );
            
            setOrders(updatedOrders);
            filterCookOrders(updatedOrders, activeTab);
            
            Alert.alert('Success', `Order status updated to ${formatStatus(status)}`);
        } catch (error) {
            console.error('Error updating order status:', error);
            Alert.alert('Error', 'Failed to update order status');
        } finally {
            setUpdatingOrderId(null);
        }
    };

    // For cooks: Get next status options based on current status
    const getNextStatusOptions = (currentStatus: OrderStatus): OrderStatus[] => {
        switch (currentStatus) {
            case 'new':
                return ['confirmed', 'cancelled'];
            case 'confirmed':
                return ['preparing', 'cancelled'];
            case 'preparing':
                return ['ready', 'cancelled'];
            case 'ready':
                return ['out_for_delivery', 'completed', 'cancelled'];
            case 'out_for_delivery':
                return ['delivered', 'cancelled'];
            case 'delivered':
                return ['completed'];
            default:
                return [];
        }
    };

    // For cooks: Show status update options
    const showStatusOptions = (order: Order) => {
        if (user?.userType !== 'cook') return;
        
        const nextOptions = getNextStatusOptions(order.status as OrderStatus);
        
        if (nextOptions.length === 0) return;
        
        const buttons = nextOptions.map(status => ({
            text: formatStatus(status),
            onPress: () => handleUpdateStatus(order.id, status),
            style: status === 'cancelled' ? 'destructive' : 'default'
        }));
        
        buttons.push({
            text: 'Cancel', style: 'cancel',
            onPress: undefined
        });
        
        Alert.alert(
            'Update Order Status',
            `Current status: ${formatStatus(order.status)}`,
            buttons
        );
    };

    // For customers: Cancel order
    const handleCancelOrder = async (orderId: string) => {
        if (user?.userType !== 'customer') return;
        
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
                                const updatedOrders = orders.map(order =>
                                    order.id === orderId ? { ...order, status: 'cancelled' } : order
                                );
                                setOrders(updatedOrders);
                                setFilteredOrders(updatedOrders);
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

    // Render cook's tab selector
    const renderCookTabSelector = () => (
        <View style={styles.tabContainer}>
            <TouchableOpacity
                style={[styles.tab, activeTab === 'active' && styles.activeTab]}
                onPress={() => setActiveTab('active')}
            >
                <Ionicons
                    name="timer-outline"
                    size={20}
                    color={activeTab === 'active' ? '#fff' : COLORS.primary}
                />
                <ThemedText
                    style={[styles.tabText, activeTab === 'active' && styles.activeTabText]}
                >
                    Active
                </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.tab, activeTab === 'all' && styles.activeTab]}
                onPress={() => setActiveTab('all')}
            >
                <Ionicons
                    name="list-outline"
                    size={20}
                    color={activeTab === 'all' ? '#fff' : COLORS.primary}
                />
                <ThemedText
                    style={[styles.tabText, activeTab === 'all' && styles.activeTabText]}
                >
                    All
                </ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.tab, activeTab === 'history' && styles.activeTab]}
                onPress={() => setActiveTab('history')}
            >
                <Ionicons
                    name="time-outline"
                    size={20}
                    color={activeTab === 'history' ? '#fff' : COLORS.primary}
                />
                <ThemedText
                    style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
                >
                    History
                </ThemedText>
            </TouchableOpacity>
        </View>
    );

    // Render cook's order item
    const renderCookOrderItem = ({ item }: { item: Order }) => {
        const canUpdateStatus = !['completed', 'cancelled'].includes(item.status);
        const isUpdating = updatingOrderId === item.id;
        
        return (
            <TouchableOpacity
                style={styles.orderCard}
                onPress={() => router.push(`/order/${item.id}`)}
                disabled={isUpdating}
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
                        <ThemedText style={styles.customerName}>
                            Customer: {item.customerName}
                        </ThemedText>
                        <ThemedText style={styles.deliveryMethod}>
                            {item.deliveryMethod === 'pickup' ? 'Pickup' : 'Delivery'}
                        </ThemedText>
                    </View>
                </View>

                <View style={styles.orderFooter}>
                    {canUpdateStatus && (
                        <TouchableOpacity
                            style={styles.updateStatusButton}
                            onPress={() => showStatusOptions(item)}
                            disabled={isUpdating}
                        >
                            {isUpdating ? (
                                <ActivityIndicator size="small" color={COLORS.primary} />
                            ) : (
                                <>
                                    <Ionicons name="refresh-outline" size={16} color={COLORS.primary} />
                                    <ThemedText style={styles.updateStatusText}>Update Status</ThemedText>
                                </>
                            )}
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

    // Render customer's order item
    const renderCustomerOrderItem = ({ item }: { item: Order }) => {
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

        const emptyMessage = user?.userType === 'cook' 
            ? (activeTab === 'active'
                ? 'No active orders at the moment'
                : activeTab === 'history'
                ? 'No order history yet'
                : 'No orders yet')
            : 'You haven\'t placed any orders yet';

        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="receipt-outline" size={64} color={COLORS.gray} />
                <ThemedText style={styles.emptyText}>
                    {emptyMessage}
                </ThemedText>
                {user?.userType === 'customer' && (
                    <TouchableOpacity
                        style={styles.browseButton}
                        onPress={() => router.push('/browse')}
                    >
                        <ThemedText style={styles.browseButtonText}>Browse Meals</ThemedText>
                    </TouchableOpacity>
                )}
            </View>
        );
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ 
                title: user?.userType === 'cook' ? 'Manage Orders' : 'My Orders', 
                headerShown: true 
            }} />
            
            {/* Cook-specific tab selector */}
            {user?.userType === 'cook' && renderCookTabSelector()}

            {loading && !refreshing ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                </View>
            ) : (
                <FlatList
                    data={filteredOrders}
                    renderItem={user?.userType === 'cook' ? renderCookOrderItem : renderCustomerOrderItem}
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
    tabContainer: {
        flexDirection: 'row',
        padding: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    tab: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginHorizontal: 4,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        color: COLORS.primary,
        marginLeft: 6,
        fontWeight: '500',
    },
    activeTabText: {
        color: '#fff',
    },
    listContent: {
        padding: 16,
        paddingBottom: 80,
        flexGrow: 1,
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
    customerName: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    cookName: {
        fontSize: 14,
        color: '#666',
    },
    deliveryMethod: {
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
    updateStatusButton: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    updateStatusText: {
        fontSize: 14,
        color: COLORS.primary,
        marginLeft: 4,
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
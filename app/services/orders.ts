import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp,
    Timestamp,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from './auth';
import { Meal, getMealById } from './meals';
import { LocationAddress } from './location';

// Order status types
export type OrderStatus = 
    | 'new' 
    | 'confirmed' 
    | 'preparing' 
    | 'ready' 
    | 'out_for_delivery' 
    | 'delivered' 
    | 'completed' 
    | 'cancelled';

// Delivery method types
export type DeliveryMethod = 'pickup' | 'delivery';

// Order interface
export interface Order {
    id: string;
    customerId: string;
    customerName: string;
    cookId: string;
    cookName: string;
    mealId: string;
    mealName: string;
    mealImageUrl: string;
    quantity: number;
    status: OrderStatus;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: LocationAddress;
    specialInstructions?: string;
    requestedTime: Date;  // When the customer wants the order
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
}

// Order input interface
export interface OrderInput {
    mealId: string;
    quantity: number;
    deliveryMethod: DeliveryMethod;
    deliveryAddress?: LocationAddress;
    specialInstructions?: string;
    requestedTime: Date;
}

// Convert Firestore data to Order object
const convertOrder = (doc: QueryDocumentSnapshot): Order => {
    const data = doc.data();
    return {
        id: doc.id,
        customerId: data.customerId,
        customerName: data.customerName,
        cookId: data.cookId,
        cookName: data.cookName,
        mealId: data.mealId,
        mealName: data.mealName,
        mealImageUrl: data.mealImageUrl,
        quantity: data.quantity,
        status: data.status,
        deliveryMethod: data.deliveryMethod,
        deliveryAddress: data.deliveryAddress,
        specialInstructions: data.specialInstructions,
        requestedTime: data.requestedTime.toDate(),
        totalAmount: data.totalAmount,
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate(),
        completedAt: data.completedAt ? data.completedAt.toDate() : undefined
    };
};

// Create a new order
export const createOrder = async (currentUser: User, orderInput: OrderInput): Promise<Order> => {
    try {
        if (!currentUser || currentUser.userType !== 'customer') {
            throw new Error('Only customers can place orders');
        }

        // Get the meal details
        const meal = await getMealById(orderInput.mealId);
        if (!meal) {
            throw new Error('Meal not found');
        }

        if (!meal.available) {
            throw new Error('This meal is currently unavailable');
        }

        // Get cook details
        const cookRef = doc(firestore, 'users', meal.cookId);
        const cookSnap = await getDoc(cookRef);
        
        if (!cookSnap.exists()) {
            throw new Error('Cook not found');
        }

        const cookData = cookSnap.data();

        // Calculate total amount
        const totalAmount = meal.price * orderInput.quantity;

        // Create order object with clean data - no undefined values
        const orderData: any = {
            customerId: currentUser.uid,
            customerName: currentUser.displayName || 'Customer',
            cookId: meal.cookId,
            cookName: cookData.displayName || 'Cook',
            mealId: meal.id,
            mealName: meal.name,
            mealImageUrl: meal.imageUrl || null, // Using null if imageUrl is undefined
            quantity: orderInput.quantity,
            status: 'new' as OrderStatus,
            deliveryMethod: orderInput.deliveryMethod,
            // Only include deliveryAddress if it exists and has some content
            ...(orderInput.deliveryMethod === 'delivery' && orderInput.deliveryAddress && 
                Object.keys(orderInput.deliveryAddress).length > 0 ? 
                { deliveryAddress: orderInput.deliveryAddress } : {}),
            // Only include specialInstructions if it exists and not empty
            ...(orderInput.specialInstructions && orderInput.specialInstructions.trim() !== '' ? 
                { specialInstructions: orderInput.specialInstructions } : {}),
            requestedTime: Timestamp.fromDate(orderInput.requestedTime),
            totalAmount: totalAmount,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        const orderRef = await addDoc(collection(firestore, 'orders'), orderData);
        
        // Construct the return object, ensuring all fields are present with default values if needed
        return {
            id: orderRef.id,
            ...orderData,
            requestedTime: orderInput.requestedTime,
            createdAt: new Date(),
            updatedAt: new Date(),
            // Ensure the optional fields have sensible defaults if omitted
            specialInstructions: orderData.specialInstructions || '',
            deliveryAddress: orderData.deliveryAddress || null
        } as Order;
    } catch (error) {
        console.error('Error creating order:', error);
        throw error;
    }
};

// Update order status
export const updateOrderStatus = async (
    currentUser: User,
    orderId: string,
    status: OrderStatus
): Promise<Order> => {
    try {
        const orderRef = doc(firestore, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderSnap.data();

        // Check permissions based on status and user type
        if (currentUser.userType === 'cook' && currentUser.uid !== orderData.cookId) {
            throw new Error('You can only update your own orders');
        }

        if (currentUser.userType === 'customer' && currentUser.uid !== orderData.customerId) {
            throw new Error('You can only update your own orders');
        }

        // Customers can only cancel orders
        if (currentUser.userType === 'customer' && status !== 'cancelled') {
            throw new Error('Customers can only cancel orders');
        }

        // Cannot update completed or cancelled orders
        if (orderData.status === 'completed' || orderData.status === 'cancelled') {
            throw new Error('Cannot update completed or cancelled orders');
        }

        const updatedData: any = {
            status: status,
            updatedAt: serverTimestamp()
        };

        // Set completedAt when order is completed
        if (status === 'completed') {
            updatedData.completedAt = serverTimestamp();
        }

        await updateDoc(orderRef, updatedData);

        const updatedOrderSnap = await getDoc(orderRef);
        
        return convertOrder(updatedOrderSnap as QueryDocumentSnapshot);
    } catch (error) {
        console.error('Error updating order status:', error);
        throw error;
    }
};

// Get a single order by ID
export const getOrderById = async (currentUser: User, orderId: string): Promise<Order | null> => {
    try {
        const orderRef = doc(firestore, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            return null;
        }

        const orderData = orderSnap.data();

        // Check if user has permission to view this order
        if (
            currentUser.uid !== orderData.customerId &&
            currentUser.uid !== orderData.cookId
        ) {
            throw new Error('You do not have permission to view this order');
        }

        return convertOrder(orderSnap as QueryDocumentSnapshot);
    } catch (error) {
        console.error('Error getting order:', error);
        throw error;
    }
};

// Get orders for a customer
export const getCustomerOrders = async (customerId: string): Promise<Order[]> => {
    try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(
            ordersRef,
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push(convertOrder(doc));
        });

        return orders;
    } catch (error) {
        console.error('Error getting customer orders:', error);
        throw error;
    }
};

// Get orders for a cook
export const getCookOrders = async (cookId: string): Promise<Order[]> => {
    try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(
            ordersRef,
            where('cookId', '==', cookId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push(convertOrder(doc));
        });

        return orders;
    } catch (error) {
        console.error('Error getting cook orders:', error);
        throw error;
    }
};

// Get active orders for a customer (not completed or cancelled)
export const getActiveCustomerOrders = async (customerId: string): Promise<Order[]> => {
    try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(
            ordersRef,
            where('customerId', '==', customerId),
            where('status', 'not-in', ['completed', 'cancelled']),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push(convertOrder(doc));
        });

        return orders;
    } catch (error) {
        console.error('Error getting active customer orders:', error);
        throw error;
    }
};

// Get active orders for a cook (not completed or cancelled)
export const getActiveCookOrders = async (cookId: string): Promise<Order[]> => {
    try {
        const ordersRef = collection(firestore, 'orders');
        const q = query(
            ordersRef,
            where('cookId', '==', cookId),
            where('status', 'not-in', ['completed', 'cancelled']),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const orders: Order[] = [];

        querySnapshot.forEach((doc) => {
            orders.push(convertOrder(doc));
        });

        return orders;
    } catch (error) {
        console.error('Error getting active cook orders:', error);
        throw error;
    }
};

// Create an object with all the exported functions for default export
const OrderService = {
    createOrder,
    updateOrderStatus,
    getOrderById,
    getCustomerOrders,
    getCookOrders,
    getActiveCustomerOrders,
    getActiveCookOrders
};

export default OrderService;
import {
    collection,
    doc,
    addDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    runTransaction,
    QueryDocumentSnapshot
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from './auth';
import { Order } from './orders';

// Review interface
export interface Review {
    id: string;
    orderId: string;
    customerId: string;
    customerName: string;
    cookId: string;
    mealId: string;
    mealName: string;
    rating: number; // 1-5
    comment: string;
    createdAt: Date;
}

// Review input interface
export interface ReviewInput {
    orderId: string;
    rating: number; // 1-5
    comment: string;
}

// Convert Firestore data to Review object
const convertReview = (doc: QueryDocumentSnapshot): Review => {
    const data = doc.data();
    return {
        id: doc.id,
        orderId: data.orderId,
        customerId: data.customerId,
        customerName: data.customerName,
        cookId: data.cookId,
        mealId: data.mealId,
        mealName: data.mealName,
        rating: data.rating,
        comment: data.comment,
        createdAt: data.createdAt.toDate()
    };
};

// Create a new review
export const createReview = async (currentUser: User, reviewInput: ReviewInput): Promise<Review> => {
    try {
        if (!currentUser || currentUser.userType !== 'customer') {
            throw new Error('Only customers can create reviews');
        }

        // Validate rating
        if (reviewInput.rating < 1 || reviewInput.rating > 5) {
            throw new Error('Rating must be between 1 and 5');
        }

        // Check if the order exists and belongs to the customer
        const orderRef = doc(firestore, 'orders', reviewInput.orderId);
        const orderSnap = await getDoc(orderRef);

        if (!orderSnap.exists()) {
            throw new Error('Order not found');
        }

        const orderData = orderSnap.data();

        if (orderData.customerId !== currentUser.uid) {
            throw new Error('You can only review your own orders');
        }

        if (orderData.status !== 'completed') {
            throw new Error('You can only review completed orders');
        }

        // Check if review already exists for this order
        const reviewsRef = collection(firestore, 'reviews');
        const q = query(reviewsRef, where('orderId', '==', reviewInput.orderId));
        const existingReviews = await getDocs(q);

        if (!existingReviews.empty) {
            throw new Error('You have already reviewed this order');
        }

        // Create review
        const reviewData = {
            orderId: reviewInput.orderId,
            customerId: currentUser.uid,
            customerName: currentUser.displayName || 'Customer',
            cookId: orderData.cookId,
            mealId: orderData.mealId,
            mealName: orderData.mealName,
            rating: reviewInput.rating,
            comment: reviewInput.comment,
            createdAt: serverTimestamp()
        };

        // Run transaction to update cook rating and add review
        await runTransaction(firestore, async (transaction) => {
            // Create new review
            const newReviewRef = doc(collection(firestore, 'reviews'));
            transaction.set(newReviewRef, reviewData);

            // Update cook average rating
            const cookProfileRef = doc(firestore, 'cook_profiles', orderData.cookId);
            const cookProfileSnap = await transaction.get(cookProfileRef);

            if (cookProfileSnap.exists()) {
                const cookData = cookProfileSnap.data();
                const currentRating = cookData.averageRating || 0;
                const totalReviews = cookData.totalReviews || 0;

                // Calculate new average rating
                const newTotalReviews = totalReviews + 1;
                const newAverageRating = 
                    ((currentRating * totalReviews) + reviewInput.rating) / newTotalReviews;

                transaction.update(cookProfileRef, {
                    averageRating: newAverageRating,
                    totalReviews: newTotalReviews
                });
            }
        });

        // Return the created review
        return {
            id: 'temp-id', // This would normally be set by Firestore
            ...reviewData,
            createdAt: new Date()
        } as Review;
    } catch (error) {
        console.error('Error creating review:', error);
        throw error;
    }
};

// Get reviews for a cook
export const getReviewsForCook = async (cookId: string, limitCount = 10): Promise<Review[]> => {
    try {
        const reviewsRef = collection(firestore, 'reviews');
        const q = query(
            reviewsRef,
            where('cookId', '==', cookId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push(convertReview(doc));
        });

        return reviews;
    } catch (error) {
        console.error('Error getting reviews for cook:', error);
        throw error;
    }
};

// Get reviews for a meal
export const getReviewsForMeal = async (mealId: string, limitCount = 10): Promise<Review[]> => {
    try {
        const reviewsRef = collection(firestore, 'reviews');
        const q = query(
            reviewsRef,
            where('mealId', '==', mealId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push(convertReview(doc));
        });

        return reviews;
    } catch (error) {
        console.error('Error getting reviews for meal:', error);
        throw error;
    }
};

// Get reviews by a customer
export const getReviewsByCustomer = async (customerId: string): Promise<Review[]> => {
    try {
        const reviewsRef = collection(firestore, 'reviews');
        const q = query(
            reviewsRef,
            where('customerId', '==', customerId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const reviews: Review[] = [];

        querySnapshot.forEach((doc) => {
            reviews.push(convertReview(doc));
        });

        return reviews;
    } catch (error) {
        console.error('Error getting reviews by customer:', error);
        throw error;
    }
};

// Create an object with all the exported functions for default export
const ReviewService = {
    createReview,
    getReviewsForCook,
    getReviewsForMeal,
    getReviewsByCustomer
};

export default ReviewService;
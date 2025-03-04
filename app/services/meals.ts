import {
    collection,
    doc,
    addDoc,
    updateDoc,
    deleteDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp,
    QueryDocumentSnapshot,
    Timestamp,
    GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../config/firebase';
import { User } from './auth';

// Define meal availability type
export type MealAvailability = {
    [day: string]: {
        available: boolean;
        startTime?: string;
        endTime?: string;
    };
};

// Define meal types
export interface Meal {
    id: string;
    cookId: string;
    name: string;
    description: string;
    price: number;
    imageUrl: string;
    ingredients: string[];
    allergens: string[];
    cuisineType: string;
    preparationTime: number; // in minutes
    available: boolean;
    availabilitySchedule: MealAvailability;
    location?: GeoPoint;
    createdAt: Date;
    updatedAt: Date;
}

// Input type for meal creation/update
export interface MealInput {
    name: string;
    description: string;
    price: number;
    imageUri?: string; // Local image URI for upload
    ingredients: string[];
    allergens: string[];
    cuisineType: string;
    preparationTime: number;
    available: boolean;
    availabilitySchedule: MealAvailability;
}

// Convert Firestore data to Meal object
const convertMeal = (doc: QueryDocumentSnapshot): Meal => {
    const data = doc.data();
    return {
        id: doc.id,
        cookId: data.cookId,
        name: data.name,
        description: data.description,
        price: data.price,
        imageUrl: data.imageUrl,
        ingredients: data.ingredients,
        allergens: data.allergens,
        cuisineType: data.cuisineType,
        preparationTime: data.preparationTime,
        available: data.available,
        availabilitySchedule: data.availabilitySchedule,
        location: data.location,
        createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
        updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date()
    };
};

// Create a new meal
export const createMeal = async (currentUser: User, mealInput: MealInput): Promise<Meal> => {
    try {
        if (!currentUser || currentUser.userType !== 'cook') {
            throw new Error('Only cooks can create meals');
        }

        let imageUrl = '';
        
        // Upload image if provided
        if (mealInput.imageUri) {
            const imageRef = ref(storage, `meals/${currentUser.uid}/${Date.now()}`);
            const response = await fetch(mealInput.imageUri);
            const blob = await response.blob();
            
            await uploadBytes(imageRef, blob);
            imageUrl = await getDownloadURL(imageRef);
        }

        const mealData = {
            cookId: currentUser.uid,
            name: mealInput.name,
            description: mealInput.description,
            price: mealInput.price,
            imageUrl: imageUrl,
            ingredients: mealInput.ingredients,
            allergens: mealInput.allergens,
            cuisineType: mealInput.cuisineType,
            preparationTime: mealInput.preparationTime,
            available: mealInput.available,
            availabilitySchedule: mealInput.availabilitySchedule,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };

        // Get cook's location from their profile
        const cookProfileRef = doc(firestore, 'cook_profiles', currentUser.uid);
        const cookProfileSnap = await getDoc(cookProfileRef);
        
        if (cookProfileSnap.exists() && cookProfileSnap.data().location) {
            mealData.location = cookProfileSnap.data().location;
        }

        const mealRef = await addDoc(collection(firestore, 'meals'), mealData);
        const mealSnap = await getDoc(mealRef);

        return {
            id: mealSnap.id,
            ...mealData,
            createdAt: new Date(),
            updatedAt: new Date()
        } as Meal;
    } catch (error) {
        console.error('Error creating meal:', error);
        throw error;
    }
};

// Update an existing meal
export const updateMeal = async (currentUser: User, mealId: string, mealInput: MealInput): Promise<Meal> => {
    try {
        const mealRef = doc(firestore, 'meals', mealId);
        const mealSnap = await getDoc(mealRef);

        if (!mealSnap.exists()) {
            throw new Error('Meal not found');
        }

        const mealData = mealSnap.data();
        if (mealData.cookId !== currentUser.uid) {
            throw new Error('You can only update your own meals');
        }

        let imageUrl = mealData.imageUrl;
        
        // Upload new image if provided
        if (mealInput.imageUri) {
            const imageRef = ref(storage, `meals/${currentUser.uid}/${Date.now()}`);
            const response = await fetch(mealInput.imageUri);
            const blob = await response.blob();
            
            await uploadBytes(imageRef, blob);
            imageUrl = await getDownloadURL(imageRef);
        }

        const updatedMealData = {
            name: mealInput.name,
            description: mealInput.description,
            price: mealInput.price,
            imageUrl: imageUrl,
            ingredients: mealInput.ingredients,
            allergens: mealInput.allergens,
            cuisineType: mealInput.cuisineType,
            preparationTime: mealInput.preparationTime,
            available: mealInput.available,
            availabilitySchedule: mealInput.availabilitySchedule,
            updatedAt: serverTimestamp()
        };

        await updateDoc(mealRef, updatedMealData);

        return {
            id: mealId,
            cookId: currentUser.uid,
            ...updatedMealData,
            createdAt: mealData.createdAt ? new Date(mealData.createdAt.seconds * 1000) : new Date(),
            updatedAt: new Date()
        } as Meal;
    } catch (error) {
        console.error('Error updating meal:', error);
        throw error;
    }
};

// Delete a meal
export const deleteMeal = async (currentUser: User, mealId: string): Promise<void> => {
    try {
        const mealRef = doc(firestore, 'meals', mealId);
        const mealSnap = await getDoc(mealRef);

        if (!mealSnap.exists()) {
            throw new Error('Meal not found');
        }

        if (mealSnap.data().cookId !== currentUser.uid) {
            throw new Error('You can only delete your own meals');
        }

        await deleteDoc(mealRef);
    } catch (error) {
        console.error('Error deleting meal:', error);
        throw error;
    }
};

// Get a single meal by ID
export const getMealById = async (mealId: string): Promise<Meal | null> => {
    try {
        const mealRef = doc(firestore, 'meals', mealId);
        const mealSnap = await getDoc(mealRef);

        if (!mealSnap.exists()) {
            return null;
        }

        return {
            id: mealSnap.id,
            ...mealSnap.data(),
            createdAt: mealSnap.data().createdAt ? new Date(mealSnap.data().createdAt.seconds * 1000) : new Date(),
            updatedAt: mealSnap.data().updatedAt ? new Date(mealSnap.data().updatedAt.seconds * 1000) : new Date()
        } as Meal;
    } catch (error) {
        console.error('Error getting meal:', error);
        throw error;
    }
};

// Get meals by cook ID
export const getMealsByCook = async (cookId: string): Promise<Meal[]> => {
    try {
        const mealsRef = collection(firestore, 'meals');
        const q = query(
            mealsRef,
            where('cookId', '==', cookId),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];

        querySnapshot.forEach((doc) => {
            meals.push(convertMeal(doc));
        });

        return meals;
    } catch (error) {
        console.error('Error getting meals by cook:', error);
        throw error;
    }
};

// Get available meals
export const getAvailableMeals = async (limitCount = 20): Promise<Meal[]> => {
    try {
        const mealsRef = collection(firestore, 'meals');
        const q = query(
            mealsRef,
            where('available', '==', true),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];

        querySnapshot.forEach((doc) => {
            meals.push(convertMeal(doc));
        });

        return meals;
    } catch (error) {
        console.error('Error getting available meals:', error);
        throw error;
    }
};

// Search meals by cuisine type
export const searchMealsByCuisine = async (cuisineType: string): Promise<Meal[]> => {
    try {
        const mealsRef = collection(firestore, 'meals');
        const q = query(
            mealsRef,
            where('cuisineType', '==', cuisineType),
            where('available', '==', true),
            orderBy('createdAt', 'desc')
        );

        const querySnapshot = await getDocs(q);
        const meals: Meal[] = [];

        querySnapshot.forEach((doc) => {
            meals.push(convertMeal(doc));
        });

        return meals;
    } catch (error) {
        console.error('Error searching meals by cuisine:', error);
        throw error;
    }
};

// Create an object with all the exported functions for default export
const MealService = {
    createMeal,
    updateMeal,
    deleteMeal,
    getMealById,
    getMealsByCook,
    getAvailableMeals,
    searchMealsByCuisine
};

export default MealService;
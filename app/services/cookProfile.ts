import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    collection,
    query,
    where,
    getDocs,
    serverTimestamp,
    GeoPoint
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '../config/firebase';
import { User } from './auth';
import { LocationCoordinates } from './location';

// Cuisine types
export const CUISINE_TYPES = [
    'American', 
    'Italian', 
    'Mexican', 
    'Chinese', 
    'Indian', 
    'Japanese', 
    'Thai',
    'Mediterranean',
    'Middle Eastern',
    'Korean',
    'Vietnamese',
    'French',
    'Spanish',
    'Greek',
    'Caribbean',
    'African',
    'Vegetarian',
    'Vegan',
    'Desserts',
    'Breakfast',
    'Other'
];

// Cook profile interface
export interface CookProfile {
    uid: string;
    bio: string;
    cuisineTypes: string[];
    deliveryAvailable: boolean;
    deliveryRadius?: number; // in kilometers
    deliveryFee?: number;
    minimumOrderAmount?: number;
    averageRating?: number;
    totalReviews?: number;
    availableDays?: string[]; // ["Monday", "Tuesday", etc.]
    location?: GeoPoint;
    createdAt: Date;
    updatedAt: Date;
}

// Cook profile input for creation/update
export interface CookProfileInput {
    bio: string;
    cuisineTypes: string[];
    deliveryAvailable: boolean;
    deliveryRadius?: number;
    deliveryFee?: number;
    minimumOrderAmount?: number;
    availableDays?: string[];
    coordinates?: LocationCoordinates;
}

// Get cook profile
export const getCookProfile = async (cookId: string): Promise<CookProfile | null> => {
    try {
        const profileRef = doc(firestore, 'cook_profiles', cookId);
        const profileSnap = await getDoc(profileRef);

        if (!profileSnap.exists()) {
            return null;
        }

        const data = profileSnap.data();
        return {
            uid: profileSnap.id,
            bio: data.bio,
            cuisineTypes: data.cuisineTypes,
            deliveryAvailable: data.deliveryAvailable,
            deliveryRadius: data.deliveryRadius,
            deliveryFee: data.deliveryFee,
            minimumOrderAmount: data.minimumOrderAmount,
            averageRating: data.averageRating,
            totalReviews: data.totalReviews,
            availableDays: data.availableDays,
            location: data.location,
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
            updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date()
        } as CookProfile;
    } catch (error) {
        console.error('Error getting cook profile:', error);
        throw error;
    }
};

// Create or update cook profile
export const updateCookProfile = async (
    currentUser: User,
    profileInput: CookProfileInput
): Promise<CookProfile> => {
    try {
        if (!currentUser || currentUser.userType !== 'cook') {
            throw new Error('Only cooks can update cook profiles');
        }

        const profileRef = doc(firestore, 'cook_profiles', currentUser.uid);
        const profileSnap = await getDoc(profileRef);
        const now = new Date();

        let profileData: any = {
            uid: currentUser.uid,
            bio: profileInput.bio,
            cuisineTypes: profileInput.cuisineTypes,
            deliveryAvailable: profileInput.deliveryAvailable,
            deliveryRadius: profileInput.deliveryRadius,
            deliveryFee: profileInput.deliveryFee,
            minimumOrderAmount: profileInput.minimumOrderAmount,
            availableDays: profileInput.availableDays,
            updatedAt: serverTimestamp()
        };

        // Add location if provided
        if (profileInput.coordinates) {
            profileData.location = new GeoPoint(
                profileInput.coordinates.latitude,
                profileInput.coordinates.longitude
            );
        }

        if (!profileSnap.exists()) {
            // Create new profile
            profileData.createdAt = serverTimestamp();
            profileData.averageRating = 0;
            profileData.totalReviews = 0;
            
            await setDoc(profileRef, profileData);
        } else {
            // Update existing profile
            await updateDoc(profileRef, profileData);
            
            // Preserve existing data that wasn't updated
            const existingData = profileSnap.data();
            profileData.averageRating = existingData.averageRating || 0;
            profileData.totalReviews = existingData.totalReviews || 0;
            profileData.createdAt = existingData.createdAt || now;
        }

        return {
            ...profileData,
            createdAt: profileData.createdAt instanceof Date ? profileData.createdAt : now,
            updatedAt: now
        } as CookProfile;
    } catch (error) {
        console.error('Error updating cook profile:', error);
        throw error;
    }
};

// Get cooks by cuisine type
export const getCooksByCuisine = async (cuisineType: string): Promise<User[]> => {
    try {
        const profilesRef = collection(firestore, 'cook_profiles');
        const q = query(
            profilesRef,
            where('cuisineTypes', 'array-contains', cuisineType)
        );

        const querySnapshot = await getDocs(q);
        const cookIds = querySnapshot.docs.map(doc => doc.id);
        
        if (cookIds.length === 0) {
            return [];
        }

        // Get user details for these cooks
        const users: User[] = [];
        const usersRef = collection(firestore, 'users');
        
        for (const cookId of cookIds) {
            const userDoc = await getDoc(doc(usersRef, cookId));
            if (userDoc.exists()) {
                const userData = userDoc.data();
                users.push({
                    uid: userDoc.id,
                    email: userData.email,
                    displayName: userData.displayName,
                    userType: userData.userType,
                    photoURL: userData.photoURL
                });
            }
        }

        return users;
    } catch (error) {
        console.error('Error getting cooks by cuisine:', error);
        throw error;
    }
};

// Get top-rated cooks
export const getTopRatedCooks = async (limit = 10): Promise<CookProfile[]> => {
    try {
        const profilesRef = collection(firestore, 'cook_profiles');
        const q = query(
            profilesRef,
            where('totalReviews', '>', 0),
            where('averageRating', '>=', 4.0)
        );

        const querySnapshot = await getDocs(q);
        const profiles: CookProfile[] = [];

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            profiles.push({
                uid: doc.id,
                bio: data.bio,
                cuisineTypes: data.cuisineTypes,
                deliveryAvailable: data.deliveryAvailable,
                deliveryRadius: data.deliveryRadius,
                deliveryFee: data.deliveryFee,
                minimumOrderAmount: data.minimumOrderAmount,
                averageRating: data.averageRating,
                totalReviews: data.totalReviews,
                availableDays: data.availableDays,
                location: data.location,
                createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : new Date(),
                updatedAt: data.updatedAt ? new Date(data.updatedAt.seconds * 1000) : new Date()
            } as CookProfile);
        });

        // Sort by rating and limit
        return profiles
            .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
            .slice(0, limit);
    } catch (error) {
        console.error('Error getting top-rated cooks:', error);
        throw error;
    }
};

// Create an object with all the exported functions for default export
const CookProfileService = {
    getCookProfile,
    updateCookProfile,
    getCooksByCuisine,
    getTopRatedCooks,
    CUISINE_TYPES
};

export default CookProfileService;
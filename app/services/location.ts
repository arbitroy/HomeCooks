import * as Location from 'expo-location';
import { GeoPoint, doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from './auth';

export type LocationCoordinates = {
    latitude: number;
    longitude: number;
    accuracy?: number;
};

export type LocationAddress = {
    street?: string;
    city?: string;
    region?: string;
    postalCode?: string;
    country?: string;
    formattedAddress?: string;
};

// Request location permissions
export const requestLocationPermissions = async (): Promise<boolean> => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        return status === 'granted';
    } catch (error) {
        console.error('Error requesting location permissions:', error);
        return false;
    }
};

// Get current location
export const getCurrentLocation = async (): Promise<LocationCoordinates | null> => {
    try {
        const hasPermission = await requestLocationPermissions();
        
        if (!hasPermission) {
            throw new Error('Location permission not granted');
        }
        
        const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced
        });
        
        return {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy
        };
    } catch (error) {
        console.error('Error getting current location:', error);
        return null;
    }
};

// Reverse geocode coordinates to get address
export const getAddressFromCoordinates = async (
    coordinates: LocationCoordinates
): Promise<LocationAddress | null> => {
    try {
        const result = await Location.reverseGeocodeAsync({
            latitude: coordinates.latitude,
            longitude: coordinates.longitude
        });
        
        if (result.length > 0) {
            const address = result[0];
            return {
                street: address.street,
                city: address.city,
                region: address.region,
                postalCode: address.postalCode,
                country: address.country,
                formattedAddress: [
                    address.street,
                    address.city,
                    address.region,
                    address.postalCode,
                    address.country
                ].filter(Boolean).join(', ')
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error reverse geocoding:', error);
        return null;
    }
};

// Geocode address to get coordinates
export const getCoordinatesFromAddress = async (address: string): Promise<LocationCoordinates | null> => {
    try {
        const result = await Location.geocodeAsync(address);
        
        if (result.length > 0) {
            return {
                latitude: result[0].latitude,
                longitude: result[0].longitude
            };
        }
        
        return null;
    } catch (error) {
        console.error('Error geocoding address:', error);
        return null;
    }
};

// Update user location in Firestore
export const updateUserLocation = async (
    user: User,
    coordinates: LocationCoordinates
): Promise<void> => {
    try {
        const userRef = doc(firestore, 'users', user.uid);
        const geoPoint = new GeoPoint(coordinates.latitude, coordinates.longitude);
        
        await updateDoc(userRef, {
            location: geoPoint,
            locationUpdatedAt: new Date()
        });
        
        // If user is a cook, also update cook_profile
        if (user.userType === 'cook') {
            const cookProfileRef = doc(firestore, 'cook_profiles', user.uid);
            await updateDoc(cookProfileRef, {
                location: geoPoint,
                locationUpdatedAt: new Date()
            });
        }
    } catch (error) {
        console.error('Error updating user location:', error);
        throw error;
    }
};

// Calculate distance between two coordinates in kilometers
export const calculateDistance = (
    coords1: LocationCoordinates,
    coords2: LocationCoordinates
): number => {
    const R = 6371; // Earth's radius in km
    const dLat = (coords2.latitude - coords1.latitude) * Math.PI / 180;
    const dLon = (coords2.longitude - coords1.longitude) * Math.PI / 180;
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(coords1.latitude * Math.PI / 180) * Math.cos(coords2.latitude * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
};

// Find nearby cooks within a given radius (km)
export const findNearbyCooks = async (
    coordinates: LocationCoordinates,
    radiusInKm: number = 10
): Promise<User[]> => {
    try {
        // This is a simple implementation without GeoFirestore
        // For a production app, you'd want to use GeoFirestore for efficient geo queries
        const usersRef = collection(firestore, 'users');
        const q = query(usersRef, where('userType', '==', 'cook'));
        const querySnapshot = await getDocs(q);
        
        const nearbyCooks: User[] = [];
        
        querySnapshot.forEach((doc) => {
            const userData = doc.data();
            if (userData.location) {
                const cookCoords = {
                    latitude: userData.location.latitude,
                    longitude: userData.location.longitude
                };
                
                const distance = calculateDistance(coordinates, cookCoords);
                
                if (distance <= radiusInKm) {
                    nearbyCooks.push({
                        uid: doc.id,
                        email: userData.email,
                        displayName: userData.displayName,
                        userType: userData.userType,
                        photoURL: userData.photoURL,
                        distance: distance // Add calculated distance
                    });
                }
            }
        });
        
        // Sort by distance
        return nearbyCooks.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } catch (error) {
        console.error('Error finding nearby cooks:', error);
        throw error;
    }
};

// Create an object with all the exported functions for default export
const LocationService = {
    requestLocationPermissions,
    getCurrentLocation,
    getAddressFromCoordinates,
    getCoordinatesFromAddress,
    updateUserLocation,
    calculateDistance,
    findNearbyCooks
};

export default LocationService;
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut as firebaseSignOut,
    GoogleAuthProvider,
    signInWithPopup,
    onAuthStateChanged,
    User as FirebaseUser,
    updateProfile
} from "firebase/auth";
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    updateDoc,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { auth, firestore } from "../config/firebase";

export type UserType = 'cook' | 'customer';

const storage = getStorage();

export interface User {
    uid: string;
    email: string | null;
    displayName: string | null;
    userType: UserType;
    photoURL?: string | null;
    createdAt?: Date;
}

// Register a new user with email/password
export const registerWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    userType: UserType
): Promise<User> => {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        // Update display name
        await updateProfile(user, {
            displayName
        });

        // Create user document in Firestore
        const userDoc = {
            uid: user.uid,
            email: user.email,
            displayName,
            userType,
            photoURL: user.photoURL,
            createdAt: serverTimestamp()
        };

        await setDoc(doc(firestore, 'users', user.uid), userDoc);

        return {
            uid: user.uid,
            email: user.email,
            displayName,
            userType,
            photoURL: user.photoURL,
            createdAt: new Date()
        };
    } catch (error) {
        console.error('Error registering user:', error);
        throw error;
    }
};

// Sign in with email/password
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<User> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const { user } = userCredential;

        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(firestore, 'users', user.uid));

        if (!userDoc.exists()) {
            throw new Error('User data not found in database');
        }

        const userData = userDoc.data() as Omit<User, 'uid'>;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            userType: userData.userType,
            photoURL: user.photoURL,
            createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : undefined
        };
    } catch (error) {
        console.error('Error signing in:', error);
        throw error;
    }
};

// Sign in with Google
export const signInWithGoogle = async (): Promise<User> => {
    try {
        const provider = new GoogleAuthProvider();

        // This needs adaptation for React Native/Expo
        // In mobile environments, you'd use a different approach like expo-auth-session
        const result = await signInWithPopup(auth, provider);
        const { user } = result;

        // Check if user already exists in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (!userDoc.exists()) {
            // First time Google sign-in, ask for user type
            // For this example, we'll default to 'customer'
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                userType: 'customer' as UserType,
                photoURL: user.photoURL,
                createdAt: serverTimestamp()
            };

            await setDoc(userDocRef, userData);

            return {
                ...userData,
                createdAt: new Date()
            };
        }

        // Existing user
        const userData = userDoc.data() as Omit<User, 'uid'>;

        return {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            userType: userData.userType,
            photoURL: user.photoURL,
            createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : undefined
        };
    } catch (error) {
        console.error('Error signing in with Google:', error);
        throw error;
    }
};

// Sign out
export const signOut = async (): Promise<void> => {
    try {
        await firebaseSignOut(auth);
    } catch (error) {
        console.error('Error signing out:', error);
        throw error;
    }
};


export const updateUserProfile = async (
    currentUser: User,
    profileData: { displayName?: string; photoURI?: string | null }
): Promise<User> => {
    try {
        const { displayName, photoURI } = profileData;
        const firebaseUser = auth.currentUser;

        if (!firebaseUser) {
            throw new Error('No user is currently signed in');
        }

        // Object to hold update data for Firebase Auth
        const authUpdateData: { displayName?: string; photoURL?: string } = {};
        
        // Object to hold update data for Firestore
        const firestoreUpdateData: { displayName?: string; photoURL?: string } = {};

        // Process display name if provided
        if (displayName) {
            authUpdateData.displayName = displayName;
            firestoreUpdateData.displayName = displayName;
        }

        // Process photo if provided
        let photoURL = currentUser.photoURL;
        if (photoURI) {
            try {
                // Upload the image to Firebase Storage
                const imageRef = ref(storage, `profile_images/${currentUser.uid}`);
                const response = await fetch(photoURI);
                const blob = await response.blob();
                
                // Upload image
                await uploadBytes(imageRef, blob);
                
                // Get download URL
                photoURL = await getDownloadURL(imageRef);
                
                // Add to update objects
                authUpdateData.photoURL = photoURL;
                firestoreUpdateData.photoURL = photoURL;
                
                console.log("Photo upload successful");
            } catch (storageError) {
                console.error("Error uploading photo:", storageError);
                // Continue with other updates even if photo upload fails
            }
        }

        // Update Firebase Auth profile
        if (Object.keys(authUpdateData).length > 0) {
            await updateProfile(firebaseUser, authUpdateData);
        }

        // Update Firestore document
        if (Object.keys(firestoreUpdateData).length > 0) {
            const userRef = doc(firestore, 'users', currentUser.uid);
            await updateDoc(userRef, firestoreUpdateData);
        }

        // Return updated user object
        return {
            ...currentUser,
            displayName: displayName || currentUser.displayName,
            photoURL: photoURL || currentUser.photoURL
        };
    } catch (error) {
        console.error('Error updating user profile:', error);
        throw error;
    }
};

// Get current user data
export const getCurrentUser = async (): Promise<User | null> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
        return null;
    }

    try {
        const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));

        if (!userDoc.exists()) {
            return null;
        }

        const userData = userDoc.data() as Omit<User, 'uid'>;

        return {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            userType: userData.userType,
            photoURL: currentUser.photoURL,
            createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : undefined
        };
    } catch (error) {
        console.error('Error getting current user:', error);
        throw error;
    }
};

// Auth state observer
export const onAuthStateChange = (
    callback: (user: User | null) => void
): (() => void) => {
    return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        if (!firebaseUser) {
            callback(null);
            return;
        }

        try {
            const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));

            if (!userDoc.exists()) {
                callback(null);
                return;
            }

            const userData = userDoc.data() as Omit<User, 'uid'>;

            callback({
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                displayName: firebaseUser.displayName,
                userType: userData.userType,
                photoURL: firebaseUser.photoURL,
                createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : undefined
            });
        } catch (error) {
            console.error('Error in auth state change:', error);
            callback(null);
        }
    });
};

// Create an object with all the exported functions for default export
const AuthService = {
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getCurrentUser,
    onAuthStateChange,
    updateUserProfile
};

// Default export for Expo Router compatibility
export default AuthService;
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
    serverTimestamp
} from "firebase/firestore";
import { auth, firestore } from "../config/firebase";

export type UserType = 'cook' | 'customer';

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
    onAuthStateChange
};

// Default export for Expo Router compatibility
export default AuthService;
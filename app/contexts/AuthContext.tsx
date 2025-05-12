import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
    User,
    UserType,
    registerWithEmail,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    getCurrentUser,
    onAuthStateChange,
    updateUserProfile as updateUserProfileService
} from '../services/auth';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    error: string | null;
    register: (email: string, password: string, displayName: string, userType: UserType) => Promise<void>;
    login: (email: string, password: string) => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
    clearError: () => void;
    updateUserProfile: (profileData: { displayName?: string; photoURI?: string | null }) => Promise<void>; // Add this
}

// Create the context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    error: null,
    register: async () => { },
    login: async () => { },
    loginWithGoogle: async () => { },
    logout: async () => { },
    clearError: () => { },
    updateUserProfile: async () => { },
});


// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [initializing, setInitializing] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Initialize authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChange((user) => {
            setUser(user);
            if (initializing) setInitializing(false);
            setLoading(false);
        });

        // Cleanup subscription
        return unsubscribe;
    }, [initializing]);

    // Register with email
    const register = async (
        email: string,
        password: string,
        displayName: string,
        userType: UserType
    ): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            await registerWithEmail(email, password, displayName, userType);

            // The auth state change listener will update the user state
        } catch (error) {
            let errorMessage = 'Failed to register';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign in with email
    const login = async (
        email: string,
        password: string
    ): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            await signInWithEmail(email, password);

            // The auth state change listener will update the user state
        } catch (error) {
            let errorMessage = 'Failed to sign in';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign in with Google
    const loginWithGoogle = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            await signInWithGoogle();

            // The auth state change listener will update the user state
        } catch (error) {
            let errorMessage = 'Failed to sign in with Google';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Sign out
    const logout = async (): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            await signOut();

            // The auth state change listener will update the user state
        } catch (error) {
            let errorMessage = 'Failed to sign out';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Update user profile - NEW FUNCTION
    const updateUserProfile = async (profileData: { displayName?: string; photoURI?: string | null }): Promise<void> => {
        try {
            setLoading(true);
            setError(null);

            if (!user) {
                throw new Error('No user is logged in');
            }

            const updatedUser = await updateUserProfileService(user, profileData);
            setUser(updatedUser);
        } catch (error) {
            let errorMessage = 'Failed to update profile';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            setError(errorMessage);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    // Clear error
    const clearError = (): void => {
        setError(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                error,
                register,
                login,
                loginWithGoogle,
                logout,
                clearError,
                updateUserProfile, // Add the new function
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook to use the auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Default export for Expo Router compatibility
export default AuthProvider;
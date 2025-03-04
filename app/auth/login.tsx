import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema for login form
const LoginSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
});

export default function LoginScreen() {
    const { login, loginWithGoogle, error, clearError } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleLogin = async (values: { email: string; password: string }) => {
        try {
            setIsSubmitting(true);
            await login(values.email, values.password);
            // Navigation will be handled by the root layout based on auth state
        } catch (error) {
            let message = 'Failed to sign in';
            if (error instanceof Error) {
                message = error.message;
            }
            Alert.alert('Login Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            setIsSubmitting(true);
            await loginWithGoogle();
            // Navigation will be handled by the root layout based on auth state
        } catch (error) {
            let message = 'Failed to sign in with Google';
            if (error instanceof Error) {
                message = error.message;
            }
            Alert.alert('Google Login Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Log In', headerShown: true }} />

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerContainer}>
                    <ThemedText type="title" style={styles.title}>Welcome to HomeCooks</ThemedText>
                    <ThemedText style={styles.subtitle}>Sign in to continue</ThemedText>
                </View>

                <Formik
                    initialValues={{ email: '', password: '' }}
                    validationSchema={LoginSchema}
                    onSubmit={handleLogin}
                >
                    {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Email</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#999"
                                    value={values.email}
                                    onChangeText={handleChange('email')}
                                    onBlur={handleBlur('email')}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                                {touched.email && errors.email && (
                                    <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
                                )}
                            </View>

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Password</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your password"
                                    placeholderTextColor="#999"
                                    value={values.password}
                                    onChangeText={handleChange('password')}
                                    onBlur={handleBlur('password')}
                                    secureTextEntry
                                />
                                {touched.password && errors.password && (
                                    <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
                                )}
                            </View>

                            <TouchableOpacity
                                style={styles.forgotPasswordContainer}
                                onPress={() => router.push('/auth/forgotpassword')}
                            >
                                <ThemedText style={styles.forgotPasswordText}>Forgot Password?</ThemedText>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={styles.loginButton}
                                onPress={() => handleSubmit()}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.buttonText}>Log In</ThemedText>
                                )}
                            </TouchableOpacity>

                            <View style={styles.divider}>
                                <View style={styles.dividerLine} />
                                <ThemedText style={styles.dividerText}>OR</ThemedText>
                                <View style={styles.dividerLine} />
                            </View>

                            <TouchableOpacity
                                style={styles.googleButton}
                                onPress={handleGoogleLogin}
                                disabled={isSubmitting}
                            >
                                <ThemedText style={styles.googleButtonText}>Continue with Google</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>

                <View style={styles.signupContainer}>
                    <ThemedText>Don't have an account? </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/auth/register')}>
                        <ThemedText style={styles.signupText}>Sign Up</ThemedText>
                    </TouchableOpacity>
                </View>
            </KeyboardAwareScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        height: 50,
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        color: '#000',
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 24,
    },
    forgotPasswordText: {
        color: COLORS.primary,
    },
    loginButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 16,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#cccccc',
    },
    dividerText: {
        marginHorizontal: 8,
        color: '#666666',
    },
    googleButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cccccc',
        backgroundColor: '#fff',
    },
    googleButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    signupText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
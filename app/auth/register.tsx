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
import { UserType } from '@/app/services/auth';

// Validation schema for registration form
const RegisterSchema = Yup.object().shape({
    displayName: Yup.string()
        .min(2, 'Name must be at least 2 characters')
        .required('Name is required'),
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
    password: Yup.string()
        .min(6, 'Password must be at least 6 characters')
        .required('Password is required'),
    confirmPassword: Yup.string()
        .oneOf([Yup.ref('password')], 'Passwords must match')
        .required('Confirm password is required'),
    userType: Yup.string()
        .oneOf(['cook', 'customer'], 'Invalid user type')
        .required('User type is required'),
});

export default function RegisterScreen() {
    const { register, error, clearError } = useAuth();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleRegister = async (values: {
        displayName: string;
        email: string;
        password: string;
        confirmPassword: string;
        userType: UserType;
    }) => {
        try {
            setIsSubmitting(true);
            await register(values.email, values.password, values.displayName, values.userType);
            // Navigation will be handled by the root layout based on auth state
        } catch (error) {
            let message = 'Failed to register';
            if (error instanceof Error) {
                message = error.message;
            }
            Alert.alert('Registration Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Create Account', headerShown: true }} />

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.headerContainer}>
                    <ThemedText type="title" style={styles.title}>Join HomeCooks</ThemedText>
                    <ThemedText style={styles.subtitle}>Create a new account</ThemedText>
                </View>

                <Formik
                    initialValues={{
                        displayName: '',
                        email: '',
                        password: '',
                        confirmPassword: '',
                        userType: 'customer' as UserType,
                    }}
                    validationSchema={RegisterSchema}
                    onSubmit={handleRegister}
                >
                    {({ handleChange, handleBlur, handleSubmit, setFieldValue, values, errors, touched }) => (
                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Full Name</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999"
                                    value={values.displayName}
                                    onChangeText={handleChange('displayName')}
                                    onBlur={handleBlur('displayName')}
                                />
                                {touched.displayName && errors.displayName && (
                                    <ThemedText style={styles.errorText}>{errors.displayName}</ThemedText>
                                )}
                            </View>

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
                                    placeholder="Create a password"
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

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Confirm Password</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Confirm your password"
                                    placeholderTextColor="#999"
                                    value={values.confirmPassword}
                                    onChangeText={handleChange('confirmPassword')}
                                    onBlur={handleBlur('confirmPassword')}
                                    secureTextEntry
                                />
                                {touched.confirmPassword && errors.confirmPassword && (
                                    <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
                                )}
                            </View>

                            <ThemedText style={styles.label}>I want to join as:</ThemedText>
                            <View style={styles.userTypeContainer}>
                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        values.userType === 'customer' && styles.selectedUserType
                                    ]}
                                    onPress={() => setFieldValue('userType', 'customer')}
                                >
                                    <ThemedText
                                        style={[
                                            styles.userTypeText,
                                            values.userType === 'customer' && styles.selectedUserTypeText
                                        ]}
                                    >
                                        Customer
                                    </ThemedText>
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={[
                                        styles.userTypeButton,
                                        values.userType === 'cook' && styles.selectedUserType
                                    ]}
                                    onPress={() => setFieldValue('userType', 'cook')}
                                >
                                    <ThemedText
                                        style={[
                                            styles.userTypeText,
                                            values.userType === 'cook' && styles.selectedUserTypeText
                                        ]}
                                    >
                                        Home Cook
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>
                            {touched.userType && errors.userType && (
                                <ThemedText style={styles.errorText}>{errors.userType}</ThemedText>
                            )}

                            <TouchableOpacity
                                style={styles.registerButton}
                                onPress={() => handleSubmit()}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.buttonText}>Create Account</ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>

                <View style={styles.loginContainer}>
                    <ThemedText>Already have an account? </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/auth/login')}>
                        <ThemedText style={styles.loginText}>Log In</ThemedText>
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
    userTypeContainer: {
        flexDirection: 'row',
        marginBottom: 24,
        marginTop: 8,
    },
    userTypeButton: {
        flex: 1,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#cccccc',
        borderRadius: 8,
        marginHorizontal: 4,
        backgroundColor: '#fff',
    },
    selectedUserType: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    userTypeText: {
        fontSize: 16,
        color: '#333',
    },
    selectedUserTypeText: {
        color: 'white',
        fontWeight: '500',
    },
    registerButton: {
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
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
    },
    loginText: {
        color: COLORS.primary,
        fontWeight: '600',
    },
});
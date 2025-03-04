// app/auth/forgotpassword.tsx
import { useState } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/app/config/firebase';
import { Formik } from 'formik';
import * as Yup from 'yup';

// Validation schema for forgot password form
const ForgotPasswordSchema = Yup.object().shape({
    email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
});

export default function ForgotPasswordScreen() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [resetSent, setResetSent] = useState(false);

    const handleResetPassword = async (values: { email: string }) => {
        try {
            setIsSubmitting(true);
            await sendPasswordResetEmail(auth, values.email);
            setResetSent(true);
        } catch (error) {
            let message = 'Failed to send password reset email';
            if (error instanceof Error) {
                message = error.message;
            }
            Alert.alert('Error', message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Reset Password', headerShown: true }} />

            <View style={styles.content}>
                <View style={styles.headerContainer}>
                    <ThemedText type="title" style={styles.title}>Reset Your Password</ThemedText>
                    <ThemedText style={styles.subtitle}>
                        Enter your email address and we'll send you instructions to reset your password
                    </ThemedText>
                </View>

                {resetSent ? (
                    <View style={styles.successContainer}>
                        <ThemedText style={styles.successText}>
                            Password reset instructions have been sent to your email.
                            Please check your inbox and follow the instructions.
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.push('/auth/login')}
                        >
                            <ThemedText style={styles.buttonText}>Back to Login</ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <Formik
                        initialValues={{ email: '' }}
                        validationSchema={ForgotPasswordSchema}
                        onSubmit={handleResetPassword}
                    >
                        {({ handleChange, handleBlur, handleSubmit, values, errors, touched }) => (
                            <View style={styles.formContainer}>
                                <View style={styles.inputContainer}>
                                    <ThemedText style={styles.label}>Email</ThemedText>
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Enter your email"
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

                                <TouchableOpacity
                                    style={styles.resetButton}
                                    onPress={() => handleSubmit()}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? (
                                        <ActivityIndicator color={Colors.light} />
                                    ) : (
                                        <ThemedText style={styles.buttonText}>Send Reset Instructions</ThemedText>
                                    )}
                                </TouchableOpacity>

                                <TouchableOpacity
                                    style={styles.cancelButton}
                                    onPress={() => router.push('/auth/login')}
                                >
                                    <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
                                </TouchableOpacity>
                            </View>
                        )}
                    </Formik>
                )}
            </View>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 24,
    },
    headerContainer: {
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        opacity: 0.7,
        textAlign: 'center',
    },
    formContainer: {
        marginBottom: 24,
    },
    inputContainer: {
        marginBottom: 24,
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
    },
    errorText: {
        color: 'red',
        fontSize: 12,
        marginTop: 4,
    },
    resetButton: {
        backgroundColor: '#05668d',
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
    cancelButton: {
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 16,
        color: '#05668d',
    },
    successContainer: {
        alignItems: 'center',
        padding: 16,
    },
    successText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        lineHeight: 24,
    },
    backButton: {
        backgroundColor: '#05668d',
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
});
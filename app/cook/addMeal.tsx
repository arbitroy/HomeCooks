import React, { useState } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform,
    KeyboardAvoidingView
} from 'react-native';
import { Router, Stack, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { MealInput, createMeal, MealAvailability } from '@/app/services/meals';
import { Ionicons } from '@expo/vector-icons';
import { CUISINE_TYPES } from '@/app/services/cookProfile';
import { User } from '../services/auth';

// Validation schema for meal creation
const MealSchema = Yup.object().shape({
    name: Yup.string()
        .required('Meal name is required')
        .min(2, 'Name must be at least 2 characters'),
    description: Yup.string()
        .required('Description is required')
        .min(10, 'Description must be at least 10 characters'),
    price: Yup.number()
        .required('Price is required')
        .min(0.01, 'Price must be greater than 0'),
    cuisineType: Yup.string()
        .required('Cuisine type is required'),
    preparationTime: Yup.number()
        .required('Preparation time is required')
        .min(1, 'Preparation time must be at least 1 minute'),
    ingredients: Yup.array()
        .of(Yup.string())
        .min(1, 'At least one ingredient is required'),
    allergens: Yup.array().of(Yup.string())
});

// Initial availability for all days
const initialAvailability: MealAvailability = {
    Monday: { available: true, startTime: '09:00', endTime: '20:00' },
    Tuesday: { available: true, startTime: '09:00', endTime: '20:00' },
    Wednesday: { available: true, startTime: '09:00', endTime: '20:00' },
    Thursday: { available: true, startTime: '09:00', endTime: '20:00' },
    Friday: { available: true, startTime: '09:00', endTime: '20:00' },
    Saturday: { available: true, startTime: '09:00', endTime: '20:00' },
    Sunday: { available: true, startTime: '09:00', endTime: '20:00' },
};

export default function AddMealScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState('');
    const [allergens, setAllergens] = useState<string[]>([]);
    const [currentAllergen, setCurrentAllergen] = useState('');
    const [availabilitySchedule, setAvailabilitySchedule] = useState<MealAvailability>(initialAvailability);
    const scrollViewRef = React.useRef<KeyboardAwareScrollView>(null);
    
    // Protect route - redirect non-cook users
    useEffect(() => {
        if (user && user.userType !== 'cook') {
            Alert.alert('Access Denied', 'Only cooks can add meals');
            router.replace('/(tabs)');
        }
    }, [user, router]);
    
    // If not a cook, show nothing (will be redirected)
    if (user && user.userType !== 'cook') {
        return null;
    }

    // Permission request for image picker
    const requestMediaLibraryPermission = async () => {
        if (Platform.OS !== 'web') {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Required',
                    'This app needs access to your photo library to let you choose a meal image.',
                    [{ text: 'OK' }]
                );
                return false;
            }
        }
        return true;
    };

    // Handle image picking
    const handlePickImage = async () => {
        const hasPermission = await requestMediaLibraryPermission();
        if (!hasPermission) return;

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images', 'videos'],
            allowsEditing: true,
            aspect: [4, 3],
            quality: 1,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            setImageUri(result.assets[0].uri);
        }
    };

    // Add ingredient
    const addIngredient = () => {
        if (currentIngredient.trim() === '') return;
        setIngredients([...ingredients, currentIngredient.trim()]);
        setCurrentIngredient('');
    };

    // Remove ingredient
    const removeIngredient = (index: number) => {
        const updatedIngredients = [...ingredients];
        updatedIngredients.splice(index, 1);
        setIngredients(updatedIngredients);
    };

    // Add allergen
    const addAllergen = () => {
        if (currentAllergen.trim() === '') return;
        setAllergens([...allergens, currentAllergen.trim()]);
        setCurrentAllergen('');
    };

    // Remove allergen
    const removeAllergen = (index: number) => {
        const updatedAllergens = [...allergens];
        updatedAllergens.splice(index, 1);
        setAllergens(updatedAllergens);
    };

    // Handle day availability toggle
    const toggleDayAvailability = (day: string) => {
        setAvailabilitySchedule({
            ...availabilitySchedule,
            [day]: {
                ...availabilitySchedule[day],
                available: !availabilitySchedule[day].available
            }
        });
    };

    // Handle time change
    const updateDayTime = (day: string, type: 'startTime' | 'endTime', time: string) => {
        setAvailabilitySchedule({
            ...availabilitySchedule,
            [day]: {
                ...availabilitySchedule[day],
                [type]: time
            }
        });
    };

    // Submit meal creation
    const handleSubmit = async (values: any, { setSubmitting, resetForm }: { setSubmitting: (isSubmitting: boolean) => void, resetForm: () => void }) => {
        try {
            if (!user) {
                Alert.alert('Error', 'You must be logged in to create a meal');
                return;
            }

            if (ingredients.length === 0) {
                Alert.alert('Error', 'Please add at least one ingredient');
                setSubmitting(false);
                return;
            }

            const mealInput: MealInput = {
                name: values.name,
                description: values.description,
                price: parseFloat(values.price),
                cuisineType: values.cuisineType,
                preparationTime: parseInt(values.preparationTime),
                ingredients: ingredients,
                allergens: allergens,
                available: true,
                availabilitySchedule: availabilitySchedule,
                imageUri: imageUri || undefined
            };

            await createMeal(user, mealInput);

            // Show success alert with multiple options
            Alert.alert(
                'Meal Created',
                `"${values.name}" has been added to your menu.`,
                [
                    {
                        text: 'Add Another Meal',
                        onPress: () => {
                            // Reset form for a new meal
                            resetForm();
                            setIngredients([]);
                            setAllergens([]);
                            setImageUri(null);
                            setAvailabilitySchedule(initialAvailability);

                            // Scroll to top (would need to add a ref to ScrollView)
                            if (scrollViewRef.current) {
                                scrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
                            }
                        }
                    },
                    {
                        text: 'View All Meals',
                        onPress: () => router.push('/cook/meals')
                    },
                    {
                        text: 'View This Meal',
                        style: 'default',
                        // Navigate to the meal detail screen
                        // Note: This would require the createMeal function to return the created meal ID
                        onPress: (mealId) => router.push(`/meal/${mealId}`)
                    }
                ]
            );
        } catch (error) {
            console.error('Error creating meal:', error);
            let errorMessage = 'Failed to create meal';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };


    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Add New Meal' }} />

            <KeyboardAwareScrollView
                ref={scrollViewRef}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Formik
                    initialValues={{
                        name: '',
                        description: '',
                        price: '',
                        cuisineType: '',
                        preparationTime: '',
                    }}
                    validationSchema={MealSchema}
                    onSubmit={handleSubmit}
                >
                    {({
                        handleChange,
                        handleBlur,
                        handleSubmit,
                        setFieldValue,
                        values,
                        errors,
                        touched,
                        isSubmitting
                    }) => (
                        <View>
                            {/* Meal Image */}
                            <View style={styles.imageContainer}>
                                {imageUri ? (
                                    <Image source={{ uri: imageUri }} style={styles.mealImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="image-outline" size={48} color="#999" />
                                        <ThemedText style={styles.placeholderText}>
                                            Add Meal Image
                                        </ThemedText>
                                    </View>
                                )}
                                <TouchableOpacity
                                    style={styles.imagePickerButton}
                                    onPress={handlePickImage}
                                >
                                    <ThemedText style={styles.imagePickerText}>
                                        {imageUri ? 'Change Image' : 'Select Image'}
                                    </ThemedText>
                                </TouchableOpacity>
                            </View>

                            {/* Meal Name */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Meal Name</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={values.name}
                                    onChangeText={handleChange('name')}
                                    onBlur={handleBlur('name')}
                                    placeholder="Enter meal name"
                                    placeholderTextColor="#999"
                                />
                                {touched.name && errors.name && (
                                    <ThemedText style={styles.errorText}>{errors.name}</ThemedText>
                                )}
                            </View>

                            {/* Meal Description */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Description</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    value={values.description}
                                    onChangeText={handleChange('description')}
                                    onBlur={handleBlur('description')}
                                    placeholder="Describe your meal"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                    textAlignVertical="top"
                                />
                                {touched.description && errors.description && (
                                    <ThemedText style={styles.errorText}>{errors.description}</ThemedText>
                                )}
                            </View>

                            {/* Price */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Price ($)</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={values.price}
                                    onChangeText={handleChange('price')}
                                    onBlur={handleBlur('price')}
                                    placeholder="Enter price"
                                    placeholderTextColor="#999"
                                    keyboardType="decimal-pad"
                                />
                                {touched.price && errors.price && (
                                    <ThemedText style={styles.errorText}>{errors.price}</ThemedText>
                                )}
                            </View>

                            {/* Cuisine Type */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Cuisine Type</ThemedText>
                                <View style={styles.pickerContainer}>
                                    <ScrollView
                                        horizontal
                                        showsHorizontalScrollIndicator={false}
                                        contentContainerStyle={styles.cuisineList}
                                    >
                                        {CUISINE_TYPES.map((cuisine) => (
                                            <TouchableOpacity
                                                key={cuisine}
                                                style={[
                                                    styles.cuisineItem,
                                                    values.cuisineType === cuisine && styles.selectedCuisine
                                                ]}
                                                onPress={() => setFieldValue('cuisineType', cuisine)}
                                            >
                                                <ThemedText
                                                    style={[
                                                        styles.cuisineText,
                                                        values.cuisineType === cuisine && styles.selectedCuisineText
                                                    ]}
                                                >
                                                    {cuisine}
                                                </ThemedText>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>
                                {touched.cuisineType && errors.cuisineType && (
                                    <ThemedText style={styles.errorText}>{errors.cuisineType}</ThemedText>
                                )}
                            </View>

                            {/* Preparation Time */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Preparation Time (minutes)</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={values.preparationTime}
                                    onChangeText={handleChange('preparationTime')}
                                    onBlur={handleBlur('preparationTime')}
                                    placeholder="Enter preparation time"
                                    placeholderTextColor="#999"
                                    keyboardType="number-pad"
                                />
                                {touched.preparationTime && errors.preparationTime && (
                                    <ThemedText style={styles.errorText}>{errors.preparationTime}</ThemedText>
                                )}
                            </View>

                            {/* Ingredients */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Ingredients</ThemedText>
                                <View style={styles.inlineInput}>
                                    <TextInput
                                        style={styles.itemInput}
                                        value={currentIngredient}
                                        onChangeText={setCurrentIngredient}
                                        placeholder="Add ingredient"
                                        placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={addIngredient}
                                    >
                                        <Ionicons name="add" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.tagContainer}>
                                    {ingredients.map((ingredient, index) => (
                                        <View key={index} style={styles.tag}>
                                            <ThemedText style={styles.tagText}>{ingredient}</ThemedText>
                                            <TouchableOpacity
                                                onPress={() => removeIngredient(index)}
                                                style={styles.removeTag}
                                            >
                                                <Ionicons name="close" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                                {touched.ingredients && errors.ingredients && (
                                    <ThemedText style={styles.errorText}>{errors.ingredients}</ThemedText>
                                )}
                            </View>

                            {/* Allergens */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Allergens (Optional)</ThemedText>
                                <View style={styles.inlineInput}>
                                    <TextInput
                                        style={styles.itemInput}
                                        value={currentAllergen}
                                        onChangeText={setCurrentAllergen}
                                        placeholder="Add allergen"
                                        placeholderTextColor="#999"
                                    />
                                    <TouchableOpacity
                                        style={styles.addButton}
                                        onPress={addAllergen}
                                    >
                                        <Ionicons name="add" size={24} color="#fff" />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.tagContainer}>
                                    {allergens.map((allergen, index) => (
                                        <View key={index} style={[styles.tag, styles.allergenTag]}>
                                            <ThemedText style={styles.tagText}>{allergen}</ThemedText>
                                            <TouchableOpacity
                                                onPress={() => removeAllergen(index)}
                                                style={styles.removeTag}
                                            >
                                                <Ionicons name="close" size={16} color="#fff" />
                                            </TouchableOpacity>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Availability Schedule */}
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.label}>Availability Schedule</ThemedText>
                                <View style={styles.scheduleContainer}>
                                    {Object.keys(availabilitySchedule).map((day) => (
                                        <View key={day} style={styles.dayContainer}>
                                            <TouchableOpacity
                                                style={styles.dayToggle}
                                                onPress={() => toggleDayAvailability(day)}
                                            >
                                                <View
                                                    style={[
                                                        styles.checkbox,
                                                        availabilitySchedule[day].available && styles.checkboxChecked
                                                    ]}
                                                >
                                                    {availabilitySchedule[day].available && (
                                                        <Ionicons name="checkmark" size={16} color="#fff" />
                                                    )}
                                                </View>
                                                <ThemedText style={styles.dayText}>{day}</ThemedText>
                                            </TouchableOpacity>

                                            {availabilitySchedule[day].available && (
                                                <View style={styles.timeContainer}>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        value={availabilitySchedule[day].startTime}
                                                        onChangeText={(time) => updateDayTime(day, 'startTime', time)}
                                                        placeholder="9:00"
                                                        placeholderTextColor="#999"
                                                    />
                                                    <ThemedText style={styles.toText}>to</ThemedText>
                                                    <TextInput
                                                        style={styles.timeInput}
                                                        value={availabilitySchedule[day].endTime}
                                                        onChangeText={(time) => updateDayTime(day, 'endTime', time)}
                                                        placeholder="20:00"
                                                        placeholderTextColor="#999"
                                                    />
                                                </View>
                                            )}
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Submit Button */}
                            <TouchableOpacity
                                style={styles.submitButton}
                                onPress={() => handleSubmit()}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <ThemedText style={styles.submitButtonText}>Create Meal</ThemedText>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </Formik>
            </KeyboardAwareScrollView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 50,
    },
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    mealImage: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        marginBottom: 8,
    },
    imagePlaceholder: {
        width: '100%',
        height: 200,
        borderRadius: 8,
        backgroundColor: '#f0f0f0',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    placeholderText: {
        marginTop: 8,
        color: '#999',
    },
    imagePickerButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        backgroundColor: COLORS.lightGray,
        borderRadius: 4,
    },
    imagePickerText: {
        color: COLORS.primary,
        fontWeight: '600',
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
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    textArea: {
        height: 100,
        paddingTop: 12,
        paddingBottom: 12,
    },
    errorText: {
        color: COLORS.error,
        fontSize: 12,
        marginTop: 4,
    },
    pickerContainer: {
        marginBottom: 8,
    },
    cuisineList: {
        paddingVertical: 8,
    },
    cuisineItem: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 8,
    },
    selectedCuisine: {
        backgroundColor: COLORS.primary,
    },
    cuisineText: {
        color: COLORS.primary,
    },
    selectedCuisineText: {
        color: '#fff',
    },
    inlineInput: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    itemInput: {
        flex: 1,
        height: 50,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 16,
        fontSize: 16,
        backgroundColor: '#fff',
        marginRight: 8,
    },
    addButton: {
        height: 50,
        width: 50,
        backgroundColor: COLORS.primary,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tagContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginTop: 8,
    },
    tag: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        paddingHorizontal: 12,
        paddingVertical: 6,
        marginRight: 8,
        marginBottom: 8,
    },
    allergenTag: {
        backgroundColor: COLORS.secondary,
    },
    tagText: {
        color: '#fff',
        marginRight: 4,
    },
    removeTag: {
        width: 16,
        height: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scheduleContainer: {
        marginTop: 8,
    },
    dayContainer: {
        marginBottom: 12,
    },
    dayToggle: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    checkbox: {
        width: 20,
        height: 20,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginRight: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkboxChecked: {
        backgroundColor: COLORS.primary,
    },
    dayText: {
        fontWeight: '500',
    },
    timeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 28,
    },
    timeInput: {
        height: 40,
        width: 80,
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        paddingHorizontal: 12,
        backgroundColor: '#fff',
        textAlign: 'center',
    },
    toText: {
        marginHorizontal: 10,
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

function useEffect(arg0: () => void, arg1: (User | Router | null)[]) {
    throw new Error('Function not implemented.');
}

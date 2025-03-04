import React, { useState, useEffect } from 'react';
import {
    StyleSheet,
    View,
    TextInput,
    TouchableOpacity,
    Image,
    ScrollView,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Meal, MealInput, updateMeal, getMealById } from '@/app/services/meals';
import { Ionicons } from '@expo/vector-icons';
import { CUISINE_TYPES } from '@/app/services/cookProfile';

// Validation schema for meal update
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
    allergens: Yup.array().of(Yup.string()),
});

export default function EditMealScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const params = useLocalSearchParams();
    const mealId = params.id as string;
    const toggleAvailability = params.toggleAvailability === 'true';

    const [meal, setMeal] = useState<Meal | null>(null);
    const [loading, setLoading] = useState(true);
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [ingredients, setIngredients] = useState<string[]>([]);
    const [currentIngredient, setCurrentIngredient] = useState('');
    const [allergens, setAllergens] = useState<string[]>([]);
    const [currentAllergen, setCurrentAllergen] = useState('');

    // Load meal data
    useEffect(() => {
        const loadMeal = async () => {
            try {
                setLoading(true);
                const mealData = await getMealById(mealId);

                if (mealData) {
                    setMeal(mealData);
                    setIngredients(mealData.ingredients);
                    setAllergens(mealData.allergens);

                    // If we're just toggling availability, do it right away
                    if (toggleAvailability) {
                        handleAvailabilityToggle(mealData);
                    }
                } else {
                    Alert.alert('Error', 'Meal not found');
                    router.back();
                }
            } catch (error) {
                console.error('Error loading meal:', error);
                Alert.alert('Error', 'Failed to load meal details');
                router.back();
            } finally {
                setLoading(false);
            }
        };

        if (mealId) {
            loadMeal();
        }
    }, [mealId, toggleAvailability]);

    // Handle availability toggle
    const handleAvailabilityToggle = async (mealData: Meal) => {
        try {
            if (!user) {
                Alert.alert('Error', 'You must be logged in');
                return;
            }

            const updatedMeal: MealInput = {
                name: mealData.name,
                description: mealData.description,
                price: mealData.price,
                cuisineType: mealData.cuisineType,
                preparationTime: mealData.preparationTime,
                ingredients: mealData.ingredients,
                allergens: mealData.allergens,
                available: !mealData.available,
                availabilitySchedule: mealData.availabilitySchedule
            };

            await updateMeal(user, mealId, updatedMeal);

            const statusText = !mealData.available ? 'available' : 'unavailable';
            Alert.alert('Success', `Meal is now ${statusText}`, [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error toggling availability:', error);
            Alert.alert('Error', 'Failed to update meal availability');
        }
    };

    // Image picker permission
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

    // Submit meal update
    const handleSubmit = async (values: any, { setSubmitting }: { setSubmitting: (isSubmitting: boolean) => void }) => {
        try {
            if (!user || !meal) {
                Alert.alert('Error', 'You must be logged in to update a meal');
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
                available: meal.available,
                availabilitySchedule: meal.availabilitySchedule,
                imageUri: imageUri || undefined
            };

            await updateMeal(user, mealId, mealInput);
            Alert.alert('Success', 'Meal updated successfully', [
                { text: 'OK', onPress: () => router.back() }
            ]);
        } catch (error) {
            console.error('Error updating meal:', error);
            let errorMessage = 'Failed to update meal';
            if (error instanceof Error) {
                errorMessage = error.message;
            }
            Alert.alert('Error', errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading meal data...</ThemedText>
            </ThemedView>
        );
    }

    if (!meal) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ThemedText>Meal not found</ThemedText>
            </ThemedView>
        );
    }

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Edit Meal' }} />

            <KeyboardAwareScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                <Formik
                    initialValues={{
                        name: meal.name,
                        description: meal.description,
                        price: meal.price.toString(),
                        cuisineType: meal.cuisineType,
                        preparationTime: meal.preparationTime.toString(),
                    }}
                    validationSchema={MealSchema}
                    onSubmit={handleSubmit}
                    enableReinitialize
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
                                ) : meal.imageUrl ? (
                                    <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
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
                                        Change Image
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

                            {/* Availability Indicator */}
                            <View style={[styles.availabilityIndicator, meal.available ? styles.availableIndicator : styles.unavailableIndicator]}>
                                <Ionicons
                                    name={meal.available ? "checkmark-circle" : "close-circle"}
                                    size={24}
                                    color="#fff"
                                />
                                <ThemedText style={styles.availabilityText}>
                                    This meal is currently {meal.available ? 'available' : 'unavailable'}
                                </ThemedText>
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
                                    <ThemedText style={styles.submitButtonText}>Update Meal</ThemedText>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
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
    availabilityIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        borderRadius: 8,
        marginVertical: 16,
    },
    availableIndicator: {
        backgroundColor: COLORS.success,
    },
    unavailableIndicator: {
        backgroundColor: COLORS.gray,
    },
    availabilityText: {
        color: '#fff',
        marginLeft: 8,
        fontWeight: '500',
    },
    submitButton: {
        backgroundColor: COLORS.primary,
        height: 50,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
// app/cook/dashboard.tsx
import React, { ReactNode } from 'react';
import {
    StyleSheet,
    View,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Alert,
    Dimensions
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { Meal, getMealsByCook } from '@/app/services/meals';
import { getCookProfile } from '@/app/services/cookProfile';
import { getActiveCookOrders, getCookOrders } from '@/app/services/orders';
import { User } from '@/app/services/auth';

const windowWidth = Dimensions.get('window').width;

// Interface for dashboard data
interface DashboardData {
    meals: Meal[];
    activeMeals: number;
    activeOrders: number;
    totalOrders: number;
    totalMeals: number;
    profileComplete: boolean;
}

// Export the data loading function
export async function loadDashboardData(user: User): Promise<DashboardData> {
    // Load profile data
    const profile = await getCookProfile(user.uid);
    const profileComplete = !!profile && !!profile.bio && profile.cuisineTypes.length > 0;
    
    // Load meals
    const cookMeals = await getMealsByCook(user.uid);
    const totalMeals = cookMeals.length;
    const activeMeals = cookMeals.filter(meal => meal.available).length;
    
    // Load orders
    const activeOrdersData = await getActiveCookOrders(user.uid);
    const allOrdersData = await getCookOrders(user.uid);
    
    const activeOrders = activeOrdersData.length;
    const totalOrders = allOrdersData.length;

    return {
        meals: cookMeals,
        activeMeals,
        activeOrders,
        totalOrders,
        totalMeals,
        profileComplete
    };
}

// Export the render function
export function renderCookDashboardContent(
    data: DashboardData | null, 
    user: User, 
    router: ReturnType<typeof useRouter>
): ReactNode {
    if (!data) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <ThemedText style={styles.loadingText}>Loading your dashboard...</ThemedText>
            </View>
        );
    }

    // Navigate to add meal
    const navigateToAddMeal = () => {
        router.push('/cook/addMeal');
    };

    // Navigate to profile setup
    const navigateToProfileSetup = () => {
        router.push('/cook/profile-setup');
    };

    // Get popular meals (top 3 based on mock data - in a real app this would be based on order count)
    const getPopularMeals = () => {
        // For demo purposes, just return the first 3 meals or fewer if there aren't 3
        return data.meals.slice(0, Math.min(3, data.meals.length));
    };

    return (
        <>
            {/* Profile Status */}
            {!data.profileComplete && (
                <View style={styles.alertCard}>
                    <View style={styles.alertIconContainer}>
                        <Ionicons name="alert-circle" size={24} color="#fff" />
                    </View>
                    <View style={styles.alertContent}>
                        <ThemedText type="defaultSemiBold" style={styles.alertTitle}>
                            Complete Your Profile
                        </ThemedText>
                        <ThemedText style={styles.alertText}>
                            Set up your cook profile to attract more customers.
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.alertButton}
                            onPress={navigateToProfileSetup}
                        >
                            <ThemedText style={styles.alertButtonText}>
                                Set Up Profile
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Stats Section */}
            <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    Your Stats
                </ThemedText>
                
                <View style={styles.statsContainer}>
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{data.totalMeals}</ThemedText>
                        <ThemedText style={styles.statLabel}>Total Meals</ThemedText>
                    </View>
                    
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{data.activeMeals}</ThemedText>
                        <ThemedText style={styles.statLabel}>Active Meals</ThemedText>
                    </View>
                    
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{data.activeOrders}</ThemedText>
                        <ThemedText style={styles.statLabel}>Active Orders</ThemedText>
                    </View>
                    
                    <View style={styles.statCard}>
                        <ThemedText style={styles.statValue}>{data.totalOrders}</ThemedText>
                        <ThemedText style={styles.statLabel}>Total Orders</ThemedText>
                    </View>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.section}>
                <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                    Quick Actions
                </ThemedText>
                
                <View style={styles.actionCardsContainer}>
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={navigateToAddMeal}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: COLORS.primary }]}>
                            <Ionicons name="restaurant-outline" size={24} color="#fff" />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                            Add New Meal
                        </ThemedText>
                        <ThemedText style={styles.actionDescription}>
                            Create a new dish for your menu
                        </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => router.push('/order/[id]')}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: COLORS.secondary }]}>
                            <Ionicons name="list-outline" size={24} color="#fff" />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                            Manage Orders
                        </ThemedText>
                        <ThemedText style={styles.actionDescription}>
                            View and update your orders
                        </ThemedText>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                        style={styles.actionCard}
                        onPress={() => router.push('/(tabs)/cook/meals')}
                    >
                        <View style={[styles.actionIconContainer, { backgroundColor: COLORS.tertiary }]}>
                            <Ionicons name="grid-outline" size={24} color="#fff" />
                        </View>
                        <ThemedText type="defaultSemiBold" style={styles.actionTitle}>
                            Manage Menu
                        </ThemedText>
                        <ThemedText style={styles.actionDescription}>
                            Edit or update your meals
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Popular Meals */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>
                        Your Meals
                    </ThemedText>
                    <TouchableOpacity onPress={() => router.push('/(tabs)/cook/meals')}>
                        <ThemedText style={styles.viewAllText}>View All</ThemedText>
                    </TouchableOpacity>
                </View>
                
                {data.meals.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="restaurant-outline" size={48} color={COLORS.gray} />
                        <ThemedText style={styles.emptyStateText}>
                            You haven't added any meals yet
                        </ThemedText>
                        <TouchableOpacity
                            style={styles.emptyStateButton}
                            onPress={navigateToAddMeal}
                        >
                            <ThemedText style={styles.emptyStateButtonText}>
                                Add Your First Meal
                            </ThemedText>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.popularMealsContainer}>
                        {getPopularMeals().map((meal, index) => (
                            <TouchableOpacity
                                key={meal.id}
                                style={styles.popularMealCard}
                                onPress={() => router.push(`/meal/${meal.id}`)}
                            >
                                <View style={styles.popularMealContent}>
                                    <ThemedText
                                        type="defaultSemiBold"
                                        style={styles.popularMealName}
                                        numberOfLines={1}
                                    >
                                        {meal.name}
                                    </ThemedText>
                                    <ThemedText style={styles.popularMealPrice}>
                                        ${meal.price.toFixed(2)}
                                    </ThemedText>
                                    <View style={styles.popularMealStatus}>
                                        <View style={[
                                            styles.statusDot,
                                            { backgroundColor: meal.available ? COLORS.success : COLORS.gray }
                                        ]} />
                                        <ThemedText style={styles.statusText}>
                                            {meal.available ? 'Available' : 'Unavailable'}
                                        </ThemedText>
                                    </View>
                                </View>
                                
                                <View style={styles.popularMealActions}>
                                    <TouchableOpacity
                                        style={styles.popularMealAction}
                                        onPress={() => router.push(`/cook/editMeal?id=${meal.id}`)}
                                    >
                                        <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                                    </TouchableOpacity>
                                    
                                    <TouchableOpacity
                                        style={styles.popularMealAction}
                                        onPress={() => router.push(`/cook/editMeal?id=${meal.id}&toggleAvailability=true`)}
                                    >
                                        <Ionicons 
                                            name={meal.available ? "eye-off-outline" : "eye-outline"} 
                                            size={18} 
                                            color={COLORS.primary} 
                                        />
                                    </TouchableOpacity>
                                </View>
                            </TouchableOpacity>
                        ))}
                        
                        <TouchableOpacity
                            style={styles.viewAllMealsButton}
                            onPress={() => router.push('/(tabs)/cook/meals')}
                        >
                            <ThemedText style={styles.viewAllMealsText}>
                                View All Meals
                            </ThemedText>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Add Meal Button */}
            <TouchableOpacity
                style={styles.addMealButton}
                onPress={navigateToAddMeal}
            >
                <Ionicons name="add-circle-outline" size={24} color="#fff" />
                <ThemedText style={styles.addMealButtonText}>
                    Add New Meal
                </ThemedText>
            </TouchableOpacity>
        </>
    );
}

// Keep the original screen component for direct navigation
export default function CookDashboardScreen() {
    const { user } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    // Load dashboard data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                
                if (!user) {
                    Alert.alert('Error', 'You must be logged in to view the dashboard');
                    router.replace('/auth/login');
                    return;
                }
                
                if (user.userType !== 'cook') {
                    Alert.alert('Error', 'Only cooks can access this dashboard');
                    router.replace('/(tabs)');
                    return;
                }
                
                const data = await loadDashboardData(user);
                setDashboardData(data);
            } catch (error) {
                console.error('Error loading dashboard data:', error);
                Alert.alert('Error', 'Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };
        
        loadData();
    }, [user]);

    return (
        <ThemedView style={styles.container}>
            <Stack.Screen options={{ title: 'Cook Dashboard' }} />
            
            <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
            >
                {loading ? (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={COLORS.primary} />
                        <ThemedText style={styles.loadingText}>Loading your dashboard...</ThemedText>
                    </View>
                ) : (
                    renderCookDashboardContent(dashboardData, user!, router)
                )}
            </ScrollView>
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
        marginTop: 16,
        fontSize: 16,
        color: '#666',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 16,
        paddingBottom: 32,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        marginBottom: 12,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    viewAllText: {
        color: COLORS.primary,
        fontWeight: '500',
    },
    alertCard: {
        flexDirection: 'row',
        backgroundColor: '#FFF8E1',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    alertIconContainer: {
        backgroundColor: '#FFB300',
        height: 40,
        width: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    alertContent: {
        flex: 1,
    },
    alertTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    alertText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    alertButton: {
        backgroundColor: '#FFB300',
        paddingVertical: 6,
        paddingHorizontal: 12,
        borderRadius: 4,
        alignSelf: 'flex-start',
    },
    alertButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    statsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -4,
    },
    statCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: (windowWidth - 32 - 8) / 2,
        marginHorizontal: 4,
        marginBottom: 8,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
    },
    actionCardsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -4,
    },
    actionCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: (windowWidth - 32 - 8) / 2,
        marginHorizontal: 4,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    actionIconContainer: {
        height: 48,
        width: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 12,
        color: '#666',
    },
    emptyState: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 24,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    emptyStateText: {
        fontSize: 16,
        color: '#666',
        marginVertical: 12,
        textAlign: 'center',
    },
    emptyStateButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    emptyStateButtonText: {
        color: '#fff',
        fontWeight: '500',
    },
    popularMealsContainer: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    popularMealCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
    },
    popularMealContent: {
        flex: 1,
    },
    popularMealName: {
        fontSize: 16,
        marginBottom: 4,
    },
    popularMealPrice: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: '500',
        marginBottom: 4,
    },
    popularMealStatus: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 6,
    },
    statusText: {
        fontSize: 12,
        color: '#666',
    },
    popularMealActions: {
        flexDirection: 'row',
    },
    popularMealAction: {
        padding: 8,
    },
    viewAllMealsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        marginTop: 8,
    },
    viewAllMealsText: {
        color: COLORS.primary,
        fontWeight: '500',
        marginRight: 4,
    },
    addMealButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 8,
        marginTop: 8,
    },
    addMealButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
    },
});
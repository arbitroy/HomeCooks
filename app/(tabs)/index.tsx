import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  StatusBar,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getTopRatedCooks, CookProfile } from '@/app/services/cookProfile';
import { getAvailableMeals, Meal } from '@/app/services/meals';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [topCooks, setTopCooks] = useState<CookProfile[]>([]);
  const [featuredMeals, setFeaturedMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch top cooks and featured meals
  useEffect(() => {
    const fetchHomeScreenData = async () => {
      try {
        const [cooks, meals] = await Promise.all([
          getTopRatedCooks(3),
          getAvailableMeals(4)
        ]);
        
        setTopCooks(cooks);
        setFeaturedMeals(meals);
      } catch (error) {
        console.error('Error fetching home screen data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeScreenData();
  }, []);

  const navigateToMeal = (mealId: string) => {
    router.push(`/meal/${mealId}`);
  };

  const navigateToBrowse = () => {
    router.push('/browse');
  };

  const navigateToNearbyCooks = () => {
    router.push('/cook/discovery');
  };

  const navigateToAddMeal = () => {
    router.push('/cook/addMeal');
  };

  const navigateToFavorites = () => {
    router.push('/favorites');
  };
  

  return (
    <ThemedView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Clean Modern Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <ThemedText style={styles.welcomeText}>
              Welcome,
            </ThemedText>
            <ThemedText style={styles.userName}>
              {user?.displayName || 'Foodie'}! 👋
            </ThemedText>
          </View>
          
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Top Rated Cooks Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Top Rated Cooks</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cookScrollContainer}
          >
            {topCooks.map((cook) => (
              <TouchableOpacity key={cook.uid} style={styles.cookCard}>
                <View style={styles.cookAvatar}>
                  <ThemedText style={styles.cookInitial}>
                    {cook.uid.charAt(0).toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText style={styles.cookName}>
                  Chef {cook.uid.substring(0, 8)}
                </ThemedText>
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FFD700" />
                  <ThemedText style={styles.ratingText}>
                    {cook.averageRating?.toFixed(1)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Meals Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Featured Meals</ThemedText>
            <TouchableOpacity>
              <ThemedText style={styles.seeAllText}>See All</ThemedText>
            </TouchableOpacity>
          </View>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.mealScrollContainer}
          >
            {featuredMeals.map((meal) => (
              <TouchableOpacity 
                key={meal.id} 
                style={styles.mealCard}
                onPress={() => navigateToMeal(meal.id)}
              >
                <Image 
                  source={{ uri: meal.imageUrl || '/api/placeholder/200/200' }}
                  style={styles.mealImage}
                  defaultSource={require('@/assets/images/placeholder-meal.png')}
                />
                <View style={styles.mealOverlay}>
                  <ThemedText style={styles.cuisineTag}>{meal.cuisineType}</ThemedText>
                </View>
                <View style={styles.mealCardContent}>
                  <ThemedText style={styles.mealName} numberOfLines={1}>
                    {meal.name}
                  </ThemedText>
                  <ThemedText style={styles.mealPrice}>
                    ${meal.price.toFixed(2)}
                  </ThemedText>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.sectionContainer}>
          <ThemedText type="subtitle" style={styles.quickActionsTitle}>Quick Actions</ThemedText>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionButton} onPress={navigateToBrowse}>
              <Ionicons name="search" size={24} color={COLORS.primary} />
              <ThemedText style={styles.quickActionText}>Browse Meals</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickActionButton} onPress={navigateToNearbyCooks}>
              <Ionicons name="restaurant" size={24} color={COLORS.primary} />
              <ThemedText style={styles.quickActionText}>Nearby Cooks</ThemedText>
            </TouchableOpacity>
            {user?.userType === 'cook' ? (
              <TouchableOpacity style={styles.quickActionButton} onPress={navigateToAddMeal}>
                <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                <ThemedText style={styles.quickActionText}>Add Meal</ThemedText>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.quickActionButton} onPress={navigateToFavorites}>
                <Ionicons name="heart" size={24} color={COLORS.primary} />
                <ThemedText style={styles.quickActionText}>Favorites</ThemedText>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 25,
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: 120, // Reduced since we removed the search bar
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  userName: {
    color: '#ffffff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  notificationButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingTop: 24,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cookScrollContainer: {
    paddingVertical: 8,
  },
  cookCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cookAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  cookInitial: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  cookName: {
    fontSize: 14,
    marginBottom: 4,
    textAlign: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#666',
  },
  mealScrollContainer: {
    paddingVertical: 8,
  },
  mealCard: {
    width: 180,
    marginRight: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  mealImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  mealOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  cuisineTag: {
    backgroundColor: COLORS.primary,
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  mealCardContent: {
    padding: 12,
  },
  mealName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  mealPrice: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  quickActionsTitle: {
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 16,
    marginHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#444',
    textAlign: 'center',
  },
});
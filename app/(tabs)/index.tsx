import React, { useState, useEffect } from 'react';
import { Image, StyleSheet, Platform, ScrollView, View, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { HelloWave } from '@/components/HelloWave';
import ParallaxScrollView from '@/components/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { COLORS } from '@/constants/Colors';
import { useAuth } from '@/app/contexts/AuthContext';
import { getTopRatedCooks, CookProfile } from '@/app/services/cookProfile';
import { getAvailableMeals, Meal } from '@/app/services/meals';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen() {
  const { user } = useAuth();
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

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: COLORS.primary, dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/header_pattern.png')}
          style={styles.fullReactLogo}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome, {user?.displayName || 'Foodie'}!</ThemedText>
        <HelloWave />
      </ThemedView>

      {/* Top Rated Cooks Section */}
      <ThemedView style={styles.sectionContainer}>
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
      </ThemedView>

      {/* Featured Meals Section */}
      <ThemedView style={styles.sectionContainer}>
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
            <TouchableOpacity key={meal.id} style={styles.mealCard}>
              <Image 
                source={{ uri: meal.imageUrl || '/api/placeholder/200/200' }}
                style={styles.mealImage}
                defaultSource={require('@/assets/images/placeholder-meal.png')}
              />
              <ThemedText style={styles.mealName} numberOfLines={2}>
                {meal.name}
              </ThemedText>
              <ThemedText style={styles.mealPrice}>
                ${meal.price.toFixed(2)}
              </ThemedText>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ThemedView>

      {/* Quick Actions */}
      <ThemedView style={styles.quickActionsContainer}>
        <ThemedText type="subtitle" style={styles.quickActionsTitle}>Quick Actions</ThemedText>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="search" size={24} color={COLORS.primary} />
            <ThemedText style={styles.quickActionText}>Browse Meals</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.quickActionButton}>
            <Ionicons name="restaurant" size={24} color={COLORS.primary} />
            <ThemedText style={styles.quickActionText}>Nearby Cooks</ThemedText>
          </TouchableOpacity>
          {user?.userType === 'cook' ? (
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="add-circle" size={24} color={COLORS.primary} />
              <ThemedText style={styles.quickActionText}>Add Meal</ThemedText>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.quickActionButton}>
              <Ionicons name="heart" size={24} color={COLORS.primary} />
              <ThemedText style={styles.quickActionText}>Favorites</ThemedText>
            </TouchableOpacity>
          )}
        </View>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  fullReactLogo: {
    width: screenWidth * 0.6, // Make the logo 60% of screen width
    height: screenWidth * 0.6, // Keep aspect ratio square
    position: 'absolute',
    bottom: 10,
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  seeAllText: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  cookScrollContainer: {
    paddingHorizontal: 16,
  },
  cookCard: {
    alignItems: 'center',
    marginRight: 16,
    width: 100,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
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
    fontSize: 12,
    marginBottom: 4,
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
    paddingHorizontal: 16,
  },
  mealCard: {
    width: 150,
    marginRight: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  mealName: {
    padding: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  mealPrice: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    color: COLORS.primary,
    fontWeight: '600',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
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
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 12,
    color: COLORS.primary,
  },
});
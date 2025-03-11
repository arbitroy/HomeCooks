// components/ui/IconSymbol.tsx
// This file is a fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { Ionicons } from '@expo/vector-icons';
import { SymbolWeight } from 'expo-symbols';
import React from 'react';
import { OpaqueColorValue, StyleProp, ViewStyle } from 'react-native';

// Add your SFSymbol to MaterialIcons mappings here.
const MAPPING = {
  // Basic mappings - use strings that exist in both Icon libraries
  'house.fill': 'home',
  'search.fill': 'search',
  'person.fill': 'person',
  // Restaurant and receipt icons with fallbacks
  'restaurant.fill': 'restaurant',
  'receipt.fill': 'receipt-long',  // Using a more reliable MaterialIcons name
  // Additional useful icons
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'cart.fill': 'shopping-cart',
  'plus.circle.fill': 'add-circle',
  'list.bullet': 'list',
  'star.fill': 'star',
  'heart.fill': 'favorite',
  'location.fill': 'location-on',
  'bell.fill': 'notifications'
} as Partial<
  Record<
    import('expo-symbols').SymbolViewProps['name'],
    React.ComponentProps<typeof MaterialIcons>['name']
  >
>;

export type IconSymbolName = keyof typeof MAPPING;

/**
 * An icon component that uses native SFSymbols on iOS, and MaterialIcons on Android and web.
 * With fallback to Ionicons if MaterialIcons doesn't have the needed icon.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Try to get the mapped icon name or use a fallback
  const iconName = MAPPING[name];
  
  // If mapping exists and is valid, use MaterialIcons
  if (iconName) {
    return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
  }
  
  // For missing mappings, use Ionicons as a fallback with similar naming
  const ionIconName = mapToIonicon(name);
  return <Ionicons color={color} size={size} name={ionIconName} style={style} />;
}

// Helper function to map SFSymbol-like names to Ionicons names
function mapToIonicon(name: string): any {
  // Convert the SFSymbol-like name to an Ionicons equivalent
  // This is a basic implementation - expand as needed
  if (name.includes('restaurant')) return 'restaurant';
  if (name.includes('receipt')) return 'receipt-outline';
  if (name.includes('house') || name.includes('home')) return 'home-outline';
  if (name.includes('search')) return 'search-outline';
  if (name.includes('person')) return 'person-outline';
  if (name.includes('cart')) return 'cart-outline';
  if (name.includes('star')) return 'star-outline';
  if (name.includes('heart')) return 'heart-outline';
  if (name.includes('location')) return 'location-outline';
  if (name.includes('bell')) return 'notifications-outline';
  if (name.includes('list')) return 'list-outline';
  if (name.includes('plus')) return 'add-circle-outline';
  
  // Default fallback
  return 'help-circle-outline';
}
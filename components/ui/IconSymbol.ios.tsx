// components/ui/IconSymbol.ios.tsx
import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';

// Define explicit mapping for iOS SF Symbols
// This ensures we use consistent symbol names on iOS
const SF_SYMBOL_NAMES = {
  'house.fill': 'house.fill',
  'search.fill': 'magnifyingglass',  
  'person.fill': 'person.fill',
  'restaurant.fill': 'fork.knife',  // Better SF Symbol for restaurant
  'receipt.fill': 'receipt.fill',
  'paperplane.fill': 'paperplane.fill',
  'chevron.left.forwardslash.chevron.right': 'chevron.left.forwardslash.chevron.right',
  'chevron.right': 'chevron.right',
  'cart.fill': 'cart.fill',
  'plus.circle.fill': 'plus.circle.fill',
  'list.bullet': 'list.bullet',
  'star.fill': 'star.fill',
  'heart.fill': 'heart.fill',
  'location.fill': 'location.fill',
  'bell.fill': 'bell.fill'
};

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: keyof typeof SF_SYMBOL_NAMES;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // Get the SF Symbol name or use the provided name as fallback
  const symbolName = SF_SYMBOL_NAMES[name] || name;
  
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={symbolName as SymbolViewProps['name']}
      style={[
        {
          width: size,
          height: size,
        },
        style,
      ]}
    />
  );
}
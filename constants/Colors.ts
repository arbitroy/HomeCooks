// constants/Colors.ts
/**
 * HomeCooks app color palette
 * Primary colors defined in requirements:
 * #05668d - Deep Blue (Primary)
 * #028090 - Teal (Secondary)
 * #00a896 - Sea Green (Tertiary)
 * #02c39a - Mint (Accent)
 * #f0f3bd - Light Yellow (Light)
 */

// Theme color definitions
const primaryColor = '#05668d';
const secondaryColor = '#028090';
const tertiaryColor = '#00a896';
const accentColor = '#02c39a';
const lightColor = '#f0f3bd';

export const COLORS = {
  primary: primaryColor,
  secondary: secondaryColor,
  tertiary: tertiaryColor,
  accent: accentColor,
  light: lightColor,
  white: '#ffffff',
  black: '#000000',
  gray: '#cccccc',
  lightGray: '#eeeeee',
  error: '#ff3b30',
  success: '#34c759',
  warning: '#ffcc00',
  transparent: 'transparent',
};

// Keeping the existing light/dark theme structure for compatibility
export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: primaryColor,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: primaryColor,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: lightColor,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: lightColor,
  },
};

export default Colors;
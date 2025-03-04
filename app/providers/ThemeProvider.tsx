import React, { createContext, useContext, ReactNode } from 'react';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, COLORS } from '@/constants/Colors';

// Define the theme context type
type ThemeContextType = {
    colorScheme: 'light' | 'dark';
    colors: typeof COLORS;
    themeColors: typeof Colors.light | typeof Colors.dark;
};

// Create the context with a default value
const ThemeContext = createContext<ThemeContextType>({
    colorScheme: 'light',
    colors: COLORS,
    themeColors: Colors.light,
});

// Theme provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
    const colorScheme = useColorScheme() ?? 'light';

    // Value for the context
    const themeValue = {
        colorScheme: colorScheme as 'light' | 'dark',
        colors: COLORS,
        themeColors: colorScheme === 'dark' ? Colors.dark : Colors.light,
    };

    return (
        <ThemeContext.Provider value={themeValue}>
            {children}
        </ThemeContext.Provider>
    );
}

// Custom hook to use the theme context
export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

// Default export for Expo Router compatibility
export default ThemeProvider;
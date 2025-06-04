import { Stack } from 'expo-router';
import { COLORS } from '@/constants/Colors';

export default function ReviewLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: COLORS.primary,
                },
                headerTintColor: '#fff',
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerBackTitle: 'Back',
            }}
        />
    );
}
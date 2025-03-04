import { Stack } from 'expo-router';
import { Colors } from '@/constants/Colors';

export default function AuthLayout() {
    return (
        <Stack
            screenOptions={{
                headerStyle: {
                    backgroundColor: Colors.dark,
                },
                headerTintColor: Colors.light,
                headerTitleStyle: {
                    fontWeight: '600',
                },
                headerBackTitle: 'Back',
            }}
        />
    );
}
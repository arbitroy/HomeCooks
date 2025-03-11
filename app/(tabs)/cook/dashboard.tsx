import { Redirect } from 'expo-router';
import { useAuth } from '@/app/contexts/AuthContext';

/**
 * This component serves as a redirect that maintains compatibility with 
 * the tab navigation structure. It simply forwards to the dashboard page.
 */
export default function CookDashboardTab() {
    const { user } = useAuth();

    // Redirect to the actual dashboard page
    return <Redirect href="/cook/dashboard" />;
}
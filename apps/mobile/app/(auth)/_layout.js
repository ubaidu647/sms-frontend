import { Redirect, Stack } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';

export default function AuthLayout() {
  const { isAuthenticated, hasHydrated } = useAuth();
  if (!hasHydrated) return null;
  if (isAuthenticated) return <Redirect href="/(app)/dashboard" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}

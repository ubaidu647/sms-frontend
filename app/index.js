import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function Index() {
  const { isAuthenticated, hasHydrated } = useAuth();

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  return <Redirect href={isAuthenticated ? '/(app)/dashboard' : '/(auth)/signin'} />;
}

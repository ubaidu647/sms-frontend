import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { useUserStore } from '../src/store/userStore';
import { isSuperAdmin } from '../src/utils/permissions';

export default function Index() {
  const { isAuthenticated, hasHydrated } = useAuth();
  const user = useUserStore((s) => s.user);

  if (!hasHydrated) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#0d9488" />
      </View>
    );
  }

  if (!isAuthenticated) return <Redirect href="/(auth)/signin" />;
  // Super-admins land in the system module; everyone else on the school dashboard.
  return (
    <Redirect href={isSuperAdmin(user?.role) ? '/(app)/system/organizations' : '/(app)/dashboard'} />
  );
}

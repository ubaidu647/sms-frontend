import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Redirect, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../../src/hooks/useAuth';
import TopBar from '../../src/component/TopBar';
import DrawerMenu from '../../src/component/Drawer';
import { useColors, useIsDark } from '../../src/theme/useColors';

export default function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { isAuthenticated, hasHydrated } = useAuth();
  const C = useColors();
  const isDark = useIsDark();

  if (!hasHydrated) return null;
  if (!isAuthenticated) return <Redirect href="/(auth)/signin" />;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: C.bg }]} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <TopBar onMenu={() => setDrawerOpen(true)} />
      <View style={[styles.body, { backgroundColor: C.bg }]}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: C.bg },
          }}
        />
      </View>
      <DrawerMenu open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: { flex: 1 },
});

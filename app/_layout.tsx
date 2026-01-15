import {
  SpaceGrotesk_400Regular,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
  useFonts,
} from '@expo-google-fonts/space-grotesk';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
import { RootStoreProvider, useStores } from '@shared/stores/setup';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { observer } from 'mobx-react-lite';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent local splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

const InitialLayout = observer(() => {
  const { authStore } = useStores();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const unsub = authStore.initialize();
    return () => unsub();
  }, [authStore]);

  useEffect(() => {
    if (authStore.isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Logic:
    // If not logged in:
    //   - If trying to access (tabs), kick to Welcome (/)
    //   - Allow (auth) and index (/)

    // If logged in:
    //   - If at Welcome (/) or (auth), kick to (tabs)

    if (!authStore.isAuthenticated) {
      if (inTabsGroup) {
        router.replace('/');
      }
    } else if (authStore.isAuthenticated) {
      // TS Fix: Ensure we are checking specific conditions
      // @ts-ignore
      const atRoot = segments.length === 0;
      if (atRoot || inAuthGroup) {
        router.replace('/(tabs)');
      }
    }
  }, [authStore.isAuthenticated, authStore.isLoading, segments]);

  if (authStore.isLoading) {
    return null; // Or a splash screen component
  }

  return (
    <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <RootStoreProvider>
          <ActionSheetProvider>
            <>
              <InitialLayout />
              <StatusBar style="light" />
            </>
          </ActionSheetProvider>
        </RootStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

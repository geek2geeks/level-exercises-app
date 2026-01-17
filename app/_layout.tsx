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
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

// Prevent local splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  // Can throw if called multiple times during fast refresh.
});

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
  }, [authStore.isAuthenticated, authStore.isLoading, router, segments]);

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

import { SplashScreen as AnimatedSplashScreen } from '@features/splash/SplashScreen';

// ... imports

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceGrotesk_400Regular,
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
  });

  const [splashTimedOut, setSplashTimedOut] = useState(false);
  const [isSplashAnimationFinished, setIsSplashAnimationFinished] = useState(false);
  const rootViewDidLayoutRef = useRef(false);
  const splashHiddenRef = useRef(false);

  const appIsReady = loaded || !!error || splashTimedOut;

  const hideSplash = useCallback(async (reason: string) => {
    if (splashHiddenRef.current) return;
    splashHiddenRef.current = true;
    try {
      console.log(`[splash] hiding (${reason}) loaded=${loaded} error=${!!error} timedOut=${splashTimedOut}`);
      await SplashScreen.hideAsync();
    } catch (e) {
      console.warn('[splash] hideAsync failed', e);
    }
  }, [error, loaded, splashTimedOut]);

  const onLayoutRootView = useCallback(() => {
    rootViewDidLayoutRef.current = true;
    if (appIsReady) {
      void hideSplash('layout');
    }
  }, [appIsReady, hideSplash]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      console.warn('[splash] font load timeout; continuing without fonts');
      setSplashTimedOut(true);
    }, 4000);

    return () => clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (appIsReady && rootViewDidLayoutRef.current) {
      void hideSplash('ready');
    }
  }, [appIsReady, hideSplash]);

  if (!appIsReady) {
    return null;
  }

  // Layer the screens: App renders underneath, Splash overlays on top and fades out
  // This creates seamless transition where logo appears to "stay" in place
  return (
    <GestureHandlerRootView style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <RootStoreProvider>
          <ActionSheetProvider>
            <>
              <InitialLayout />
              {/* Splash overlays on top and fades out to reveal Welcome */}
              {!isSplashAnimationFinished && (
                <AnimatedSplashScreen onFinish={() => setIsSplashAnimationFinished(true)} />
              )}
              <StatusBar style="light" />
            </>
          </ActionSheetProvider>
        </RootStoreProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

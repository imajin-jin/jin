/**
 * Root layout — session gating and app shell.
 *
 * Unauthed users are ALWAYS routed to the static login screen.
 * Authed users see the presence surface.
 *
 * The session check happens once on mount; after login, the login
 * screen calls router.replace('/') to land here.
 */

import { useEffect } from 'react';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import 'react-native-get-random-values';

import { useSession } from '@/src/hooks/useSession';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  const router = useRouter();
  const segments = useSegments();
  const { loading, authed } = useSession();

  // Hide splash when fonts + session check are done
  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && !loading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, loading]);

  // Route guard: unauthed → /login, authed → /
  useEffect(() => {
    if (loading) return;

    const inAuthGroup = segments[0] === 'login';

    if (!authed && !inAuthGroup) {
      router.replace('/login');
    } else if (authed && inAuthGroup) {
      router.replace('/');
    }
  }, [authed, loading, segments, router]);

  if (!fontsLoaded || loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

/**
 * Root layout — session gating and app shell.
 *
 * Unauthed users are ALWAYS routed to the static login screen; authed
 * users see the presence surface. The session check happens once on
 * mount; after login, the login screen calls router.replace('/').
 *
 * This is the client-side half of the security invariant. The server-side
 * half (the agent backend refuses a socket without a verified session)
 * lands with the first action work, jin#2 — see docs/DEFINITION-OF-DONE.md.
 */

// Must load before @noble/ed25519 — polyfills crypto.getRandomValues on native.
import 'react-native-get-random-values';

import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

import { useSession } from '@/src/hooks/useSession';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { loading, authed } = useSession();

  useEffect(() => {
    if (loading) return;
    SplashScreen.hideAsync();

    const onLogin = segments[0] === 'login';
    if (authed && onLogin) {
      router.replace('/');
    } else if (!authed && !onLogin) {
      router.replace('/login');
    }
  }, [authed, loading, segments, router]);

  if (loading) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="index" />
    </Stack>
  );
}

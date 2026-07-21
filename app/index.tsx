/**
 * Idle presence surface — the first object in the scene.
 *
 * Post-auth, Jin is *there*: the presence glyph (spinning/pulsing orb),
 * idle. Framed as "the first object in the world" so the scene model
 * is real from commit one.
 *
 * This is the shell/domain seam — `listActiveObjects()` returns the
 * presence object. A vertical fork plugs its intent vocabulary into
 * the composition layer here.
 *
 * SERVER-LAYER GATE: the agent backend refuses connection without a
 * valid session. This is enforced server-side (jin#2), not a client
 * redirect. MVP has no agent backend yet.
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { listActiveObjects } from '@/src/types/object';

export default function PresenceScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing scale animation
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.15,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();

    // Slow rotation animation
    const rotateAnim = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    );
    rotateAnim.start();

    return () => {
      pulseAnim.stop();
      rotateAnim.stop();
    };
  }, [pulse, rotate]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const objects = listActiveObjects();
  const presence = objects.find((o) => o.kind === 'presence');

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.orbContainer,
          { transform: [{ scale: pulse }, { rotate: spin }] },
        ]}
      >
        <View style={styles.orbOuter}>
          <View style={styles.orbInner} />
        </View>
      </Animated.View>

      <Text style={styles.presenceText}>Jin is here.</Text>

      {presence ? (
        <Text style={styles.debugId}>obj://{presence.id}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  orbInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F59E0B',
    shadowColor: '#F59E0B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  presenceText: {
    fontSize: 20,
    fontWeight: '500',
    color: '#F59E0B',
    letterSpacing: 1,
  },
  debugId: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
});

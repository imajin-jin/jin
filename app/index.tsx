/**
 * The presence surface — vision §2a, "Jin is here."
 *
 * Post-auth, Jin is *there*: the presence glyph (breathing amber orb) and
 * one line of state. This is the first object in the scene and, in the
 * agentic dashboard, the whole front page while nothing is pending and
 * nothing is running. NOW / NEEDS YOU / RECORD mount around it as the
 * agent backend lands (jin#2; docs/vision/agentic-dashboard.md §2b–2c).
 *
 * The glyph is a status, not a splash: the breath is the tell.
 */

import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { findPresence, listActiveObjects, presenceLabel } from '@/src/scene/objects';

const BREATH_MS = 2000;
const SPIN_MS = 12000;

export default function PresenceScreen() {
  const pulse = useRef(new Animated.Value(1)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: BREATH_MS, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: BREATH_MS, useNativeDriver: true }),
      ]),
    );
    const spin = Animated.loop(
      Animated.timing(rotate, { toValue: 1, duration: SPIN_MS, useNativeDriver: true }),
    );
    breath.start();
    spin.start();
    return () => {
      breath.stop();
      spin.stop();
    };
  }, [pulse, rotate]);

  const spinDeg = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  const presence = findPresence(listActiveObjects());
  const state = presence?.state ?? 'idle';

  return (
    <View style={styles.container}>
      <Animated.View
        style={[styles.orbContainer, { transform: [{ scale: pulse }, { rotate: spinDeg }] }]}
        accessibilityRole="image"
        accessibilityLabel={`Presence: ${state}`}
      >
        <View style={styles.orbOuter}>
          <View style={styles.orbInner} />
        </View>
      </Animated.View>

      <Text style={styles.presenceText}>{presenceLabel(state)}</Text>

      {presence ? <Text style={styles.objectId}>obj://{presence.id}</Text> : null}
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
  objectId: {
    fontSize: 12,
    color: '#374151',
    fontFamily: 'monospace',
  },
});

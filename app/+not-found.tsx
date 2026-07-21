import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Not Found</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Go home</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#F59E0B',
  },
  link: {
    marginTop: 16,
    paddingVertical: 8,
  },
  linkText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
});

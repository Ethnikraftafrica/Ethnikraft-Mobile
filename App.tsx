import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ethnikraft Mobile</Text>
      <Text style={styles.subtitle}>Vendor & User Dashboard</Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>Mobile App Running Successfully</Text>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF8F5',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1917',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#78716C',
    marginBottom: 24,
  },
  badge: {
    backgroundColor: '#E7F5E9',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: '#A3E635',
  },
  badgeText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '600',
  },
});


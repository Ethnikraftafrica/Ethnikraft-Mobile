import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from '@/store';
import { Colors } from '@/constants/theme';

export default function IndexGateway() {
  const router = useRouter();
  const activeRole = useAppSelector((state) => state.auth.activeRole);

  useEffect(() => {
    // Route to active dashboard
    if (activeRole === 'vendor') {
      router.replace('/(vendor)');
    } else {
      router.replace('/(user)');
    }
  }, [activeRole, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});

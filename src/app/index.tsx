import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppSelector } from '@/store';
import { Colors } from '@/constants/theme';

export default function IndexGateway() {
  const router = useRouter();
  const auth = useAppSelector((state) => state.auth);
  const { activeRole, isAuthenticated, vendor } = auth;

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(user)');
      return;
    }

    // Route based on activeRole and vendor onboarding status
    if (activeRole === 'vendor') {
      const isBusinessComplete = vendor?.isBusinessInfoComplete;
      const isDocsComplete = vendor?.isDocumentsComplete;
      const vendorStatus = vendor?.status?.toUpperCase();

      if (isBusinessComplete === false && vendor?.id) {
        router.replace({
          pathname: '/(auth)/vendor-business-info',
          params: { vendorId: vendor.id },
        });
        return;
      }

      if (isDocsComplete === false && vendor?.id) {
        router.replace({
          pathname: '/(auth)/vendor-documents',
          params: { vendorId: vendor.id },
        });
        return;
      }

      if (vendorStatus === 'PENDING') {
        router.replace('/(auth)/pending-approval');
        return;
      }

      router.replace('/(vendor)');
    } else {
      router.replace('/(user)');
    }
  }, [activeRole, isAuthenticated, vendor, router]);

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

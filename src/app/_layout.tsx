import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { store, useAppDispatch, useAppSelector } from '@/store';
import { hydrateSession } from '@/store/slices/authSlice';
import { StorageService } from '@/services/storage.service';
import { Colors } from '@/constants/theme';
import {
  useFonts,
  CormorantGaramond_600SemiBold,
  CormorantGaramond_700Bold,
  CormorantGaramond_700Bold_Italic,
} from '@expo-google-fonts/cormorant-garamond';
import {
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
  Poppins_800ExtraBold,
} from '@expo-google-fonts/poppins';
import {
  Lato_400Regular,
  Lato_700Bold,
} from '@expo-google-fonts/lato';

function RootNavigation() {
  const dispatch = useAppDispatch();
  const isHydrated = useAppSelector((state) => state.auth.isHydrated);

  const [fontsLoaded] = useFonts({
    CormorantGaramond_600SemiBold,
    CormorantGaramond_700Bold,
    CormorantGaramond_700Bold_Italic,
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Poppins_800ExtraBold,
    Lato_400Regular,
    Lato_700Bold,
  });

  useEffect(() => {
    async function restoreSession() {
      try {
        const [token, user, vendor, activeRole] = await Promise.all([
          StorageService.getAccessToken(),
          StorageService.getUserProfile(),
          StorageService.getVendorProfile(),
          StorageService.getActiveRole(),
        ]);

        dispatch(
          hydrateSession({
            token,
            user,
            vendor,
            activeRole,
          })
        );
      } catch (e) {
        console.error('Session restoration failed', e);
        dispatch(
          hydrateSession({
            token: null,
            user: null,
            vendor: null,
            activeRole: 'user',
          })
        );
      }
    }

    restoreSession();
  }, [dispatch]);

  if (!isHydrated || !fontsLoaded) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(user)" options={{ headerShown: false }} />
        <Stack.Screen name="(vendor)" options={{ headerShown: false }} />
        <Stack.Screen
          name="product/[id]"
          options={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <RootNavigation />
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

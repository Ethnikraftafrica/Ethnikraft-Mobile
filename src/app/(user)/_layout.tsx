import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NotchedLuxuryTabBar } from '@/components/navigation/NotchedLuxuryTabBar';
import { Colors, FontFamily, Shadows, Spacing } from '@/constants/theme';

export default function UserTabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      tabBar={(props) => <NotchedLuxuryTabBar {...props} />}
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.background,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontFamily: FontFamily.cormorantBold,
          fontSize: 21,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          headerShown: false,
          title: 'Ethnikraft',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          headerShown: false,
          title: 'Shop Craft',
          tabBarLabel: 'Explore',
        }}
      />
      <Tabs.Screen
        name="studio"
        options={{
          title: 'Custom Studio',
          tabBarLabel: 'Studio',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'My Orders',
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'My Account',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

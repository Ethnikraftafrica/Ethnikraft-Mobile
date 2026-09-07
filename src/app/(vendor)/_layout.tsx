import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadows } from '@/constants/theme';

export default function VendorTabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerShadowVisible: false,
        headerTintColor: Colors.primaryDark,
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          letterSpacing: 0.3,
        },
        tabBarActiveTintColor: Colors.secondary, // Olive Earth theme for Artisan operations
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: 56 + bottomInset,
          paddingTop: 8,
          paddingBottom: bottomInset,
          ...Shadows.navBar,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Artisan Hub',
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, focused }) => (
            <VendorTabIcon focused={focused} name={focused ? 'stats-chart' : 'stats-chart-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          title: 'Workshop Catalog',
          tabBarLabel: 'Catalog',
          tabBarIcon: ({ color, focused }) => (
            <VendorTabIcon focused={focused} name={focused ? 'cube' : 'cube-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          title: 'Custom Bids',
          tabBarLabel: 'Bids',
          tabBarIcon: ({ color, focused }) => (
            <VendorTabIcon focused={focused} name={focused ? 'hammer' : 'hammer-outline'} color={color} isHighlight />
          ),
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          title: 'Fulfillment',
          tabBarLabel: 'Orders',
          tabBarIcon: ({ color, focused }) => (
            <VendorTabIcon focused={focused} name={focused ? 'file-tray-full' : 'file-tray-full-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          title: 'Settlements',
          tabBarLabel: 'Payouts',
          tabBarIcon: ({ color, focused }) => (
            <VendorTabIcon focused={focused} name={focused ? 'wallet' : 'wallet-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

function VendorTabIcon({
  name,
  color,
  focused,
  isHighlight,
}: {
  name: any;
  color: any;
  focused: boolean;
  isHighlight?: boolean;
}) {
  return (
    <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
      <Ionicons name={name} size={21} color={isHighlight && focused ? Colors.primary : color} />
      {focused && <View style={styles.activeDot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 38,
    height: 28,
  },
  iconWrapperActive: {
    transform: [{ scale: 1.05 }],
  },
  activeDot: {
    position: 'absolute',
    bottom: -4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.secondary,
  },
});

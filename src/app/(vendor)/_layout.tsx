import React from 'react';
import { Tabs } from 'expo-router';
import { NotchedArtisanTabBar } from '@/components/navigation/NotchedArtisanTabBar';
import { Colors, FontFamily } from '@/constants/theme';

export default function VendorTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <NotchedArtisanTabBar {...props} />}
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
          title: 'Artisan Hub',
          tabBarLabel: 'Hub',
        }}
      />
      <Tabs.Screen
        name="catalog"
        options={{
          headerShown: false,
          title: 'Workshop Catalog',
          tabBarLabel: 'Catalog',
        }}
      />
      <Tabs.Screen
        name="requests"
        options={{
          headerShown: false,
          title: 'Custom Bids',
          tabBarLabel: 'Bids',
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          headerShown: false,
          title: 'Fulfillment',
          tabBarLabel: 'Orders',
        }}
      />
      <Tabs.Screen
        name="payouts"
        options={{
          headerShown: false,
          title: 'Workshop & Settlements',
          tabBarLabel: 'Workshop',
        }}
      />
    </Tabs>
  );
}

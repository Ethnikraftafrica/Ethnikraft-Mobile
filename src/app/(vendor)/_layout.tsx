import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanCommandTabBar } from '@/components/navigation/ArtisanCommandTabBar';
import { ArtisanDrawerMenu } from '@/components/navigation/ArtisanDrawerMenu';
import { Colors, FontFamily, Spacing } from '@/constants/theme';

export default function VendorTabsLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false);

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => setDrawerVisible(true)}
      style={styles.drawerTriggerBtn}
      activeOpacity={0.75}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons name="menu-outline" size={24} color="#FFF3D6" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Tabs
        tabBar={(props) => <ArtisanCommandTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: '#160B05',
          },
          headerShadowVisible: false,
          headerTintColor: '#FFF3D6',
          headerTitleStyle: {
            fontFamily: FontFamily.cormorantBold,
            fontSize: 20,
            letterSpacing: 0.2,
          },
          headerLeft: renderHeaderLeft,
        }}
      >
        {/* 1. Hub */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Artisan Hub',
            tabBarLabel: 'Hub',
          }}
        />

        {/* 2. Products */}
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'Craft Catalog',
            tabBarLabel: 'Products',
          }}
        />

        {/* 3. Studio (Center Docked Medallion) */}
        <Tabs.Screen
          name="studio"
          options={{
            title: 'Artisan Studio',
            tabBarLabel: 'Studio',
          }}
        />

        {/* 4. Requests */}
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Bespoke Requests',
            tabBarLabel: 'Requests',
          }}
        />

        {/* 5. Orders */}
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Fulfillment Orders',
            tabBarLabel: 'Orders',
          }}
        />

        {/* Secondary route accessible via Drawer */}
        <Tabs.Screen
          name="payouts"
          options={{
            title: 'Settlements & Escrow',
            tabBarLabel: 'Payouts',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />
      </Tabs>

      {/* Left Drawer Menu */}
      <ArtisanDrawerMenu
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#160B05',
  },
  drawerTriggerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1405',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.25)',
  },
});

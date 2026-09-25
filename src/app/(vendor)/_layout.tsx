import React, { useState } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanCommandTabBar } from '@/components/navigation/ArtisanCommandTabBar';
import { ArtisanDrawerMenu } from '@/components/navigation/ArtisanDrawerMenu';
import { CurrencyPickerModal } from '@/components/common/CurrencyPickerModal';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';

export default function VendorTabsLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const { theme, isDark } = useAppTheme();
  const currentCurrency = useAppSelector((state) => state.currency);

  const renderHeaderLeft = () => (
    <TouchableOpacity
      onPress={() => setDrawerVisible(true)}
      style={styles.drawerTriggerBtn}
      activeOpacity={0.75}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons
        name="menu-outline"
        size={24}
        color={isDark ? '#FFFFFF' : '#341B00'}
      />
    </TouchableOpacity>
  );

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => setCurrencyModalVisible(true)}
      style={[
        styles.currencyTriggerBtn,
        {
          backgroundColor: isDark ? '#191919' : '#FCF4E1',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(54, 19, 0, 0.25)',
        },
      ]}
      activeOpacity={0.75}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.currencyFlagText}>{currentCurrency.flag}</Text>
      <Text style={[styles.currencyCodeText, { color: isDark ? '#FFFFFF' : '#341B00' }]}>
        {currentCurrency.code}
      </Text>
      <Ionicons
        name="chevron-down"
        size={12}
        color={isDark ? '#CBD2CF' : '#341B00'}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Tabs
        tabBar={(props) => <ArtisanCommandTabBar {...props} />}
        screenOptions={{
          headerShown: true,
          headerStyle: {
            backgroundColor: theme.headerBackground,
          },
          headerShadowVisible: false,
          headerTintColor: theme.headerText,
          headerTitleStyle: {
            fontFamily: FontFamily.headingBold,
            fontSize: 20,
            letterSpacing: -0.2,
            color: theme.headerText,
          },
          headerLeft: renderHeaderLeft,
          headerRight: renderHeaderRight,
        }}
      >
        {/* 1. Dashboard */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
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

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  drawerTriggerBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
    padding: Spacing.xs,
  },
  currencyTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginRight: Spacing.md,
    gap: 6,
  },
  currencyFlagText: {
    fontSize: 14,
  },
  currencyCodeText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.3,
  },
});

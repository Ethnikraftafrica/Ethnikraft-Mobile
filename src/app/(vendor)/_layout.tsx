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
      style={[
        styles.drawerTriggerBtn,
        {
          backgroundColor: isDark ? '#361300' : '#FFFFFF',
          borderColor: theme.borderSubtle,
        },
      ]}
      activeOpacity={0.75}
      hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
    >
      <Ionicons
        name="menu-outline"
        size={22}
        color={isDark ? '#FFF3D6' : theme.textPrimary}
      />
    </TouchableOpacity>
  );

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => setCurrencyModalVisible(true)}
      style={[
        styles.currencyTriggerBtn,
        {
          backgroundColor: isDark ? '#361300' : '#FFFFFF',
          borderColor: isDark ? 'rgba(209, 153, 90, 0.3)' : 'rgba(196, 108, 39, 0.2)',
        },
      ]}
      activeOpacity={0.75}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.currencyFlagText}>{currentCurrency.flag}</Text>
      <Text style={[styles.currencyCodeText, { color: isDark ? '#FFF3D6' : theme.textPrimary }]}>
        {currentCurrency.code}
      </Text>
      <Ionicons
        name="chevron-down"
        size={11}
        color={isDark ? '#FFD79E' : theme.primary}
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
            fontFamily: FontFamily.cormorantBold,
            fontSize: 20,
            letterSpacing: 0.2,
            color: theme.headerText,
          },
          headerLeft: renderHeaderLeft,
          headerRight: renderHeaderRight,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.md,
    borderWidth: 1,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  currencyTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: Spacing.md,
    gap: 4,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 2,
  },
  currencyFlagText: {
    fontSize: 13,
  },
  currencyCodeText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.3,
  },
});

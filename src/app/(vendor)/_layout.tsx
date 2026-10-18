import React, { useState, useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ArtisanCommandTabBar } from '@/components/navigation/ArtisanCommandTabBar';
import { ArtisanDrawerMenu } from '@/components/navigation/ArtisanDrawerMenu';
import { CurrencyPickerModal } from '@/components/common/CurrencyPickerModal';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import {
  useGetVendorProductRequestsQuery,
  useGetVendorOrdersQuery,
} from '@/store/api/vendorApi';

export default function VendorTabsLayout() {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);
  const { theme, isDark } = useAppTheme();
  const currentCurrency = useAppSelector((state) => state.currency);

  // ─── Live Operational Counts for Bottom Navigation Badges ───────────────────
  const { data: productRequestsData } = useGetVendorProductRequestsQuery();
  const { data: ordersData } = useGetVendorOrdersQuery();

  // Active / pending requests awaiting artisan action or in production
  const activeRequestsCount = useMemo(() => {
    if (!productRequestsData || !Array.isArray(productRequestsData)) return 0;
    return productRequestsData.filter((r) =>
      ['PENDING', 'PRODUCTION_PENDING', 'ACCEPTED', 'IN_PRODUCTION'].includes(r.status)
    ).length;
  }, [productRequestsData]);

  // Active / pending orders requiring fulfillment
  const activeOrdersCount = useMemo(() => {
    if (!ordersData || !Array.isArray(ordersData)) return 0;
    return ordersData.filter((o) =>
      ['PENDING', 'IN_PROGRESS', 'IN_PRODUCTION', 'PROCESSING'].includes(o.status)
    ).length;
  }, [ordersData]);

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
        color={theme.textPrimary}
      />
    </TouchableOpacity>
  );

  const renderHeaderRight = () => (
    <TouchableOpacity
      onPress={() => setCurrencyModalVisible(true)}
      style={[
        styles.currencyTriggerBtn,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
        },
      ]}
      activeOpacity={0.75}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Text style={styles.currencyFlagText}>{currentCurrency.flag}</Text>
      <Text style={[styles.currencyCodeText, { color: theme.textPrimary }]}>
        {currentCurrency.code}
      </Text>
      <Ionicons
        name="chevron-down"
        size={12}
        color={theme.textSecondary}
      />
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Tabs
        tabBar={(props) => (
          <ArtisanCommandTabBar
            {...props}
            unreadRequestsCount={activeRequestsCount}
            pendingOrdersCount={activeOrdersCount}
          />
        )}
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
          headerTitleContainerStyle: {
            maxWidth: '60%',
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
          name="products"
          options={{
            title: 'Products',
            tabBarLabel: 'Products',
          }}
        />

        {/* Catalog route accessible via Drawer */}
        <Tabs.Screen
          name="catalog"
          options={{
            title: 'Catalog',
            tabBarLabel: 'Catalog',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* 3. Studio (Center Docked Medallion) */}
        <Tabs.Screen
          name="studio"
          options={{
            title: 'Studio',
            tabBarLabel: 'Studio',
          }}
        />

        {/* 4. Requests */}
        <Tabs.Screen
          name="requests"
          options={{
            title: 'Requests',
            tabBarLabel: 'Requests',
          }}
        />

        {/* 5. Orders */}
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Orders',
            tabBarLabel: 'Orders',
          }}
        />

        {/* Secondary route accessible via Drawer */}
        <Tabs.Screen
          name="payouts"
          options={{
            title: 'Settlements',
            tabBarLabel: 'Payouts',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* Profile route accessible via Drawer */}
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarLabel: 'Profile',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* Customers route accessible via Drawer */}
        <Tabs.Screen
          name="customers"
          options={{
            title: 'Customers',
            tabBarLabel: 'Customers',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* Statistics route accessible via Drawer */}
        <Tabs.Screen
          name="statistics"
          options={{
            title: 'Statistics',
            tabBarLabel: 'Statistics',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* Settings route accessible via Drawer */}
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Settings',
            tabBarLabel: 'Settings',
            href: null, // Hidden from bottom tabs, opened from drawer
          }}
        />

        {/* Messenger route accessible via Drawer & Deep Links */}
        <Tabs.Screen
          name="messenger"
          options={{
            title: 'Messenger',
            tabBarLabel: 'Messenger',
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

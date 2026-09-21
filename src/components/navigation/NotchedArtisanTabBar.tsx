import React from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface NotchedArtisanTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  unreadBidsCount?: number;
  pendingOrdersCount?: number;
}

export const NotchedArtisanTabBar: React.FC<NotchedArtisanTabBarProps> = ({
  state,
  descriptors,
  navigation,
  unreadBidsCount,
  pendingOrdersCount,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const barHeight = 58 + bottomInset;

  // Notch Geometry Calculations
  const center = SCREEN_WIDTH / 2;
  const notchWidth = 52; // Half-width of notch curve from center
  const notchDepth = 35; // Depth of center dip

  // C1 Continuous Cubic Bezier Notch Cutout Path
  const notchPath = `
    M 0 0
    H ${center - notchWidth}
    C ${center - notchWidth * 0.62} 0, ${center - notchWidth * 0.62} ${notchDepth}, ${center} ${notchDepth}
    C ${center + notchWidth * 0.62} ${notchDepth}, ${center + notchWidth * 0.62} 0, ${center + notchWidth} 0
    H ${SCREEN_WIDTH}
    V ${barHeight}
    H 0
    Z
  `;

  // Molten Terracotta & Royal Gold Highlight Rim along the top and notch
  const rimPath = `
    M 0 1
    H ${center - notchWidth}
    C ${center - notchWidth * 0.62} 1, ${center - notchWidth * 0.62} ${notchDepth + 1}, ${center} ${notchDepth + 1}
    C ${center + notchWidth * 0.62} ${notchDepth + 1}, ${center + notchWidth * 0.62} 1, ${center + notchWidth} 1
    H ${SCREEN_WIDTH}
  `;

  // Route lookups for the 5 artisan domains
  const hubRoute = state?.routes?.find((r: any) => r.name === 'index');
  const catalogRoute = state?.routes?.find((r: any) => r.name === 'catalog');
  const bidsRoute = state?.routes?.find((r: any) => r.name === 'requests');
  const ordersRoute = state?.routes?.find((r: any) => r.name === 'orders');
  const workshopRoute = state?.routes?.find((r: any) => r.name === 'payouts');

  const bidsIndex = state?.routes?.findIndex((r: any) => r.name === 'requests');
  const isBidsActive = bidsIndex !== -1 && state?.index === bidsIndex;

  const renderTabItem = (route: any, badgeCount?: number) => {
    if (!route || !route.key || !descriptors || !descriptors[route.key]) {
      return null;
    }

    const routeIndex = state?.routes?.findIndex((r: any) => r.key === route.key);
    const isFocused = state?.index === routeIndex;
    const { options } = descriptors[route.key];

    const label =
      options?.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options?.title !== undefined
        ? options.title
        : route.name === 'index'
        ? 'Hub'
        : route.name === 'catalog'
        ? 'Catalog'
        : route.name === 'orders'
        ? 'Orders'
        : route.name === 'payouts'
        ? 'Workshop'
        : route.name;

    const getIconName = () => {
      switch (route.name) {
        case 'index':
          return isFocused ? 'stats-chart' : 'stats-chart-outline';
        case 'catalog':
          return isFocused ? 'cube' : 'cube-outline';
        case 'orders':
          return isFocused ? 'receipt' : 'receipt-outline';
        case 'payouts':
          return isFocused ? 'business' : 'business-outline';
        default:
          return 'apps-outline';
      }
    };

    const onPress = () => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });

      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name);
      }
    };

    return (
      <TouchableOpacity
        key={route.key}
        onPress={onPress}
        style={styles.tabItem}
        activeOpacity={0.8}
      >
        <View style={styles.iconBadgeContainer}>
          <Ionicons
            name={getIconName() as any}
            size={20}
            color={isFocused ? '#E5A93C' : '#9E8C7A'}
          />

          {/* Operational Notification Badge */}
          {!!badgeCount && badgeCount > 0 && (
            <View style={styles.badgePill}>
              <Text style={styles.badgeText}>
                {badgeCount > 99 ? '99+' : badgeCount}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#FFF3D6' : '#9E8C7A' },
            isFocused && styles.tabLabelFocused,
          ]}
        >
          {label as string}
        </Text>
        {isFocused && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  const handleBidsPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (bidsRoute) {
      const event = navigation.emit({
        type: 'tabPress',
        target: bidsRoute.key,
        canPreventDefault: true,
      });

      if (!isBidsActive && !event.defaultPrevented) {
        navigation.navigate(bidsRoute.name);
      }
    } else {
      navigation.navigate('requests');
    }
  };

  return (
    <View style={[styles.container, { height: barHeight }]}>
      {/* SVG Notched Background with Molten-Copper & Royal Gold Rim */}
      <Svg
        width={SCREEN_WIDTH}
        height={barHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGradient id="artisanRimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4A2810" stopOpacity="0.4" />
            <Stop offset="25%" stopColor="#C46C27" stopOpacity="0.9" />
            <Stop offset="50%" stopColor="#E5A93C" stopOpacity="1" />
            <Stop offset="75%" stopColor="#C46C27" stopOpacity="0.9" />
            <Stop offset="100%" stopColor="#4A2810" stopOpacity="0.4" />
          </SvgGradient>
        </Defs>

        {/* Deep Atelier Obsidian Mahogany Dock Base */}
        <Path d={notchPath} fill="#140A04" />

        {/* Top & Notch Golden Rim */}
        <Path
          d={rimPath}
          stroke="url(#artisanRimGradient)"
          strokeWidth="1.8"
          fill="none"
        />
      </Svg>

      {/* Floating Center Bids / Forge Action Button inside Notch */}
      <View style={[styles.centerFabAnchor, { left: center - 30 }]}>
        <TouchableOpacity
          onPress={handleBidsPress}
          activeOpacity={0.88}
          style={[
            styles.centerFabButton,
            isBidsActive && styles.centerFabButtonActive,
            Shadows.lg,
          ]}
        >
          {/* Subtle Golden Glowing Halo */}
          <View
            style={[
              styles.centerFabHalo,
              isBidsActive && styles.centerFabHaloActive,
            ]}
          />

          {/* Center Artisan Hammer Emblem */}
          <View style={styles.centerFabIconWrap}>
            <Ionicons
              name={isBidsActive ? 'hammer' : 'hammer-outline'}
              size={24}
              color={isBidsActive ? '#FFFFFF' : '#E5A93C'}
            />
          </View>

          {/* Sparkle / Live Pulse Accent */}
          <View style={styles.centerSparkleBadge}>
            <Ionicons name="sparkles" size={9} color="#140A04" />
          </View>
        </TouchableOpacity>

        <Text
          style={[
            styles.centerFabLabel,
            isBidsActive && styles.centerFabLabelActive,
          ]}
        >
          Bids
        </Text>
      </View>

      {/* Navigation Tabs (Left 2 & Right 2) */}
      <View style={[styles.tabsRow, { paddingBottom: bottomInset }]}>
        {/* Left Wings: Hub, Catalog */}
        <View style={styles.tabWing}>
          {renderTabItem(hubRoute)}
          {renderTabItem(catalogRoute)}
        </View>

        {/* Center Gap Spacer for the Notch */}
        <View style={styles.notchSpacer} />

        {/* Right Wings: Orders, Workshop */}
        <View style={styles.tabWing}>
          {renderTabItem(ordersRoute, pendingOrdersCount)}
          {renderTabItem(workshopRoute)}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    zIndex: 90,
  },
  tabsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  tabWing: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    height: '100%',
  },
  notchSpacer: {
    width: 76,
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    minWidth: 54,
  },
  iconBadgeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: '#C92929',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5A93C',
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    lineHeight: 11,
  },
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5A93C',
    marginTop: 2,
  },

  // ─── CENTER ELEVATED FORGE / BIDS FAB ─────────────────────
  centerFabAnchor: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    width: 60,
    zIndex: 100,
  },
  centerFabButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#2A1405',
    borderWidth: 2,
    borderColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
  },
  centerFabButtonActive: {
    borderColor: '#E5A93C',
    backgroundColor: '#4A2105',
    transform: [{ scale: 1.04 }],
  },
  centerFabHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(229, 169, 60, 0.35)',
  },
  centerFabHaloActive: {
    borderColor: '#E5A93C',
    borderWidth: 1.5,
  },
  centerFabIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1C0D03',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#662502',
  },
  centerSparkleBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E5A93C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#140A04',
  },
  centerFabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: '#9E8C7A',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  centerFabLabelActive: {
    color: '#E5A93C',
    fontFamily: FontFamily.poppinsBold,
  },
});

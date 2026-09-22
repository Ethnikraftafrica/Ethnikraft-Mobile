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
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FontFamily, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface ArtisanCommandTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
  unreadRequestsCount?: number;
  pendingOrdersCount?: number;
}

export const ArtisanCommandTabBar: React.FC<ArtisanCommandTabBarProps> = ({
  state,
  descriptors,
  navigation,
  unreadRequestsCount = 2,
  pendingOrdersCount = 3,
}) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom : 8;
  const barHeight = 64 + bottomInset;

  // 5 primary tabs in exact order: Hub, Products, Store (Center Docked), Requests, Orders
  const hubRoute = state?.routes?.find((r: any) => r.name === 'index');
  const productsRoute = state?.routes?.find((r: any) => r.name === 'catalog');
  const storeRoute = state?.routes?.find((r: any) => r.name === 'store');
  const requestsRoute = state?.routes?.find((r: any) => r.name === 'requests');
  const ordersRoute = state?.routes?.find((r: any) => r.name === 'orders');

  const storeIndex = state?.routes?.findIndex((r: any) => r.name === 'store');
  const isStoreActive = storeIndex !== -1 && state?.index === storeIndex;

  const renderSegmentItem = (
    route: any,
    label: string,
    activeIcon: string,
    inactiveIcon: string,
    badgeCount?: number
  ) => {
    if (!route || !route.key || !descriptors || !descriptors[route.key]) {
      return (
        <View style={styles.segmentItem}>
          <Ionicons name={inactiveIcon as any} size={21} color="#9E8C7A" />
          <Text style={styles.segmentLabel}>{label}</Text>
        </View>
      );
    }

    const routeIndex = state?.routes?.findIndex((r: any) => r.key === route.key);
    const isFocused = state?.index === routeIndex;

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
        style={[styles.segmentItem, isFocused && styles.segmentItemActive]}
        activeOpacity={0.78}
      >
        {/* Top Active Gold Indicator Line */}
        {isFocused && <View style={styles.activeTopLine} />}

        <View style={styles.iconContainer}>
          <Ionicons
            name={(isFocused ? activeIcon : inactiveIcon) as any}
            size={22}
            color={isFocused ? '#FFD79E' : '#9E8C7A'}
          />

          {/* Operational Real-time Badge */}
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
            styles.segmentLabel,
            isFocused ? styles.segmentLabelActive : styles.segmentLabelInactive,
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const handleStorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (storeRoute) {
      const event = navigation.emit({
        type: 'tabPress',
        target: storeRoute.key,
        canPreventDefault: true,
      });

      if (!isStoreActive && !event.defaultPrevented) {
        navigation.navigate(storeRoute.name);
      }
    } else {
      navigation.navigate('store');
    }
  };

  return (
    <View style={[styles.container, { height: barHeight }]}>
      {/* Dark Ebony & Polished Wood Textured Bar Background */}
      <LinearGradient
        colors={['#24140A', '#160B05', '#0D0602']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.barBackground, { paddingBottom: bottomInset }]}
      >
        {/* Golden Top Border Rim */}
        <View style={styles.topGoldenBevel} />

        {/* 5 Segmented Compartments */}
        <View style={styles.segmentsRow}>
          {/* 1. Hub */}
          {renderSegmentItem(hubRoute, 'Hub', 'stats-chart', 'stats-chart-outline')}

          {/* Divider 1 */}
          <View style={styles.verticalDivider} />

          {/* 2. Products */}
          {renderSegmentItem(productsRoute, 'Products', 'book', 'book-outline')}

          {/* Center Gap Spacer for the Docked Store Medallion */}
          <View style={styles.centerMedallionSpacer} />

          {/* 4. Requests */}
          {renderSegmentItem(
            requestsRoute,
            'Requests',
            'hammer',
            'hammer-outline',
            unreadRequestsCount
          )}

          {/* Divider 2 */}
          <View style={styles.verticalDivider} />

          {/* 5. Orders */}
          {renderSegmentItem(
            ordersRoute,
            'Orders',
            'bag-check',
            'bag-outline',
            pendingOrdersCount
          )}
        </View>
      </LinearGradient>

      {/* Center Docked Elevated Store Medallion */}
      <View style={[styles.storeMedallionAnchor, { left: SCREEN_WIDTH / 2 - 32 }]}>
        <TouchableOpacity
          onPress={handleStorePress}
          activeOpacity={0.88}
          style={[
            styles.storeMedallionOuter,
            isStoreActive && styles.storeMedallionOuterActive,
          ]}
        >
          {/* Outer Multi-Ring Bezel */}
          <LinearGradient
            colors={
              isStoreActive
                ? ['#F3CE86', '#C46C27', '#662502', '#F3CE86']
                : ['#8A562B', '#421E08', '#220D02', '#8A562B']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.bezelRing}
          >
            {/* Inner Medallion Disc */}
            <LinearGradient
              colors={
                isStoreActive
                  ? ['#542407', '#341302', '#1E0B02']
                  : ['#2F1505', '#1C0B02', '#0F0501']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.medallionInnerDisc}
            >
              {/* Storefront / Atelier Crest Icon */}
              <Ionicons
                name={isStoreActive ? 'storefront' : 'storefront-outline'}
                size={24}
                color={isStoreActive ? '#FFD79E' : '#D4A373'}
              />
            </LinearGradient>
          </LinearGradient>
        </TouchableOpacity>

        {/* Medallion Label */}
        <Text
          style={[
            styles.storeLabel,
            isStoreActive && styles.storeLabelActive,
          ]}
        >
          Store
        </Text>
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
    zIndex: 90,
  },
  barBackground: {
    flex: 1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(212, 163, 115, 0.28)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 16,
  },
  topGoldenBevel: {
    height: 1.5,
    width: '100%',
    backgroundColor: '#C46C27',
    opacity: 0.8,
  },
  segmentsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  segmentItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    height: '100%',
    position: 'relative',
  },
  segmentItemActive: {
    backgroundColor: 'rgba(196, 108, 39, 0.08)',
  },
  activeTopLine: {
    position: 'absolute',
    top: 0,
    left: '20%',
    right: '20%',
    height: 2.5,
    backgroundColor: '#FFD79E',
    borderRadius: 2,
    shadowColor: '#FFD79E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
  },
  verticalDivider: {
    width: 1,
    height: 26,
    backgroundColor: 'rgba(212, 163, 115, 0.16)',
  },
  centerMedallionSpacer: {
    width: 66,
  },
  iconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePill: {
    position: 'absolute',
    top: -5,
    right: -11,
    backgroundColor: '#C92929',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFD79E',
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
  segmentLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  segmentLabelInactive: {
    color: '#9E8C7A',
  },
  segmentLabelActive: {
    color: '#FFD79E',
    fontFamily: FontFamily.poppinsBold,
  },

  // ─── CENTER DOCKED STORE MEDALLION ─────────────────────────
  storeMedallionAnchor: {
    position: 'absolute',
    top: -20,
    width: 64,
    alignItems: 'center',
    zIndex: 100,
  },
  storeMedallionOuter: {
    width: 60,
    height: 60,
    borderRadius: 30,
    padding: 2,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 12,
  },
  storeMedallionOuterActive: {
    shadowColor: '#FFD79E',
    shadowOpacity: 0.9,
    shadowRadius: 14,
    transform: [{ scale: 1.05 }],
  },
  bezelRing: {
    flex: 1,
    borderRadius: 28,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medallionInnerDisc: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.4)',
  },
  storeLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: '#9E8C7A',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  storeLabelActive: {
    color: '#FFD79E',
    fontFamily: FontFamily.poppinsBold,
  },
});

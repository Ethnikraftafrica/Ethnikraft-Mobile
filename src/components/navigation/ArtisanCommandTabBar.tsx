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
import { FontFamily } from '@/constants/theme';

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
  const barHeight = 62 + bottomInset;

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
        <View style={styles.segmentColumn}>
          <Ionicons name={inactiveIcon as any} size={20} color="#9E8C7A" />
          <Text style={styles.segmentLabelInactive}>{label}</Text>
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
        style={[styles.segmentColumn, isFocused && styles.segmentColumnActive]}
        activeOpacity={0.78}
      >
        <View style={styles.iconContainer}>
          <Ionicons
            name={(isFocused ? activeIcon : inactiveIcon) as any}
            size={21}
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

        {/* Subtle active glow dot */}
        {isFocused && <View style={styles.activeDot} />}
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
      {/* Dark Ebony & Polished Wood Textured Bar Background with Curved Top Border */}
      <LinearGradient
        colors={['#24140A', '#160B05', '#0D0602']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.barBackground, { paddingBottom: bottomInset }]}
      >
        {/* 5 Equal 20% Columns with Centered Symmetry */}
        <View style={styles.segmentsRow}>
          {/* 1. Hub */}
          {renderSegmentItem(hubRoute, 'Hub', 'stats-chart', 'stats-chart-outline')}

          {/* Divider 1 */}
          <View style={styles.verticalDivider} />

          {/* 2. Products */}
          {renderSegmentItem(productsRoute, 'Products', 'book', 'book-outline')}

          {/* 3. Center Store Column (Medallion Slot) */}
          <View style={styles.storeCenterColumn}>
            <TouchableOpacity
              onPress={handleStorePress}
              activeOpacity={0.88}
              style={[
                styles.storeMedallionOuter,
                isStoreActive && styles.storeMedallionOuterActive,
              ]}
            >
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
                  <Ionicons
                    name={isStoreActive ? 'storefront' : 'storefront-outline'}
                    size={22}
                    color={isStoreActive ? '#FFD79E' : '#D4A373'}
                  />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            <Text
              style={[
                styles.storeLabel,
                isStoreActive && styles.storeLabelActive,
              ]}
            >
              Store
            </Text>
          </View>

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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.35)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 16,
  },
  segmentsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  segmentColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    height: '100%',
    position: 'relative',
  },
  segmentColumnActive: {
    backgroundColor: 'rgba(196, 108, 39, 0.08)',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(212, 163, 115, 0.18)',
    alignSelf: 'center',
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
  activeDot: {
    width: 3.5,
    height: 3.5,
    borderRadius: 2,
    backgroundColor: '#FFD79E',
    marginTop: 2,
  },

  // ─── CENTER STORE COLUMN & MEDALLION ───────────────────────
  storeCenterColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  storeMedallionOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    marginTop: -18,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 10,
  },
  storeMedallionOuterActive: {
    shadowColor: '#FFD79E',
    shadowOpacity: 0.9,
    shadowRadius: 12,
    transform: [{ scale: 1.05 }],
  },
  bezelRing: {
    flex: 1,
    borderRadius: 24,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  medallionInnerDisc: {
    width: '100%',
    height: '100%',
    borderRadius: 22,
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

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
import { FontFamily, Radius } from '@/constants/theme';

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

  // 5 primary tabs in exact order: Hub, Products, Studio (Center Docked), Requests, Orders
  const hubRoute = state?.routes?.find((r: any) => r.name === 'index');
  const productsRoute = state?.routes?.find((r: any) => r.name === 'catalog');
  const studioRoute = state?.routes?.find((r: any) => r.name === 'studio');
  const requestsRoute = state?.routes?.find((r: any) => r.name === 'requests');
  const ordersRoute = state?.routes?.find((r: any) => r.name === 'orders');

  const studioIndex = state?.routes?.findIndex((r: any) => r.name === 'studio');
  const isStudioActive = studioIndex !== -1 && state?.index === studioIndex;

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
          <Ionicons name={inactiveIcon as any} size={20} color="#D1995A" />
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
            color={isFocused ? '#FFF3D6' : '#D1995A'}
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

        {/* Burnt Orange Active Glow Dot */}
        {isFocused && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  const handleStudioPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (studioRoute) {
      const event = navigation.emit({
        type: 'tabPress',
        target: studioRoute.key,
        canPreventDefault: true,
      });

      if (!isStudioActive && !event.defaultPrevented) {
        navigation.navigate(studioRoute.name);
      }
    } else {
      navigation.navigate('studio');
    }
  };

  return (
    <View style={[styles.container, { height: barHeight }]}>
      {/* Glassmorphism Brown & Burnt Orange Container */}
      <LinearGradient
        colors={['rgba(102, 37, 2, 0.94)', 'rgba(54, 19, 0, 0.97)', 'rgba(37, 20, 0, 0.99)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.barBackground, { paddingBottom: bottomInset }]}
      >
        {/* Subtle Top Specular Glass Reflection */}
        <View style={styles.glassTopGleam} />

        {/* 5 Equal 20% Columns with Pixel-Perfect Centered Symmetry */}
        <View style={styles.segmentsRow}>
          {/* 1. Hub */}
          {renderSegmentItem(hubRoute, 'Hub', 'stats-chart', 'stats-chart-outline')}

          {/* Divider 1 */}
          <View style={styles.verticalDivider} />

          {/* 2. Products */}
          {renderSegmentItem(productsRoute, 'Products', 'book', 'book-outline')}

          {/* 3. Center Studio Column (Docked Medallion) */}
          <View style={styles.studioCenterColumn}>
            <TouchableOpacity
              onPress={handleStudioPress}
              activeOpacity={0.88}
              style={[
                styles.studioMedallionOuter,
                isStudioActive && styles.studioMedallionOuterActive,
              ]}
            >
              <LinearGradient
                colors={
                  isStudioActive
                    ? ['#FFD79E', '#C46C27', '#E68A3E', '#FFD79E']
                    : ['#C46C27', '#662502', '#361300', '#D1995A']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.bezelRing}
              >
                <LinearGradient
                  colors={
                    isStudioActive
                      ? ['#C46C27', '#662502', '#361300']
                      : ['#662502', '#361300', '#251400']
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={styles.medallionInnerDisc}
                >
                  <Ionicons
                    name={isStudioActive ? 'color-palette' : 'color-palette-outline'}
                    size={23}
                    color={isStudioActive ? '#FFF3D6' : '#FFD79E'}
                  />
                </LinearGradient>
              </LinearGradient>
            </TouchableOpacity>

            <Text
              style={[
                styles.studioLabel,
                isStudioActive ? styles.studioLabelActive : styles.studioLabelInactive,
              ]}
            >
              Studio
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
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(209, 153, 90, 0.38)',
    borderTopColor: 'rgba(255, 215, 158, 0.5)',
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 16,
    position: 'relative',
    overflow: 'visible',
  },
  glassTopGleam: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255, 252, 244, 0.25)',
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
    borderRadius: Radius.md,
  },
  segmentColumnActive: {
    backgroundColor: 'rgba(196, 108, 39, 0.22)',
  },
  verticalDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(209, 153, 90, 0.22)',
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
    backgroundColor: '#C46C27',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFF3D6',
    minWidth: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF3D6',
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
    color: '#D1995A',
  },
  segmentLabelActive: {
    color: '#FFF3D6',
    fontFamily: FontFamily.poppinsBold,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#C46C27',
    marginTop: 2,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
  },

  // ─── CENTER STUDIO DOCKED MEDALLION ───────────────────────
  studioCenterColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  studioMedallionOuter: {
    width: 52,
    height: 52,
    borderRadius: 26,
    padding: 2,
    marginTop: -18,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.7,
    shadowRadius: 10,
    elevation: 12,
  },
  studioMedallionOuterActive: {
    shadowColor: '#FFD79E',
    shadowOpacity: 0.95,
    shadowRadius: 14,
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
    borderColor: 'rgba(255, 215, 158, 0.45)',
  },
  studioLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 2,
    letterSpacing: 0.2,
  },
  studioLabelInactive: {
    color: '#D1995A',
  },
  studioLabelActive: {
    color: '#FFF3D6',
    fontFamily: FontFamily.poppinsBold,
  },
});

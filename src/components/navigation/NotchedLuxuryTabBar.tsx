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
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { Colors, FontFamily, Shadows } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface NotchedLuxuryTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

export const NotchedLuxuryTabBar: React.FC<NotchedLuxuryTabBarProps> = ({
  state,
  descriptors,
  navigation,
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

  // Golden Highlight Rim along the top and the notch
  const rimPath = `
    M 0 1
    H ${center - notchWidth}
    C ${center - notchWidth * 0.62} 1, ${center - notchWidth * 0.62} ${notchDepth + 1}, ${center} ${notchDepth + 1}
    C ${center + notchWidth * 0.62} ${notchDepth + 1}, ${center + notchWidth * 0.62} 1, ${center + notchWidth} 1
    H ${SCREEN_WIDTH}
  `;

  // Tab mapping:
  // routes: [index (0), explore (1), studio (2), orders (3), profile (4)]
  const leftRoutes = state.routes.slice(0, 2);
  const studioRoute = state.routes.find((r: any) => r.name === 'studio') || state.routes[2];
  const rightRoutes = state.routes.slice(3, 5);

  const studioIndex = state.routes.findIndex((r: any) => r.name === 'studio');
  const isStudioActive = state.index === studioIndex;

  const renderTabItem = (route: any, routeIndex: number) => {
    const isFocused = state.index === routeIndex;
    const { options } = descriptors[route.key];

    const label =
      options.tabBarLabel !== undefined
        ? options.tabBarLabel
        : options.title !== undefined
        ? options.title
        : route.name;

    const getIconName = () => {
      switch (route.name) {
        case 'index':
          return isFocused ? 'home' : 'home-outline';
        case 'explore':
          return isFocused ? 'grid' : 'grid-outline';
        case 'orders':
          return isFocused ? 'receipt' : 'receipt-outline';
        case 'profile':
          return isFocused ? 'person' : 'person-outline';
        default:
          return 'sparkles';
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
        <Ionicons
          name={getIconName() as any}
          size={20}
          color={isFocused ? '#E8BA7A' : '#A8998A'}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#FFF5DE' : '#A8998A' },
            isFocused && styles.tabLabelFocused,
          ]}
        >
          {label as string}
        </Text>
        {isFocused && <View style={styles.activeDot} />}
      </TouchableOpacity>
    );
  };

  const handleStudioPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const event = navigation.emit({
      type: 'tabPress',
      target: studioRoute.key,
      canPreventDefault: true,
    });

    if (!isStudioActive && !event.defaultPrevented) {
      navigation.navigate(studioRoute.name);
    }
  };

  return (
    <View style={[styles.container, { height: barHeight }]}>
      {/* SVG Notched Background with Golden Gradient Rim */}
      <Svg
        width={SCREEN_WIDTH}
        height={barHeight}
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <SvgGradient id="goldRimGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="#4A2810" stopOpacity="0.4" />
            <Stop offset="30%" stopColor="#C46C27" stopOpacity="0.85" />
            <Stop offset="50%" stopColor="#E8BA7A" stopOpacity="1" />
            <Stop offset="70%" stopColor="#C46C27" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#4A2810" stopOpacity="0.4" />
          </SvgGradient>
        </Defs>

        {/* Deep Obsidian-Coffee Dock Fill */}
        <Path d={notchPath} fill="#180C04" />

        {/* Top & Notch Golden Rim */}
        <Path
          d={rimPath}
          stroke="url(#goldRimGradient)"
          strokeWidth="1.8"
          fill="none"
        />
      </Svg>

      {/* Floating Center Studio FAB seated inside the notch */}
      <View style={[styles.centerFabAnchor, { left: center - 30 }]}>
        <TouchableOpacity
          onPress={handleStudioPress}
          activeOpacity={0.88}
          style={[
            styles.centerFabButton,
            isStudioActive && styles.centerFabButtonActive,
            Shadows.lg,
          ]}
        >
          {/* Subtle Golden Glowing Halo when Active */}
          <View
            style={[
              styles.centerFabHalo,
              isStudioActive && styles.centerFabHaloActive,
            ]}
          />

          {/* Studio Emblem */}
          <Image
            source={require('../../../assets/revamp/studio.png')}
            style={styles.studioIconImage}
            contentFit="cover"
          />

          {/* Golden Badge Accent */}
          <View style={styles.studioSparkleBadge}>
            <Ionicons name="sparkles" size={10} color="#180C04" />
          </View>
        </TouchableOpacity>

        <Text
          style={[
            styles.studioLabel,
            isStudioActive && styles.studioLabelActive,
          ]}
        >
          Studio
        </Text>
      </View>

      {/* Navigation Tabs (Left 2 & Right 2) */}
      <View style={[styles.tabsRow, { paddingBottom: bottomInset }]}>
        {/* Left Wings: Home, Explore */}
        <View style={styles.tabWing}>
          {renderTabItem(leftRoutes[0], 0)}
          {renderTabItem(leftRoutes[1], 1)}
        </View>

        {/* Center Gap Spacer for the Notch */}
        <View style={styles.notchSpacer} />

        {/* Right Wings: Orders, Profile */}
        <View style={styles.tabWing}>
          {renderTabItem(rightRoutes[0], 3)}
          {renderTabItem(rightRoutes[1], 4)}
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
  tabLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 3,
    letterSpacing: 0.2,
  },
  tabLabelFocused: {
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF5DE',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E8BA7A',
    marginTop: 2,
  },

  // ─── CENTER ELEVATED NOTCHED FAB ──────────────────────────
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
    backgroundColor: '#271100',
    borderWidth: 2,
    borderColor: '#E8BA7A',
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
    borderColor: '#FFD79E',
    backgroundColor: '#3E1C03',
    transform: [{ scale: 1.04 }],
  },
  centerFabHalo: {
    ...StyleSheet.absoluteFill,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: 'rgba(232, 186, 122, 0.35)',
  },
  centerFabHaloActive: {
    borderColor: '#E8BA7A',
    borderWidth: 1.5,
  },
  studioIconImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  studioSparkleBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#E8BA7A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#180C04',
  },
  studioLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: '#A8998A',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  studioLabelActive: {
    color: '#E8BA7A',
    fontFamily: FontFamily.poppinsBold,
  },
});

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

interface ArtisanHeaderProps {
  title: string;
  subtitle?: string;
  onOpenDrawer: () => void;
  rightAction?: React.ReactNode;
}

export const ArtisanHeader: React.FC<ArtisanHeaderProps> = ({
  title,
  subtitle = 'ATELIER WORKBENCH',
  onOpenDrawer,
  rightAction,
}) => {
  const insets = useSafeAreaInsets();

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onOpenDrawer();
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 10) }]}>
      {/* Left: Drawer Hamburger Trigger */}
      <TouchableOpacity
        onPress={handleMenuPress}
        style={styles.menuBtn}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        activeOpacity={0.75}
      >
        <Ionicons name="menu-outline" size={24} color="#FFF3D6" />
      </TouchableOpacity>

      {/* Center: Title & Subtitle */}
      <View style={styles.titleCol}>
        <Text style={styles.titleText} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.subtitleText} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>

      {/* Right: Custom Action or Notifications */}
      <View style={styles.rightActionWrap}>
        {rightAction ? (
          rightAction
        ) : (
          <TouchableOpacity
            style={styles.notifBtn}
            activeOpacity={0.75}
            onPress={handleMenuPress}
          >
            <Ionicons name="notifications-outline" size={20} color="#FFD79E" />
            <View style={styles.notifDot} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm + 2,
    backgroundColor: '#160B05',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(212, 163, 115, 0.2)',
  },
  menuBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1405',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.25)',
  },
  titleCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
  },
  titleText: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF3D6',
    letterSpacing: 0.3,
  },
  subtitleText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    letterSpacing: 1,
    marginTop: -2,
  },
  rightActionWrap: {
    width: 38,
    alignItems: 'flex-end',
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#2A1405',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.25)',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#C92929',
    borderWidth: 1,
    borderColor: '#160B05',
  },
});

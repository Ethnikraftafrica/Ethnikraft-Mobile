import React, { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, setRole } from '@/store/slices/authSlice';
import { ThemeMode } from '@/store/slices/themeSlice';
import { CurrencyPickerModal } from '@/components/common/CurrencyPickerModal';
import { setCurrency, SUPPORTED_CURRENCIES } from '@/store/slices/currencySlice';
import { useAppTheme } from '@/hooks/useAppTheme';
import { FontFamily, Radius, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.82, 330);

interface ArtisanDrawerMenuProps {
  visible: boolean;
  onClose: () => void;
}

export const ArtisanDrawerMenu: React.FC<ArtisanDrawerMenuProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const currentCurrency = useAppSelector((state) => state.currency);
  const { theme, isDark, mode, setThemeMode } = useAppTheme();
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  // Exact 11 navigation links from Ethnikraft-Vendor web portal (sidenav.tsx & desktopSideNav.tsx)
  const menuLinks = [
    { label: 'Dashboard',  route: '/(vendor)',          icon: 'stats-chart-outline',        activeIcon: 'stats-chart' },
    { label: 'Products',   route: '/(vendor)/catalog',  icon: 'cube-outline',               activeIcon: 'cube' },
    { label: 'Orders',     route: '/(vendor)/orders',   icon: 'receipt-outline',            activeIcon: 'receipt' },
    { label: 'Profile',    route: '/(vendor)/profile',  icon: 'person-outline',             activeIcon: 'person' },
    { label: 'Studio',     route: '/(vendor)/studio',   icon: 'color-palette-outline',      activeIcon: 'color-palette' },
    { label: 'Customers',  route: '/(vendor)/orders',   icon: 'people-outline',             activeIcon: 'people' },
    { label: 'Catalog',    route: '/(vendor)/catalog',  icon: 'grid-outline',               activeIcon: 'grid' },
    { label: 'Statistics', route: '/(vendor)',          icon: 'bar-chart-outline',          activeIcon: 'bar-chart' },
    { label: 'Settings',   route: '/(vendor)/settings', icon: 'settings-outline',           activeIcon: 'settings' },
    { label: 'Messenger',  route: '/(vendor)/requests', icon: 'chatbubbles-outline',        activeIcon: 'chatbubbles' },
    { label: 'Requests',   route: '/(vendor)/requests', icon: 'hammer-outline',             activeIcon: 'hammer' },
  ];

  const handleNavigate = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 150);
  };

  const handleSwitchToCustomerMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
    setTimeout(() => {
      dispatch(setRole('user'));
      router.replace('/(user)');
    }, 150);
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out of Workshop?',
      'Are you sure you want to sign out of your Artisan account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: () => {
            onClose();
            dispatch(logout());
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleSelectTheme = (newMode: ThemeMode) => {
    setThemeMode(newMode);
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalContainer}>
        {/* Backdrop */}
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onClose}
          />
        </Animated.View>

        {/* Sliding Drawer Container with Dynamic Theme Gradient */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 16),
              backgroundColor: isDark ? '#17120F' : theme.background,
            },
          ]}
        >
          {!isDark && (
            <LinearGradient
              colors={theme.drawerBackgroundGradient}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />
          )}

          {/* Right Edge Golden Rim */}
          <View
            style={[
              styles.rightBorderGoldenRim,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : theme.drawerBorder },
            ]}
          />

          {/* Workshop Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View
                style={[
                  styles.avatarCircle,
                  {
                    backgroundColor: isDark ? '#191919' : '#FCF4E1',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.primary,
                  },
                ]}
              >
                <Ionicons
                  name="storefront"
                  size={26}
                  color={isDark ? '#FFFFFF' : theme.primary}
                />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#009D1A" />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={[styles.workshopName, { color: theme.textPrimary }]} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Workshop`}
              </Text>
              <Text style={[styles.workshopEmail, { color: theme.textMuted }]} numberOfLines={1}>
                {user?.email || 'artisan@ethnikraft.com'}
              </Text>
              
              {/* Tier Badge */}
              <View
                style={[
                  styles.tierPill,
                  {
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#FEF3C7',
                    borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : theme.primary,
                  },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={11}
                  color={isDark ? '#CBD2CF' : theme.primary}
                  style={{ marginRight: 4 }}
                />
                <Text
                  style={[
                    styles.tierPillText,
                    { color: isDark ? '#FFFFFF' : theme.primary },
                  ]}
                >
                  {vendor?.status === 'APPROVED' ? 'MASTER ARTISAN' : 'VERIFIED ARTISAN'}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Drawer Menu List (Exact Ethnikraft-Vendor Web Sidebar Items) */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuScrollContent}
          >
            {menuLinks.map((item) => {
              const isSelected =
                pathname === item.route ||
                (item.route === '/(vendor)' && pathname === '/(vendor)/index');

              return (
                <TouchableOpacity
                  key={item.label}
                  style={[
                    styles.menuItem,
                    isSelected && [
                      styles.menuItemActive,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(196, 108, 39, 0.12)',
                        borderColor: theme.borderSubtle,
                      },
                    ],
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconCircle,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : '#FFFFFF',
                        borderColor: theme.borderSubtle,
                      },
                      isSelected && {
                        backgroundColor: isDark ? '#191919' : '#FEF3C7',
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <Ionicons
                      name={(isSelected ? item.activeIcon : item.icon) as any}
                      size={18}
                      color={
                        isSelected
                          ? isDark
                            ? '#FFF3D6'
                            : theme.primary
                          : theme.textMuted
                      }
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      { color: isSelected ? theme.textPrimary : theme.textMuted },
                      isSelected && styles.menuItemTitleActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View
                      style={[
                        styles.activePillDot,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={[styles.divider, { backgroundColor: theme.borderSubtle }]} />

          {/* Theme Mode Selector Pill */}
          <View style={styles.themeSelectorRow}>
            <Text style={[styles.themeLabel, { color: theme.textMuted }]}>APPEARANCE</Text>
            <View style={[styles.themePillContainer, { backgroundColor: isDark ? '#191919' : '#EFE1C3' }]}>
              <TouchableOpacity
                style={[styles.themeSegment, mode === 'light' && styles.themeSegmentActive]}
                onPress={() => handleSelectTheme('light')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="sunny"
                  size={14}
                  color={mode === 'light' ? '#FFFFFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    { color: mode === 'light' ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeSegment, mode === 'dark' && styles.themeSegmentActive]}
                onPress={() => handleSelectTheme('dark')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="moon"
                  size={13}
                  color={mode === 'dark' ? '#FFFFFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    { color: mode === 'dark' ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.themeSegment, mode === 'system' && styles.themeSegmentActive]}
                onPress={() => handleSelectTheme('system')}
                activeOpacity={0.75}
              >
                <Ionicons
                  name="phone-portrait-outline"
                  size={13}
                  color={mode === 'system' ? '#FFFFFF' : theme.textMuted}
                />
                <Text
                  style={[
                    styles.themeSegmentText,
                    { color: mode === 'system' ? '#FFFFFF' : theme.textMuted },
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Currency Selector Pill */}
          <View style={[styles.themeSelectorRow, { marginTop: 8 }]}>
            <Text style={[styles.themeLabel, { color: theme.textMuted }]}>CURRENCY</Text>
            <View style={[styles.themePillContainer, { backgroundColor: isDark ? '#191919' : '#EFE1C3' }]}>
              {Object.values(SUPPORTED_CURRENCIES).map((c) => {
                const isSelected = currentCurrency.code === c.code;
                return (
                  <TouchableOpacity
                    key={c.code}
                    style={[
                      styles.currencySegment,
                      isSelected && styles.themeSegmentActive,
                    ]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      dispatch(setCurrency(c.code));
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.currencySegmentFlag}>{c.flag}</Text>
                    <Text
                      style={[
                        styles.themeSegmentText,
                        { color: isSelected ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            {/* Switch to Customer Mode */}
            <TouchableOpacity
              style={styles.customerSwitchBtn}
              onPress={handleSwitchToCustomerMode}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle-outline" size={17} color="#FFF3D6" style={{ marginRight: 8 }} />
              <Text style={styles.customerSwitchText}>Switch to Customer Mode</Text>
            </TouchableOpacity>

            {/* Logout */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={17} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.signOutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>

      {/* Currency Picker Modal */}
      <CurrencyPickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    height: '100%',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 20,
  },
  rightBorderGoldenRim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1.5,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.md,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  workshopName: {
    fontSize: 15,
    fontFamily: FontFamily.poppinsBold,
  },
  workshopEmail: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  tierPillText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.xs,
  },
  menuScroll: {
    flex: 1,
  },
  menuScrollContent: {
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginVertical: 1.5,
  },
  menuItemActive: {
    borderWidth: 1,
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.poppinsMedium,
    marginLeft: Spacing.sm + 4,
  },
  menuItemTitleActive: {
    fontFamily: FontFamily.poppinsBold,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  themeSelectorRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  themeLabel: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.8,
    marginBottom: 4,
    marginLeft: 2,
  },
  themePillContainer: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
    justifyContent: 'space-between',
  },
  themeSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 4,
  },
  themeSegmentActive: {
    backgroundColor: '#C46C27',
  },
  themeSegmentText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
  },
  currencySegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: Radius.full,
    gap: 3,
  },
  currencySegmentFlag: {
    fontSize: 11,
  },
  footerActions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.xs,
    gap: Spacing.xs,
  },
  customerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 11,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.45)',
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  customerSwitchText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF3D6',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
  },
  signOutText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#C92929',
  },
});

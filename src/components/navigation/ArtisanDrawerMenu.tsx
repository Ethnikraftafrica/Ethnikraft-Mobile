import React, { useEffect, useRef } from 'react';
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
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

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
    { label: 'Profile',    route: '/(vendor)/store',    icon: 'person-outline',             activeIcon: 'person' },
    { label: 'Studio',     route: '/(vendor)/requests', icon: 'color-palette-outline',      activeIcon: 'color-palette' },
    { label: 'Customers',  route: '/(vendor)/orders',   icon: 'people-outline',             activeIcon: 'people' },
    { label: 'Catalog',    route: '/(vendor)/catalog',  icon: 'grid-outline',               activeIcon: 'grid' },
    { label: 'Statistics', route: '/(vendor)',          icon: 'bar-chart-outline',          activeIcon: 'bar-chart' },
    { label: 'Settings',   route: '/(vendor)/store',    icon: 'settings-outline',           activeIcon: 'settings' },
    { label: 'Messenger',  route: '/(vendor)/requests', icon: 'chatbubbles-outline',        activeIcon: 'chatbubbles' },
    { label: 'Requests',   route: '/(vendor)/requests', icon: 'mail-unread-outline',        activeIcon: 'mail-unread' },
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

        {/* Sliding Drawer Container */}
        <Animated.View
          style={[
            styles.drawerContent,
            {
              transform: [{ translateX: slideAnim }],
              paddingTop: Math.max(insets.top, 24),
              paddingBottom: Math.max(insets.bottom, 16),
            },
          ]}
        >
          <LinearGradient
            colors={['#24140A', '#160B05', '#0D0602']}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          />

          {/* Right Edge Golden Rim */}
          <View style={styles.rightBorderGoldenRim} />

          {/* Workshop Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Ionicons name="storefront" size={26} color="#FFD79E" />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={15} color="#009D1A" />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.workshopName} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Workshop`}
              </Text>
              <Text style={styles.workshopEmail} numberOfLines={1}>
                {user?.email || 'artisan@ethnikraft.com'}
              </Text>
              
              {/* Tier Badge */}
              <View style={styles.tierPill}>
                <Ionicons name="shield-checkmark" size={11} color="#FFD79E" style={{ marginRight: 4 }} />
                <Text style={styles.tierPillText}>
                  {vendor?.status === 'APPROVED' ? 'MASTER ARTISAN' : 'VERIFIED ARTISAN'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

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
                    isSelected && styles.menuItemActive,
                  ]}
                  onPress={() => handleNavigate(item.route)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.menuIconCircle,
                      isSelected && styles.menuIconCircleActive,
                    ]}
                  >
                    <Ionicons
                      name={(isSelected ? item.activeIcon : item.icon) as any}
                      size={18}
                      color={isSelected ? '#FFD79E' : '#9E8C7A'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.menuItemTitle,
                      isSelected && styles.menuItemTitleActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                  {isSelected && (
                    <View style={styles.activePillDot} />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.divider} />

          {/* Footer Actions */}
          <View style={styles.footerActions}>
            {/* Switch to Customer Mode */}
            <TouchableOpacity
              style={styles.customerSwitchBtn}
              onPress={handleSwitchToCustomerMode}
              activeOpacity={0.8}
            >
              <Ionicons name="bag-handle-outline" size={17} color="#341302" style={{ marginRight: 8 }} />
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
    backgroundColor: '#160B05',
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 20,
  },
  rightBorderGoldenRim: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1.5,
    backgroundColor: 'rgba(212, 163, 115, 0.35)',
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
    backgroundColor: '#381A05',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#C46C27',
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
    color: '#FFF3D6',
  },
  workshopEmail: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#9E8C7A',
    marginTop: 1,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.4)',
    alignSelf: 'flex-start',
    marginTop: 5,
  },
  tierPillText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFD79E',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(212, 163, 115, 0.16)',
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
    backgroundColor: 'rgba(196, 108, 39, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.25)',
  },
  menuIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(61, 30, 8, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.18)',
  },
  menuIconCircleActive: {
    backgroundColor: '#662502',
    borderColor: '#FFD79E',
  },
  menuItemTitle: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.poppinsMedium,
    color: '#9E8C7A',
    marginLeft: Spacing.sm + 4,
  },
  menuItemTitleActive: {
    color: '#FFF3D6',
    fontFamily: FontFamily.poppinsBold,
  },
  activePillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFD79E',
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
    backgroundColor: '#FFD79E',
    paddingVertical: 11,
    borderRadius: Radius.md,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  customerSwitchText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    color: '#341302',
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

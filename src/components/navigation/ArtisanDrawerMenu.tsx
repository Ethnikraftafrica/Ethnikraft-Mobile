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
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
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

          {/* Golden Highlight Border along the Right Edge */}
          <View style={styles.rightBorderGoldenRim} />

          {/* Workshop Profile Header */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                <Ionicons name="storefront" size={28} color="#FFD79E" />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#009D1A" />
              </View>
            </View>

            <View style={styles.profileInfoCol}>
              <Text style={styles.workshopName} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Studio`}
              </Text>
              <Text style={styles.workshopEmail} numberOfLines={1}>
                {user?.email || 'artisan@ethnikraft.com'}
              </Text>
              
              {/* Tier Badge */}
              <View style={styles.tierPill}>
                <Ionicons name="shield-checkmark" size={12} color="#FFD79E" style={{ marginRight: 4 }} />
                <Text style={styles.tierPillText}>
                  {vendor?.status === 'APPROVED' ? 'MASTER ARTISAN' : 'VERIFIED ARTISAN'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Drawer Menu List */}
          <ScrollView
            style={styles.menuScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuScrollContent}
          >
            {/* Domain Sections */}
            <Text style={styles.sectionHeader}>FINANCES & OPERATIONS</Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(vendor)/payouts')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="wallet-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Settlements & Escrow</Text>
                <Text style={styles.menuItemSubtitle}>Wallet balance, payouts & history</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(vendor)/requests')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="hammer-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Bespoke Requests</Text>
                <Text style={styles.menuItemSubtitle}>Client inquiries & quote bids</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(vendor)/orders')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="bag-check-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Fulfillment Pipeline</Text>
                <Text style={styles.menuItemSubtitle}>Active shipping & delivery</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>

            <Text style={[styles.sectionHeader, { marginTop: Spacing.md }]}>
              WORKSHOP & BRANDING
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(vendor)/store')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="storefront-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Atelier Storefront</Text>
                <Text style={styles.menuItemSubtitle}>Public profile, banner & story</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(vendor)/catalog')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="cube-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Craft Catalog</Text>
                <Text style={styles.menuItemSubtitle}>Manage products & stock</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => handleNavigate('/(auth)/vendor-documents')}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#3D1E08' }]}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#FFD79E" />
              </View>
              <View style={styles.menuItemTextCol}>
                <Text style={styles.menuItemTitle}>Verification Documents</Text>
                <Text style={styles.menuItemSubtitle}>CAC & artisan certifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#9E8C7A" />
            </TouchableOpacity>
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
              <Ionicons name="bag-handle-outline" size={18} color="#341302" style={{ marginRight: 8 }} />
              <Text style={styles.customerSwitchText}>Switch to Customer Mode</Text>
            </TouchableOpacity>

            {/* Sign Out */}
            <TouchableOpacity
              style={styles.signOutBtn}
              onPress={handleSignOut}
              activeOpacity={0.7}
            >
              <Ionicons name="log-out-outline" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.signOutText}>Sign Out of Workshop</Text>
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 16,
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
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.4)',
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  tierPillText: {
    fontSize: 9,
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  sectionHeader: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    color: '#9E8C7A',
    letterSpacing: 0.8,
    marginBottom: Spacing.xs,
    marginTop: Spacing.xs,
    paddingHorizontal: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    marginVertical: 2,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  menuItemTextCol: {
    flex: 1,
    marginLeft: Spacing.sm + 4,
  },
  menuItemTitle: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#FFF3D6',
  },
  menuItemSubtitle: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    color: '#9E8C7A',
    marginTop: 1,
  },
  footerActions: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.xs,
  },
  customerSwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFD79E',
    paddingVertical: 12,
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
    paddingVertical: 8,
  },
  signOutText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#C92929',
  },
});

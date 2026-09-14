import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleRole, logout } from '@/store/slices/authSlice';
import {
  syncUserFromAuth,
  syncFromFullProfile,
  syncAddresses,
  syncFavoritesCount,
  syncOrdersCount,
} from '@/store/slices/profileSlice';
import {
  useGetProfileQuery,
  useGetAddressesQuery,
  useGetFavoritesQuery,
  useGetCustomerOrdersQuery,
} from '@/store/api/profileApi';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

// Profile Modals
import EditPersonalDetailsModal from '@/components/profile/EditPersonalDetailsModal';
import SavedAddressesModal from '@/components/profile/SavedAddressesModal';
import CompleteProfileModal from '@/components/profile/CompleteProfileModal';
import ChangePasswordModal from '@/components/profile/ChangePasswordModal';
import NotificationSettingsModal from '@/components/profile/NotificationSettingsModal';
import AppearanceModal from '@/components/profile/AppearanceModal';
import AboutAndTermsModal from '@/components/profile/AboutAndTermsModal';
import FavoritesModal from '@/components/profile/FavoritesModal';
import RecentlyViewedModal from '@/components/profile/RecentlyViewedModal';
import PaymentMethodsModal from '@/components/profile/PaymentMethodsModal';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, hasVendorAccount } = useAppSelector((state) => state.auth);
  const {
    profile,
    savedAddresses,
    savedCards,
    favoritesCount,
    ordersCount,
    recentlyViewedCount,
    profileCompletionPercentage,
  } = useAppSelector((state) => state.profile);

  // RTK Query Hooks for Live Backend Data
  const {
    data: remoteProfile,
    isLoading: isProfileLoading,
    refetch: refetchProfile,
  } = useGetProfileQuery(undefined, { skip: !isAuthenticated });

  const {
    data: remoteAddresses,
    refetch: refetchAddresses,
  } = useGetAddressesQuery(undefined, { skip: !isAuthenticated });

  const {
    data: remoteFavorites,
    refetch: refetchFavorites,
  } = useGetFavoritesQuery(undefined, { skip: !isAuthenticated });

  const {
    data: remoteOrders,
    refetch: refetchOrders,
  } = useGetCustomerOrdersQuery(undefined, { skip: !isAuthenticated });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refetchProfile(),
        refetchAddresses(),
        refetchFavorites(),
        refetchOrders(),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refetchProfile, refetchAddresses, refetchFavorites, refetchOrders]);

  // Sync API Data to Redux Store
  useEffect(() => {
    if (remoteProfile) {
      dispatch(syncFromFullProfile(remoteProfile));
    }
  }, [remoteProfile, dispatch]);

  useEffect(() => {
    if (remoteAddresses) {
      dispatch(syncAddresses(remoteAddresses as any));
    }
  }, [remoteAddresses, dispatch]);

  useEffect(() => {
    if (remoteFavorites) {
      dispatch(syncFavoritesCount(remoteFavorites.length));
    }
  }, [remoteFavorites, dispatch]);

  useEffect(() => {
    if (remoteOrders) {
      dispatch(syncOrdersCount(remoteOrders.length));
    }
  }, [remoteOrders, dispatch]);

  // Modals visibility state (lazy mounted for optimal memory and FPS)
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showAddresses, setShowAddresses] = useState(false);
  const [showCompleteWizard, setShowCompleteWizard] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showAboutTerms, setShowAboutTerms] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showRecentlyViewed, setShowRecentlyViewed] = useState(false);
  const [showPaymentMethods, setShowPaymentMethods] = useState(false);

  // Sync auth user details into profile state on load
  useEffect(() => {
    if (user) {
      dispatch(
        syncUserFromAuth({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        })
      );
    }
  }, [user, dispatch]);

  const handleSwitchToVendor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(toggleRole());
    router.replace('/(vendor)');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Ethnikraft account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || 'Ethnikraft Patron';
  const displayEmail = profile.email || 'patron@ethnikraft.africa';
  const initial = (profile.firstName?.[0] || 'E').toUpperCase();

  const displayedAddressesCount = remoteAddresses?.length ?? savedAddresses.length;
  const displayedFavoritesCount = remoteFavorites?.length ?? favoritesCount;
  const displayedOrdersCount = remoteOrders?.length ?? ordersCount;

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#C46C27"
            colors={['#C46C27']}
          />
        }
      >
        {/* Profile Identity Card */}
        {isAuthenticated ? (
          <View style={[styles.profileCard, Shadows.md]}>
            <View style={styles.cardPatternBar} />
            <View style={styles.cardInner}>
              <View style={styles.avatarRow}>
                <View style={styles.avatarContainer}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.avatarEditBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setShowEditDetails(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="pencil" size={13} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <View style={styles.identityDetails}>
                  <Text style={styles.userName}>{displayName}</Text>
                  <Text style={styles.userEmail}>{displayEmail}</Text>
                  <View style={styles.badgeRow}>
                    <View style={styles.verifiedBadge}>
                      <Ionicons name="checkmark-circle" size={13} color="#166534" />
                      <Text style={styles.verifiedText}>Verified Patron</Text>
                    </View>
                    {profile.profileName ? (
                      <View style={styles.handleBadge}>
                        <Text style={styles.handleText}>@{profile.profileName}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* Complete Profile Progress Callout */}
              <TouchableOpacity
                style={styles.progressCallout}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowCompleteWizard(true);
                }}
                activeOpacity={0.88}
              >
                <View style={styles.progressTextCol}>
                  <View style={styles.progressTitleRow}>
                    <Ionicons name="sparkles" size={14} color="#C46C27" style={{ marginRight: 4 }} />
                    <Text style={styles.progressTitle}>Complete Your Profile</Text>
                  </View>
                  <Text style={styles.progressSub}>
                    Add your custom body dimensions and delivery destinations
                  </Text>
                </View>

                <View style={styles.progressBadgeCircle}>
                  <Text style={styles.progressBadgeText}>{profileCompletionPercentage}%</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={[styles.guestCard, Shadows.sm]}>
            <View style={styles.guestIcon}>
              <Ionicons name="person-outline" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.guestTitle}>Welcome to Ethnikraft</Text>
            <Text style={styles.guestSubtitle}>
              Sign in to track orders, save bespoke measurements, and commission master artisans.
            </Text>
            <TouchableOpacity
              style={styles.signInBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/login');
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.signInBtnText}>Sign In or Register</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        )}

        {/* Artisan Vendor Switcher Banner */}
        <TouchableOpacity
          style={[styles.vendorSwitchCard, Shadows.sm]}
          onPress={handleSwitchToVendor}
          activeOpacity={0.85}
        >
          <View style={styles.switchIconCircle}>
            <Ionicons name="briefcase" size={20} color="#F5EBD5" />
          </View>
          <View style={styles.switchTextContainer}>
            <Text style={styles.switchTitle}>
              {hasVendorAccount ? 'Switch to Artisan Vendor Hub' : 'Artisan Workshop Mode'}
            </Text>
            <Text style={styles.switchSubtitle}>
              Manage workshop catalog, client commissions, and order fulfillment
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#C46C27" />
        </TouchableOpacity>

        {/* Section: Account & Addresses */}
        <Text style={styles.sectionHeader}>ACCOUNT</Text>
        <View style={[styles.menuSection, Shadows.sm]}>
          {/* Personal Details */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.selectionAsync();
              setShowEditDetails(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="person" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Personal Details</Text>
              <Text style={styles.menuSubtitle}>Contact name, phone number, and address</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Delivery Addresses */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAddresses(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="location" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Delivery Addresses</Text>
              <Text style={styles.menuSubtitle}>Manage shipping destinations</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{displayedAddressesCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Custom Measurements */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowCompleteWizard(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="cut" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Custom Measurements</Text>
              <Text style={styles.menuSubtitle}>Bespoke tailoring, shoes, and ring sizing</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* My Orders */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/(user)/orders');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="cube" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>My Orders</Text>
              <Text style={styles.menuSubtitle}>Track recent shipments and order history</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{displayedOrdersCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Payment & Cards */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowPaymentMethods(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="card" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Payment Methods</Text>
              <Text style={styles.menuSubtitle}>Saved cards and billing</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{savedCards.length}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>
        </View>

        {/* Section: Activity */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>ACTIVITY</Text>
        <View style={[styles.menuSection, Shadows.sm]}>
          {/* Favorites */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.selectionAsync();
              setShowFavorites(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="heart" size={18} color="#DC2626" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Saved Favorites</Text>
              <Text style={styles.menuSubtitle}>Artisan masterpieces in your wishlist</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{displayedFavoritesCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Recently Viewed */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowRecentlyViewed(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="eye" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Recently Viewed</Text>
              <Text style={styles.menuSubtitle}>Browse your recent artisan discoveries</Text>
            </View>
            <View style={styles.counterBadge}>
              <Text style={styles.counterText}>{recentlyViewedCount}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>
        </View>

        {/* Section: Preferences & Security */}
        <Text style={[styles.sectionHeader, { marginTop: Spacing.lg }]}>PREFERENCES & SECURITY</Text>
        <View style={[styles.menuSection, Shadows.sm]}>
          {/* Notifications */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              Haptics.selectionAsync();
              setShowNotifications(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="notifications" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Notifications</Text>
              <Text style={styles.menuSubtitle}>Order milestones and artisan bids</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Change Password */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowChangePassword(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="lock-closed" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>Change Password</Text>
              <Text style={styles.menuSubtitle}>Update login security credentials</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* Appearance Palette */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAppearance(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="color-palette" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>App Appearance</Text>
              <Text style={styles.menuSubtitle}>System default, Ivory light, Ebony dark</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>

          {/* About & Terms */}
          <TouchableOpacity
            style={[styles.menuItem, styles.menuItemBorder]}
            onPress={() => {
              Haptics.selectionAsync();
              setShowAboutTerms(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.menuIconCircle, { backgroundColor: '#F8EFE4' }]}>
              <Ionicons name="information-circle" size={18} color="#662502" />
            </View>
            <View style={styles.menuTextContainer}>
              <Text style={styles.menuTitle}>About & Legal Terms</Text>
              <Text style={styles.menuSubtitle}>Authenticity guarantee & membership agreement</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#A8998A" />
          </TouchableOpacity>
        </View>

        {/* Section: Sign Out */}
        {isAuthenticated && (
          <View style={[styles.logoutSection, Shadows.sm]}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginRight: 8 }} />
              <Text style={styles.logoutText}>Sign Out of Ethnikraft</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sub-modals (conditionally mounted to minimize RAM consumption and eliminate memory overhead when hidden) */}
      {showEditDetails && (
        <EditPersonalDetailsModal
          visible={showEditDetails}
          onClose={() => setShowEditDetails(false)}
        />
      )}

      {showAddresses && (
        <SavedAddressesModal
          visible={showAddresses}
          onClose={() => setShowAddresses(false)}
        />
      )}

      {showCompleteWizard && (
        <CompleteProfileModal
          visible={showCompleteWizard}
          onClose={() => setShowCompleteWizard(false)}
        />
      )}

      {showChangePassword && (
        <ChangePasswordModal
          visible={showChangePassword}
          onClose={() => setShowChangePassword(false)}
        />
      )}

      {showNotifications && (
        <NotificationSettingsModal
          visible={showNotifications}
          onClose={() => setShowNotifications(false)}
        />
      )}

      {showAppearance && (
        <AppearanceModal
          visible={showAppearance}
          onClose={() => setShowAppearance(false)}
        />
      )}

      {showAboutTerms && (
        <AboutAndTermsModal
          visible={showAboutTerms}
          onClose={() => setShowAboutTerms(false)}
        />
      )}

      {showFavorites && (
        <FavoritesModal
          visible={showFavorites}
          onClose={() => setShowFavorites(false)}
        />
      )}

      {showRecentlyViewed && (
        <RecentlyViewedModal
          visible={showRecentlyViewed}
          onClose={() => setShowRecentlyViewed(false)}
        />
      )}

      {showPaymentMethods && (
        <PaymentMethodsModal
          visible={showPaymentMethods}
          onClose={() => setShowPaymentMethods(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 160,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardPatternBar: {
    height: 14,
    backgroundColor: '#341B00',
  },
  cardInner: {
    padding: Spacing.md,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#EFE7DA',
  },
  avatarText: {
    color: '#F5EBD5',
    fontSize: 24,
    fontWeight: '900',
  },
  avatarEditBtn: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  identityDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#341B00',
  },
  userEmail: {
    fontSize: 12,
    color: '#662502',
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 3,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  handleBadge: {
    backgroundColor: '#FAF7F2',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  handleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#662502',
  },
  progressCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    padding: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: '#E8DCCB',
  },
  progressTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  progressTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#341B00',
  },
  progressSub: {
    fontSize: 10,
    color: '#662502',
    lineHeight: 14,
  },
  progressBadgeCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C46C27',
  },
  progressBadgeText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#F5EBD5',
  },
  guestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    marginBottom: Spacing.md,
  },
  guestIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8EFE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  guestTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C46C27',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    gap: 6,
  },
  signInBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  vendorSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2D5C3',
    marginBottom: Spacing.md,
  },
  switchIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontWeight: '800',
    color: '#341B00',
  },
  switchSubtitle: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
    lineHeight: 15,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginLeft: 4,
  },
  menuSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xs,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3EDE2',
  },
  menuIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  counterBadge: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginRight: 6,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#662502',
  },
  logoutSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#FFF5F5',
  },
  logoutText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#DC2626',
  },
});

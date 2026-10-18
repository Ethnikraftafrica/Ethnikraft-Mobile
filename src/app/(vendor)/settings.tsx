import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Share,
  Clipboard,
  RefreshControl,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppDispatch, useAppSelector } from '@/store';
import { logout, setRole } from '@/store/slices/authSlice';
import { ThemeMode } from '@/store/slices/themeSlice';
import { CurrencyPickerModal } from '@/components/common/CurrencyPickerModal';
import {
  useGetVendorProfileQuery,
  useUpdateVendorSettingsMutation,
  useUpdateVendorBrandingMutation,
} from '@/store/api/vendorApi';
import { VendorSettingsSkeleton } from '@/components/common/Skeletons';

export type StoreAvailability = 'ONLINE' | 'AWAY' | 'OFFLINE';

export default function VendorSettingsScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { theme, isDark, mode, setThemeMode } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const currentCurrency = useAppSelector((state) => state.currency);

  // ─── RTK Query Integration ──────────────────────────────────────────────────
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: profileError,
    refetch: refetchProfile,
  } = useGetVendorProfileQuery();

  const [updateVendorSettingsMutation, { isLoading: isUpdatingSettings }] = useUpdateVendorSettingsMutation();
  const [updateVendorBrandingMutation, { isLoading: isUpdatingBranding }] = useUpdateVendorBrandingMutation();

  const [refreshing, setRefreshing] = useState(false);

  // ─── Local State: Operational Settings ──────────────────────────────────────
  const [storeStatus, setStoreStatus] = useState<StoreAvailability>('ONLINE');
  const [awayMessage, setAwayMessage] = useState(
    'Our atelier is currently preparing bespoke collections. Orders placed will be processed promptly upon our return.'
  );
  const [openForStudio, setOpenForStudio] = useState(true);
  const [openTime, setOpenTime] = useState('08:00 AM');
  const [closeTime, setCloseTime] = useState('06:00 PM');
  const [preferredLogistics, setPreferredLogistics] = useState('Ethnikraft Logistics (Recommended)');

  // ─── Security & Credentials State ───────────────────────────────────────────
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // ─── Notification Toggles ───────────────────────────────────────────────────
  const [notifyOrders, setNotifyOrders] = useState(true);
  const [notifyEscrow, setNotifyEscrow] = useState(true);
  const [notifyLowStock, setNotifyLowStock] = useState(true);
  const [lowStockThreshold, setLowStockThreshold] = useState(5);
  const [notifyMessages, setNotifyMessages] = useState(true);
  const [notifyMarketing, setNotifyMarketing] = useState(false);

  // Synchronize backend profile settings into local state
  React.useEffect(() => {
    if (profileData) {
      if (typeof profileData.notificationsEnabled === 'boolean') {
        setNotifyOrders(profileData.notificationsEnabled);
        setNotifyEscrow(profileData.notificationsEnabled);
        setNotifyMessages(profileData.notificationsEnabled);
      }
      if (profileData.description) {
        setAwayMessage(profileData.description);
      }
    }
  }, [profileData]);

  // ─── Modals State (ALL STRICTLY WITH statusBarTranslucent) ───────────────────
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [hoursModalVisible, setHoursModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [commissionModalVisible, setCommissionModalVisible] = useState(false);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [currencyModalVisible, setCurrencyModalVisible] = useState(false);

  // Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Email Form
  const [newEmail, setNewEmail] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(msg);
    setToastType(type);
    if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setToastMessage(null), 3200);
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleCopyStoreLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const storeSlug = vendor?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'artisan-atelier';
    const link = `https://ethnikraft.com/store/${storeSlug}`;
    Clipboard.setString(link);
    showToast('Public Storefront URL copied to clipboard');
  };

  const handleShareStoreLink = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      const storeSlug = vendor?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'artisan-atelier';
      await Share.share({
        title: `${vendor?.businessName || 'Artisan Atelier'} on Ethnikraft`,
        message: `Explore authentic African crafts and heritage masterpieces from my atelier on Ethnikraft: https://ethnikraft.com/store/${storeSlug}`,
      });
    } catch {}
  };

  const handleSwitchToCollectorMode = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    dispatch(setRole('user'));
    router.replace('/(user)');
  };

  const handleConfirmLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLogoutModalVisible(false);
    dispatch(logout());
    router.replace('/(auth)/login');
  };

  const handleSavePassword = () => {
    if (!currentPassword.trim()) {
      showToast('Enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match');
      return;
    }
    setPasswordModalVisible(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    showToast('Atelier security password updated');
  };

  const handleSaveEmail = () => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      showToast('Enter a valid email address');
      return;
    }
    setEmailModalVisible(false);
    setNewEmail('');
    showToast('Verification link sent to new email');
  };

  // Status visual badge helpers
  const getStatusConfig = (st: StoreAvailability) => {
    switch (st) {
      case 'ONLINE':
        return {
          label: 'Accepting Orders',
          pillBg: isDark ? 'rgba(10, 210, 79, 0.16)' : '#EAFBF0',
          pillBorder: '#0AD24F',
          textColor: '#0AD24F',
          dotColor: '#0AD24F',
          icon: 'radio-button-on' as const,
        };
      case 'AWAY':
        return {
          label: 'Holiday / Away Mode',
          pillBg: isDark ? 'rgba(245, 158, 11, 0.16)' : '#FEF3C7',
          pillBorder: '#F59E0B',
          textColor: '#D97706',
          dotColor: '#F59E0B',
          icon: 'pause-circle' as const,
        };
      case 'OFFLINE':
      default:
        return {
          label: 'Storefront Offline',
          pillBg: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F3F4F6',
          pillBorder: theme.borderSubtle,
          textColor: theme.textSecondary,
          dotColor: '#9CA3AF',
          icon: 'radio-button-off' as const,
        };
    }
  };

  const currentStatusConfig = getStatusConfig(storeStatus);

  const displayBusinessName = profileData?.businessName || vendor?.businessName || 'Atelier Workshop';
  const displayEmail = profileData?.businessEmail || user?.email || 'artisan@ethnikraft.com';
  const displayLogo = profileData?.businessLogo || (vendor as any)?.businessLogo || (vendor as any)?.business_logo;
  const artisanInitial =
    (user?.firstName?.[0] || displayBusinessName[0] || 'A').toUpperCase();

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetchProfile();
    } catch (_err) {
      // Handled silently
    } finally {
      setRefreshing(false);
    }
  };

  const LOGISTICS_PARTNERS = [
    'Ethnikraft Logistics (Recommended)',
    'DHL Express Worldwide',
    'FedEx African Freight',
    'UPS Air Priority',
    'Local Courier Service',
    'Self-Pickup at Workshop',
  ];

  const TIME_OPTIONS = [
    '07:00 AM', '08:00 AM', '09:00 AM', '10:00 AM',
    '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM',
  ];

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      {/* ── Toast Notification Pill ────────────────────────────────────────── */}
      {toastMessage && (
        <View style={styles.toastFloatingWrapper} pointerEvents="none">
          <View
            style={[
              styles.toastPill,
              {
                backgroundColor: toastType === 'error'
                  ? (isDark ? '#3E1B1B' : '#FEF2F2')
                  : (isDark ? '#262626' : '#341B00'),
                borderColor: toastType === 'error' ? '#EF4444' : theme.primary,
              },
            ]}
          >
            <Ionicons
              name={toastType === 'error' ? 'alert-circle' : 'checkmark-circle'}
              size={16}
              color={toastType === 'error' ? '#EF4444' : '#0AD24F'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.toastText,
                toastType === 'error' && { color: isDark ? '#FCA5A5' : '#991B1B' }
              ]}
              numberOfLines={2}
            >
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.mainScroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Spacing.md,
            paddingBottom: Math.max(insets.bottom, 16) + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Error Banner with Retry */}
        {profileError && (
          <View
            style={{
              marginBottom: Spacing.sm,
              padding: Spacing.sm,
              borderRadius: Radius.md,
              backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2',
              borderColor: isDark ? 'rgba(239, 68, 68, 0.3)' : '#FCA5A5',
              borderWidth: 1,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
              <Ionicons name="cloud-offline-outline" size={18} color="#EF4444" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, color: theme.textSecondary, flexShrink: 1 }}>
                Unable to sync live profile settings. Tap retry.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => refetchProfile()}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 5,
                borderRadius: Radius.sm,
                backgroundColor: '#EF4444',
              }}
              activeOpacity={0.8}
            >
              <Text style={{ color: '#FFFFFF', fontSize: 11, fontFamily: FontFamily.poppinsSemiBold }}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Loading Skeleton */}
        {isProfileLoading && !profileData ? (
          <VendorSettingsSkeleton />
        ) : (
          <>
            {/* ── 1. Atelier Executive Identity Header ───────────────────────────── */}
            <View
              style={[
                styles.identityHeaderCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.identityTopRow}>
                {/* Medallion Avatar */}
                <View
                  style={[
                    styles.avatarMedallion,
                    {
                      backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FCF4E1',
                      borderColor: theme.primary,
                      overflow: 'hidden',
                    },
                  ]}
                >
                  {displayLogo ? (
                    <Image source={{ uri: displayLogo }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Text style={[styles.avatarInitialText, { color: theme.primary }]}>
                      {artisanInitial}
                    </Text>
                  )}
                </View>

                <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[styles.artisanBusinessName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {displayBusinessName}
                    </Text>
                    <Ionicons name="checkmark-circle" size={16} color="#D4A373" />
                  </View>

                  <Text style={[styles.artisanSubEmail, { color: theme.textSecondary }]} numberOfLines={1}>
                    {displayEmail}
                  </Text>

              <View style={styles.roleBadgeRow}>
                <View
                  style={[
                    styles.masterBadgePill,
                    {
                      backgroundColor: isDark ? 'rgba(212, 163, 115, 0.16)' : '#FCF4E1',
                      borderColor: '#D4A373',
                    },
                  ]}
                >
                  <Ionicons name="trophy" size={11} color="#D4A373" style={{ marginRight: 4 }} />
                  <Text style={styles.masterBadgeText}>TOP 1% MASTER ARTISAN</Text>
                </View>
              </View>
            </View>

            {/* Quick Share / Preview Icon */}
            <TouchableOpacity
              style={[
                styles.headerActionBtn,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#F5EBD5' },
              ]}
              onPress={handleShareStoreLink}
              activeOpacity={0.7}
            >
              <Ionicons name="share-social-outline" size={18} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {/* Interactive Availability Bar */}
          <View style={[styles.statusDivider, { backgroundColor: theme.borderSubtle }]} />

          <View style={styles.availabilityRow}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[styles.availabilityLabel, { color: theme.textSecondary }]}>
                Storefront Availability
              </Text>
              <Text style={[styles.availabilitySub, { color: theme.textPrimary }]}>
                {currentStatusConfig.label}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.statusSelectPill,
                {
                  backgroundColor: currentStatusConfig.pillBg,
                  borderColor: currentStatusConfig.pillBorder,
                },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusModalVisible(true);
              }}
              activeOpacity={0.75}
            >
              <Ionicons
                name={currentStatusConfig.icon}
                size={14}
                color={currentStatusConfig.textColor}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.statusSelectPillText, { color: currentStatusConfig.textColor }]}>
                Change Status
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={currentStatusConfig.textColor}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          </View>

          {/* Profile Completeness Bar */}
          <View style={styles.profileMeterContainer}>
            <View style={styles.meterHeader}>
              <Text style={[styles.meterTitle, { color: theme.textSecondary }]}>
                Atelier Profile Readiness
              </Text>
              <Text style={[styles.meterPercent, { color: theme.primary }]}>85% Complete</Text>
            </View>
            <View style={[styles.meterTrack, { backgroundColor: isDark ? '#333333' : '#E2E8F0' }]}>
              <View style={[styles.meterFill, { width: '85%', backgroundColor: theme.primary }]} />
            </View>
          </View>
        </View>

        {/* ── 2. SECTION 1: Credentials & Contact ────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Credentials & Identity
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Email Address */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setEmailModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="mail-outline" size={18} color="#C46C27" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Primary Email</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {user?.email || 'artisan@ethnikraft.com'}
              </Text>
            </View>
            <View style={styles.badgeChip}>
              <Text style={[styles.badgeChipText, { color: '#0AD24F' }]}>Verified</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Phone Number */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('Phone verification active on profile');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
              <Ionicons name="call-outline" size={18} color="#0AD24F" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Direct Telephone</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {(user as any)?.phone || (user as any)?.phoneNumber || '+234 801 234 5678'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Public Storefront URL */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={handleCopyStoreLink}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(27, 42, 74, 0.12)' }]}>
              <Ionicons name="link-outline" size={18} color={theme.primary} />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Public Atelier URL</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                ethnikraft.com/store/{vendor?.businessName?.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'atelier'}
              </Text>
            </View>
            <Ionicons name="copy-outline" size={16} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* ── 3. SECTION 2: Security & Authentication ────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Security & Authentication
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Change Password */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setPasswordModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="key-outline" size={18} color="#D4A373" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Change Password</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Updated 30 days ago
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Two-Factor Authentication */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#0AD24F" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Two-Factor Auth (2FA)</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                {twoFactorEnabled ? 'Protected via SMS & Email' : 'Disabled — Higher Risk'}
              </Text>
            </View>
            <Switch
              value={twoFactorEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTwoFactorEnabled(val);
                showToast(val ? 'Two-Factor Authentication enabled' : 'Two-Factor Authentication disabled');
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Biometric App Lock */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(27, 42, 74, 0.12)' }]}>
              <Ionicons name="finger-print-outline" size={18} color="#1B2A4A" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Biometric Passcode</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Unlock workshop with FaceID / TouchID
              </Text>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setBiometricEnabled(val);
                showToast(val ? 'Biometric security activated' : 'Biometric security deactivated');
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── 4. SECTION 3: Storefront & Operations ──────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Storefront & Craft Operations
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Studio Bespoke Projects Acceptance */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(196, 108, 39, 0.14)' }]}>
              <Ionicons name="hammer-outline" size={18} color="#C46C27" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Bespoke Studio Commissions</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Accept custom craft requests from collectors
              </Text>
            </View>
            <Switch
              value={openForStudio}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOpenForStudio(val);
                showToast(val ? 'Open for custom Studio requests' : 'Custom requests paused');
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Operating Hours & Dispatch Times */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHoursModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="time-outline" size={18} color="#D4A373" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Workshop Operating Hours</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                {openTime} – {closeTime} • Mon–Sat
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Preferred Logistics Partner */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHoursModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(85, 107, 47, 0.14)' }]}>
              <Ionicons name="cube-outline" size={18} color="#556B2F" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Default Shipping Carrier</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]} numberOfLines={1}>
                {preferredLogistics}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── 5. SECTION 4: Real-Time Alerts & Notifications ─────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Notifications & Alerts
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Order & Bid Alerts */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
              <Ionicons name="notifications-outline" size={18} color="#0AD24F" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>New Orders & Bids</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Push & email alerts when items are purchased
              </Text>
            </View>
            <Switch
              value={notifyOrders}
              onValueChange={async (val) => {
                const prev = notifyOrders;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifyOrders(val);
                try {
                  await updateVendorSettingsMutation({ notificationsEnabled: val }).unwrap();
                  showToast(val ? 'Order & Bid alerts enabled' : 'Order & Bid alerts paused');
                } catch (_err) {
                  setNotifyOrders(prev);
                  showToast('Failed to update alert settings. Reverted.', 'error');
                }
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Low Inventory Threshold Stepper */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setStockModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(239, 68, 68, 0.12)' }]}>
              <Ionicons name="alert-circle-outline" size={18} color="#EF4444" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Low Inventory Alerts</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Alert when stock reaches ≤ {lowStockThreshold} units
              </Text>
            </View>
            <View
              style={[
                styles.thresholdPill,
                { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : '#FEE2E2' },
              ]}
            >
              <Text style={styles.thresholdPillText}>≤ {lowStockThreshold}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Escrow & Payout Releases */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="cash-outline" size={18} color="#C46C27" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Escrow & Settlement Releases</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Instant notifications when funds are disbursed
              </Text>
            </View>
            <Switch
              value={notifyEscrow}
              onValueChange={async (val) => {
                const prev = notifyEscrow;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifyEscrow(val);
                try {
                  await updateVendorSettingsMutation({ notificationsEnabled: val }).unwrap();
                  showToast(val ? 'Escrow payout notifications active' : 'Escrow notifications muted');
                } catch (_err) {
                  setNotifyEscrow(prev);
                  showToast('Failed to update escrow alerts. Reverted.', 'error');
                }
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Collector Direct Messages */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(27, 42, 74, 0.12)' }]}>
              <Ionicons name="chatbubbles-outline" size={18} color="#1B2A4A" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Collector Inquiries</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Direct chat and question alerts from patrons
              </Text>
            </View>
            <Switch
              value={notifyMessages}
              onValueChange={async (val) => {
                const prev = notifyMessages;
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifyMessages(val);
                try {
                  await updateVendorSettingsMutation({ notificationsEnabled: val }).unwrap();
                  showToast(val ? 'Collector inquiry alerts active' : 'Inquiry alerts muted');
                } catch (_err) {
                  setNotifyMessages(prev);
                  showToast('Failed to update inquiry alerts. Reverted.', 'error');
                }
              }}
              trackColor={{ false: isDark ? 'rgba(255,255,255,0.1)' : '#E2E8F0', true: theme.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ── 6. SECTION 5: Appearance, Currency & Region ────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Appearance, Currency & Region
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Theme Mode Segmented Toggle */}
          <View style={styles.themeSelectorRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Atelier Appearance</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Choose interface palette
              </Text>
            </View>
            <View
              style={[
                styles.segmentedThemeContainer,
                { backgroundColor: isDark ? '#262626' : '#F5EBD5' },
              ]}
            >
              {(['system', 'light', 'dark'] as ThemeMode[]).map((tMode) => {
                const isSelected = mode === tMode;
                return (
                  <TouchableOpacity
                    key={tMode}
                    style={[
                      styles.segmentedThemeBtn,
                      isSelected && {
                        backgroundColor: isDark ? '#383838' : '#FFFFFF',
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setThemeMode(tMode);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.segmentedThemeText,
                        {
                          color: isSelected
                            ? theme.primary
                            : theme.textSecondary,
                          fontFamily: isSelected
                            ? FontFamily.headingBold
                            : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {tMode === 'system' ? 'Auto' : tMode === 'light' ? 'Light' : 'Dark'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Default Trading Currency */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCurrencyModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
              <Text style={{ fontSize: 16 }}>{currentCurrency.flag}</Text>
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Display Currency</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Live exchange rate conversions
              </Text>
            </View>
            <View
              style={[
                styles.currencyPill,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FCF4E1',
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.currencyPillText, { color: theme.textPrimary }]}>
                {currentCurrency.flag} {currentCurrency.code}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Language & Regional Standards */}
          <View style={styles.settingRow}>
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="globe-outline" size={18} color="#C46C27" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Region & Units</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                English (Nigeria) • Metric (cm, kg)
              </Text>
            </View>
            <Text style={[styles.badgeChipText, { color: theme.textMuted }]}>Default</Text>
          </View>
        </View>

        {/* ── 7. SECTION 6: Policies, Fees & Support ─────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Support & Fair Trade Standards
        </Text>
        <View
          style={[
            styles.groupCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          {/* Marketplace Commission Schedule */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setCommissionModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
              <Ionicons name="receipt-outline" size={18} color="#0AD24F" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Platform Commission Breakdown</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                10% Marketplace + 2.5% Escrow
              </Text>
            </View>
            <Ionicons name="information-circle-outline" size={18} color={theme.primary} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Artisan Heritage Standards */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('Artisan Ethics Handbook loaded');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(212, 163, 115, 0.16)' }]}>
              <Ionicons name="book-outline" size={18} color="#D4A373" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Artisan Ethics & Provenance</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Guidelines for authentic African art preservation
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <View style={[styles.rowDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Concierge Support */}
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              showToast('Artisan Concierge is available 24/7');
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: 'rgba(27, 42, 74, 0.12)' }]}>
              <Ionicons name="headset-outline" size={18} color="#1B2A4A" />
            </View>
            <View style={styles.rowCenter}>
              <Text style={[styles.rowLabel, { color: theme.textPrimary }]}>Artisan Atelier Concierge</Text>
              <Text style={[styles.rowSub, { color: theme.textSecondary }]}>
                Priority resolution for orders & disputes
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── 8. SECTION 7: Account Actions & Danger Zone ────────────────────── */}
        <Text style={[styles.sectionHeading, { color: theme.textSecondary }]}>
          Account Actions
        </Text>

        {/* Switch to Collector Mode Golden Banner */}
        <TouchableOpacity
          style={[
            styles.collectorBanner,
            {
              backgroundColor: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FCF4E1',
              borderColor: theme.primary,
            },
          ]}
          onPress={handleSwitchToCollectorMode}
          activeOpacity={0.8}
        >
          <View style={styles.collectorBannerIconBox}>
            <Ionicons name="sparkles" size={20} color="#C46C27" />
          </View>
          <View style={{ flex: 1, minWidth: 0, paddingHorizontal: 12 }}>
            <Text style={[styles.collectorBannerTitle, { color: theme.textPrimary }]}>
              Explore as Cultural Collector
            </Text>
            <Text style={[styles.collectorBannerSub, { color: theme.textSecondary }]}>
              Browse masterpieces, bespoke textiles & sculptures as a patron
            </Text>
          </View>
          <Ionicons name="arrow-forward-circle" size={24} color={theme.primary} />
        </TouchableOpacity>

        {/* Sign Out Button (Mature, Simple & Understated) */}
        <View style={styles.signOutWrapper}>
          <TouchableOpacity
            style={[
              styles.matureSignOutBtn,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : theme.card,
                borderColor: theme.borderSubtle,
              },
            ]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setLogoutModalVisible(true);
            }}
            activeOpacity={0.75}
          >
            <Ionicons
              name="log-out-outline"
              size={17}
              color={isDark ? '#F87171' : '#DC2626'}
              style={{ marginRight: 8 }}
            />
            <Text
              style={[
                styles.matureSignOutText,
                { color: isDark ? '#F87171' : '#DC2626' },
              ]}
            >
              Sign Out of Atelier
            </Text>
          </TouchableOpacity>
        </View>
        </>
      )}
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: Store Availability & Vacation Mode (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStatusModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setStatusModalVisible(false)}
        >
          <View
            style={[
              styles.dialogSheet,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Storefront Availability
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Control how patrons interact with your atelier catalog
            </Text>

            {/* 3 Status Options */}
            <View style={{ gap: 10, marginVertical: 14 }}>
              {[
                {
                  id: 'ONLINE' as StoreAvailability,
                  title: 'Online (Accepting Orders)',
                  desc: 'Crafts can be purchased instantly. Standard delivery times apply.',
                  icon: 'radio-button-on',
                  color: '#0AD24F',
                },
                {
                  id: 'AWAY' as StoreAvailability,
                  title: 'Holiday / Away Mode',
                  desc: 'Patrons can browse but cannot place instant orders. Custom away note displayed.',
                  icon: 'pause-circle',
                  color: '#F59E0B',
                },
                {
                  id: 'OFFLINE' as StoreAvailability,
                  title: 'Storefront Offline',
                  desc: 'Catalog hidden from public marketplace searches while restocking.',
                  icon: 'radio-button-off',
                  color: '#9CA3AF',
                },
              ].map((opt) => {
                const isSelected = storeStatus === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.statusOptionCard,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                        borderColor: isSelected ? opt.color : theme.borderSubtle,
                        borderWidth: isSelected ? 1.5 : 1,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setStoreStatus(opt.id);
                    }}
                    activeOpacity={0.7}
                  >
                    <Ionicons name={opt.icon as any} size={20} color={opt.color} style={{ marginRight: 12 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.statusOptionTitle, { color: theme.textPrimary }]}>
                        {opt.title}
                      </Text>
                      <Text style={[styles.statusOptionDesc, { color: theme.textSecondary }]}>
                        {opt.desc}
                      </Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={18} color={opt.color} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Away Message Note if AWAY */}
            {storeStatus === 'AWAY' && (
              <View style={{ marginBottom: 14 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                  Vacation Auto-Responder Note
                </Text>
                <TextInput
                  style={[
                    styles.textAreaInput,
                    {
                      backgroundColor: isDark ? '#262626' : '#FFFFFF',
                      borderColor: theme.borderSubtle,
                      color: theme.textPrimary,
                    },
                  ]}
                  value={awayMessage}
                  onChangeText={setAwayMessage}
                  placeholder="Tell collectors when you will resume production..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: theme.primary, opacity: isUpdatingBranding ? 0.8 : 1 }
              ]}
              disabled={isUpdatingBranding}
              onPress={async () => {
                try {
                  if (storeStatus === 'AWAY' && awayMessage.trim()) {
                    await updateVendorBrandingMutation({ description: awayMessage.trim() }).unwrap();
                  }
                  setStatusModalVisible(false);
                  showToast(`Storefront status set to ${storeStatus}`);
                } catch (_err) {
                  showToast('Failed to update storefront status. Try again.', 'error');
                }
              }}
              activeOpacity={0.8}
            >
              {isUpdatingBranding ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryActionBtnText}>Confirm Storefront Status</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: Change Password Dialog (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={passwordModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPasswordModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setPasswordModalVisible(false)}
          >
            <View
              style={[
                styles.dialogSheet,
                { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.dragHandle} />
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                Change Atelier Password
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
                Ensure a strong combination of letters, digits & symbols
              </Text>

              <View style={{ gap: 12, marginVertical: 14 }}>
                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Current Password
                  </Text>
                  <View style={styles.passwordInputWrap}>
                    <TextInput
                      style={[
                        styles.dialogInput,
                        {
                          backgroundColor: isDark ? '#262626' : '#FFFFFF',
                          borderColor: theme.borderSubtle,
                          color: theme.textPrimary,
                          paddingRight: 42,
                        },
                      ]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter existing password"
                      placeholderTextColor={theme.textMuted}
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity
                      style={styles.eyeBtn}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons
                        name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                        size={18}
                        color={theme.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    New Password
                  </Text>
                  <TextInput
                    style={[
                      styles.dialogInput,
                      {
                        backgroundColor: isDark ? '#262626' : '#FFFFFF',
                        borderColor: theme.borderSubtle,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </View>

                <View>
                  <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                    Confirm New Password
                  </Text>
                  <TextInput
                    style={[
                      styles.dialogInput,
                      {
                        backgroundColor: isDark ? '#262626' : '#FFFFFF',
                        borderColor: theme.borderSubtle,
                        color: theme.textPrimary,
                      },
                    ]}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Repeat new password"
                    placeholderTextColor={theme.textMuted}
                    secureTextEntry={!showPassword}
                  />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    { borderColor: theme.borderSubtle, backgroundColor: theme.card },
                  ]}
                  onPress={() => setPasswordModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.primary }]}
                  onPress={handleSavePassword}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryActionBtnText}>Update Password</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: Change Email Dialog (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={emailModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEmailModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setEmailModalVisible(false)}
        >
          <View
            style={[
              styles.dialogSheet,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Update Atelier Email
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Current: {user?.email || 'artisan@ethnikraft.com'}
            </Text>

            <View style={{ marginVertical: 14 }}>
              <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
                New Verified Email
              </Text>
              <TextInput
                style={[
                  styles.dialogInput,
                  {
                    backgroundColor: isDark ? '#262626' : '#FFFFFF',
                    borderColor: theme.borderSubtle,
                    color: theme.textPrimary,
                  },
                ]}
                value={newEmail}
                onChangeText={setNewEmail}
                placeholder="Enter new email address"
                placeholderTextColor={theme.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <Text style={[styles.fieldHint, { color: theme.textSecondary }]}>
                A confirmation code will be sent to verify your address.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  { borderColor: theme.borderSubtle, backgroundColor: theme.card },
                ]}
                onPress={() => setEmailModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { flex: 1, backgroundColor: theme.primary }]}
                onPress={handleSaveEmail}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Send Verification</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: Operating Hours & Logistics (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={hoursModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setHoursModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setHoursModalVisible(false)}
        >
          <View
            style={[
              styles.dialogSheet,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Operating Hours & Shipping
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Set workshop opening schedules and primary logistics partner
            </Text>

            {/* Time Pickers */}
            <View style={{ flexDirection: 'row', gap: 10, marginVertical: 14 }}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Opening Time</Text>
                <View
                  style={[
                    styles.pickerBox,
                    {
                      backgroundColor: isDark ? '#262626' : '#FFFFFF',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.pickerValText, { color: theme.textPrimary }]}>{openTime}</Text>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>Closing Time</Text>
                <View
                  style={[
                    styles.pickerBox,
                    {
                      backgroundColor: isDark ? '#262626' : '#FFFFFF',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.pickerValText, { color: theme.textPrimary }]}>{closeTime}</Text>
                  <Ionicons name="time-outline" size={16} color={theme.primary} />
                </View>
              </View>
            </View>

            {/* Carrier selection */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              Select Default Shipping Partner
            </Text>
            <View style={{ gap: 8, marginBottom: 16 }}>
              {LOGISTICS_PARTNERS.slice(0, 3).map((carrier) => {
                const isSelected = preferredLogistics === carrier;
                return (
                  <TouchableOpacity
                    key={carrier}
                    style={[
                      styles.carrierOptionPill,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F9FAFB',
                        borderColor: isSelected ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setPreferredLogistics(carrier);
                    }}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={16}
                      color={isSelected ? theme.primary : theme.textMuted}
                      style={{ marginRight: 8 }}
                    />
                    <Text
                      style={[
                        styles.carrierOptionText,
                        {
                          color: isSelected ? theme.primary : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.bodyBold : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {carrier}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setHoursModalVisible(false);
                showToast('Operating hours and logistics preferences updated');
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 5: Low-Stock Threshold Stepper (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setStockModalVisible(false)}
        >
          <View
            style={[
              styles.dialogSheet,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Low Inventory Threshold
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              Trigger instant alerts when warehouse or craft quantity drops
            </Text>

            {/* Stepper */}
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={[styles.counterBtn, { backgroundColor: isDark ? '#333333' : '#F1F5F9' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLowStockThreshold((v) => Math.max(1, v - 1));
                }}
              >
                <Ionicons name="remove" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <View style={styles.counterDisplay}>
                <Text style={[styles.counterNumText, { color: theme.textPrimary }]}>
                  {lowStockThreshold}
                </Text>
                <Text style={[styles.counterUnitText, { color: theme.textSecondary }]}>
                  Units Remaining
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.counterBtn, { backgroundColor: isDark ? '#333333' : '#F1F5F9' }]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLowStockThreshold((v) => v + 1);
                }}
              >
                <Ionicons name="add" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetsRow}>
              {[2, 5, 10, 15].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[
                    styles.presetPill,
                    {
                      backgroundColor:
                        lowStockThreshold === preset
                          ? isDark ? 'rgba(196, 108, 39, 0.25)' : '#FCF4E1'
                          : isDark ? 'rgba(255,255,255,0.06)' : '#F1F5F9',
                      borderColor:
                        lowStockThreshold === preset ? theme.primary : 'transparent',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setLowStockThreshold(preset);
                  }}
                >
                  <Text
                    style={[
                      styles.presetText,
                      {
                        color:
                          lowStockThreshold === preset ? theme.primary : theme.textSecondary,
                      },
                    ]}
                  >
                    {preset} units
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => {
                setStockModalVisible(false);
                showToast(`Low-stock threshold set to ${lowStockThreshold} units`);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>Apply Alert Threshold</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 6: Fair Commission Breakdown (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={commissionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCommissionModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCommissionModalVisible(false)}
        >
          <View
            style={[
              styles.dialogSheet,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.dragHandle} />
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
              Ethnikraft Fair-Trade Commission
            </Text>
            <Text style={[styles.modalSubtitle, { color: theme.textSecondary }]}>
              100% transparent fee structure protecting artisan profitability
            </Text>

            <View style={{ gap: 10, marginVertical: 14 }}>
              <View style={[styles.feeRowCard, { backgroundColor: isDark ? '#262626' : '#F9FAFB' }]}>
                <View style={[styles.feeIconCircle, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
                  <Ionicons name="shield-checkmark" size={16} color="#0AD24F" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feeRowTitle, { color: theme.textPrimary }]}>
                    87.5% Artisan Net Payout
                  </Text>
                  <Text style={[styles.feeRowSub, { color: theme.textSecondary }]}>
                    Transferred directly to your verified settlement account
                  </Text>
                </View>
              </View>

              <View style={[styles.feeRowCard, { backgroundColor: isDark ? '#262626' : '#F9FAFB' }]}>
                <View style={[styles.feeIconCircle, { backgroundColor: 'rgba(196, 108, 39, 0.14)' }]}>
                  <Ionicons name="storefront" size={16} color="#C46C27" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feeRowTitle, { color: theme.textPrimary }]}>
                    10.0% Marketplace Commission
                  </Text>
                  <Text style={[styles.feeRowSub, { color: theme.textSecondary }]}>
                    Covers global diaspora marketing, search optimization & platform maintenance
                  </Text>
                </View>
              </View>

              <View style={[styles.feeRowCard, { backgroundColor: isDark ? '#262626' : '#F9FAFB' }]}>
                <View style={[styles.feeIconCircle, { backgroundColor: 'rgba(27, 42, 74, 0.12)' }]}>
                  <Ionicons name="lock-closed" size={16} color="#1B2A4A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.feeRowTitle, { color: theme.textPrimary }]}>
                    2.5% Escrow & Gateway Protection
                  </Text>
                  <Text style={[styles.feeRowSub, { color: theme.textSecondary }]}>
                    Multi-currency card settlement, dispute defense & zero chargeback guarantees
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
              onPress={() => setCommissionModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryActionBtnText}>Understood</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 7: Sign Out Confirmation Dialog (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={logoutModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setLogoutModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: theme.cardElevated, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.logoutIconBox}>
              <Ionicons name="log-out" size={28} color="#EF4444" />
            </View>

            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Sign out of Atelier?
            </Text>
            <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
              You will need to re-authenticate to manage customer orders, bespoke requests, and settlement payouts.
            </Text>

            <View style={{ flexDirection: 'row', gap: 10, width: '100%', marginTop: 8 }}>
              <TouchableOpacity
                style={[
                  styles.secondaryActionBtn,
                  { borderColor: theme.borderSubtle, backgroundColor: theme.card },
                ]}
                onPress={() => setLogoutModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.secondaryActionBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.destructiveActionBtn, { backgroundColor: '#EF4444' }]}
                onPress={handleConfirmLogout}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryActionBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          CURRENCY PICKER MODAL (statusBarTranslucent inside component)
      ════════════════════════════════════════════════════════════════════════ */}
      <CurrencyPickerModal
        visible={currencyModalVisible}
        onClose={() => setCurrencyModalVisible(false)}
      />
    </View>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  mainScroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },

  // Toast Floating Pill
  toastFloatingWrapper: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    maxWidth: '92%',
  },
  toastText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },

  // 1. Identity Header Card
  identityHeaderCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 20,
  },
  identityTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarMedallion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarInitialText: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
  },
  artisanBusinessName: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.2,
  },
  artisanSubEmail: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  masterBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  masterBadgeText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    color: '#D4A373',
    letterSpacing: 0.4,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDivider: {
    height: 1,
    marginVertical: 14,
  },
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  availabilityLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  availabilitySub: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    marginTop: 2,
  },
  statusSelectPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  statusSelectPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },
  profileMeterContainer: {
    marginTop: 14,
  },
  meterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  meterTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  meterPercent: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },
  meterTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  meterFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Section Headers & Group Cards
  sectionHeading: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  groupCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 2,
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    gap: 12,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowCenter: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontSize: 13.5,
    fontFamily: FontFamily.bodyBold,
  },
  rowSub: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  rowDivider: {
    height: 1,
  },
  badgeChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(10, 210, 79, 0.12)',
    marginRight: 6,
  },
  badgeChipText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },

  // Appearance Segmented Toggle
  themeSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    gap: 8,
  },
  segmentedThemeContainer: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: Radius.lg,
  },
  segmentedThemeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
  },
  segmentedThemeText: {
    fontSize: 11,
  },
  currencyPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: 4,
  },
  currencyPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  thresholdPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.md,
    marginRight: 6,
  },
  thresholdPillText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyBold,
    color: '#EF4444',
  },

  // Collector Banner
  collectorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  collectorBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(196, 108, 39, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  collectorBannerTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  collectorBannerSub: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },

  // Sign out button (Mature, minimalist, understated)
  signOutWrapper: {
    marginTop: 8,
    marginBottom: 20,
    alignItems: 'center',
  },
  matureSignOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radius.full,
    borderWidth: 1,
    width: '100%',
  },
  matureSignOutText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.2,
  },

  // Modals Styling
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  dialogSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
  },
  dialogBox: {
    margin: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    width: '90%',
    maxWidth: 380,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 4,
  },
  statusOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: Radius.lg,
  },
  statusOptionTitle: {
    fontSize: 13.5,
    fontFamily: FontFamily.bodyBold,
  },
  statusOptionDesc: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 6,
  },
  dialogInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
  },
  passwordInputWrap: {
    position: 'relative',
    justifyContent: 'center',
  },
  eyeBtn: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  textAreaInput: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  fieldHint: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 4,
  },
  pickerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pickerValText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  carrierOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  carrierOptionText: {
    fontSize: 12.5,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
    gap: 20,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterDisplay: {
    alignItems: 'center',
    minWidth: 100,
  },
  counterNumText: {
    fontSize: 32,
    fontFamily: FontFamily.headingBold,
  },
  counterUnitText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  presetsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  presetPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyBold,
  },
  feeRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.md,
    gap: 12,
  },
  feeIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feeRowTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  feeRowSub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  logoutIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  dialogTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    textAlign: 'center',
  },
  dialogSub: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },
  secondaryActionBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },
  destructiveActionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

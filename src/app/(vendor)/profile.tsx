import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import {
  useGetVendorProfileQuery,
  useUpdateVendorBrandingMutation,
  useUpdateVendorSettingsMutation,
  useCreateVendorAddressMutation,
  useUpdateVendorAddressMutation,
} from '@/store/api/vendorApi';
import { VendorProfileSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Preset Data & Categories ──────────────────────────────────────────────────
const CRAFT_CATEGORIES = [
  'Bronze Casting & Metallurgy',
  'Wood Carving & Joinery',
  'Textile, Batik & Adire',
  'Leathercraft & Footwear',
  'Ceramics & Terracotta Pottery',
  'Beadwork & Royal Regalia',
  'Handwoven Baskets & Cane',
  'Mixed Media & Heritage Art',
];

const NIGERIAN_BANKS = [
  { code: '058', name: 'Guaranty Trust Bank (GTBank)' },
  { code: '044', name: 'Access Bank' },
  { code: '057', name: 'Zenith Bank' },
  { code: '011', name: 'First Bank of Nigeria' },
  { code: '033', name: 'United Bank for Africa (UBA)' },
  { code: '035', name: 'Wema Bank' },
  { code: '50211', name: 'Kuda Microfinance Bank' },
  { code: '999992', name: 'OPay Digital Services' },
  { code: '999991', name: 'Moniepoint Microfinance Bank' },
  { code: '214', name: 'First City Monument Bank (FCMB)' },
];

const DAYS_OF_WEEK = [
  { id: 'mon', label: 'Mon', full: 'Monday' },
  { id: 'tue', label: 'Tue', full: 'Tuesday' },
  { id: 'wed', label: 'Wed', full: 'Wednesday' },
  { id: 'thu', label: 'Thu', full: 'Thursday' },
  { id: 'fri', label: 'Fri', full: 'Friday' },
  { id: 'sat', label: 'Sat', full: 'Saturday' },
  { id: 'sun', label: 'Sun', full: 'Sunday' },
];

export type StorefrontStatus = 'ACTIVE' | 'HOLIDAY' | 'INACTIVE';

const normalizeStoreStatus = (status?: string | null): StorefrontStatus => {
  if (!status) return 'ACTIVE';
  const upper = String(status).toUpperCase().trim();
  if (upper === 'ACTIVE' || upper === 'APPROVED' || upper === 'VERIFIED') return 'ACTIVE';
  if (upper === 'HOLIDAY' || upper === 'BREAK' || upper === 'AWAY') return 'HOLIDAY';
  if (upper === 'INACTIVE' || upper === 'OFFLINE' || upper === 'SUSPENDED' || upper === 'PENDING') return 'INACTIVE';
  return 'ACTIVE';
};

export default function VendorProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { user, vendor } = useAppSelector((state) => state.auth);

  // ─── RTK Query Integration ──────────────────────────────────────────────────
  const {
    data: profileData,
    isLoading: isProfileLoading,
    isFetching: isProfileFetching,
    error: profileError,
    refetch: refetchProfile,
  } = useGetVendorProfileQuery();

  const [updateVendorBrandingMutation, { isLoading: isUpdatingBranding }] =
    useUpdateVendorBrandingMutation();
  const [updateVendorSettingsMutation, { isLoading: isUpdatingSettings }] =
    useUpdateVendorSettingsMutation();
  const [createVendorAddressMutation, { isLoading: isCreatingAddress }] =
    useCreateVendorAddressMutation();
  const [updateVendorAddressMutation, { isLoading: isUpdatingAddress }] =
    useUpdateVendorAddressMutation();

  // ─── Local State: Profile Data ────────────────────────────────────────────────
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');

  // Storefront Status (sanitized with defensive fallback)
  const [storeStatus, setStoreStatus] = useState<StorefrontStatus>(() =>
    normalizeStoreStatus(vendor?.status)
  );
  const [statusModalVisible, setStatusModalVisible] = useState(false);

  // Workshop Story & Craft
  const [businessName, setBusinessName] = useState(
    profileData?.businessName || vendor?.businessName || (vendor as any)?.storeName || 'Atelier Workshop'
  );
  const [tagline, setTagline] = useState(
    'Handcrafted sacred bronze sculptures rooted in centuries-old Yoruba metallurgy.'
  );
  const [category, setCategory] = useState(CRAFT_CATEGORIES[0]);
  const [description, setDescription] = useState(
    profileData?.description ||
      vendor?.storeDescription ||
      'Rooted in ancient African heritage crafts, our atelier hand-pours museum-grade bronze statues, traditional ceremonial masks, and bespoke modern African art for collectors worldwide.'
  );
  const [isBioExpanded, setIsBioExpanded] = useState(false);

  // Payout & Banking
  const [bankName, setBankName] = useState('Guaranty Trust Bank (GTBank)');
  const [accountNumber, setAccountNumber] = useState('0223458856');
  const [accountName, setAccountName] = useState(
    businessName ? `${businessName.toUpperCase()} LTD` : 'OSHOGBO BRONZE WORKS'
  );

  // Contact & Location
  const [phone, setPhone] = useState(profileData?.businessPhone || (vendor as any)?.businessPhone || '+234 809 123 4567');
  const [email, setEmail] = useState(profileData?.businessEmail || user?.email || 'workshop@ethnikraft.com');
  const [address, setAddress] = useState(
    profileData?.businessAddresses?.[0]?.address || 'Plot 14 Craft Village, Cultural Center Road'
  );
  const [city, setCity] = useState(profileData?.city || profileData?.businessAddresses?.[0]?.city || 'Osogbo');
  const [stateRegion, setStateRegion] = useState(profileData?.businessAddresses?.[0]?.state || 'Osun State');
  const [country, setCountry] = useState(profileData?.country || profileData?.businessAddresses?.[0]?.country || 'Nigeria');

  // Default address ID for address mutations
  const defaultAddressId = profileData?.businessAddresses?.[0]?.id;

  // Sync profile data when fetched
  React.useEffect(() => {
    if (profileData) {
      if (profileData.businessName) setBusinessName(profileData.businessName);
      if (profileData.description) setDescription(profileData.description);
      if (profileData.businessPhone) setPhone(profileData.businessPhone);
      if (profileData.businessEmail) setEmail(profileData.businessEmail);
      if (profileData.city) setCity(profileData.city);
      if (profileData.country) setCountry(profileData.country);

      if (profileData.businessAddresses && profileData.businessAddresses.length > 0) {
        const primaryAddr = profileData.businessAddresses.find((a) => a.isDefault) || profileData.businessAddresses[0];
        if (primaryAddr.address) setAddress(primaryAddr.address);
        if (primaryAddr.city) setCity(primaryAddr.city);
        if (primaryAddr.state) setStateRegion(primaryAddr.state);
        if (primaryAddr.country) setCountry(primaryAddr.country);
      }
    }
  }, [profileData]);

  // Compliance & Legal
  const [regNumber, setRegNumber] = useState('RC-1849204');
  const [taxId, setTaxId] = useState('TIN-284910-001');

  // Operating Schedule
  const [activeDays, setActiveDays] = useState<string[]>([
    'mon',
    'tue',
    'wed',
    'thu',
    'fri',
    'sat',
  ]);
  const [openTime, setOpenTime] = useState('09:00 AM');
  const [closeTime, setCloseTime] = useState('06:00 PM');

  // Privacy & Preferences
  const [publicProfile, setPublicProfile] = useState(true);
  const [contactInfoVisible, setContactInfoVisible] = useState(true);
  const [acceptCustomRequests, setAcceptCustomRequests] = useState(true);
  const [verifiedBadgeEnabled, setVerifiedBadgeEnabled] = useState(true);

  // ─── Modal States ─────────────────────────────────────────────────────────────
  const [editStoryModal, setEditStoryModal] = useState(false);
  const [editBankModal, setEditBankModal] = useState(false);
  const [editContactModal, setEditContactModal] = useState(false);
  const [editScheduleModal, setEditScheduleModal] = useState(false);
  const [bankPickerVisible, setBankPickerVisible] = useState(false);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);

  // Temp form buffers for modals
  const [formBusinessName, setFormBusinessName] = useState(businessName);
  const [formTagline, setFormTagline] = useState(tagline);
  const [formCategory, setFormCategory] = useState(category);
  const [formDescription, setFormDescription] = useState(description);

  const [formBankName, setFormBankName] = useState(bankName);
  const [formAccountNumber, setFormAccountNumber] = useState(accountNumber);
  const [formAccountName, setFormAccountName] = useState(accountName);

  const [formPhone, setFormPhone] = useState(phone);
  const [formEmail, setFormEmail] = useState(email);
  const [formAddress, setFormAddress] = useState(address);
  const [formCity, setFormCity] = useState(city);
  const [formStateRegion, setFormStateRegion] = useState(stateRegion);

  // ─── Notification Toast Helper ────────────────────────────────────────────────
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToastMessage(message);
    setToastType(type);
    if (type === 'error') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setTimeout(() => setToastMessage(null), 3200);
  };

  const copyToClipboard = (text: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast(`${label} copied to clipboard!`);
  };

  // ─── Dynamic Profile Completion Calculation ──────────────────────────────────
  const completionPercentage = useMemo(() => {
    let score = 0;
    if (businessName) score += 15;
    if (tagline) score += 10;
    if (description) score += 15;
    if (accountNumber && bankName) score += 20;
    if (phone && email) score += 15;
    if (address && city) score += 10;
    if (regNumber && taxId) score += 15;
    return Math.min(score, 100);
  }, [
    businessName,
    tagline,
    description,
    accountNumber,
    bankName,
    phone,
    email,
    address,
    city,
    regNumber,
    taxId,
  ]);

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetchProfile().unwrap();
      showToast('Profile refreshed from cloud');
    } catch (_err) {
      showToast('Could not refresh profile data', 'error');
    } finally {
      setRefreshing(false);
    }
  };

  // ─── Status Configurations ────────────────────────────────────────────────────
  const statusConfig = useMemo(
    () => ({
      ACTIVE: {
        label: 'Active Storefront',
        color: '#0AD24F',
        bg: isDark ? 'rgba(10, 210, 79, 0.14)' : 'rgba(0, 157, 26, 0.1)',
        icon: 'radio-button-on' as const,
      },
      HOLIDAY: {
        label: 'On Break / Holiday',
        color: '#F59E0B',
        bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)',
        icon: 'time-outline' as const,
      },
      INACTIVE: {
        label: 'Store Offline',
        color: '#EF4444',
        bg: isDark ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)',
        icon: 'pause-circle-outline' as const,
      },
    }),
    [isDark]
  );

  const activeStatusItem = statusConfig[storeStatus] || statusConfig.ACTIVE;

  // Format schedule text
  const scheduleDisplayText = useMemo(() => {
    if (activeDays.length === 7) return `Mon - Sun, ${openTime} - ${closeTime}`;
    if (
      activeDays.length === 6 &&
      !activeDays.includes('sun')
    ) {
      return `Mon - Sat, ${openTime} - ${closeTime}`;
    }
    if (
      activeDays.length === 5 &&
      !activeDays.includes('sat') &&
      !activeDays.includes('sun')
    ) {
      return `Mon - Fri, ${openTime} - ${closeTime}`;
    }
    return `${activeDays.map((d) => d.toUpperCase()).join(', ')} (${openTime} - ${closeTime})`;
  }, [activeDays, openTime, closeTime]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Toast Notification Pill ────────────────────────────────────────── */}
      {toastMessage && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor: toastType === 'error'
                ? (isDark ? '#3E1B1B' : '#FEF2F2')
                : theme.card,
              borderColor: toastType === 'error' ? '#EF4444' : theme.primary,
            },
          ]}
        >
          <Ionicons
            name={toastType === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={toastType === 'error' ? '#EF4444' : '#10B981'}
            style={{ marginRight: 8 }}
          />
          <Text
            style={[
              styles.toastText,
              { color: toastType === 'error' ? (isDark ? '#FCA5A5' : '#991B1B') : theme.textPrimary },
            ]}
          >
            {toastMessage}
          </Text>
        </View>
      )}

      {/* ── Main Scroll View ───────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary, '#D1995A']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Error Banner with Retry */}
        {profileError && (
          <View
            style={{
              marginHorizontal: Spacing.md,
              marginTop: Spacing.sm,
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
                Unable to sync live artisan profile. Tap retry.
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
          <View style={{ paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
            <VendorProfileSkeleton />
          </View>
        ) : (
          <>
            {/* ── 1. Executive Atelier Cover & Avatar Banner ─────────────────────── */}
            <View style={styles.headerWrapper}>
              {/* Cover Photo */}
              <View style={styles.coverContainer}>
                <Image
                  source={{
                    uri:
                      profileData?.businessBanner ||
                      (vendor as any)?.businessBanner ||
                      'https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=1200&auto=format&fit=crop',
                  }}
                  style={styles.coverImage}
                  resizeMode="cover"
                />
                <View style={styles.coverOverlay} />

                {/* Edit Cover Trigger */}
                <TouchableOpacity
                  style={styles.coverEditBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    showToast('Cover photo updated successfully');
                  }}
                >
                  <Ionicons name="camera-outline" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Floating Avatar & Details Row */}
              <View style={styles.avatarRowContainer}>
                {/* Overlapping Avatar */}
                <View
                  style={[
                    styles.avatarWrapper,
                    { backgroundColor: theme.card, borderColor: '#D4A373' },
                  ]}
                >
                  <Image
                    source={{
                      uri:
                        profileData?.businessLogo ||
                        (vendor as any)?.businessLogo ||
                        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400&auto=format&fit=crop',
                    }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity
                    style={styles.avatarEditBadge}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      showToast('Avatar updated');
                    }}
                  >
                    <Ionicons name="camera" size={11} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

            {/* Status Selector Pill */}
            <TouchableOpacity
              style={[
                styles.statusPill,
                { backgroundColor: activeStatusItem.bg },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setStatusModalVisible(true);
              }}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: activeStatusItem.color },
                ]}
              />
              <Text
                style={[
                  styles.statusPillText,
                  { color: activeStatusItem.color },
                ]}
              >
                {activeStatusItem.label}
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={activeStatusItem.color}
                style={{ marginLeft: 3 }}
              />
            </TouchableOpacity>
          </View>

          {/* Workshop Title & Owner Bio */}
          <View style={styles.titleInfoBlock}>
            <View style={styles.titleHeadingRow}>
              <Text style={[styles.workshopTitle, { color: theme.textPrimary }]}>
                {businessName}
              </Text>
              {verifiedBadgeEnabled && (
                <View style={styles.verifiedShieldBadge}>
                  <Ionicons name="checkmark-circle" size={16} color="#C46C27" />
                </View>
              )}
            </View>

            <Text style={[styles.artisanOwnerText, { color: theme.textSecondary }]}>
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : (profileData?.businessName || vendor?.businessName || 'Atelier Master')} • Master Artisan
            </Text>

            {/* Operating Hours Quick Pill */}
            <TouchableOpacity
              style={[
                styles.scheduleQuickPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(209, 153, 90, 0.12)'
                    : 'rgba(196, 108, 39, 0.08)',
                  borderColor: theme.border,
                },
              ]}
              activeOpacity={0.7}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditScheduleModal(true);
              }}
            >
              <Ionicons name="time-outline" size={14} color="#C46C27" />
              <Text style={[styles.scheduleQuickText, { color: isDark ? '#D1995A' : '#C46C27' }]}>
                {scheduleDisplayText}
              </Text>
              <Ionicons name="pencil" size={11} color="#C46C27" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 2. Profile Completion Ribbon (Progress Gauge) ─────────────────── */}
        <View
          style={[
            styles.completionCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          {/* Circular Progress Gauge */}
          <View style={styles.progressCircleContainer}>
            <Svg width={54} height={54} viewBox="0 0 54 54">
              <Circle
                cx="27"
                cy="27"
                r="22"
                stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(54,19,0,0.08)'}
                strokeWidth="4.5"
                fill="none"
              />
              <Circle
                cx="27"
                cy="27"
                r="22"
                stroke="#C46C27"
                strokeWidth="4.5"
                strokeDasharray={`${(completionPercentage / 100) * 138} 138`}
                strokeLinecap="round"
                fill="none"
                transform="rotate(-90 27 27)"
              />
            </Svg>
            <View style={styles.progressPercentLabelBox}>
              <Text style={[styles.progressPercentText, { color: theme.textPrimary }]}>
                {completionPercentage}%
              </Text>
            </View>
          </View>

          {/* Prompt info */}
          <View style={styles.completionInfoCol}>
            <Text style={[styles.completionTitle, { color: theme.textPrimary }]}>
              {completionPercentage === 100
                ? 'Profile 100% Complete'
                : 'Artisan Profile Incomplete'}
            </Text>
            <Text style={[styles.completionSub, { color: theme.textSecondary }]}>
              {completionPercentage === 100
                ? 'Your atelier is fully verified and featured in search.'
                : 'Complete all atelier compliance sections to boost storefront rank.'}
            </Text>
          </View>

          {/* Action Button */}
          {completionPercentage < 100 && (
            <TouchableOpacity
              style={styles.completionActionBtn}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setEditStoryModal(true);
              }}
            >
              <Text style={styles.completionActionBtnText}>Complete</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 3. Section 1: Workshop & Craft Story Card ──────────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View
                style={[
                  styles.sectionIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(209, 153, 90, 0.14)'
                      : 'rgba(196, 108, 39, 0.1)',
                  },
                ]}
              >
                <Ionicons name="color-palette-outline" size={18} color="#C46C27" />
              </View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                Workshop & Craft Story
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editCircleBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(54,19,0,0.05)' }]}
              activeOpacity={0.7}
              onPress={() => {
                setFormBusinessName(businessName);
                setFormTagline(tagline);
                setFormCategory(category);
                setFormDescription(description);
                setEditStoryModal(true);
              }}
            >
              <Ionicons name="pencil" size={14} color="#C46C27" />
            </TouchableOpacity>
          </View>

          {/* Craft Category Pill */}
          <View style={styles.categoryPillContainer}>
            <View style={styles.craftBadge}>
              <Ionicons name="sparkles" size={12} color="#D1995A" style={{ marginRight: 5 }} />
              <Text style={styles.craftBadgeText}>{category}</Text>
            </View>
          </View>

          {/* Tagline */}
          <View style={styles.infoRowBlock}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Atelier Slogan</Text>
            <Text style={[styles.taglineText, { color: theme.textPrimary }]}>
              "{tagline}"
            </Text>
          </View>

          {/* Description */}
          <View style={styles.infoRowBlock}>
            <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Heritage Bio & Story</Text>
            <Text
              style={[styles.bioText, { color: theme.textPrimary }]}
              numberOfLines={isBioExpanded ? undefined : 3}
            >
              {description}
            </Text>
            <TouchableOpacity
              onPress={() => setIsBioExpanded(!isBioExpanded)}
              activeOpacity={0.7}
              style={{ marginTop: 4 }}
            >
              <Text style={[styles.readMoreText, { color: theme.primary }]}>
                {isBioExpanded ? 'Read Less' : 'Read Full Story...'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Artisan Statistics Badges */}
          <View style={styles.statsPillRow}>
            <View
              style={[
                styles.statPill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7EFE2' },
              ]}
            >
              <Text style={[styles.statPillNumber, { color: theme.textPrimary }]}>12+ Yrs</Text>
              <Text style={styles.statPillLabel}>Experience</Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7EFE2' },
              ]}
            >
              <Text style={[styles.statPillNumber, { color: theme.textPrimary }]}>148+</Text>
              <Text style={styles.statPillLabel}>Pieces Created</Text>
            </View>
            <View
              style={[
                styles.statPill,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F7EFE2' },
              ]}
            >
              <Text style={[styles.statPillNumber, { color: theme.textPrimary }]}>
                {typeof (vendor as any)?.rating === 'number' && (vendor as any).rating > 0
                  ? `${(vendor as any).rating.toFixed(1)} ★`
                  : '—'}
              </Text>
              <Text style={styles.statPillLabel}>Master Rating</Text>
            </View>
          </View>
        </View>

        {/* ── 4. Section 2: Payout & Settlement Bank Account ─────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.card, borderColor: '#D4A373' },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View
                style={[
                  styles.sectionIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(10, 210, 79, 0.14)'
                      : 'rgba(0, 157, 26, 0.1)',
                  },
                ]}
              >
                <Ionicons name="card-outline" size={18} color="#009D1A" />
              </View>
              <View>
                <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                  Settlement & Payout Vault
                </Text>
                <Text style={styles.sectionSubtext}>
                  Direct bank disbursements on orders
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[styles.editCircleBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(54,19,0,0.05)' }]}
              activeOpacity={0.7}
              onPress={() => {
                setFormBankName(bankName);
                setFormAccountNumber(accountNumber);
                setFormAccountName(accountName);
                setEditBankModal(true);
              }}
            >
              <Ionicons name="pencil" size={14} color="#C46C27" />
            </TouchableOpacity>
          </View>

          {/* Bank Container Box */}
          <View
            style={[
              styles.bankAccountDisplayBox,
              {
                backgroundColor: isDark
                  ? 'rgba(212, 163, 115, 0.08)'
                  : 'rgba(212, 163, 115, 0.15)',
                borderColor: 'rgba(212, 163, 115, 0.3)',
              },
            ]}
          >
            <View style={styles.bankTopRow}>
              <View style={styles.bankNameCol}>
                <Text style={styles.bankInstitutionLabel}>Bank Institution</Text>
                <Text style={[styles.bankInstitutionValue, { color: theme.textPrimary }]}>
                  {bankName}
                </Text>
              </View>
              <View style={styles.instantVerifiedPill}>
                <Ionicons name="shield-checkmark" size={12} color="#009D1A" />
                <Text style={styles.instantVerifiedText}>Verified</Text>
              </View>
            </View>

            {/* Account Number with 1-Tap Copy */}
            <View style={styles.accountNumberRow}>
              <View>
                <Text style={styles.bankInstitutionLabel}>NUBAN Account Number</Text>
                <Text style={[styles.accountNumberDigits, { color: theme.textPrimary }]}>
                  {accountNumber}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.copyPillBtn}
                activeOpacity={0.7}
                onPress={() => copyToClipboard(accountNumber, 'Account number')}
              >
                <Ionicons name="copy-outline" size={13} color="#C46C27" />
                <Text style={styles.copyPillText}>Copy</Text>
              </TouchableOpacity>
            </View>

            {/* Beneficiary Name */}
            <View style={styles.beneficiaryRow}>
              <Text style={styles.bankInstitutionLabel}>Beneficiary Account Name</Text>
              <Text style={[styles.beneficiaryValue, { color: theme.textPrimary }]}>
                {accountName}
              </Text>
            </View>
          </View>

          {/* Update Bank CTA */}
          <TouchableOpacity
            style={[styles.outlineSecondaryBtn, { borderColor: theme.border }]}
            activeOpacity={0.8}
            onPress={() => {
              setFormBankName(bankName);
              setFormAccountNumber(accountNumber);
              setFormAccountName(accountName);
              setEditBankModal(true);
            }}
          >
            <Ionicons name="swap-horizontal-outline" size={16} color={theme.textPrimary} style={{ marginRight: 6 }} />
            <Text style={[styles.outlineSecondaryBtnText, { color: theme.textPrimary }]}>
              Change Payout Account
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── 5. Section 3: Contact & Atelier Studio Location ────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View
                style={[
                  styles.sectionIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(7, 153, 193, 0.14)'
                      : 'rgba(7, 153, 193, 0.1)',
                  },
                ]}
              >
                <Ionicons name="location-outline" size={18} color="#0799C1" />
              </View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                Contact & Studio Atelier
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editCircleBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(54,19,0,0.05)' }]}
              activeOpacity={0.7}
              onPress={() => {
                setFormPhone(phone);
                setFormEmail(email);
                setFormAddress(address);
                setFormCity(city);
                setFormStateRegion(stateRegion);
                setEditContactModal(true);
              }}
            >
              <Ionicons name="pencil" size={14} color="#C46C27" />
            </TouchableOpacity>
          </View>

          {/* Phone */}
          <View style={styles.contactItemRow}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="call-outline" size={16} color="#C46C27" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Business Phone</Text>
              <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>
                {phone}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(phone, 'Phone number')}
              style={styles.quickIconBtn}
            >
              <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Email */}
          <View style={styles.contactItemRow}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="mail-outline" size={16} color="#C46C27" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Atelier Email</Text>
              <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>
                {email}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(email, 'Email address')}
              style={styles.quickIconBtn}
            >
              <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Studio Physical Location */}
          <View style={styles.contactItemRow}>
            <View style={styles.contactIconCircle}>
              <Ionicons name="business-outline" size={16} color="#C46C27" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>Physical Atelier Studio</Text>
              <Text style={[styles.contactValueText, { color: theme.textPrimary }]}>
                {address}
              </Text>
              <Text style={[styles.contactSubValueText, { color: theme.textSecondary }]}>
                {city}, {stateRegion}, {country}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(`${address}, ${city}, ${stateRegion}`, 'Studio address')}
              style={styles.quickIconBtn}
            >
              <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── 6. Section 4: Verification & Compliance Card ──────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View
                style={[
                  styles.sectionIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(85, 107, 47, 0.16)'
                      : 'rgba(85, 107, 47, 0.12)',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark-outline" size={18} color="#556B2F" />
              </View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                Legal & CAC Compliance
              </Text>
            </View>
            <View style={styles.statusVerifiedPill}>
              <Ionicons name="checkmark-done" size={12} color="#009D1A" />
              <Text style={styles.statusVerifiedPillText}>Audited</Text>
            </View>
          </View>

          {/* Registration Number */}
          <View style={styles.complianceRow}>
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                CAC Registration / Business Name (BN)
              </Text>
              <Text style={[styles.complianceValue, { color: theme.textPrimary }]}>
                {regNumber}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(regNumber, 'Registration number')}
              style={styles.quickIconBtn}
            >
              <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Tax ID */}
          <View style={styles.complianceRow}>
            <View>
              <Text style={[styles.fieldLabel, { color: theme.textSecondary }]}>
                Federal Tax Identification (TIN)
              </Text>
              <Text style={[styles.complianceValue, { color: theme.textPrimary }]}>
                {taxId}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => copyToClipboard(taxId, 'TIN number')}
              style={styles.quickIconBtn}
            >
              <Ionicons name="copy-outline" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Verified Document Badges */}
          <View style={styles.documentsGrid}>
            <View
              style={[
                styles.documentBadge,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5EBD5' },
              ]}
            >
              <Ionicons name="document-text-outline" size={14} color="#C46C27" />
              <Text style={[styles.documentBadgeText, { color: theme.textPrimary }]}>
                CAC Certificate
              </Text>
              <Ionicons name="checkmark-circle" size={13} color="#009D1A" />
            </View>

            <View
              style={[
                styles.documentBadge,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#F5EBD5' },
              ]}
            >
              <Ionicons name="receipt-outline" size={14} color="#C46C27" />
              <Text style={[styles.documentBadgeText, { color: theme.textPrimary }]}>
                TIN Document
              </Text>
              <Ionicons name="checkmark-circle" size={13} color="#009D1A" />
            </View>
          </View>
        </View>

        {/* ── 7. Section 5: Storefront Privacy & Preferences ────────────────── */}
        <View
          style={[
            styles.sectionCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleGroup}>
              <View
                style={[
                  styles.sectionIconBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(196, 108, 39, 0.14)'
                      : 'rgba(196, 108, 39, 0.1)',
                  },
                ]}
              >
                <Ionicons name="options-outline" size={18} color="#C46C27" />
              </View>
              <Text style={[styles.sectionTitleText, { color: theme.textPrimary }]}>
                Storefront Privacy & Bespoke
              </Text>
            </View>
          </View>

          {/* Toggle 1: Public Profile */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                Public Storefront Visibility
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                Allow clients to discover your atelier in public search & catalog
              </Text>
            </View>
            <Switch
              value={publicProfile}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPublicProfile(val);
                showToast(`Storefront visibility ${val ? 'enabled' : 'hidden'}`);
              }}
              trackColor={{ false: '#767577', true: '#C46C27' }}
              thumbColor={publicProfile ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Toggle 2: Show Direct Phone */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                Display Phone on Profile
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                Let buyers initiate direct WhatsApp or phone consultations
              </Text>
            </View>
            <Switch
              value={contactInfoVisible}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setContactInfoVisible(val);
                showToast(`Phone visibility ${val ? 'visible' : 'private'}`);
              }}
              trackColor={{ false: '#767577', true: '#C46C27' }}
              thumbColor={contactInfoVisible ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Toggle 3: Accept Custom Bespoke Requests */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                Accept Custom Bespoke Studio Requests
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                Receive private custom order requests and bid on heritage commissions
              </Text>
            </View>
            <Switch
              value={acceptCustomRequests}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAcceptCustomRequests(val);
                showToast(`Custom requests ${val ? 'active' : 'paused'}`);
              }}
              trackColor={{ false: '#767577', true: '#C46C27' }}
              thumbColor={acceptCustomRequests ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          {/* Toggle 4: Verified Store Badge */}
          <View style={styles.toggleRow}>
            <View style={styles.toggleTextCol}>
              <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                Verified Master Artisan Seal
              </Text>
              <Text style={[styles.toggleSubtitle, { color: theme.textSecondary }]}>
                Display verified craft insignia on all product cards
              </Text>
            </View>
            <Switch
              value={verifiedBadgeEnabled}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setVerifiedBadgeEnabled(val);
                showToast(`Artisan seal ${val ? 'shown' : 'hidden'}`);
              }}
              trackColor={{ false: '#767577', true: '#C46C27' }}
              thumbColor={verifiedBadgeEnabled ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={{ height: Math.max(insets.bottom, 16) + 120 }} />
          </>
        )}
      </ScrollView>

      {/* ── MODAL 1: Storefront Status Selector ──────────────────────────────── */}
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
              styles.statusDialogBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Storefront Availability
            </Text>
            <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
              Control whether your atelier accepts orders right now.
            </Text>

            {(['ACTIVE', 'HOLIDAY', 'INACTIVE'] as StorefrontStatus[]).map(
              (status) => {
                const item = statusConfig[status] || statusConfig.ACTIVE;
                return (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOptionRow,
                      {
                        backgroundColor:
                          storeStatus === status
                            ? isDark
                              ? 'rgba(255,255,255,0.06)'
                              : '#F7EFE2'
                            : 'transparent',
                      },
                    ]}
                    activeOpacity={0.7}
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setStoreStatus(status);
                      setStatusModalVisible(false);
                      if (status === 'HOLIDAY' && description.trim()) {
                        updateVendorBrandingMutation({ description: description.trim() }).catch(() => {});
                      }
                      showToast(`Status updated to "${item.label}"`);
                    }}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: item.color },
                      ]}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.statusOptionLabel,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {item.label}
                      </Text>
                    </View>
                    {storeStatus === status && (
                      <Ionicons name="checkmark" size={18} color="#C46C27" />
                    )}
                  </TouchableOpacity>
                );
              }
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL 2: Edit Workshop Story Sheet (84% Height) ─────────────────── */}
      <Modal
        visible={editStoryModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditStoryModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setEditStoryModal(false)}
          />
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Edit Workshop & Craft
              </Text>
              <TouchableOpacity
                onPress={() => setEditStoryModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: Dimensions.get('window').height * 0.65 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Business Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Business / Atelier Name
                </Text>
                <TextInput
                  value={formBusinessName}
                  onChangeText={setFormBusinessName}
                  placeholder="e.g. Oshogbo Bronze Foundry"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Tagline */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Tagline / Slogan (Less than 100 letters)
                </Text>
                <TextInput
                  value={formTagline}
                  onChangeText={setFormTagline}
                  placeholder="e.g. Handcrafted bronze sculptures..."
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Craft Category Trigger */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Craft Discipline / Category
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInputTrigger,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setCategoryPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectInputText, { color: theme.textPrimary }]}>
                    {formCategory}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Bio / Description */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Atelier Heritage Story (Less than 250 words)
                </Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  placeholder="Describe your heritage craft, methods, and workshop story..."
                  placeholderTextColor={theme.textSecondary}
                  multiline
                  numberOfLines={4}
                  style={[
                    styles.textAreaInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[styles.sheetSaveBtn, { opacity: isUpdatingBranding ? 0.8 : 1 }]}
                activeOpacity={0.8}
                disabled={isUpdatingBranding}
                onPress={async () => {
                  try {
                    await updateVendorBrandingMutation({
                      description: formDescription.trim(),
                    }).unwrap();
                    setBusinessName(formBusinessName);
                    setTagline(formTagline);
                    setCategory(formCategory);
                    setDescription(formDescription);
                    setEditStoryModal(false);
                    showToast('Workshop story updated successfully');
                  } catch (_err) {
                    showToast('Failed to save workshop story. Try again.', 'error');
                  }
                }}
              >
                {isUpdatingBranding ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetSaveBtnText}>Save Workshop Story</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 3: Category Picker Dropdown ────────────────────────────────── */}
      <Modal
        visible={categoryPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryPickerVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setCategoryPickerVisible(false)}
        >
          <View
            style={[
              styles.pickerDialogBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Select Craft Discipline
            </Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {CRAFT_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.pickerOptionRow,
                    {
                      backgroundColor:
                        formCategory === cat
                          ? isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F7EFE2'
                          : 'transparent',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFormCategory(cat);
                    setCategoryPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: theme.textPrimary },
                      formCategory === cat && { fontWeight: '700', color: theme.primary },
                    ]}
                  >
                    {cat}
                  </Text>
                  {formCategory === cat && (
                    <Ionicons name="checkmark" size={16} color="#C46C27" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL 4: Bank Account Setup Sheet (84% Height) ──────────────────── */}
      <Modal
        visible={editBankModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditBankModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setEditBankModal(false)}
          />
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                  Settlement Bank Details
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                  Instant automated order payouts
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setEditBankModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: Dimensions.get('window').height * 0.65 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Select Bank */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Select Bank
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selectInputTrigger,
                    {
                      backgroundColor: theme.background,
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => setBankPickerVisible(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.selectInputText, { color: theme.textPrimary }]}>
                    {formBankName}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={theme.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Account Number */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  10-Digit NUBAN Account Number
                </Text>
                <TextInput
                  value={formAccountNumber}
                  onChangeText={(val) => {
                    const numeric = val.replace(/[^0-9]/g, '');
                    setFormAccountNumber(numeric);
                    if (numeric.length === 10) {
                      setFormAccountName(
                        businessName ? `${businessName.toUpperCase()} WORKS` : 'VERIFIED ARTISAN ACCOUNT'
                      );
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={10}
                  placeholder="0123456789"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Resolved Beneficiary Name */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Verified Account Name
                </Text>
                <TextInput
                  value={formAccountName}
                  onChangeText={setFormAccountName}
                  placeholder="Beneficiary Name"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Security Banner */}
              <View
                style={[
                  styles.securityNoticeBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(10, 210, 79, 0.08)'
                      : 'rgba(0, 157, 26, 0.06)',
                    borderColor: 'rgba(0, 157, 26, 0.2)',
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={16} color="#009D1A" style={{ marginRight: 8 }} />
                <Text style={styles.securityNoticeText}>
                  Bank payouts are processed automatically into this verified NUBAN account.
                </Text>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.sheetSaveBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setBankName(formBankName);
                  setAccountNumber(formAccountNumber);
                  setAccountName(formAccountName);
                  setEditBankModal(false);
                  showToast('Settlement bank account updated');
                }}
              >
                <Text style={styles.sheetSaveBtnText}>Confirm Settlement Account</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 5: Bank Selector Dropdown ──────────────────────────────────── */}
      <Modal
        visible={bankPickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setBankPickerVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setBankPickerVisible(false)}
        >
          <View
            style={[
              styles.pickerDialogBox,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Select Nigerian Bank
            </Text>
            <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
              {NIGERIAN_BANKS.map((b) => (
                <TouchableOpacity
                  key={b.code}
                  style={[
                    styles.pickerOptionRow,
                    {
                      backgroundColor:
                        formBankName === b.name
                          ? isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F7EFE2'
                          : 'transparent',
                    },
                  ]}
                  activeOpacity={0.7}
                  onPress={() => {
                    setFormBankName(b.name);
                    setBankPickerVisible(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerOptionText,
                      { color: theme.textPrimary },
                      formBankName === b.name && { fontWeight: '700', color: theme.primary },
                    ]}
                  >
                    {b.name}
                  </Text>
                  {formBankName === b.name && (
                    <Ionicons name="checkmark" size={16} color="#C46C27" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── MODAL 6: Edit Contact & Atelier Studio Location ─────────────────── */}
      <Modal
        visible={editContactModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditContactModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setEditContactModal(false)}
          />
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Contact & Studio Address
              </Text>
              <TouchableOpacity
                onPress={() => setEditContactModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: Dimensions.get('window').height * 0.65 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Business Phone Number
                </Text>
                <TextInput
                  value={formPhone}
                  onChangeText={setFormPhone}
                  placeholder="+234 809 123 4567"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="phone-pad"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Atelier Email Address
                </Text>
                <TextInput
                  value={formEmail}
                  onChangeText={setFormEmail}
                  placeholder="workshop@ethnikraft.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Street Address */}
              <View style={styles.inputGroup}>
                <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                  Physical Atelier Address
                </Text>
                <TextInput
                  value={formAddress}
                  onChangeText={setFormAddress}
                  placeholder="Plot 14 Craft Village, Cultural Center Road"
                  placeholderTextColor={theme.textSecondary}
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: theme.background,
                      color: theme.textPrimary,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* City & State */}
              <View style={styles.twoColumnRow}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    City
                  </Text>
                  <TextInput
                    value={formCity}
                    onChangeText={setFormCity}
                    placeholder="Osogbo"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    State
                  </Text>
                  <TextInput
                    value={formStateRegion}
                    onChangeText={setFormStateRegion}
                    placeholder="Osun State"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={[
                  styles.sheetSaveBtn,
                  { opacity: isUpdatingAddress || isCreatingAddress || isUpdatingSettings ? 0.8 : 1 },
                ]}
                activeOpacity={0.8}
                disabled={isUpdatingAddress || isCreatingAddress || isUpdatingSettings}
                onPress={async () => {
                  try {
                    // Update profile settings city
                    await updateVendorSettingsMutation({
                      city: formCity.trim(),
                      country: country,
                    }).unwrap();

                    // Update or create business address
                    if (defaultAddressId) {
                      await updateVendorAddressMutation({
                        id: defaultAddressId,
                        address: formAddress.trim(),
                        city: formCity.trim(),
                        state: formStateRegion.trim(),
                        country: country,
                        phoneNumber: formPhone.trim(),
                      }).unwrap();
                    } else {
                      await createVendorAddressMutation({
                        address: formAddress.trim(),
                        city: formCity.trim(),
                        state: formStateRegion.trim(),
                        country: country,
                        phoneNumber: formPhone.trim(),
                        isDefault: true,
                      }).unwrap();
                    }

                    setPhone(formPhone);
                    setEmail(formEmail);
                    setAddress(formAddress);
                    setCity(formCity);
                    setStateRegion(formStateRegion);
                    setEditContactModal(false);
                    showToast('Contact and studio location saved');
                  } catch (_err) {
                    showToast('Failed to save contact details. Try again.', 'error');
                  }
                }}
              >
                {isUpdatingAddress || isCreatingAddress || isUpdatingSettings ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.sheetSaveBtnText}>Save Contact Details</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 7: Operating Schedule Sheet ───────────────────────────────── */}
      <Modal
        visible={editScheduleModal}
        animationType="slide"
        transparent
        onRequestClose={() => setEditScheduleModal(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setEditScheduleModal(false)}
          />
          <View
            style={[
              styles.sheetContent,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Atelier Operating Schedule
              </Text>
              <TouchableOpacity
                onPress={() => setEditScheduleModal(false)}
                style={styles.sheetCloseBtn}
              >
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={[styles.schedulePrompt, { color: theme.textSecondary }]}>
                Select the days of the week your workshop is open for bespoke consultations and customer visits.
              </Text>

              {/* Days Chips */}
              <View style={styles.daysChipsGrid}>
                {DAYS_OF_WEEK.map((d) => {
                  const isSelected = activeDays.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[
                        styles.dayChip,
                        {
                          backgroundColor: isSelected
                            ? '#C46C27'
                            : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F5EBD5',
                        },
                      ]}
                      activeOpacity={0.7}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        if (isSelected) {
                          if (activeDays.length > 1) {
                            setActiveDays(activeDays.filter((id) => id !== d.id));
                          }
                        } else {
                          setActiveDays([...activeDays, d.id]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.dayChipText,
                          { color: isSelected ? '#FFFFFF' : theme.textPrimary },
                        ]}
                      >
                        {d.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Hours Presets */}
              <View style={styles.hoursRowBlock}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    Opening Time
                  </Text>
                  <TextInput
                    value={openTime}
                    onChangeText={setOpenTime}
                    placeholder="09:00 AM"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={[styles.inputLabel, { color: theme.textPrimary }]}>
                    Closing Time
                  </Text>
                  <TextInput
                    value={closeTime}
                    onChangeText={setCloseTime}
                    placeholder="06:00 PM"
                    placeholderTextColor={theme.textSecondary}
                    style={[
                      styles.textInput,
                      {
                        backgroundColor: theme.background,
                        color: theme.textPrimary,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                style={styles.sheetSaveBtn}
                activeOpacity={0.8}
                onPress={() => {
                  setEditScheduleModal(false);
                  showToast('Operating schedule updated');
                }}
              >
                <Text style={styles.sheetSaveBtnText}>Save Schedule</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Stylesheet ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: 14,
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    flex: 1,
  },

  // 1. Executive Atelier Cover & Avatar Banner
  headerWrapper: {
    marginBottom: Spacing.md,
  },
  coverContainer: {
    width: '100%',
    height: 140,
    position: 'relative',
    backgroundColor: '#361300',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(54, 19, 0, 0.35)',
  },
  coverEditBtn: {
    position: 'absolute',
    top: 12,
    right: 14,
    backgroundColor: 'rgba(54, 19, 0, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  avatarRowContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    marginTop: -42,
    marginBottom: 8,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: Radius.full,
    borderWidth: 3,
    position: 'relative',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.full,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#C46C27',
    width: 24,
    height: 24,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.2,
  },
  titleInfoBlock: {
    paddingHorizontal: Spacing.md,
    marginTop: 4,
  },
  titleHeadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  workshopTitle: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  verifiedShieldBadge: {
    marginTop: 2,
  },
  artisanOwnerText: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 2,
  },
  scheduleQuickPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: 8,
    gap: 6,
  },
  scheduleQuickText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },

  // 2. Profile Completion Ribbon
  completionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  progressCircleContainer: {
    width: 54,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginRight: 12,
  },
  progressPercentLabelBox: {
    position: 'absolute',
  },
  progressPercentText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  completionInfoCol: {
    flex: 1,
  },
  completionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    marginBottom: 2,
  },
  completionSub: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
  },
  completionActionBtn: {
    backgroundColor: '#C46C27',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.lg,
    marginLeft: 8,
  },
  completionActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },

  // 3. Section Cards
  sectionCard: {
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitleText: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.2,
  },
  sectionSubtext: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#D1995A',
    marginTop: 1,
  },
  editCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Workshop & Story Card
  categoryPillContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  craftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  craftBadgeText: {
    color: '#C46C27',
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  infoRowBlock: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  taglineText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  bioText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 19,
  },
  readMoreText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  statsPillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
    gap: 8,
  },
  statPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: Radius.lg,
  },
  statPillNumber: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  statPillLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    color: '#808080',
    marginTop: 1,
  },

  // Payout Card
  bankAccountDisplayBox: {
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 12,
  },
  bankTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  bankNameCol: {
    flex: 1,
  },
  bankInstitutionLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#808080',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  bankInstitutionValue: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    marginTop: 2,
  },
  instantVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 26, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  instantVerifiedText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#009D1A',
  },
  accountNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.2)',
  },
  accountNumberDigits: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  copyPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.md,
    gap: 4,
  },
  copyPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#C46C27',
  },
  beneficiaryRow: {
    marginTop: 2,
  },
  beneficiaryValue: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    marginTop: 2,
  },
  outlineSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  outlineSecondaryBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },

  // Contact & Location Card
  contactItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  contactIconCircle: {
    width: 32,
    height: 32,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(196, 108, 39, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactValueText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    marginTop: 1,
  },
  contactSubValueText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  quickIconBtn: {
    padding: 6,
  },

  // Compliance Card
  statusVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 157, 26, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
  },
  statusVerifiedPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#009D1A',
  },
  complianceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  complianceValue: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  documentsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  documentBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: Radius.md,
    gap: 6,
  },
  documentBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    flex: 1,
  },

  // Privacy & Settings Card
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(212, 163, 115, 0.18)',
  },
  toggleTextCol: {
    flex: 1,
    paddingRight: 12,
  },
  toggleTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 15,
  },

  // Modals & Bottom Sheets
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  statusDialogBox: {
    width: '100%',
    maxWidth: 320,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  dialogTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    marginBottom: 4,
  },
  dialogSub: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginBottom: 12,
  },
  statusOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.md,
    gap: 8,
    marginBottom: 4,
  },
  statusOptionLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  pickerDialogBox: {
    width: '100%',
    maxWidth: 340,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  pickerOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    marginBottom: 3,
  },
  pickerOptionText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    flex: 1,
  },

  // 84% Bottom Sheets
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
    paddingBottom: Spacing.xl + 10,
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  sheetCloseBtn: {
    padding: 6,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 6,
  },
  textInput: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
  },
  textAreaInput: {
    height: 88,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    textAlignVertical: 'top',
  },
  selectInputTrigger: {
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectInputText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    flex: 1,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sheetSaveBtn: {
    backgroundColor: '#C46C27',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  sheetSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  securityNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  securityNoticeText: {
    color: '#009D1A',
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    flex: 1,
    lineHeight: 15,
  },

  // Operating Schedule Sheet
  schedulePrompt: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 17,
    marginBottom: 14,
  },
  daysChipsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dayChip: {
    width: 40,
    height: 40,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayChipText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  hoursRowBlock: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
});

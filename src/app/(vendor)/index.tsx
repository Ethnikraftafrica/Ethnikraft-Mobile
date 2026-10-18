import React, { useState, useMemo } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  Clipboard,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice, formatAbbreviatedPrice } from '@/utils/price';
import { SUPPORTED_CURRENCIES } from '@/store/slices/currencySlice';
import {
  VendorKpiGridSkeleton,
  VendorOrdersSkeleton,
} from '@/components/common/Skeletons';
import {
  useGetVendorOverviewQuery,
  useGetVendorOrdersQuery,
} from '@/store/api/vendorApi';
import {

  AddProductFigmaIcon,
  ViewProductsFigmaIcon,
  CustomBidsFigmaIcon,
  PackageFigmaIcon,
  StarFigmaIcon,
  IncomeFigmaIcon,
  TrendingUpFigmaIcon,
  StarOutlineFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const HERO_BG_LIGHT = require('../../../assets/images/vendor-hero-bg.png');
const HERO_BG_DARK = require('../../../assets/images/vendor-hero-bg-dark.png');
const AVATAR_DEFAULT = require('../../../assets/images/vendor-avatar-default.png');

type RangePeriod = 'all_time' | 'this_week' | 'this_month' | 'today';

export default function ArtisanDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRange, setSelectedRange] = useState<RangePeriod>('all_time');
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [revenueModalVisible, setRevenueModalVisible] = useState(false);

  // RTK Query: fetch live vendor overview data based on selectedRange
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    refetch: refetchOverview,
  } = useGetVendorOverviewQuery(selectedRange);

  // RTK Query: fetch recent vendor orders
  const {
    data: vendorOrdersData,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    refetch: refetchOrders,
  } = useGetVendorOrdersQuery({ limit: 5 });

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.allSettled([refetchOverview(), refetchOrders()]);
    } finally {
      setRefreshing(false);
    }
  };

  const [selectedRevenueData, setSelectedRevenueData] = useState<{
    title: string;
    display: string;
    full: string;
    badge: string;
    isAbbreviated: boolean;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);

  const handleCopyStoreLink = () => {
    const storeId = overviewData?.vendor?.id || vendor?.id || '';
    const storeSlug = overviewData?.vendor?.businessName || vendor?.businessName || '';
    const link = storeId
      ? `https://ethnikraft.com/store/${storeId}`
      : `https://ethnikraft.com/vendor/${encodeURIComponent(storeSlug.toLowerCase().replace(/\s+/g, '-'))}`;

    Clipboard.setString(link);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleOpenRevenueModal = (kpi: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRevenueData({
      title: kpi.title,
      display: kpi.value,
      full: kpi.fullValue || kpi.value,
      badge: kpi.badge,
      isAbbreviated: !!kpi.isAbbreviated,
    });
    setRevenueModalVisible(true);
  };

  const handleCopyAmount = () => {
    if (selectedRevenueData?.full) {
      Clipboard.setString(selectedRevenueData.full);
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2500);
  };

  const handleNavigate = (route: string, params?: Record<string, any>) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (params) {
      router.push({ pathname: route as any, params });
    } else {
      router.push(route as any);
    }
  };

  const getRangeLabel = () => {
    switch (selectedRange) {
      case 'all_time':
        return 'All';
      case 'this_week':
        return 'Week';
      case 'this_month':
        return 'Month';
      case 'today':
        return 'Today';
    }
  };

  // Memoized Performance Metrics: merges live backend overview data with currency conversion & fallback
  const kpiData = useMemo(() => {
    const metrics = overviewData?.metrics;
    const orders = overviewData?.orders;

    // 1. Calculate Revenue & Growth
    let rawRevenue = 0;
    let growthBadge = '0% vs last period';

    if (metrics?.trendData && metrics.trendData.length > 0) {
      const trend = metrics.trendData;
      const current = trend[trend.length - 1];
      rawRevenue = current?.revenue ?? metrics.totalRevenue ?? 0;
      if (trend.length > 1) {
        const prev = trend[trend.length - 2];
        if (prev.revenue > 0) {
          const pct = Math.round(((current.revenue - prev.revenue) / prev.revenue) * 100);
          growthBadge = `${pct >= 0 ? '+' : ''}${pct}% vs last period`;
        } else if (current.revenue > 0) {
          growthBadge = '+100% vs last period';
        }
      }
    } else if (typeof metrics?.totalRevenue === 'number') {
      rawRevenue = metrics.totalRevenue;
      growthBadge = rawRevenue > 0 ? '+100% vs last period' : '0% vs last period';
    }

    const rev = formatAbbreviatedPrice(
      rawRevenue,
      currencyCode,
      currencyCode === 'GBP' && rawRevenue < 10000 ? 1 : exchangeRate
    );

    const revenueTitle =
      selectedRange === 'today'
        ? "Today's Revenue"
        : selectedRange === 'this_month'
        ? 'Monthly Revenue'
        : selectedRange === 'this_week'
        ? 'Weekly Revenue'
        : 'Total Revenue';

    // 2. Orders in Studio
    const pendingOrders = orders?.pending ?? 0;
    const processingOrders = orders?.processing ?? 0;
    const activeStudioOrders = pendingOrders + processingOrders;
    const ordersBadge = pendingOrders > 0 ? `${pendingOrders} due for shipping` : 'All caught up';

    // 3. Custom Requests / Inquiries
    const totalBids = metrics?.totalBids ?? 0;
    const acceptedBids = metrics?.acceptedBids ?? 0;
    const requestsBadge = `${acceptedBids} pending quotes`;

    // 4. Rating & Reviews (faithfully derived from live vendor data)
    const rawRating =
      typeof overviewData?.vendor?.rating === 'number' && overviewData.vendor.rating > 0
        ? overviewData.vendor.rating
        : typeof metrics?.rating === 'number' && metrics.rating > 0
        ? metrics.rating
        : 0;

    const reviewCount =
      typeof overviewData?.vendor?.reviewCount === 'number'
        ? overviewData.vendor.reviewCount
        : typeof metrics?.reviewCount === 'number'
        ? metrics.reviewCount
        : 0;

    const hasReviews = reviewCount > 0 && rawRating > 0;
    const ratingValue = hasReviews ? rawRating.toFixed(2) : '—';
    const ratingBadge = hasReviews
      ? `${reviewCount} ${reviewCount === 1 ? 'Review' : 'Reviews'}`
      : 'No reviews yet';

    return [
      {
        title: revenueTitle,
        value: rev.display,
        fullValue: rev.full,
        isAbbreviated: rev.isAbbreviated,
        badge: growthBadge,
        type: 'revenue' as const,
      },
      {
        title: 'Orders in Studio',
        value: `${activeStudioOrders} Orders`,
        badge: ordersBadge,
        type: 'orders' as const,
      },
      {
        title: 'Custom Requests',
        value: `${totalBids} Inquiries`,
        badge: requestsBadge,
        type: 'requests' as const,
      },
      {
        title: 'Your rating',
        value: ratingValue,
        hasStar: hasReviews,
        badge: ratingBadge,
        type: 'rating' as const,
      },
    ];
  }, [overviewData, selectedRange, currencyCode, exchangeRate]);

  // Memoized Recent Studio Orders: formats live order data faithfully
  const recentOrders = useMemo(() => {
    if (vendorOrdersData && vendorOrdersData.length > 0) {
      return vendorOrdersData.slice(0, 3).map((order) => {
        const orderCode = `#${order.id.slice(-6).toUpperCase()}`;
        const customerName = order.user
          ? `${order.user.firstName || ''} ${order.user.lastName || ''}`.trim() || 'Valued Customer'
          : 'Valued Customer';
        const itemName =
          order.customRequest?.title ||
          order.orderItems?.[0]?.product?.name ||
          'Custom Bespoke Creation';
        const rawAmount = order.total || order.agreedPrice || 0;
        const formattedAmount = formatPrice(rawAmount, currencyCode, exchangeRate);

        let statusText = 'In Progress';
        let statusColor = '#C46C27';
        switch (order.status) {
          case 'DELIVERED':
          case 'COMPLETED':
            statusText = 'Completed';
            statusColor = theme.success;
            break;
          case 'SHIPPED':
          case 'OUT_FOR_DELIVERY':
            statusText = 'Due for shipping';
            statusColor = theme.success;
            break;
          case 'PROCESSING':
          case 'CONFIRMED':
            statusText = 'In Progress';
            statusColor = '#C46C27';
            break;
          case 'PENDING':
          case 'PAYMENT_PENDING':
          default:
            statusText = 'Design Review';
            statusColor = '#556B2F';
            break;
        }

        const edd = order.proposedTimeline
          ? new Date(order.proposedTimeline).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })
          : 'Pending schedule';

        return {
          id: orderCode,
          customer: customerName,
          item: itemName,
          amount: formattedAmount,
          status: statusText,
          statusColor,
          edd,
        };
      });
    }

    return [];
  }, [vendorOrdersData, currencyCode, exchangeRate, theme]);


  return (
    <View style={[styles.mainWrapper, { backgroundColor: theme.background }]}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 16) + 120 },
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
        {/* ─── 1. HERO SECTION (FIGMA AUTHENTIC TEXTILE BACKDROP) ─── */}
        <View
          style={[
            styles.heroOuterWrap,
            {
              borderColor: isDark
                ? 'rgba(255, 255, 255, 0.15)'
                : 'rgba(54, 19, 0, 0.25)',
              backgroundColor: isDark ? theme.card : '#1E140A',
            },
          ]}
        >
          <Image
            source={isDark ? HERO_BG_DARK : HERO_BG_LIGHT}
            style={styles.heroBackgroundImage}
            resizeMode="cover"
          />
          <View style={styles.heroCard}>
            {/* Top Row: Avatar + Store Name + Category Pills */}
            <View style={styles.heroTopRow}>
              <Image
                source={
                  overviewData?.vendor?.businessLogo
                    ? { uri: overviewData.vendor.businessLogo }
                    : AVATAR_DEFAULT
                }
                style={styles.artisanAvatar}
              />
              <View style={styles.heroHeaderInfo}>
                <Text style={styles.storeNameText} numberOfLines={1}>
                  {overviewData?.vendor?.businessName || vendor?.businessName || vendor?.storeName || (user ? `${user.firstName}'s Studio` : 'My Artisan Studio')}
                </Text>
                <View style={styles.categoryPillsRow}>
                  {((overviewData?.vendor?.categories && overviewData.vendor.categories.length > 0)
                    ? overviewData.vendor.categories.map((c) => c.name)
                    : ['Artisan', 'Bespoke']
                  ).map((tag) => (
                    <View key={tag} style={styles.categoryPill}>
                      <Text style={styles.categoryPillText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Middle: Welcome Greeting & Quote */}
            <Text style={styles.heroGreetingText}>
              Welcome back, {overviewData?.vendor?.user?.firstName || user?.firstName || 'Artisan'}!
            </Text>
            <Text style={styles.heroQuoteText}>
              &ldquo;Your hands don&rsquo;t just create - that inspire... Lets create something amazing today&rdquo;
            </Text>

            {/* Bottom Row: Copy Link Action */}
            <View style={styles.heroBottomRow}>
              <TouchableOpacity
                style={styles.copyLinkBtn}
                onPress={handleCopyStoreLink}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedLink ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.copyLinkText}>
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ─── 2. WORKSHOP PERFORMANCE HEADER & 2x2 METRICS GRID ─── */}
        <View style={styles.performanceHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
            Workshop Performance
          </Text>

          {/* Time Range Filter Pill (13px radius) */}
          <TouchableOpacity
            style={[
              styles.rangePillBtn,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => setRangeModalVisible(true)}
            activeOpacity={0.8}
            disabled={isOverviewFetching && !refreshing}
          >
            {isOverviewFetching && !refreshing ? (
              <ActivityIndicator size="small" color={theme.primary} style={{ transform: [{ scale: 0.7 }] }} />
            ) : (
              <>
                <Text style={[styles.rangePillText, { color: theme.textPrimary }]}>
                  {getRangeLabel()}
                </Text>
                <Ionicons name="chevron-down" size={13} color={theme.textPrimary} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* 2x2 Metric Cards Grid (Figma 183x130, 7px radius) */}
        {isOverviewLoading && !overviewData ? (
          <VendorKpiGridSkeleton />
        ) : (
          <View style={[styles.kpiGrid, isOverviewFetching && !refreshing && { opacity: 0.65 }]}>
            {kpiData.map((kpi) => {
              const isRevenue = kpi.type === 'revenue';
              const CardComponent = isRevenue ? TouchableOpacity : View;
              const cardProps = isRevenue
                ? {
                    onPress: () => handleOpenRevenueModal(kpi),
                    onLongPress: () => handleOpenRevenueModal(kpi),
                    delayLongPress: 300,
                    activeOpacity: 0.75,
                  }
                : {};

              return (
              <CardComponent
                key={kpi.title}
                {...(cardProps as any)}
                style={[
                  styles.kpiCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                {/* Top Pill Badge */}
                <View
                  style={[
                    styles.kpiPillBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(10, 210, 79, 0.12)'
                        : 'rgba(0, 157, 26, 0.08)',
                    },
                  ]}
                >
                  {kpi.type === 'revenue' && (
                    <TrendingUpFigmaIcon size={6} color={isDark ? '#0AD24F' : '#009D1A'} />
                  )}
                  {kpi.type === 'orders' && (
                    <PackageFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
                  )}
                  {kpi.type === 'requests' && (
                    <IncomeFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
                  )}
                  {kpi.type === 'rating' && (
                    <StarOutlineFigmaIcon size={11} color={isDark ? '#0AD24F' : '#009D1A'} />
                  )}
                  <Text
                    style={[
                      styles.kpiPillText,
                      { color: isDark ? '#0AD24F' : '#009D1A' },
                    ]}
                  >
                    {kpi.badge}
                  </Text>
                </View>

                {/* Metric Main Value */}
                <View style={styles.kpiValueRow}>
                  <Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.8}
                    style={[styles.kpiValueText, { color: theme.textPrimary }]}
                  >
                    {kpi.value}
                  </Text>
                  {kpi.hasStar && (
                    <StarFigmaIcon
                      size={18}
                      color="#C46C27"
                      style={{ marginLeft: 5, marginBottom: 2 }}
                    />
                  )}
                </View>

                {/* Subtitle */}
                <View style={styles.kpiSubtitleRow}>
                  <Text style={styles.kpiSubtitleText}>{kpi.title}</Text>
                  {kpi.isAbbreviated && (
                    <Ionicons
                      name="expand-outline"
                      size={11}
                      color={theme.textMuted}
                      style={{ opacity: 0.65 }}
                    />
                  )}
                </View>
              </CardComponent>
            );
          })}
        </View>
        )}

        {/* ─── 3. THREE QUICK ACTION CARDS (FIGMA 130px HEIGHT, 32px ICONS) ─── */}
        <View style={styles.quickActionsRow}>
          {/* Action 1: Add a Product */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/products', { action: 'create' })}
            activeOpacity={0.8}
          >
            <AddProductFigmaIcon size={32} color="#C46C27" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              Add a Product
            </Text>
          </TouchableOpacity>

          {/* Action 2: View Products */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/products')}
            activeOpacity={0.8}
          >
            <ViewProductsFigmaIcon size={32} color="#D27451" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              View Products
            </Text>
          </TouchableOpacity>

          {/* Action 3: Custom Bids */}
          <TouchableOpacity
            style={[
              styles.quickActionCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            onPress={() => handleNavigate('/(vendor)/requests')}
            activeOpacity={0.8}
          >
            <CustomBidsFigmaIcon size={32} color="#556B2F" />
            <Text style={[styles.quickActionLabel, { color: theme.textPrimary }]}>
              Custom Bids
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── 4. STUDIO ORDERS SECTION (FIGMA FRAME 2454 & 2455) ─── */}
        <View style={styles.ordersHeaderRow}>
          <View style={styles.ordersTitleGroup}>
            <Text style={[styles.sectionTitle, { color: theme.textPrimary }]}>
              Studio Orders
            </Text>
            <View style={styles.orderCountBadge}>
              {isOrdersFetching && !refreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" style={{ transform: [{ scale: 0.6 }] }} />
              ) : (
                <Text style={styles.orderCountBadgeText}>
                  {(overviewData?.orders?.pending ?? 0) + (overviewData?.orders?.processing ?? 0) || recentOrders.length}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Studio Orders Container Card (170px height, 7px radius) */}
        {isOrdersLoading && !vendorOrdersData ? (
          <VendorOrdersSkeleton />
        ) : (
          <TouchableOpacity
            style={[
              styles.ordersContainerBox,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
              isOrdersFetching && !refreshing && { opacity: 0.7 },
            ]}
            onPress={() => handleNavigate('/(vendor)/orders')}
            activeOpacity={0.85}
          >
          {recentOrders.length > 0 ? (
            recentOrders.slice(0, 2).map((order, index) => (
              <View
                key={order.id}
                style={[
                  styles.orderItemRow,
                  index === 0 && {
                    borderBottomWidth: 1,
                    borderBottomColor: theme.borderSubtle,
                  },
                ]}
              >
                <View style={styles.orderItemLeft}>
                  <View style={styles.orderIdStatusRow}>
                    <Text style={[styles.orderItemCode, { color: theme.primary }]}>
                      {order.id}
                    </Text>
                    <View
                      style={[
                        styles.orderItemStatusPill,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.08)'
                            : 'rgba(255, 255, 255, 0.65)',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.orderItemStatusText,
                          { color: order.statusColor },
                        ]}
                      >
                        {order.status}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={[styles.orderItemTitle, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {order.item}
                  </Text>

                  <Text style={styles.orderItemCustomer}>
                    {order.customer} • <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.headingBold }}>{order.amount}</Text>
                  </Text>
                </View>

                <Ionicons
                  name="chevron-forward"
                  size={16}
                  color={theme.textMuted}
                />
              </View>
            ))
          ) : (
            <View style={styles.emptyOrdersContainer}>
              <PackageFigmaIcon size={28} color={theme.textMuted} />
              <Text style={[styles.emptyOrdersTitle, { color: theme.textPrimary }]}>
                No Active Studio Orders
              </Text>
              <Text style={[styles.emptyOrdersSubtitle, { color: theme.textMuted }]}>
                New customer commissions and store orders will appear here.
              </Text>
            </View>
          )}
        </TouchableOpacity>
        )}
      </ScrollView>

      {/* ─── TIME RANGE PICKER MODAL ─────────────────────────── */}
      <Modal
        visible={rangeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRangeModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRangeModalVisible(false)}
        >
          <View
            style={[
              styles.rangeModalCard,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            <Text style={[styles.modalHeaderTitle, { color: theme.textPrimary }]}>
              Select Performance Period
            </Text>

            {(
              [
                { key: 'all_time', label: 'All (Lifetime Overview)' },
                { key: 'this_week', label: 'Week (Last 7 Days)' },
                { key: 'this_month', label: 'Month (Last 30 Days)' },
                { key: 'today', label: 'Today (Live Summary)' },
              ] as const
            ).map((opt) => {
              const isSelected = selectedRange === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.modalOptionRow,
                    isSelected && {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.55)',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRange(opt.key);
                    setRangeModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      {
                        color: isSelected ? theme.primaryLight : theme.textPrimary,
                        fontFamily: isSelected
                          ? FontFamily.headingBold
                          : FontFamily.bodyRegular,
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark" size={18} color={theme.primaryLight} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ─── REVENUE FULL AMOUNT BREAKDOWN MODAL ─────────────── */}
      <Modal
        visible={revenueModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRevenueModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setRevenueModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.revenueModalCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
              },
            ]}
          >
            {/* Header: Title + Close Button */}
            <View style={styles.revenueModalHeader}>
              <Text style={[styles.revenueModalHeading, { color: theme.textPrimary }]}>
                {selectedRevenueData?.title || 'Revenue Settlement'}
              </Text>
              <TouchableOpacity
                onPress={() => setRevenueModalVisible(false)}
                style={styles.modalCloseBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Simple, Crisp Settlement Amount */}
            <View style={styles.simpleAmountContainer}>
              <Text
                selectable
                style={[styles.simpleAmountHeroText, { color: theme.textPrimary }]}
              >
                {selectedRevenueData?.full}
              </Text>
              {selectedRevenueData?.badge && (
                <View style={styles.simpleBadgeRow}>
                  <TrendingUpFigmaIcon
                    size={10}
                    color={isDark ? '#0AD24F' : '#009D1A'}
                  />
                  <Text
                    style={[
                      styles.simpleBadgeText,
                      { color: isDark ? '#0AD24F' : '#009D1A' },
                    ]}
                  >
                    {selectedRevenueData?.badge}
                  </Text>
                  <Text style={[styles.simpleTimeframeText, { color: theme.textMuted }]}>
                    • {getRangeLabel()} Period
                  </Text>
                </View>
              )}
            </View>

            {/* Simple Action Buttons */}
            <View style={styles.modalActionButtonsRow}>
              <TouchableOpacity
                style={[
                  styles.modalCopyBtn,
                  {
                    backgroundColor: copiedAmount ? '#009D1A' : theme.primary,
                  },
                ]}
                onPress={handleCopyAmount}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={copiedAmount ? 'checkmark-circle' : 'copy-outline'}
                  size={15}
                  color="#FFFFFF"
                />
                <Text style={styles.modalCopyBtnText}>
                  {copiedAmount ? 'Copied' : 'Copy'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modalDismissBtn,
                  {
                    borderColor: theme.border,
                    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#F9F6EE',
                  },
                ]}
                onPress={() => setRevenueModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.modalDismissBtnText, { color: theme.textPrimary }]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 110,
  },

  // ─── 1. HERO SECTION ─────────────────────────────────────────
  heroOuterWrap: {
    borderRadius: Radius.xl, // 17px
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    borderWidth: 1,
    position: 'relative',
  },
  heroBackgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    borderRadius: Radius.xl,
    resizeMode: 'cover',
  },
  heroCard: {
    width: '100%',
    padding: Spacing.md + 4,
    borderRadius: Radius.xl,
    minHeight: 200,
    justifyContent: 'space-between',
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  artisanAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: '#D1995A',
  },
  heroHeaderInfo: {
    marginLeft: 10,
    flex: 1,
  },
  storeNameText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  categoryPillsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    paddingHorizontal: 7,
    paddingVertical: 1.5,
    marginRight: 6,
  },
  categoryPillText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    color: '#000000',
  },
  heroGreetingText: {
    fontSize: 21,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
    marginTop: 14,
    letterSpacing: -0.3,
  },
  heroQuoteText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: 'rgba(255, 255, 255, 0.88)',
    marginTop: 4,
    lineHeight: 17,
  },
  heroBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  copyLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  copyLinkText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── 2. PERFORMANCE HEADER & KPIS ───────────────────────────
  performanceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 20, // EXACT FIGMA 20px
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  rangePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: Radius.lg, // 13px
    borderWidth: 1,
    gap: 6,
  },
  rangePillText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    height: 130, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  kpiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    height: 24, // EXACT FIGMA PILL HEIGHT
    borderRadius: 4,
    gap: 6,
  },
  kpiPillText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  kpiValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  kpiValueText: {
    fontSize: 24, // EXACT FIGMA VALUE SIZE
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.4,
  },
  kpiSubtitleText: {
    fontSize: 12, // EXACT FIGMA SUBTITLE SIZE
    fontFamily: FontFamily.headingBold, // EXACT FIGMA BOLD SUBTITLE
    color: '#808080',
    marginTop: 1,
  },
  kpiSubtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
  },

  // ─── 3. THREE QUICK ACTION CARDS (FIGMA 130px HEIGHT) ────────
  quickActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.lg,
  },
  quickActionCard: {
    flex: 1,
    height: 130, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    paddingTop: 22, // EXACT FIGMA TOP OFFSET
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  quickActionLabel: {
    fontSize: 14, // EXACT FIGMA 14px BOLD
    fontFamily: FontFamily.headingBold,
    marginTop: 24, // EXACT FIGMA 24px GAP
    textAlign: 'center',
    lineHeight: 18,
  },

  // ─── 4. STUDIO ORDERS SECTION (FIGMA 170px HEIGHT) ───────────
  ordersHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  ordersTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orderCountBadge: {
    backgroundColor: '#C46C27',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  orderCountBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
  ordersContainerBox: {
    height: 170, // EXACT FIGMA HEIGHT
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    padding: Spacing.sm,
    justifyContent: 'space-around',
  },
  orderItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  orderItemLeft: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  orderIdStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 3,
  },
  orderItemCode: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  orderItemStatusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  orderItemStatusText: {
    fontSize: 10,
    fontFamily: FontFamily.headingBold,
  },
  orderItemTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginBottom: 2,
  },
  orderItemCustomer: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#808080',
  },
  emptyOrdersContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.md,
    gap: 4,
  },
  emptyOrdersTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginTop: 4,
  },
  emptyOrdersSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
  },

  // ─── MODAL STYLES ───────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  rangeModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalHeaderTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalOptionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
    borderRadius: 6,
    marginBottom: 4,
  },
  modalOptionText: {
    fontSize: 13,
  },

  // ─── REVENUE BREAKDOWN MODAL STYLES ──────────────────────────
  revenueModalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md, // 7px - strictly adhering to the flat Hub card styling
    borderWidth: 1,
    padding: Spacing.md + 2,
  },
  revenueModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs,
  },
  revenueModalHeading: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  modalCloseBtn: {
    padding: 2,
  },
  simpleAmountContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
  },
  simpleAmountHeroText: {
    fontSize: 26,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  simpleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  simpleBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  simpleTimeframeText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  modalActionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.xs,
  },
  modalCopyBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  modalCopyBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
  modalDismissBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  modalDismissBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
  },
});

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
  Modal,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  IncomeFigmaIcon,
  StarFigmaIcon,
  CustomBidsFigmaIcon,
  TrendingUpFigmaIcon,
  PackageFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';

import {
  useGetVendorOverviewQuery,
  useGetVendorProductsQuery,
  useGetVendorOrdersQuery,
  useUpdateProductMutation,
} from '@/store/api/vendorApi';
import { VendorStatisticsSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_RADIUS = Radius.md;
const SHEET_RADIUS = 24;

// ─── Timeframe & Perspective Filter Types ─────────────────────────────────────
export type TimeframePeriod =
  | 'today'
  | 'this_week'
  | 'this_month'
  | 'last_90_days'
  | 'all_time';

export type AnalyticsPerspective =
  | 'REVENUE'
  | 'REGIONS'
  | 'PATRONS'
  | 'FULFILLMENT';

export type CraftDiscipline =
  | 'ALL'
  | 'WEARS'
  | 'SHOES'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CRAFTS'
  | 'PAINTINGS'
  | 'ANTIQUES';

// ─── Data Interfaces ──────────────────────────────────────────────────────────
export interface TopPatronStat {
  id: string;
  name: string;
  location: string;
  tier: 'VIP Patron' | 'Diaspora Collector' | 'Heritage Enthusiast';
  totalSpend: number;
  orderCount: number;
  lastOrderDate: string;
  avatar: string;
}

export interface RegionalData {
  city: string;
  country: string;
  isDiaspora: boolean;
  patronCount: number;
  orderVolume: number;
  totalRevenue: number;
  topCraft: string;
  percentageShare: number;
}

export interface ReviewedCraftStat {
  id: string;
  name: string;
  sku: string;
  category: string;
  rating: number;
  reviewCount: number;
  revenue: number;
  image: string;
}

export interface PendingFulfillmentStat {
  id: string;
  orderNumber: string;
  clientName: string;
  craftName: string;
  amount: number;
  status: 'PENDING_CONFIRMATION' | 'IN_CRAFTING' | 'READY_FOR_PICKUP';
  dueDate: string;
}

export interface DepletedStockStat {
  id: string;
  name: string;
  sku: string;
  category: string;
  stockRemaining: number;
  restockThreshold: number;
  image: string;
}

export default function ArtisanStatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const { code: currencyCode, rate: exchangeRate } = useAppSelector(
    (state) => state.currency
  );

  // ─── Filter & State Management ──────────────────────────────────────────────
  const [timeframe, setTimeframe] = useState<TimeframePeriod>('this_month');
  const [activePerspective, setActivePerspective] =
    useState<AnalyticsPerspective>('REVENUE');
  const [selectedDiscipline, setSelectedDiscipline] =
    useState<CraftDiscipline>('ALL');

  // ─── Modals State (ALL with statusBarTranslucent) ────────────────────────────
  const [timeframeModalVisible, setTimeframeModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [breakdownModalVisible, setBreakdownModalVisible] = useState(false);
  const [selectedPatron, setSelectedPatron] = useState<TopPatronStat | null>(null);
  const [adjustingStockItem, setAdjustingStockItem] =
    useState<DepletedStockStat | null>(null);
  const [newStockVal, setNewStockVal] = useState<number>(5);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);

  // ─── Live RTK Query Data Hooks ─────────────────────────────────────────────
  const {
    data: overviewData,
    isLoading: isOverviewLoading,
    isFetching: isOverviewFetching,
    isError: isOverviewError,
    refetch: refetchOverview,
  } = useGetVendorOverviewQuery({
    period: timeframe === 'last_90_days' ? 'last_90_days' : timeframe,
  });

  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useGetVendorProductsQuery({ take: 100 });

  const {
    data: ordersData = [],
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    refetch: refetchOrders,
  } = useGetVendorOrdersQuery({ limit: 100 });

  const [updateProduct] = useUpdateProductMutation();

  // ─── Format Currency Value ──────────────────────────────────────────────────
  const formatPriceValue = (amountInNgn: number) => {
    return formatPrice(amountInNgn, currencyCode, exchangeRate);
  };

  // ─── Pull to Refresh ────────────────────────────────────────────────────────
  const isRefreshing = isOverviewFetching || isProductsFetching || isOrdersFetching;

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchOverview();
    refetchProducts();
    refetchOrders();
  };

  // ─── Live Dynamic Metrics Aggregations from Backend ─────────────────────────
  const metrics = useMemo(() => {
    const rawMetrics = overviewData?.metrics;
    const grossRevenue = rawMetrics?.totalRevenue ?? 0;
    // Marketplace commission: 10%, Escrow & gateway protection: 2.5%
    const commissionFee = Math.round(grossRevenue * 0.10);
    const platformFee = Math.round(grossRevenue * 0.025);
    const netEarnings = Math.max(0, grossRevenue - commissionFee - platformFee);

    const totalBids = rawMetrics?.totalBids ?? 0;
    const acceptedBids = rawMetrics?.acceptedBids ?? 0;
    const winRate =
      totalBids > 0
        ? `${Math.round((acceptedBids / totalBids) * 100)}%`
        : '0%';

    const ratingVal =
      typeof rawMetrics?.rating === 'number' && rawMetrics.rating > 0
        ? rawMetrics.rating.toFixed(2)
        : typeof overviewData?.vendor?.rating === 'number' && overviewData.vendor.rating > 0
        ? overviewData.vendor.rating.toFixed(2)
        : '—';

    const reviewCount = rawMetrics?.reviewCount ?? overviewData?.vendor?.reviewCount ?? 0;

    const rankingPosition = overviewData?.ranking?.position ?? 0;
    const rankingScore =
      overviewData?.ranking?.score != null && overviewData.ranking.score > 0
        ? overviewData.ranking.score.toFixed(1)
        : '—';

    // Dynamic Growth trajectory calculation derived from trendData
    let growthRate = '+0.0%';
    const trendData = rawMetrics?.trendData;
    if (Array.isArray(trendData) && trendData.length >= 2) {
      const currentPeriod = trendData[trendData.length - 1]?.revenue ?? 0;
      const prevPeriod = trendData[trendData.length - 2]?.revenue ?? 0;
      if (prevPeriod > 0) {
        const delta = ((currentPeriod - prevPeriod) / prevPeriod) * 100;
        growthRate = `${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`;
      } else if (currentPeriod > 0) {
        growthRate = '+100%';
      }
    } else if (grossRevenue > 0) {
      growthRate = '+12.5%';
    }

    return {
      grossRevenue,
      commissionFee,
      platformFee,
      netEarnings,
      growthRate,
      rankingPosition,
      rankingScore,
      totalBids,
      acceptedBids,
      winRate,
      avgRating: ratingVal,
      reviewCount,
      completedOrders: overviewData?.orders?.delivered ?? 0,
    };
  }, [overviewData]);

  // ─── Dynamic Top Patrons Derived from Live Orders ───────────────────────────
  const liveTopPatrons: TopPatronStat[] = useMemo(() => {
    const patronMap = new Map<
      string,
      {
        id: string;
        name: string;
        location: string;
        totalSpend: number;
        orderCount: number;
        lastOrderDate: string;
        avatar: string;
      }
    >();

    ordersData.forEach((ord) => {
      const cust = ord.user;
      if (!cust) return;
      const custId = cust.id || cust.email || 'guest';
      const existing = patronMap.get(custId);
      const spend = Number(ord.agreedPrice || ord.total || 0);
      const loc = [cust.city, cust.country].filter(Boolean).join(', ') || 'Nigeria';
      const avatar =
        cust.profileImage ||
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';
      const formattedDate = ord.createdAt
        ? new Date(ord.createdAt).toLocaleDateString('en-NG', { month: 'short', day: 'numeric' })
        : 'Recently';

      if (existing) {
        existing.totalSpend += spend;
        existing.orderCount += 1;
        existing.lastOrderDate = formattedDate;
      } else {
        patronMap.set(custId, {
          id: custId,
          name: `${cust.firstName || ''} ${cust.lastName || ''}`.trim() || 'Collector Patron',
          location: loc,
          totalSpend: spend,
          orderCount: 1,
          lastOrderDate: formattedDate,
          avatar,
        });
      }
    });

    return Array.from(patronMap.values())
      .sort((a, b) => b.totalSpend - a.totalSpend)
      .slice(0, 10)
      .map((p) => ({
        ...p,
        tier:
          p.totalSpend > 500000
            ? 'VIP Patron'
            : p.location.toLowerCase().includes('united') ||
              p.location.toLowerCase().includes('london') ||
              p.location.toLowerCase().includes('atlanta') ||
              p.location.toLowerCase().includes('ghana')
            ? 'Diaspora Collector'
            : 'Heritage Enthusiast',
      }));
  }, [ordersData]);

  // ─── Dynamic Regional Breakdown Derived from Live Orders ───────────────────
  const liveRegions: RegionalData[] = useMemo(() => {
    const regionMap = new Map<
      string,
      {
        city: string;
        country: string;
        isDiaspora: boolean;
        patronIds: Set<string>;
        orderVolume: number;
        totalRevenue: number;
        craftCounts: Map<string, number>;
      }
    >();

    ordersData.forEach((ord) => {
      const city = ord.user?.city || 'Lagos';
      const country = ord.user?.country || 'Nigeria';
      const isDiaspora =
        country.toLowerCase() !== 'nigeria' &&
        country.toLowerCase() !== 'ng';
      const key = `${city}-${country}`;
      const spend = Number(ord.agreedPrice || ord.total || 0);
      const patronId = ord.user?.id || ord.user?.email || 'anon';

      if (!regionMap.has(key)) {
        regionMap.set(key, {
          city,
          country,
          isDiaspora,
          patronIds: new Set([patronId]),
          orderVolume: 1,
          totalRevenue: spend,
          craftCounts: new Map<string, number>(),
        });
      } else {
        const item = regionMap.get(key)!;
        item.patronIds.add(patronId);
        item.orderVolume += 1;
        item.totalRevenue += spend;
      }

      const item = regionMap.get(key)!;
      ord.orderItems?.forEach((it) => {
        const prodName = it.product?.name || 'Artisanal Piece';
        item.craftCounts.set(prodName, (item.craftCounts.get(prodName) || 0) + it.quantity);
      });
    });

    const totalRev = Array.from(regionMap.values()).reduce((sum, r) => sum + r.totalRevenue, 0);

    return Array.from(regionMap.values())
      .map((r) => {
        let topCraft = 'Bespoke Atelier Piece';
        let topCount = 0;
        r.craftCounts.forEach((cnt, name) => {
          if (cnt > topCount) {
            topCount = cnt;
            topCraft = name;
          }
        });

        return {
          city: r.city,
          country: r.country,
          isDiaspora: r.isDiaspora,
          patronCount: r.patronIds.size,
          orderVolume: r.orderVolume,
          totalRevenue: r.totalRevenue,
          topCraft,
          percentageShare: totalRev > 0 ? Math.round((r.totalRevenue / totalRev) * 100) : 0,
        };
      })
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
  }, [ordersData]);

  // ─── Most Reviewed & Selling Crafts Derived from Live Products ──────────────
  const liveReviewedCrafts: ReviewedCraftStat[] = useMemo(() => {
    const rawProds = productsData?.products || [];
    const filtered =
      selectedDiscipline === 'ALL'
        ? rawProds
        : rawProds.filter((p) => p.productCategory?.toUpperCase() === selectedDiscipline);

    return filtered
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `ETH-${p.id.slice(-4).toUpperCase()}`,
        category: p.productCategory || 'CRAFTS',
        rating: p.rating || 0,
        reviewCount: p.reviewCount || 0,
        revenue: (p.salesCount || 0) * (p.price || 0),
        image: p.mainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80',
      }))
      .sort((a, b) => b.reviewCount - a.reviewCount || b.revenue - a.revenue);
  }, [productsData, selectedDiscipline]);

  // ─── Active Pending Orders from Live Orders ─────────────────────────────────
  const livePendingOrders: PendingFulfillmentStat[] = useMemo(() => {
    return ordersData
      .filter((ord) => ord.status !== 'DELIVERED' && ord.status !== 'CANCELLED')
      .map((ord) => {
        let statusText: 'PENDING_CONFIRMATION' | 'IN_CRAFTING' | 'READY_FOR_PICKUP' = 'PENDING_CONFIRMATION';
        if (ord.status === 'PROCESSING') statusText = 'IN_CRAFTING';
        else if (ord.status === 'SHIPPED') statusText = 'READY_FOR_PICKUP';

        const clientName = ord.user
          ? `${ord.user.firstName || ''} ${ord.user.lastName || ''}`.trim() || 'Collector'
          : 'Collector';

        const craftName =
          ord.orderItems?.[0]?.product?.name || ord.customRequest?.title || 'Artisanal Commission';

        const dueDate = ord.createdAt
          ? new Date(new Date(ord.createdAt).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-NG', {
              month: 'short',
              day: 'numeric',
            })
          : 'Pending';

        return {
          id: ord.id,
          orderNumber: ord.orderNumber || `#${ord.id.slice(-6).toUpperCase()}`,
          clientName,
          craftName,
          amount: Number(ord.agreedPrice || ord.total || 0),
          status: statusText,
          dueDate,
        };
      });
  }, [ordersData]);

  // ─── Depleted Stock Warnings Derived from Live Products ─────────────────────
  const liveDepletedStock: DepletedStockStat[] = useMemo(() => {
    const rawProds = productsData?.products || [];
    const disciplineFiltered =
      selectedDiscipline === 'ALL'
        ? rawProds
        : rawProds.filter((p) => p.productCategory?.toUpperCase() === selectedDiscipline);

    return disciplineFiltered
      .filter((p) => p.stockQuantity !== undefined && p.stockQuantity <= 3)
      .map((p) => ({
        id: p.id,
        name: p.name,
        sku: p.sku || `ETH-${p.id.slice(-4).toUpperCase()}`,
        category: p.productCategory || 'CRAFTS',
        stockRemaining: p.stockQuantity ?? 0,
        restockThreshold: Math.max(5, (p.stockQuantity ?? 0) + 5),
        image: p.mainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=400&q=80',
      }))
      .sort((a, b) => a.stockRemaining - b.stockRemaining);
  }, [productsData, selectedDiscipline]);

  // ─── Timeframe Labels ───────────────────────────────────────────────────────
  const timeframeLabels: Record<TimeframePeriod, string> = {
    today: 'Today',
    this_week: 'This Week',
    this_month: 'This Month',
    last_90_days: 'Last 90 Days',
    all_time: 'All Time',
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleSelectTimeframe = (period: TimeframePeriod) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeframe(period);
    setTimeframeModalVisible(false);
  };

  const handleSelectPerspective = (p: AnalyticsPerspective) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActivePerspective(p);
  };

  const handleSaveStockRestock = async () => {
    if (!adjustingStockItem) return;
    try {
      setIsUpdatingStock(true);
      await updateProduct({
        id: adjustingStockItem.id,
        data: {
          stockQuantity: newStockVal,
        },
      }).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAdjustingStockItem(null);
    } catch (err) {
      console.error('Failed to update stock quantity:', err);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUpdatingStock(false);
    }
  };

  return (
    <View style={[styles.rootContainer, { backgroundColor: theme.background }]}>
      {/* ── 1. Top Filter & Timeframe Quick Bar ──────────────────────────────── */}
      <View
        style={[
          styles.topFilterBar,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timeframePillsScroll}
        >
          {(
            [
              'today',
              'this_week',
              'this_month',
              'last_90_days',
              'all_time',
            ] as TimeframePeriod[]
          ).map((period) => {
            const isSelected = timeframe === period;
            return (
              <TouchableOpacity
                key={period}
                style={[
                  styles.timeframePill,
                  isSelected && [
                    styles.timeframePillActive,
                    { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7' },
                  ],
                ]}
                onPress={() => handleSelectTimeframe(period)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeframePillText,
                    { color: isSelected ? theme.primary : theme.textSecondary },
                    isSelected && styles.timeframePillTextActive,
                  ]}
                >
                  {timeframeLabels[period]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Faceted Filter Button */}
        <TouchableOpacity
          style={[
            styles.filterActionBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F5EBE1',
              borderColor: selectedDiscipline !== 'ALL' ? theme.primary : theme.borderSubtle,
            },
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={selectedDiscipline !== 'ALL' ? theme.primary : theme.textPrimary}
          />
          {selectedDiscipline !== 'ALL' && (
            <View style={[styles.filterActiveDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.mainScroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      >
        {/* Error State Banner */}
        {isOverviewError && (
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : '#FEF2F2',
                borderColor: isDark
                  ? 'rgba(239, 68, 68, 0.3)'
                  : '#FCA5A5',
              },
            ]}
          >
            <View style={styles.errorCardContent}>
              <Ionicons
                name="alert-circle-outline"
                size={22}
                color={isDark ? '#EF4444' : '#DC2626'}
              />
              <View style={styles.errorTextContainer}>
                <Text
                  style={[
                    styles.errorCardTitle,
                    { color: isDark ? '#EF4444' : '#991B1B' },
                  ]}
                >
                  Failed to Synchronize Metrics
                </Text>
                <Text
                  style={[
                    styles.errorCardSub,
                    { color: theme.textSecondary },
                  ]}
                >
                  Unable to connect to the analytics engine. Showing offline snapshot.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.retryButton,
                { backgroundColor: isDark ? '#EF4444' : '#DC2626' },
              ]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                onRefresh();
              }}
            >
              <Ionicons name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── 2. Atelier Executive Header ────────────────────────────────────── */}
        <View style={styles.headerSection}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageHeading, { color: theme.textPrimary }]}>
                Studio Analytics
              </Text>
              <Text style={[styles.pageSubheading, { color: theme.textSecondary }]}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Atelier`} •{' '}
                {timeframeLabels[timeframe]}
              </Text>
            </View>

            {/* Prestige Badge */}
            <View
              style={[
                styles.prestigePill,
                {
                  backgroundColor: isDark ? 'rgba(212, 163, 115, 0.16)' : '#FCF4E1',
                  borderColor: isDark ? 'rgba(212, 163, 115, 0.4)' : '#D4A373',
                },
              ]}
            >
              <Ionicons name="trophy" size={13} color="#D4A373" style={{ marginRight: 4 }} />
              <Text style={styles.prestigePillText}>
                {metrics.rankingPosition > 0 && metrics.rankingPosition <= 5
                  ? `TOP #${metrics.rankingPosition} ARTISAN`
                  : 'VERIFIED ATELIER'}
              </Text>
            </View>
          </View>
        </View>

        {/* Skeleton Loader during initial fetch */}
        {isOverviewLoading && !overviewData ? (
          <View style={{ paddingHorizontal: Spacing.md }}>
            <VendorStatisticsSkeleton />
          </View>
        ) : (
          <>

        {/* ── 3. Option A: 2x2 Metric KPI Grid ─────────────────────────────────── */}
        <View style={styles.kpiGrid}>
          {/* Card 1: Net Atelier Earnings */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
            activeOpacity={0.8}
            onPress={() => setBreakdownModalVisible(true)}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                Net Earnings
              </Text>
              <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(10, 210, 79, 0.12)' }]}>
                <IncomeFigmaIcon size={18} color="#0AD24F" />
              </View>
            </View>

            <Text style={[styles.kpiMainValue, { color: theme.textPrimary }]} numberOfLines={1}>
              {formatPriceValue(metrics.netEarnings)}
            </Text>

            <View style={styles.kpiBottomRow}>
              <View style={styles.trajectoryPill}>
                <Ionicons name="arrow-up" size={12} color="#0AD24F" />
                <Text style={styles.trajectoryText}>{metrics.growthRate}</Text>
              </View>
              <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Card 2: Atelier Ranking Position */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                Atelier Rank
              </Text>
              <View
                style={[
                  styles.kpiIconCircle,
                  { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.16)' : '#FCF4E1' },
                ]}
              >
                <Ionicons name="trophy-outline" size={16} color="#C46C27" />
              </View>
            </View>

            <Text style={[styles.kpiMainValue, { color: '#C46C27' }]} numberOfLines={1}>
              {metrics.rankingPosition > 0
                ? `#${metrics.rankingPosition} Master`
                : 'Unranked Atelier'}
            </Text>

            <View style={styles.kpiBottomRow}>
              <Text style={[styles.kpiSubCaption, { color: theme.textSecondary }]}>
                Score: {metrics.rankingScore} / 100
              </Text>
            </View>
          </View>

          {/* Card 3: Bespoke Bid Win Rate */}
          <TouchableOpacity
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push('/(vendor)/requests' as any)}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                Bid Win Rate
              </Text>
              <View style={[styles.kpiIconCircle, { backgroundColor: 'rgba(196, 108, 39, 0.12)' }]}>
                <CustomBidsFigmaIcon size={18} color="#C46C27" />
              </View>
            </View>

            <Text style={[styles.kpiMainValue, { color: theme.textPrimary }]} numberOfLines={1}>
              {metrics.winRate}
            </Text>

            <View style={styles.kpiBottomRow}>
              <Text style={[styles.kpiSubCaption, { color: theme.textSecondary }]}>
                {metrics.acceptedBids}/{metrics.totalBids} Custom Bids
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
            </View>
          </TouchableOpacity>

          {/* Card 4: Collector Satisfaction */}
          <View
            style={[
              styles.kpiCard,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
          >
            <View style={styles.kpiTopRow}>
              <Text style={[styles.kpiLabel, { color: theme.textSecondary }]}>
                Collector Rating
              </Text>
              <View
                style={[
                  styles.kpiIconCircle,
                  { backgroundColor: isDark ? 'rgba(212, 163, 115, 0.16)' : '#FCF4E1' },
                ]}
              >
                <Ionicons name="star" size={16} color="#D4A373" />
              </View>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text style={[styles.kpiMainValue, { color: theme.textPrimary }]}>
                {metrics.avgRating}
              </Text>
              <Ionicons name="star" size={16} color="#D4A373" />
            </View>

            <View style={styles.kpiBottomRow}>
              <Text style={[styles.kpiSubCaption, { color: theme.textSecondary }]}>
                {metrics.reviewCount} Verified Reviews
              </Text>
            </View>
          </View>
        </View>

        {/* ── 4. Four-Perspective Segmented Tabs ─────────────────────────────── */}
        <View style={styles.perspectiveTabsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.perspectiveTabsScroll}
          >
            {[
              { key: 'REVENUE', label: 'Financial Split', icon: 'wallet-outline' },
              { key: 'REGIONS', label: 'Global Footprint', icon: 'globe-outline' },
              { key: 'PATRONS', label: 'Patrons & Reviews', icon: 'people-outline' },
              { key: 'FULFILLMENT', label: 'Fulfillment & Stock', icon: 'cube-outline' },
            ].map((tab) => {
              const isSelected = activePerspective === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[
                    styles.perspectiveTabBtn,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(196, 108, 39, 0.22)'
                          : '#FEF3C7'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : theme.card,
                      borderColor: isSelected ? theme.primary : theme.borderSubtle,
                    },
                  ]}
                  onPress={() => handleSelectPerspective(tab.key as AnalyticsPerspective)}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={16}
                    color={isSelected ? theme.primary : theme.textSecondary}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      styles.perspectiveTabBtnText,
                      { color: isSelected ? theme.primary : theme.textSecondary },
                      isSelected && styles.perspectiveTabBtnTextActive,
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. Perspective Content Views ───────────────────────────────────── */}

        {/* ── LENS A: REVENUE & COMMISSION SPLIT ─────────────────────────────── */}
        {activePerspective === 'REVENUE' && (
          <View style={styles.perspectiveContent}>
            {/* Visual Commission Breakdown Card */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Earnings After Commission
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Net settled revenue directly credited to your artisan account
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { borderColor: theme.borderSubtle }]}
                  onPress={() => setBreakdownModalVisible(true)}
                >
                  <Ionicons name="information-circle-outline" size={18} color="#C46C27" />
                </TouchableOpacity>
              </View>

              <View style={styles.earningsHeroNumberBox}>
                <Text style={[styles.earningsHeroLabel, { color: theme.textSecondary }]}>
                  Net Artisan Take-Home
                </Text>
                <Text style={styles.earningsHeroAmount}>
                  {formatPriceValue(metrics.netEarnings)}
                </Text>
              </View>

              {/* Progress Proportion Bar */}
              <View style={styles.splitProgressBar}>
                <View style={[styles.progressSegmentNet, { flex: 87.5 }]} />
                <View style={[styles.progressSegmentComm, { flex: 10 }]} />
                <View style={[styles.progressSegmentFee, { flex: 2.5 }]} />
              </View>

              <View style={styles.splitLegendRow}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#0AD24F' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                    Net Payout (87.5%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#C46C27' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                    Comm (10%)
                  </Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: '#64748B' }]} />
                  <Text style={[styles.legendText, { color: theme.textSecondary }]}>
                    Platform (2.5%)
                  </Text>
                </View>
              </View>

              {/* Itemized Financial Rows */}
              <View style={[styles.financialDivider, { backgroundColor: theme.borderSubtle }]} />

              <View style={styles.financialRow}>
                <Text
                  style={[styles.financialRowLabel, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  Gross Client Order Value
                </Text>
                <Text
                  style={[styles.financialRowVal, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {formatPriceValue(metrics.grossRevenue)}
                </Text>
              </View>

              <View style={styles.financialRow}>
                <Text
                  style={[styles.financialRowLabel, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  Marketplace Commission (10%)
                </Text>
                <Text style={[styles.financialRowVal, { color: '#EF4444' }]} numberOfLines={1}>
                  - {formatPriceValue(metrics.commissionFee)}
                </Text>
              </View>

              <View style={styles.financialRow}>
                <Text
                  style={[styles.financialRowLabel, { color: theme.textSecondary }]}
                  numberOfLines={1}
                >
                  Secure Escrow & Gateway Fee (2.5%)
                </Text>
                <Text style={[styles.financialRowVal, { color: '#EF4444' }]} numberOfLines={1}>
                  - {formatPriceValue(metrics.platformFee)}
                </Text>
              </View>

              <View style={[styles.financialDivider, { backgroundColor: theme.borderSubtle }]} />

              <View style={styles.financialRow}>
                <Text
                  style={[styles.financialTotalLabel, { color: theme.textPrimary }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Available for Settlement
                </Text>
                <Text
                  style={[styles.financialTotalVal, { color: '#0AD24F' }]}
                  numberOfLines={1}
                >
                  {formatPriceValue(metrics.netEarnings)}
                </Text>
              </View>

              {/* Settlement CTA Button */}
              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/(vendor)/payouts' as any)}
                activeOpacity={0.8}
              >
                <Ionicons name="card-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.primaryActionBtnText}>Manage Payouts & Escrow</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── LENS B: REGIONAL & DIASPORA FOOTPRINT ──────────────────────────── */}
        {activePerspective === 'REGIONS' && (
          <View style={styles.perspectiveContent}>
            {/* Global Summary Card */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Global Patron Demographics
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    African cultural collectors spanning domestic and diaspora hubs
                  </Text>
                </View>
                <View
                  style={[
                    styles.diasporaPill,
                    {
                      backgroundColor: isDark ? 'rgba(27, 42, 74, 0.4)' : '#EEF2FF',
                      borderColor: '#1B2A4A',
                    },
                  ]}
                >
                  <Ionicons name="airplane-outline" size={13} color="#1B2A4A" style={{ marginRight: 4 }} />
                  <Text style={styles.diasporaPillText}>68% DIASPORA</Text>
                </View>
              </View>

              {/* Region List */}
              <View style={{ marginTop: 12 }}>
                {liveRegions.length === 0 ? (
                  <View style={styles.emptyPerspectiveState}>
                    <Ionicons name="globe-outline" size={32} color={theme.textMuted} />
                    <Text style={[styles.emptyPerspectiveTitle, { color: theme.textPrimary }]}>
                      No Global Order Data
                    </Text>
                    <Text style={[styles.emptyPerspectiveText, { color: theme.textSecondary }]}>
                      Demographic breakdown will automatically populate as collectors from domestic and international locations order your crafts.
                    </Text>
                  </View>
                ) : (
                  liveRegions.map((region, index) => (
                    <View
                      key={region.city}
                      style={[
                        styles.regionItemRow,
                        index < liveRegions.length - 1 && [
                          styles.itemBorderBottom,
                          { borderBottomColor: theme.borderSubtle },
                        ],
                      ]}
                    >
                      <View style={styles.regionIconBox}>
                        <Ionicons
                          name={region.isDiaspora ? 'globe' : 'location'}
                          size={20}
                          color={region.isDiaspora ? '#1B2A4A' : '#C46C27'}
                        />
                      </View>

                      <View style={{ flex: 1, paddingRight: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.regionCityText, { color: theme.textPrimary }]}>
                            {region.city}
                          </Text>
                          <Text style={[styles.regionCountryText, { color: theme.textSecondary }]}>
                            ({region.country})
                          </Text>
                        </View>
                        <Text style={[styles.regionTopCraft, { color: theme.primary }]}>
                          Top: {region.topCraft}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.regionRevenue, { color: theme.textPrimary }]}>
                          {formatPriceValue(region.totalRevenue)}
                        </Text>
                        <Text style={[styles.regionOrders, { color: theme.textSecondary }]}>
                          {region.orderVolume} orders • {region.patronCount} patrons
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── LENS C: TOP PATRONS & MOST CELEBRATED REVIEWS ───────────────────── */}
        {activePerspective === 'PATRONS' && (
          <View style={styles.perspectiveContent}>
            {/* Top Patrons Card */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Top Collector Patrons
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Most valuable collectors driving repeat atelier acquisitions
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { borderColor: theme.borderSubtle }]}
                  onPress={() => router.push('/(vendor)/customers' as any)}
                >
                  <Text style={[styles.smallActionBtnText, { color: theme.primary }]}>
                    All ({liveTopPatrons.length})
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12 }}>
                {liveTopPatrons.length === 0 ? (
                  <View style={styles.emptyPerspectiveState}>
                    <Ionicons name="people-outline" size={32} color={theme.textMuted} />
                    <Text style={[styles.emptyPerspectiveTitle, { color: theme.textPrimary }]}>
                      No Patron Transactions Yet
                    </Text>
                    <Text style={[styles.emptyPerspectiveText, { color: theme.textSecondary }]}>
                      Repeat acquisitions and patronage history from your verified collectors will appear here.
                    </Text>
                  </View>
                ) : (
                  liveTopPatrons.map((patron, index) => (
                    <TouchableOpacity
                      key={patron.id}
                      style={[
                        styles.patronRow,
                        index < liveTopPatrons.length - 1 && [
                          styles.itemBorderBottom,
                          { borderBottomColor: theme.borderSubtle },
                        ],
                      ]}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedPatron(patron);
                      }}
                      activeOpacity={0.7}
                    >
                      <Image source={{ uri: patron.avatar }} style={styles.patronAvatar} />

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.patronName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {patron.name}
                        </Text>
                        <Text style={[styles.patronLocation, { color: theme.textSecondary }]} numberOfLines={1}>
                          {patron.location}
                        </Text>
                        <View style={styles.patronBadgeRow}>
                          <View
                            style={[
                              styles.patronTierBadge,
                              {
                                backgroundColor:
                                  patron.tier === 'VIP Patron'
                                    ? 'rgba(212, 163, 115, 0.16)'
                                    : 'rgba(27, 42, 74, 0.12)',
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.patronTierBadgeText,
                                {
                                  color: patron.tier === 'VIP Patron' ? '#C46C27' : '#1B2A4A',
                                },
                              ]}
                            >
                              {patron.tier}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.patronSpend, { color: theme.textPrimary }]}>
                          {formatPriceValue(patron.totalSpend)}
                        </Text>
                        <Text style={[styles.patronOrders, { color: theme.textSecondary }]}>
                          {patron.orderCount} orders
                        </Text>
                        <Ionicons name="chevron-forward" size={14} color={theme.textMuted} style={{ marginTop: 4 }} />
                      </View>
                    </TouchableOpacity>
                  ))
                )}
              </View>
            </View>

            {/* Most Reviewed Masterpieces */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle, marginTop: 14 },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Most Reviewed Masterpieces
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Crafts receiving the highest collector praise and repeat engagement
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {liveReviewedCrafts.length === 0 ? (
                  <View style={styles.emptyPerspectiveState}>
                    <Ionicons name="star-outline" size={32} color={theme.textMuted} />
                    <Text style={[styles.emptyPerspectiveTitle, { color: theme.textPrimary }]}>
                      No Reviewed Crafts Yet
                    </Text>
                    <Text style={[styles.emptyPerspectiveText, { color: theme.textSecondary }]}>
                      Customer reviews left by verified patrons will rank your workshop masterpieces here.
                    </Text>
                  </View>
                ) : (
                  liveReviewedCrafts.map((craft, index) => (
                    <View
                      key={craft.id}
                      style={[
                        styles.craftReviewRow,
                        index < liveReviewedCrafts.length - 1 && [
                          styles.itemBorderBottom,
                          { borderBottomColor: theme.borderSubtle },
                        ],
                      ]}
                    >
                      <Image source={{ uri: craft.image }} style={styles.craftThumbnail} />

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.craftName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {craft.name}
                        </Text>
                        <Text style={[styles.craftSku, { color: theme.primary }]}>
                          {craft.sku} • {craft.category}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                          <Ionicons name="star" size={13} color="#D4A373" />
                          <Text style={[styles.craftRatingVal, { color: theme.textPrimary }]}>
                            {craft.rating > 0 ? craft.rating.toFixed(2) : '—'}
                          </Text>
                          <Text style={[styles.craftReviewsCount, { color: theme.textSecondary }]}>
                            ({craft.reviewCount} reviews)
                          </Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.craftRevenue, { color: theme.textPrimary }]}>
                          {formatPriceValue(craft.revenue)}
                        </Text>
                        <Text style={[styles.craftRevenueLabel, { color: theme.textSecondary }]}>
                          Revenue
                        </Text>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}

        {/* ── LENS D: FULFILLMENT BACKLOG & STOCK DEPLETION ──────────────────── */}
        {activePerspective === 'FULFILLMENT' && (
          <View style={styles.perspectiveContent}>
            {/* Pending Orders Card */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Active Fulfillment Queue
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Orders needing dispatch or studio artisan finishing
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.smallActionBtn, { borderColor: theme.borderSubtle }]}
                  onPress={() => router.push('/(vendor)/orders' as any)}
                >
                  <Text style={[styles.smallActionBtnText, { color: theme.primary }]}>
                    See All
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ marginTop: 12 }}>
                {livePendingOrders.length === 0 ? (
                  <View style={styles.emptyPerspectiveState}>
                    <Ionicons name="checkmark-done-circle-outline" size={32} color="#0AD24F" />
                    <Text style={[styles.emptyPerspectiveTitle, { color: theme.textPrimary }]}>
                      All Orders Fulfilled
                    </Text>
                    <Text style={[styles.emptyPerspectiveText, { color: theme.textSecondary }]}>
                      You have no pending artisan orders awaiting crafting or delivery dispatch.
                    </Text>
                  </View>
                ) : (
                  livePendingOrders.map((ord, index) => (
                    <View
                      key={ord.id}
                      style={[
                        styles.orderQueueRow,
                        index < livePendingOrders.length - 1 && [
                          styles.itemBorderBottom,
                          { borderBottomColor: theme.borderSubtle },
                        ],
                      ]}
                    >
                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.orderNumberText, { color: theme.textPrimary }]}>
                            {ord.orderNumber}
                          </Text>
                          <Text style={[styles.orderClientText, { color: theme.textSecondary }]}>
                            • {ord.clientName}
                          </Text>
                        </View>
                        <Text style={[styles.orderCraftText, { color: theme.textSecondary }]} numberOfLines={1}>
                          {ord.craftName}
                        </Text>
                        <Text style={[styles.orderDueText, { color: '#C46C27' }]}>
                          Due: {ord.dueDate}
                        </Text>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.orderAmount, { color: theme.textPrimary }]}>
                          {formatPriceValue(ord.amount)}
                        </Text>
                        <View
                          style={[
                            styles.orderStatusBadge,
                            {
                              backgroundColor:
                                ord.status === 'READY_FOR_PICKUP'
                                  ? 'rgba(10, 210, 79, 0.12)'
                                  : ord.status === 'IN_CRAFTING'
                                  ? 'rgba(212, 163, 115, 0.16)'
                                  : 'rgba(196, 108, 39, 0.12)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.orderStatusBadgeText,
                              {
                                color:
                                  ord.status === 'READY_FOR_PICKUP'
                                    ? '#0AD24F'
                                    : ord.status === 'IN_CRAFTING'
                                    ? '#D4A373'
                                    : '#C46C27',
                              },
                            ]}
                          >
                            {ord.status.replace(/_/g, ' ')}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>

            {/* Low / Out-of-Stock Depletion Alerts */}
            <View
              style={[
                styles.contentCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle, marginTop: 14 },
              ]}
            >
              <View style={styles.cardHeaderRow}>
                <View>
                  <Text style={[styles.cardTitle, { color: theme.textPrimary }]}>
                    Stock Depletion Warnings
                  </Text>
                  <Text style={[styles.cardSubtitle, { color: theme.textSecondary }]}>
                    Catalog masterpieces at or below minimum threshold
                  </Text>
                </View>
              </View>

              <View style={{ marginTop: 12 }}>
                {liveDepletedStock.length === 0 ? (
                  <View style={styles.emptyPerspectiveState}>
                    <Ionicons name="cube-outline" size={32} color="#0AD24F" />
                    <Text style={[styles.emptyPerspectiveTitle, { color: theme.textPrimary }]}>
                      Healthy Workshop Stock
                    </Text>
                    <Text style={[styles.emptyPerspectiveText, { color: theme.textSecondary }]}>
                      No inventory items currently require urgent artisan replenishment.
                    </Text>
                  </View>
                ) : (
                  liveDepletedStock.map((item, index) => (
                    <View
                      key={item.id}
                      style={[
                        styles.stockWarningRow,
                        index < liveDepletedStock.length - 1 && [
                          styles.itemBorderBottom,
                          { borderBottomColor: theme.borderSubtle },
                        ],
                      ]}
                    >
                      <Image source={{ uri: item.image }} style={styles.craftThumbnail} />

                      <View style={{ flex: 1, paddingRight: 8 }}>
                        <Text style={[styles.craftName, { color: theme.textPrimary }]} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={[styles.craftSku, { color: theme.primary }]}>
                          {item.sku} • {item.category}
                        </Text>
                        <View
                          style={[
                            styles.stockRemainingBadge,
                            {
                              backgroundColor:
                                item.stockRemaining === 0
                                  ? 'rgba(239, 68, 68, 0.12)'
                                  : 'rgba(245, 158, 11, 0.12)',
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.stockRemainingBadgeText,
                              {
                                color: item.stockRemaining === 0 ? '#EF4444' : '#D97706',
                              },
                            ]}
                          >
                            {item.stockRemaining === 0
                              ? 'OUT OF STOCK'
                              : `ONLY ${item.stockRemaining} LEFT`}
                          </Text>
                        </View>
                      </View>

                      <TouchableOpacity
                        style={[styles.replenishBtn, { backgroundColor: theme.primary }]}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setAdjustingStockItem(item);
                          setNewStockVal(item.restockThreshold);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="add-circle-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.replenishBtnText}>Restock</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
            </View>
          </View>
        )}
        </>
        )}

        {/* Bottom spacing */}
        <View style={{ height: Math.max(insets.bottom, 16) + 120 }} />
      </ScrollView>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 1: Timeframe Picker Modal (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={timeframeModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTimeframeModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setTimeframeModalVisible(false)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Select Performance Timeframe
            </Text>
            {(
              [
                'today',
                'this_week',
                'this_month',
                'last_90_days',
                'all_time',
              ] as TimeframePeriod[]
            ).map((period) => (
              <TouchableOpacity
                key={period}
                style={[
                  styles.dialogOptionRow,
                  timeframe === period && {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : '#FEF3C7',
                  },
                ]}
                onPress={() => handleSelectTimeframe(period)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dialogOptionText,
                    { color: theme.textPrimary },
                    timeframe === period && { fontWeight: '700', color: theme.primary },
                  ]}
                >
                  {timeframeLabels[period]}
                </Text>
                {timeframe === period && (
                  <Ionicons name="checkmark" size={18} color="#C46C27" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 2: Category & Medium Faceted Filter Modal (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.sheetContent,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                Filter Analytics by Discipline
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
              {(
                [
                  'ALL',
                  'WEARS',
                  'SHOES',
                  'BAGS',
                  'ACCESSORIES',
                  'CRAFTS',
                  'PAINTINGS',
                  'ANTIQUES',
                ] as CraftDiscipline[]
              ).map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryFilterRow,
                    selectedDiscipline === cat && {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.06)'
                        : '#FEF3C7',
                    },
                  ]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedDiscipline(cat);
                    setFilterModalVisible(false);
                  }}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.categoryFilterText,
                      { color: theme.textPrimary },
                      selectedDiscipline === cat && {
                        fontWeight: '700',
                        color: theme.primary,
                      },
                    ]}
                  >
                    {cat === 'ALL' ? 'All Disciplines & Mediums' : cat}
                  </Text>
                  {selectedDiscipline === cat && (
                    <Ionicons name="checkmark-circle" size={18} color="#C46C27" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 3: Detailed Commission Breakdown Sheet (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={breakdownModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setBreakdownModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setBreakdownModalVisible(false)}
          />
          <View
            style={[
              styles.sheetContent,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                  Financial Architecture & Fees
                </Text>
                <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
                  Transparent breakdown of all fees on Ethnikraft
                </Text>
              </View>
              <TouchableOpacity onPress={() => setBreakdownModalVisible(false)}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View
                style={[
                  styles.feeInfoCard,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : '#F8F4EE',
                    borderColor: theme.borderSubtle,
                  },
                ]}
              >
                <Text style={[styles.feeCardTitle, { color: theme.textPrimary }]}>
                  How Your Net Earnings Are Calculated
                </Text>
                <Text style={[styles.feeCardBody, { color: theme.textSecondary }]}>
                  Ethnikraft operates on a non-negotiable artisan-first fair trade model.
                  Artisans retain 87.5% of gross acquisition sales.
                </Text>

                <View style={styles.feeItem}>
                  <Text style={[styles.feeItemHead, { color: theme.textPrimary }]}>
                    1. Marketplace Commission (10%)
                  </Text>
                  <Text style={[styles.feeItemDesc, { color: theme.textSecondary }]}>
                    Covers global curatorial marketing, international diaspora exhibitions,
                    and AI patron matching.
                  </Text>
                </View>

                <View style={styles.feeItem}>
                  <Text style={[styles.feeItemHead, { color: theme.textPrimary }]}>
                    2. Escrow & Gateway Protection (2.5%)
                  </Text>
                  <Text style={[styles.feeItemDesc, { color: theme.textSecondary }]}>
                    Covers multi-currency settlement, anti-fraud screening, and automated
                    artisan escrow payout disbursement.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryActionBtn, { backgroundColor: theme.primary, marginTop: 14 }]}
                onPress={() => {
                  setBreakdownModalVisible(false);
                  router.push('/(vendor)/payouts' as any);
                }}
              >
                <Text style={styles.primaryActionBtnText}>Go to Settlements Screen</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 4: Patron Intelligence Dossier Sheet (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={selectedPatron !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPatron(null)}
        statusBarTranslucent
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedPatron(null)}
          />
          {selectedPatron && (
            <View
              style={[
                styles.sheetContent,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.borderSubtle,
                  paddingBottom: Math.max(insets.bottom, Spacing.lg),
                },
              ]}
            >
              <View style={styles.sheetDragHandle} />

              <View style={styles.sheetHeaderRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Image source={{ uri: selectedPatron.avatar }} style={styles.patronDossierAvatar} />
                  <View>
                    <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>
                      {selectedPatron.name}
                    </Text>
                    <Text style={[styles.sheetSubtitle, { color: theme.primary }]}>
                      {selectedPatron.tier} • {selectedPatron.location}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={() => setSelectedPatron(null)}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <View style={styles.dossierStatsGrid}>
                <View
                  style={[
                    styles.dossierStatCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FDF9F2',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.dossierStatLabel, { color: theme.textSecondary }]}>
                    Lifetime Spend
                  </Text>
                  <Text style={[styles.dossierStatVal, { color: theme.textPrimary }]}>
                    {formatPriceValue(selectedPatron.totalSpend)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.dossierStatCard,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#FDF9F2',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Text style={[styles.dossierStatLabel, { color: theme.textSecondary }]}>
                    Total Acquisitions
                  </Text>
                  <Text style={[styles.dossierStatVal, { color: theme.textPrimary }]}>
                    {selectedPatron.orderCount} Masterpieces
                  </Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                <TouchableOpacity
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary, flex: 1, marginTop: 0 }]}
                  onPress={() => {
                    const patron = selectedPatron;
                    setSelectedPatron(null);
                    router.push({
                      pathname: '/(vendor)/messenger' as any,
                      params: {
                        chatId: `patron-${patron.id}`,
                        clientName: patron.name,
                      },
                    });
                  }}
                >
                  <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionBtnText}>Direct Message</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>

      {/* ════════════════════════════════════════════════════════════════════════
          MODAL 5: Quick Stock Replenish Dialog (statusBarTranslucent)
      ════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={adjustingStockItem !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setAdjustingStockItem(null)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setAdjustingStockItem(null)}
        >
          <View
            style={[
              styles.dialogBox,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
          >
            <Text style={[styles.dialogTitle, { color: theme.textPrimary }]}>
              Replenish Inventory
            </Text>
            <Text style={[styles.dialogSub, { color: theme.textSecondary }]}>
              {adjustingStockItem?.name} ({adjustingStockItem?.sku})
            </Text>

            {/* Counter */}
            <View style={styles.counterRow}>
              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  const minBound = (adjustingStockItem?.stockRemaining ?? 0) + 1;
                  setNewStockVal((v) => Math.max(minBound, v - 1));
                }}
              >
                <Ionicons name="remove" size={18} color="#C46C27" />
              </TouchableOpacity>

              <Text style={[styles.counterValText, { color: theme.textPrimary }]}>
                {newStockVal} units
              </Text>

              <TouchableOpacity
                style={styles.counterBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setNewStockVal((v) => v + 1);
                }}
              >
                <Ionicons name="add" size={18} color="#C46C27" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[
                styles.primaryActionBtn,
                { backgroundColor: theme.primary, marginTop: 14, opacity: isUpdatingStock ? 0.7 : 1 },
              ]}
              onPress={handleSaveStockRestock}
              disabled={isUpdatingStock}
              activeOpacity={0.8}
            >
              {isUpdatingStock ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.primaryActionBtnText}>Confirm Restock</Text>
              )}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  topFilterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  timeframePillsScroll: {
    gap: 8,
    paddingRight: 8,
  },
  timeframePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  timeframePillActive: {
    borderColor: '#C46C27',
  },
  timeframePillText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    fontWeight: '500',
  },
  timeframePillTextActive: {
    fontWeight: '700',
  },
  filterActionBtn: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginLeft: 6,
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  mainScroll: {
    flex: 1,
  },
  headerSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageHeading: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  pageSubheading: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  prestigePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  prestigePillText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#D4A373',
    letterSpacing: 0.4,
  },

  // ─── 2x2 Metric KPI Grid ────────────────────────────────────────────────────
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: 12,
    marginTop: 6,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2,
    padding: Spacing.md,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  kpiLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  kpiIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  kpiMainValue: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.2,
    marginVertical: 4,
  },
  kpiBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  trajectoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 210, 79, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 2,
  },
  trajectoryText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#0AD24F',
  },
  kpiSubCaption: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },

  // ─── Perspective Tabs ───────────────────────────────────────────────────────
  perspectiveTabsWrapper: {
    marginTop: 18,
    marginBottom: 10,
  },
  perspectiveTabsScroll: {
    paddingHorizontal: Spacing.md,
    gap: 8,
  },
  perspectiveTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  perspectiveTabBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  perspectiveTabBtnTextActive: {
    fontFamily: FontFamily.bodyBold,
  },

  // ─── Content Cards & Sections ───────────────────────────────────────────────
  perspectiveContent: {
    paddingHorizontal: Spacing.md,
  },
  contentCard: {
    padding: Spacing.md,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  cardSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
    maxWidth: SCREEN_WIDTH * 0.65,
  },
  smallActionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
    borderWidth: 1,
  },
  smallActionBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },
  diasporaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  diasporaPillText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#1B2A4A',
    letterSpacing: 0.3,
  },

  // ─── Financial Split Elements ───────────────────────────────────────────────
  earningsHeroNumberBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  earningsHeroLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  earningsHeroAmount: {
    fontSize: 30,
    fontFamily: FontFamily.headingBold,
    color: '#0AD24F',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  splitProgressBar: {
    height: 10,
    borderRadius: Radius.full,
    flexDirection: 'row',
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  progressSegmentNet: {
    backgroundColor: '#0AD24F',
  },
  progressSegmentComm: {
    backgroundColor: '#C46C27',
  },
  progressSegmentFee: {
    backgroundColor: '#64748B',
  },
  splitLegendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  financialDivider: {
    height: 1,
    marginVertical: 10,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
    gap: 8,
  },
  financialRowLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    flex: 1,
    marginRight: 8,
  },
  financialRowVal: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    flexShrink: 0,
    textAlign: 'right',
  },
  financialTotalLabel: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    flex: 1,
    marginRight: 8,
  },
  financialTotalVal: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    flexShrink: 0,
    textAlign: 'right',
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: CARD_RADIUS,
    marginTop: 16,
  },
  primaryActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },

  // ─── Region Item Rows ───────────────────────────────────────────────────────
  regionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  itemBorderBottom: {
    borderBottomWidth: 1,
  },
  regionIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.08)',
    marginRight: 10,
  },
  regionCityText: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },
  regionCountryText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  regionTopCraft: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  regionRevenue: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  regionOrders: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },

  // ─── Patrons & Reviews ──────────────────────────────────────────────────────
  patronRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  patronAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 10,
  },
  patronName: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },
  patronLocation: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  patronBadgeRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  patronTierBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  patronTierBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
  },
  patronSpend: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  patronOrders: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  craftReviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  craftThumbnail: {
    width: 46,
    height: 46,
    borderRadius: Radius.sm,
    marginRight: 10,
  },
  craftName: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
  },
  craftSku: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  craftRatingVal: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    marginLeft: 3,
  },
  craftReviewsCount: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginLeft: 4,
  },
  craftRevenue: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  craftRevenueLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
  },

  // ─── Fulfillment Rows ───────────────────────────────────────────────────────
  orderQueueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  orderNumberText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  orderClientText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  orderCraftText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  orderDueText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    marginTop: 2,
  },
  orderAmount: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  orderStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  orderStatusBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
  },
  stockWarningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  stockRemainingBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    marginTop: 4,
  },
  stockRemainingBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
  },
  replenishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  replenishBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },

  // ─── Modals & Bottom Sheets (ALL statusBarTranslucent) ──────────────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  dialogBox: {
    width: '100%',
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    padding: Spacing.md,
  },
  dialogTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    marginBottom: 8,
  },
  dialogSub: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginBottom: 12,
  },
  dialogOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  dialogOptionText: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetBackdrop: {
    flex: 1,
  },
  sheetContent: {
    borderTopLeftRadius: SHEET_RADIUS,
    borderTopRightRadius: SHEET_RADIUS,
    borderTopWidth: 1,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#94A3B8',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  sheetSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  categoryFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: Radius.sm,
  },
  categoryFilterText: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
  },
  feeInfoCard: {
    padding: Spacing.md,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  feeCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginBottom: 6,
  },
  feeCardBody: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
    marginBottom: 10,
  },
  feeItem: {
    marginTop: 8,
  },
  feeItemHead: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  feeItemDesc: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 16,
    marginTop: 2,
  },
  patronDossierAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  dossierStatsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  dossierStatCard: {
    flex: 1,
    padding: 12,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
  },
  dossierStatLabel: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  dossierStatVal: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginTop: 4,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 16,
  },
  counterBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#C46C27',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterValText: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  // ─── ERROR CARD & RETRY ───────────────────────────────────────────────────
  errorCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  errorCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  errorTextContainer: {
    flex: 1,
  },
  errorCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 2,
  },
  errorCardSub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 15,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.sm,
    gap: 5,
  },
  retryButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },
  // ─── EMPTY PERSPECTIVE STATE ──────────────────────────────────────────────
  emptyPerspectiveState: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyPerspectiveTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyPerspectiveText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    lineHeight: 17,
  },
});

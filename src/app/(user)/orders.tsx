import React, { useState, useMemo, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  FlatList,
  RefreshControl,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import {
  useGetUserOrdersQuery,
  BackendOrder,
} from '@/store/api/ordersApi';
import { useGetUserCustomRequestsQuery } from '@/store/api/studioApi';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import {
  OrderCard,
  OrderDetailModal,
  OrderTrackingTimeline,
  OrderTopLevelTab,
  OrderStatusFilter,
  ORDER_FILTER_TABS,
} from '@/components/orders';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [topTab, setTopTab] = useState<OrderTopLevelTab>('ORDERS');
  const [activeFilter, setActiveFilter] = useState<OrderStatusFilter>('ALL');
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Selected order for detail modal & tracking timeline
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);

  // 1. Fetch live marketplace orders
  const {
    data: remoteOrders,
    isLoading: isLoadingOrders,
    refetch: refetchOrders,
  } = useGetUserOrdersQuery(undefined, {
    skip: !isAuthenticated,
  });

  // 2. Fetch live custom studio commissions
  const {
    data: remoteCommissions,
    isLoading: isLoadingCommissions,
    refetch: refetchCommissions,
  } = useGetUserCustomRequestsQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!isAuthenticated) return;
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([refetchOrders(), refetchCommissions()]);
    } finally {
      setRefreshing(false);
    }
  }, [isAuthenticated, refetchOrders, refetchCommissions]);

  // Transform custom requests to standard order items for seamless rendering
  const commissionOrders: BackendOrder[] = useMemo(() => {
    if (!remoteCommissions || !Array.isArray(remoteCommissions)) return [];
    return remoteCommissions.map((req) => ({
      id: req.id,
      userId: req.userId || '',
      status: req.status || 'OPEN',
      total: req.budget,
      agreedPrice: req.budget,
      customRequestId: req.id,
      customRequest: {
        id: req.id,
        title: req.title,
        description: req.description,
        budget: req.budget,
        timeline: req.timeline,
        inspirationImages: req.inspirationImages,
        categoryType: req.categoryType,
      },
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      vendor: req.bids?.[0]?.vendor
        ? {
            id: req.bids[0].vendor.id,
            businessName: req.bids[0].vendor.businessName,
            businessLogo: req.bids[0].vendor.profileImage,
            rating: req.bids[0].vendor.rating || 4.9,
            reviewCount: req.bids[0].vendor.reviewCount || 12,
            cityOfOperation: req.bids[0].vendor.cityOfOperation,
            countryOfOperation: req.bids[0].vendor.countryOfOperation,
          }
        : undefined,
    }));
  }, [remoteCommissions]);

  const activeList = useMemo(() => {
    if (topTab === 'ORDERS') {
      return remoteOrders || [];
    }
    return commissionOrders;
  }, [topTab, remoteOrders, commissionOrders]);

  // Status-filtered orders
  const filteredOrders = useMemo(() => {
    return activeList.filter((o) => {
      if (activeFilter === 'ALL') return true;
      if (activeFilter === 'PENDING') {
        return (
          o.status === 'PENDING' ||
          o.status === 'PAYMENT_PENDING' ||
          o.status === 'OPEN' ||
          o.status === 'BIDDING'
        );
      }
      if (activeFilter === 'IN_PROGRESS') {
        return (
          o.status === 'IN_PROGRESS' ||
          o.status === 'CONFIRMED' ||
          o.status === 'SELECTED' ||
          o.status === 'PRODUCTION_PENDING'
        );
      }
      if (activeFilter === 'SHIPPED') {
        return o.status === 'SHIPPED' || o.status === 'OUT_FOR_DELIVERY';
      }
      if (activeFilter === 'DELIVERED') {
        return o.status === 'DELIVERED' || o.status === 'COMPLETED';
      }
      if (activeFilter === 'CANCELLED') {
        return o.status === 'CANCELLED' || o.status === 'REFUNDED';
      }
      return o.status === activeFilter;
    });
  }, [activeList, activeFilter]);

  const handleTopTabChange = useCallback((tab: OrderTopLevelTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTopTab(tab);
    setActiveFilter('ALL');
  }, []);

  const handleFilterChange = useCallback((filter: OrderStatusFilter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveFilter(filter);
  }, []);

  const handleOpenDetail = useCallback((order: BackendOrder) => {
    setSelectedOrder(order);
    setIsDetailOpen(true);
  }, []);

  const handleOpenTracking = useCallback((order: BackendOrder) => {
    setSelectedOrder(order);
    setIsTrackingOpen(true);
  }, []);

  const renderItem = useCallback(
    ({ item }: { item: BackendOrder }) => (
      <OrderCard
        order={item}
        onPress={handleOpenDetail}
        onTrackPress={handleOpenTracking}
      />
    ),
    [handleOpenDetail, handleOpenTracking]
  );

  const keyExtractor = useCallback((item: BackendOrder) => item.id, []);

  const isLoading =
    topTab === 'ORDERS' ? isLoadingOrders : isLoadingCommissions;

  const ListHeader = useMemo(
    () => (
      <View style={styles.headerContainer}>
        {/* Title & Subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.screenPretitle}>PURCHASES & LOGISTICS</Text>
          <Text style={styles.screenTitle}>Orders & Tracking</Text>
          <Text style={styles.screenSubtitle}>
            Monitor your handcrafted marketplace purchases and custom artisan commissions in real-time.
          </Text>
        </View>

        {/* Dual Mode Switcher */}
        <View style={styles.segmentedTabs}>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleTopTabChange('ORDERS')}
            style={[
              styles.segmentedTab,
              topTab === 'ORDERS' && styles.segmentedTabActive,
            ]}
          >
            <Ionicons
              name="bag-check-outline"
              size={14}
              color={topTab === 'ORDERS' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedTabText,
                topTab === 'ORDERS' && styles.segmentedTabTextActive,
              ]}
            >
              Marketplace
            </Text>
            {(remoteOrders?.length || 0) > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  topTab === 'ORDERS' && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    topTab === 'ORDERS' && styles.tabBadgeTextActive,
                  ]}
                >
                  {remoteOrders?.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => handleTopTabChange('REQUESTS')}
            style={[
              styles.segmentedTab,
              topTab === 'REQUESTS' && styles.segmentedTabActive,
            ]}
          >
            <Ionicons
              name="sparkles-outline"
              size={14}
              color={topTab === 'REQUESTS' ? Colors.primary : Colors.textSecondary}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.segmentedTabText,
                topTab === 'REQUESTS' && styles.segmentedTabTextActive,
              ]}
            >
              Commissions
            </Text>
            {commissionOrders.length > 0 && (
              <View
                style={[
                  styles.tabBadge,
                  topTab === 'REQUESTS' && styles.tabBadgeActive,
                ]}
              >
                <Text
                  style={[
                    styles.tabBadgeText,
                    topTab === 'REQUESTS' && styles.tabBadgeTextActive,
                  ]}
                >
                  {commissionOrders.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Sub Status Filters Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersScroll}
        >
          {ORDER_FILTER_TABS.map((f) => {
            const isSelected = activeFilter === f.key;
            return (
              <TouchableOpacity
                key={f.key}
                activeOpacity={0.8}
                onPress={() => handleFilterChange(f.key)}
                style={[
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    isSelected && styles.filterChipTextSelected,
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    ),
    [
      topTab,
      remoteOrders?.length,
      commissionOrders.length,
      activeFilter,
      handleTopTabChange,
      handleFilterChange,
    ]
  );

  const ListEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading your orders & shipments...</Text>
        </View>
      );
    }

    if (!isAuthenticated) {
      return (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="lock-closed-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>Sign in to View Orders</Text>
          <Text style={styles.emptySubtitle}>
            Log in to view your order history, carrier tracking milestones, and custom artisan commissions.
          </Text>
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => setShowAuthModal(true)}
            style={styles.emptyActionBtn}
          >
            <Text style={styles.emptyActionBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.emptyCard}>
        <View style={styles.emptyIconBox}>
          <Ionicons
            name={topTab === 'ORDERS' ? 'bag-handle-outline' : 'sparkles-outline'}
            size={36}
            color={Colors.primary}
          />
        </View>
        <Text style={styles.emptyTitle}>
          {activeFilter !== 'ALL'
            ? `No ${activeFilter.toLowerCase()} orders found`
            : topTab === 'ORDERS'
            ? 'No Marketplace Orders Yet'
            : 'No Custom Studio Commissions Yet'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {topTab === 'ORDERS'
            ? 'Discover authentic African textiles, hand-carved artifacts, and artisan jewelry ready to ship.'
            : 'Commission bespoke apparel, jewelry, or artwork tailored to your exact measurements and fabrics.'}
        </Text>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            if (topTab === 'ORDERS') {
              router.push('/(user)/explore');
            } else {
              router.push('/(user)/studio');
            }
          }}
          style={styles.emptyActionBtn}
        >
          <Text style={styles.emptyActionBtnText}>
            {topTab === 'ORDERS' ? 'Explore Marketplace' : 'Start Custom Commission'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }, [isLoading, isAuthenticated, topTab, activeFilter]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredOrders}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: Math.max(insets.bottom + 120, 140) },
        ]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
          />
        }
      />

      {/* Detail Modal */}
      <OrderDetailModal
        order={selectedOrder}
        visible={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
      />

      {/* Tracking Modal */}
      {selectedOrder && (
        <OrderTrackingTimeline
          order={selectedOrder}
          visible={isTrackingOpen}
          onClose={() => setIsTrackingOpen(false)}
        />
      )}

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Sign In to Track Orders"
        message="Please sign in to access your order history and live parcel tracking."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  contentContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },
  headerContainer: {
    marginBottom: Spacing.md,
  },
  titleSection: {
    marginBottom: Spacing.md,
  },
  screenPretitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  screenTitle: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    lineHeight: 32,
  },
  screenSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  segmentedTabs: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  segmentedTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentedTabActive: {
    backgroundColor: Colors.surfaceSubtle,
    borderColor: 'rgba(196, 108, 39, 0.25)',
  },
  segmentedTabText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  segmentedTabTextActive: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  tabBadge: {
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginLeft: 2,
  },
  tabBadgeActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    lineHeight: 12,
  },
  tabBadgeTextActive: {
    color: '#FFFFFF',
  },
  filtersScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs + 2,
    paddingVertical: 4,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.18,
        shadowRadius: 2,
      },
      android: {
        elevation: 1.5,
      },
    }),
  },
  filterChipText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
  filterChipTextSelected: {
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  loadingBox: {
    paddingVertical: Spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  emptyCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.lg,
  },
  emptyIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: Typography.fontSize.base,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
  },
  emptyActionBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  emptyActionBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});

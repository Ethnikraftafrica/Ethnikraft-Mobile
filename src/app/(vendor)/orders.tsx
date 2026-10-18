import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Image,
  Dimensions,
  Modal,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import { VendorOrderCardsSkeleton } from '@/components/common/Skeletons';
import {
  useGetVendorOrdersQuery,
  useUpdateOrderStatusMutation,
  VendorOrder,
} from '@/store/api/vendorApi';
import {
  TrendingUpFigmaIcon,
  PackageFigmaIcon,
  CustomBidsFigmaIcon,
  StarOutlineFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data Types & Backend Enums ────────────────────────────────────────────────
export type OrderStatusType =
  | 'ALL'
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'IN_PROGRESS'
  | 'PRODUCTION_PENDING'
  | 'IN_PRODUCTION'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface OrderItemRecord {
  id: string;
  productId: string;
  name: string;
  mainImage: string;
  category: string;
  quantity: number;
  unitPrice: number;
  basePrice?: number;
  variantSnapshot?: {
    size?: string;
    color?: string;
    material?: string;
  };
}

export interface VendorOrderRecord {
  id: string;
  orderNumber: string;
  createdAt: string;
  updatedAt: string;
  status: OrderStatusType;
  totalAmount: number;
  itemsSubtotal: number;
  shippingCost: number;
  shippingProvider: string;
  shippingCostPaid: boolean;
  shippingTrackingNumber?: string;
  shippingBookingId?: string;
  estimatedDeliveryDate?: string;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    avatar?: string;
    deliveryAddress: string;
    city: string;
    country: string;
  };
  orderItems: OrderItemRecord[];
  isCustomCommission?: boolean;
  customRequestTitle?: string;
  notes?: string;
}

// ─── Initial Dataset (Default to empty array; live backend data synced via RTK Query) ────
const INITIAL_ORDERS: VendorOrderRecord[] = [];

const STATUS_TABS: { id: OrderStatusType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Orders', icon: 'layers-outline' },
  { id: 'PENDING', label: 'Pending', icon: 'time-outline' },
  { id: 'IN_PRODUCTION', label: 'In Production', icon: 'hammer-outline' },
  { id: 'SHIPPED', label: 'Shipped / In Transit', icon: 'airplane-outline' },
  { id: 'DELIVERED', label: 'Delivered', icon: 'checkmark-circle-outline' },
  { id: 'COMPLETED', label: 'Completed', icon: 'shield-checkmark-outline' },
  { id: 'CANCELLED', label: 'Cancelled', icon: 'close-circle-outline' },
];

const STATUS_BADGE_CONFIG: Record<
  string,
  { label: string; color: string; bgLight: string; bgDark: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  PENDING: {
    label: 'Pending Prep',
    color: '#D97706',
    bgLight: '#FEF3C7',
    bgDark: 'rgba(217, 119, 6, 0.2)',
    icon: 'time-outline',
  },
  PAYMENT_PENDING: {
    label: 'Payment Pending',
    color: '#B45309',
    bgLight: '#FEF3C7',
    bgDark: 'rgba(180, 83, 9, 0.2)',
    icon: 'card-outline',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    color: '#0284C7',
    bgLight: '#E0F2FE',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    icon: 'construct-outline',
  },
  PRODUCTION_PENDING: {
    label: 'Production Pending',
    color: '#8B5CF6',
    bgLight: '#EDE9FE',
    bgDark: 'rgba(139, 92, 246, 0.2)',
    icon: 'timer-outline',
  },
  IN_PRODUCTION: {
    label: 'In Production',
    color: '#C46C27',
    bgLight: '#FFEDD5',
    bgDark: 'rgba(196, 108, 39, 0.25)',
    icon: 'hammer-outline',
  },
  SHIPPED: {
    label: 'Shipped / In Transit',
    color: '#0284C7',
    bgLight: '#E0F2FE',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    icon: 'airplane-outline',
  },
  DELIVERED: {
    label: 'Delivered',
    color: '#10B981',
    bgLight: '#DCFCE7',
    bgDark: 'rgba(16, 185, 129, 0.2)',
    icon: 'checkmark-done-circle-outline',
  },
  COMPLETED: {
    label: 'Completed & Settled',
    color: '#059669',
    bgLight: '#D1FAE5',
    bgDark: 'rgba(5, 150, 105, 0.2)',
    icon: 'shield-checkmark',
  },
  CANCELLED: {
    label: 'Cancelled',
    color: '#EF4444',
    bgLight: '#FEE2E2',
    bgDark: 'rgba(239, 68, 68, 0.2)',
    icon: 'close-circle',
  },
  REFUNDED: {
    label: 'Refunded',
    color: '#6B7280',
    bgLight: '#F3F4F6',
    bgDark: 'rgba(107, 114, 128, 0.2)',
    icon: 'refresh-circle-outline',
  },
};

export default function VendorOrdersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── RTK Query API Integration ─────────────────────────────
  const {
    data: ordersResponse,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    refetch: refetchOrders,
  } = useGetVendorOrdersQuery();

  const [updateOrderStatusMutation, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  // ── State Management ───────────────────────────────────────
  const [orders, setOrders] = useState<VendorOrderRecord[]>(INITIAL_ORDERS);
  const [selectedStatuses, setSelectedStatuses] = useState<OrderStatusType[]>(['ALL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Sync Server Data with Local State ──────────────────────
  useEffect(() => {
    if (ordersResponse && Array.isArray(ordersResponse)) {
      const mapped: VendorOrderRecord[] = ordersResponse.map((item: VendorOrder) => {
        const firstItem = item.orderItems?.[0];
        const customerName = item.user
          ? `${item.user.firstName || ''} ${item.user.lastName || ''}`.trim() || 'Atelier Patron'
          : 'Atelier Patron';

        return {
          id: item.id,
          orderNumber: item.orderNumber || `#VORD-${item.id.slice(-4).toUpperCase()}`,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || item.createdAt || new Date().toISOString(),
          status: (item.status as OrderStatusType) || 'PENDING',
          totalAmount: Number(item.total ?? item.agreedPrice ?? 0),
          itemsSubtotal: Number(item.itemsSubtotal ?? item.total ?? 0),
          shippingCost: Number(item.shippingCost ?? 0),
          shippingProvider: item.shippingProvider || 'Courier Express',
          shippingCostPaid: item.shippingCostPaid ?? true,
          shippingTrackingNumber: item.shippingTrackingNumber,
          shippingBookingId: item.shippingBookingId,
          estimatedDeliveryDate: item.estimatedDeliveryDate,
          customer: {
            id: item.user?.id || 'cust-anon',
            name: customerName,
            email: item.user?.email || 'patron@ethnikraft.com',
            phone: item.user?.phone || '—',
            avatar: item.user?.profileImage,
            deliveryAddress: item.user?.deliveryAddress || 'Atelier Vault / Local Fulfillment',
            city: item.user?.city || 'Regional Hub',
            country: item.user?.country || 'Nigeria',
          },
          orderItems: (item.orderItems || []).map((it) => ({
            id: it.id,
            productId: it.productId || it.product?.id || '',
            name: it.product?.name || item.customRequest?.title || 'Heritage Piece',
            mainImage: it.product?.mainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
            category: it.product?.productCategory || 'CRAFTS',
            quantity: it.quantity || 1,
            unitPrice: it.unitPrice || 0,
            variantSnapshot: it.variantSnapshot,
          })),
          isCustomCommission: Boolean(item.customRequest || item.customBid),
          customRequestTitle: item.customRequest?.title,
          notes: item.notes || item.customBid?.notes,
        };
      });

      setOrders(mapped);
    }
  }, [ordersResponse]);

  // ── Multi-Select Toggle Helper ────────────────────────────
  const toggleStatus = (st: OrderStatusType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentPage(1);
    if (st === 'ALL') {
      setSelectedStatuses(['ALL']);
      return;
    }
    setSelectedStatuses((prev) => {
      const withoutAll = prev.filter((s) => s !== 'ALL');
      if (withoutAll.includes(st)) {
        const remaining = withoutAll.filter((s) => s !== st);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...withoutAll, st];
      }
    });
  };

  const handleClearAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStatuses(['ALL']);
    setSearchQuery('');
    setCurrentPage(1);
  };

  // ── Modals State ──────────────────────────────────────────────────────────
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);

  // Active Order References
  const [activeOrder, setActiveOrder] = useState<VendorOrderRecord | null>(null);
  const [newSelectedStatus, setNewSelectedStatus] = useState<OrderStatusType>('PENDING');

  // ── Toast Helper ──────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // ── Refresh Handler ───────────────────────────────────────────────────────
  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetchOrders().unwrap();
      showToast('Orders & logistics synchronized with courier gateway');
    } catch {
      // Handled by global error interceptor
    } finally {
      setRefreshing(false);
    }
  };

  // ── Currency Formatter Helper ─────────────────────────────────────────────
  const formatPriceValue = (val: number) => {
    return formatPrice(val, currencyCode, exchangeRate);
  };

  // ── Filtered Orders Dataset (Multi-Select Supported) ──────────────────────
  const isStatusFiltered = !selectedStatuses.includes('ALL') && selectedStatuses.length > 0;

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Multi-select status filter
      if (isStatusFiltered) {
        const matchInProd =
          selectedStatuses.includes('IN_PRODUCTION') &&
          ['IN_PRODUCTION', 'IN_PROGRESS', 'PRODUCTION_PENDING'].includes(ord.status);
        const matchOther = selectedStatuses.includes(ord.status);
        if (!matchInProd && !matchOther) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNum = ord.orderNumber.toLowerCase().includes(q);
        const matchCustomer = ord.customer.name.toLowerCase().includes(q);
        const matchEmail = ord.customer.email.toLowerCase().includes(q);
        const matchItem = ord.orderItems.some((it) => it.name.toLowerCase().includes(q));
        const matchTracking = ord.shippingTrackingNumber?.toLowerCase().includes(q);
        if (!matchNum && !matchCustomer && !matchEmail && !matchItem && !matchTracking) return false;
      }

      return true;
    });
  }, [orders, selectedStatuses, searchQuery, isStatusFiltered]);

  const totalCount = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredOrders.slice(startIndex, startIndex + pageSize);
  }, [filteredOrders, currentPage, pageSize]);

  // ── Aggregate Metrics ──────────────────────────────────────
  const totalOrdersCount = orders.length;
  const inFulfillmentCount = useMemo(() => {
    return orders.filter((o) => ['PENDING', 'IN_PROGRESS', 'IN_PRODUCTION', 'SHIPPED'].includes(o.status)).length;
  }, [orders]);
  const totalOrderRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);
  const completedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === 'COMPLETED' || o.status === 'DELIVERED').length;
  }, [orders]);

  // ── Handlers: Modals & Status Updates ───────────────────────
  const handleOpenDetailModal = (ord: VendorOrderRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveOrder(ord);
    setDetailModalVisible(true);
  };

  const handleOpenStatusModal = (ord: VendorOrderRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveOrder(ord);
    setNewSelectedStatus(ord.status);
    setStatusModalVisible(true);
  };

  const handleOpenTrackingModal = (ord: VendorOrderRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveOrder(ord);
    setTrackingModalVisible(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!activeOrder) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const prevStatus = activeOrder.status;

    // Optimistically update local view
    setOrders((prev) =>
      prev.map((o) =>
        o.id === activeOrder.id
          ? {
              ...o,
              status: newSelectedStatus,
              updatedAt: new Date().toISOString(),
            }
          : o
      )
    );

    try {
      await updateOrderStatusMutation({
        orderId: activeOrder.id,
        status: newSelectedStatus,
      }).unwrap();

      const statusLabel = STATUS_BADGE_CONFIG[newSelectedStatus]?.label || newSelectedStatus;
      setStatusModalVisible(false);
      showToast(`${activeOrder.orderNumber} transitioned to "${statusLabel}"`);
      setActiveOrder(null);
    } catch {
      // Revert optimistic update on backend error
      setOrders((prev) =>
        prev.map((o) =>
          o.id === activeOrder.id
            ? {
                ...o,
                status: prevStatus,
              }
            : o
        )
      );
    }
  };

  const renderOrderItem = useCallback(
    ({ item: ord }: { item: VendorOrderRecord }) => {
      const badgeMeta = STATUS_BADGE_CONFIG[ord.status] || STATUS_BADGE_CONFIG.PENDING;
      const mainItem = ord.orderItems[0];
      const extraCount = ord.orderItems.length - 1;

      return (
        <View
          style={[
            styles.orderCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          {/* Header Row: Order Number, Date, Status Badge */}
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={[styles.orderNumberText, { color: isDark ? theme.textGold : theme.primary }]}>
                {ord.orderNumber}
              </Text>
              <Text style={[styles.orderDateText, { color: theme.textMuted }]}>
                {new Date(ord.createdAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                { backgroundColor: isDark ? badgeMeta.bgDark : badgeMeta.bgLight },
              ]}
            >
              <Ionicons name={badgeMeta.icon} size={12} color={badgeMeta.color} style={{ marginRight: 4 }} />
              <Text style={[styles.statusBadgeText, { color: badgeMeta.color }]}>{badgeMeta.label}</Text>
            </View>
          </View>

          {/* Customer Info Strip */}
          <View style={styles.customerRow}>
            <View
              style={[
                styles.clientAvatarCircle,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Text style={[styles.clientAvatarText, { color: isDark ? theme.textGold : theme.primary }]}>
                {ord.customer.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={[styles.customerNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {ord.customer.name}
              </Text>
              <Text style={[styles.customerLocationText, { color: theme.textMuted }]} numberOfLines={1}>
                <Ionicons name="location-sharp" size={10} color={theme.textMuted} /> {ord.customer.city},{' '}
                {ord.customer.country}
              </Text>
            </View>
          </View>

          {/* Item Preview Box */}
          {mainItem && (
            <View
              style={[
                styles.itemPreviewBox,
                {
                  backgroundColor: theme.backgroundSecondary,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Image source={{ uri: mainItem.mainImage }} style={styles.itemThumbImg} />
              <View style={{ flex: 1, marginLeft: 10, justifyContent: 'center' }}>
                <Text style={[styles.itemTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {mainItem.name}
                </Text>
                <Text style={[styles.itemMetaText, { color: theme.textSecondary }]}>
                  Qty: {mainItem.quantity} • {mainItem.category}
                  {mainItem.variantSnapshot?.size ? ` • ${mainItem.variantSnapshot.size}` : ''}
                </Text>
                {extraCount > 0 && (
                  <Text style={[styles.extraItemsText, { color: isDark ? '#D1995A' : theme.primary }]}>
                    +{extraCount} more piece{extraCount > 1 ? 's' : ''} in package
                  </Text>
                )}
              </View>
            </View>
          )}

          {/* Shipping / Courier Info Row */}
          <View style={styles.shippingSummaryRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <Ionicons name="airplane-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
              <Text style={[styles.shippingProviderText, { color: theme.textSecondary }]} numberOfLines={1}>
                {ord.shippingProvider}
              </Text>
            </View>
            {ord.shippingTrackingNumber ? (
              <TouchableOpacity
                onPress={() => handleOpenTrackingModal(ord)}
                style={styles.trackingNumberLink}
                activeOpacity={0.75}
              >
                <Text style={[styles.trackingNumberLinkText, { color: isDark ? '#D1995A' : theme.primary }]}>
                  #{ord.shippingTrackingNumber} ↗
                </Text>
              </TouchableOpacity>
            ) : (
              <Text style={[styles.trackingNumberPending, { color: theme.textMuted }]}>Tracking Pending</Text>
            )}
          </View>

          {/* Divider */}
          <View style={[styles.cardDivider, { backgroundColor: theme.borderSubtle }]} />

          {/* Footer Row: Total Price & Actions */}
          <View style={styles.cardFooterRow}>
            <View>
              <Text style={[styles.totalLabelText, { color: theme.textMuted }]}>ORDER TOTAL</Text>
              <Text style={[styles.totalAmountText, { color: isDark ? '#D1995A' : theme.primary }]}>
                {formatPriceValue(ord.totalAmount)}
              </Text>
            </View>

            <View style={styles.footerActionsGroup}>
              <TouchableOpacity
                onPress={() => handleOpenStatusModal(ord)}
                style={[
                  styles.updateStatusBtn,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons name="pencil" size={13} color={theme.textPrimary} style={{ marginRight: 4 }} />
                <Text style={[styles.updateStatusBtnText, { color: theme.textPrimary }]}>Status</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleOpenDetailModal(ord)}
                style={[styles.inspectOrderBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Text style={styles.inspectOrderBtnText}>Details ✦</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    },
    [theme, isDark, currencyCode, exchangeRate]
  );

  const renderListEmpty = useCallback(
    () => (
      <View style={styles.ordersListContainer}>
        {isOrdersLoading && orders.length === 0 ? (
          <VendorOrderCardsSkeleton count={3} />
        ) : (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: theme.card, borderColor: theme.borderSubtle },
            ]}
          >
            <Ionicons name="cube-outline" size={38} color={theme.primary} />
            <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Orders Found</Text>
            <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
              No orders match your active search or status filter criteria.
            </Text>
            {(searchQuery.trim().length > 0 || isStatusFiltered) && (
              <TouchableOpacity
                onPress={handleClearAllFilters}
                style={[styles.emptyResetBtn, { borderColor: theme.border }]}
                activeOpacity={0.7}
              >
                <Ionicons name="refresh-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
                <Text style={[styles.emptyResetBtnText, { color: theme.textPrimary }]}>Clear Filters</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    ),
    [isOrdersLoading, orders.length, theme, searchQuery, isStatusFiltered]
  );

  const renderListFooter = useCallback(
    () => (
      <View style={[styles.listFooterContainer, { paddingBottom: Math.max(insets.bottom, 16) + 110 }]}>
        {totalCount > pageSize && (
          <View style={[styles.paginationCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.paginationInfoRow}>
              <Text style={[styles.paginationInfoText, { color: theme.textSecondary }]}>
                Page <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.headingBold }}>{currentPage}</Text> of{' '}
                <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.headingBold }}>{totalPages}</Text>
              </Text>
              <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
                Total: <Text style={{ color: isDark ? '#D1995A' : theme.primary, fontFamily: FontFamily.headingBold }}>{totalCount}</Text> orders
              </Text>
            </View>
            <View style={styles.paginationButtonsRow}>
              <TouchableOpacity
                disabled={!hasPrevPage}
                onPress={() => {
                  if (hasPrevPage) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentPage((p) => Math.max(1, p - 1));
                  }
                }}
                style={[
                  styles.pageNavBtn,
                  {
                    backgroundColor: hasPrevPage ? theme.backgroundSecondary : 'transparent',
                    borderColor: theme.border,
                    opacity: hasPrevPage ? 1 : 0.4,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Ionicons name="chevron-back" size={16} color={theme.textPrimary} />
                <Text style={[styles.pageNavBtnText, { color: theme.textPrimary }]}>Previous</Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={!hasNextPage}
                onPress={() => {
                  if (hasNextPage) {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setCurrentPage((p) => p + 1);
                  }
                }}
                style={[
                  styles.pageNavBtn,
                  {
                    backgroundColor: hasNextPage ? theme.primary : 'transparent',
                    borderColor: hasNextPage ? theme.primary : theme.border,
                    opacity: hasNextPage ? 1 : 0.4,
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={[styles.pageNavBtnText, { color: hasNextPage ? '#FFFFFF' : theme.textPrimary }]}>Next</Text>
                <Ionicons name="chevron-forward" size={16} color={hasNextPage ? '#FFFFFF' : theme.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    ),
    [insets.bottom, totalCount, pageSize, theme, currentPage, totalPages, isDark, hasPrevPage, hasNextPage]
  );

  const listHeaderElement = (
    <View>
      {/* ── 1. Executive Header & Counter Badge ──────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Orders & Dispatch
          </Text>
          <View style={[styles.countBadge, { backgroundColor: isDark ? 'rgba(209, 153, 90, 0.16)' : 'rgba(196, 108, 39, 0.12)' }]}>
            <Text style={[styles.countBadgeText, { color: isDark ? '#D1995A' : theme.primary }]}>
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </Text>
          </View>
          {isOrdersFetching && !isOrdersLoading && (
            <ActivityIndicator size="small" color={theme.primary} style={{ marginLeft: 6 }} />
          )}
        </View>
      </View>

      {/* ── 2. Option A: 2x2 Metric Cards Grid (Figma Standard 183x125) ───── */}
      <View style={styles.kpiGrid}>
        {/* 1. Gross Revenue */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
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
            <TrendingUpFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#0AD24F' : '#009D1A' },
              ]}
            >
              Order Revenue
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text
              style={[styles.kpiValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPriceValue(totalOrderRevenue)}
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Settled & In-Flight</Text>
        </View>

        {/* 2. Order Volume */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.kpiPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(196, 108, 39, 0.16)'
                  : 'rgba(196, 108, 39, 0.10)',
              },
            ]}
          >
            <PackageFigmaIcon size={12} color={isDark ? '#D1995A' : theme.primary} />
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#D1995A' : theme.primary },
              ]}
            >
              Order Volume
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
              {totalOrdersCount} Placed
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Total Client Orders</Text>
        </View>

        {/* 3. In Fulfillment */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View
            style={[
              styles.kpiPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(209, 153, 90, 0.16)'
                  : 'rgba(85, 107, 47, 0.10)',
              },
            ]}
          >
            <CustomBidsFigmaIcon size={12} color={isDark ? '#D1995A' : '#556B2F'} />
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#D1995A' : '#556B2F' },
              ]}
            >
              In Fulfillment
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
              {inFulfillmentCount} Active
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Processing & Transit</Text>
        </View>

        {/* 4. Fulfilled & Settled */}
        <View
          style={[
            styles.kpiCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
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
            <StarOutlineFigmaIcon size={11} color={isDark ? '#0AD24F' : '#009D1A'} />
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#0AD24F' : '#009D1A' },
              ]}
            >
              Fulfilled
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
              {completedOrdersCount} Delivered
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Successful Delivery</Text>
        </View>
      </View>

      {/* ── 3. Search Bar ────────────────────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBarWrap,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by Order #, customer name, product..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              <Ionicons name="close-circle" size={18} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── 4. Horizontal Status Filter Tabs Carousel (Multi-Select) ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusCarousel}
      >
        {STATUS_TABS.map((tab) => {
          const isSelected = selectedStatuses.includes(tab.id);
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => toggleStatus(tab.id)}
              style={[
                styles.statusPill,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.card,
                  borderColor: isSelected
                    ? theme.primary
                    : theme.border,
                },
              ]}
              activeOpacity={0.8}
            >
              {isSelected && tab.id !== 'ALL' ? (
                <Ionicons
                  name="checkmark"
                  size={13}
                  color="#FFFFFF"
                  style={{ marginRight: 5 }}
                />
              ) : (
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? theme.textGold : theme.primary}
                  style={{ marginRight: 6 }}
                />
              )}
              <Text
                style={[
                  styles.statusPillText,
                  {
                    color: isSelected ? '#FFFFFF' : theme.textPrimary,
                    fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                  },
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 4b. Active Status Filter Chips Bar ── */}
      {isStatusFiltered && (
        <View style={styles.activeChipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsScroll}
          >
            <Text style={[styles.activeChipsLeadLabel, { color: theme.textMuted }]}>
              Active:
            </Text>
            {selectedStatuses.map((stKey) => {
              const label = STATUS_TABS.find((t) => t.id === stKey)?.label || stKey;
              return (
                <TouchableOpacity
                  key={`st-${stKey}`}
                  style={[
                    styles.activeChipPill,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FAF6EE',
                      borderColor: theme.border,
                    },
                  ]}
                  onPress={() => toggleStatus(stKey)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.activeChipText, { color: theme.textPrimary }]}>
                    {label}
                  </Text>
                  <Ionicons name="close-circle" size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={[styles.clearAllChip, { borderColor: theme.border }]}
              onPress={handleClearAllFilters}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearAllChipText, { color: theme.textMuted }]}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Toast Notification Pill ────────────────────────────────────────── */}
      {toastMessage && (
        <View
          style={[
            styles.toastContainer,
            { backgroundColor: theme.card, borderColor: theme.primary },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Main Virtualized List Container ────────────────────────────────── */}
      <FlatList
        data={isOrdersLoading && orders.length === 0 ? [] : paginatedOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrderItem}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary, '#D1995A']}
          />
        }
      />

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: FULL ORDER DETAILS & BREAKDOWN SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDetailModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setDetailModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            </View>

            {/* Header */}
            <View
              style={[
                styles.modalHeader,
                {
                  borderBottomColor: theme.borderSubtle,
                },
              ]}
            >
              <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Order Breakdown</Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#D1995A' : theme.primary }]}>
                  {activeOrder?.orderNumber}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  if (activeOrder) {
                    setDetailModalVisible(false);
                    handleOpenStatusModal(activeOrder);
                  }
                }}
                style={styles.modalHeaderAction}
              >
                <Ionicons name="pencil" size={18} color={isDark ? '#D1995A' : theme.primary} />
              </TouchableOpacity>
            </View>

            {activeOrder && (
              <ScrollView
                style={styles.modalBody}
                contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Customer & Destination Card */}
                <View
                  style={[
                    styles.modalSectionCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="person-outline" size={16} color={isDark ? '#D1995A' : theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>Customer & Destination</Text>
                  </View>
                  <Text style={[styles.modalClientName, { color: theme.textPrimary }]}>{activeOrder.customer.name}</Text>
                  <Text style={[styles.modalClientSub, { color: theme.textSecondary }]}>
                    {activeOrder.customer.email} • {activeOrder.customer.phone}
                  </Text>
                  <View style={[styles.addressPill, { backgroundColor: theme.card, borderColor: theme.borderSubtle, borderWidth: 1 }]}>
                    <Ionicons name="location-outline" size={14} color={isDark ? '#D1995A' : theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.addressText, { color: theme.textPrimary }]}>
                      {activeOrder.customer.deliveryAddress}, {activeOrder.customer.city}, {activeOrder.customer.country}
                    </Text>
                  </View>
                </View>

                {/* Line Items List */}
                <View
                  style={[
                    styles.modalSectionCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="cube-outline" size={16} color={isDark ? '#D1995A' : theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>
                      Ordered Items ({activeOrder.orderItems.length})
                    </Text>
                  </View>

                  {activeOrder.orderItems.map((item, idx) => (
                    <View key={item.id || idx} style={[styles.modalItemRow, { borderBottomColor: theme.borderSubtle }]}>
                      <Image source={{ uri: item.mainImage }} style={styles.modalItemImg} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={[styles.modalItemName, { color: theme.textPrimary }]}>{item.name}</Text>
                        <Text style={[styles.modalItemSub, { color: theme.textSecondary }]}>
                          Qty: {item.quantity} • Unit: {formatPriceValue(item.unitPrice)}
                        </Text>
                        {item.variantSnapshot && (
                          <View style={styles.variantChipsWrap}>
                            {item.variantSnapshot.size && (
                              <View style={[styles.variantChip, { backgroundColor: isDark ? 'rgba(209, 153, 90, 0.16)' : 'rgba(196, 108, 39, 0.10)' }]}>
                                <Text style={[styles.variantChipText, { color: isDark ? '#D1995A' : theme.primary }]}>
                                  {item.variantSnapshot.size}
                                </Text>
                              </View>
                            )}
                            {item.variantSnapshot.color && (
                              <View style={[styles.variantChip, { backgroundColor: isDark ? 'rgba(209, 153, 90, 0.16)' : 'rgba(196, 108, 39, 0.10)' }]}>
                                <Text style={[styles.variantChipText, { color: isDark ? '#D1995A' : theme.primary }]}>
                                  {item.variantSnapshot.color}
                                </Text>
                              </View>
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={[styles.modalItemTotal, { color: isDark ? '#D1995A' : theme.primary }]}>
                        {formatPriceValue(item.unitPrice * item.quantity)}
                      </Text>
                    </View>
                  ))}
                </View>

                {/* Shipping & Courier Section */}
                <View
                  style={[
                    styles.modalSectionCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="airplane-outline" size={16} color={isDark ? '#D1995A' : theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>Logistics & Dispatch</Text>
                  </View>
                  <View style={styles.specGridRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.specLabel, { color: theme.textMuted }]}>Courier Provider</Text>
                      <Text style={[styles.specValue, { color: theme.textPrimary }]}>{activeOrder.shippingProvider}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.specLabel, { color: theme.textMuted }]}>Shipping Cost</Text>
                      <Text style={[styles.specValue, { color: theme.textPrimary }]}>
                        {formatPriceValue(activeOrder.shippingCost)} (Paid)
                      </Text>
                    </View>
                  </View>

                  {activeOrder.shippingTrackingNumber && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.specLabel, { color: theme.textMuted }]}>Waybill Tracking #</Text>
                      <View
                        style={[
                          styles.trackingCopyBox,
                          { backgroundColor: theme.card, borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Text style={[styles.trackingCopyText, { color: isDark ? '#D1995A' : theme.primary }]}>
                          {activeOrder.shippingTrackingNumber}
                        </Text>
                        <TouchableOpacity
                          onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            showToast(`Copied tracking code: ${activeOrder.shippingTrackingNumber}`);
                          }}
                          style={[styles.copyBtnPill, { backgroundColor: theme.primary }]}
                        >
                          <Ionicons name="copy-outline" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.copyBtnText}>Copy</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Payment Summary Box */}
                <View
                  style={[
                    styles.modalSectionCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.sectionHeaderRow}>
                    <Ionicons name="wallet-outline" size={16} color={isDark ? '#D1995A' : theme.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>Settlement & Payment</Text>
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Crafts Subtotal</Text>
                    <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
                      {formatPriceValue(activeOrder.itemsSubtotal)}
                    </Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Courier Shipping Fee</Text>
                    <Text style={[styles.summaryVal, { color: theme.textPrimary }]}>
                      {formatPriceValue(activeOrder.shippingCost)}
                    </Text>
                  </View>
                  <View style={[styles.summaryDivider, { backgroundColor: theme.borderSubtle }]} />
                  <View style={styles.summaryRow}>
                    <Text style={[styles.summaryGrandLabel, { color: theme.textPrimary }]}>Total Grand Settlement</Text>
                    <Text style={[styles.summaryGrandVal, { color: isDark ? '#D1995A' : theme.primary }]}>
                      {formatPriceValue(activeOrder.totalAmount)}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            )}

            {/* Bottom Action */}
            {activeOrder && (
              <View
                style={[
                  styles.modalBottomBar,
                  { backgroundColor: theme.card, borderTopColor: theme.borderSubtle },
                ]}
              >
                <TouchableOpacity
                  onPress={() => {
                    setDetailModalVisible(false);
                    handleOpenStatusModal(activeOrder);
                  }}
                  style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                  activeOpacity={0.85}
                >
                  <Ionicons name="pencil" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.primaryActionBtnText}>Update Fulfillment Status</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: UPDATE ORDER STATUS SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={statusModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setStatusModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setStatusModalVisible(false)}
          />
          <View
            style={[
              styles.statusSheetCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.sheetHandleWrap}>
              <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />
            </View>

            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Update Order Status</Text>
                <Text style={[styles.sheetSubtitle, { color: isDark ? '#D1995A' : theme.primary }]}>{activeOrder?.orderNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
              {(
                [
                  'PENDING',
                  'IN_PRODUCTION',
                  'SHIPPED',
                  'DELIVERED',
                  'COMPLETED',
                  'CANCELLED',
                ] as OrderStatusType[]
              ).map((st) => {
                const meta = STATUS_BADGE_CONFIG[st];
                const isSelected = newSelectedStatus === st;
                const isCurrent = activeOrder?.status === st;

                return (
                  <TouchableOpacity
                    key={st}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setNewSelectedStatus(st);
                    }}
                    style={[
                      styles.statusOptionRow,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(196, 108, 39, 0.16)' : 'rgba(196, 108, 39, 0.10)')
                          : theme.backgroundSecondary,
                        borderColor: isSelected ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.statusColorDot, { backgroundColor: meta.color }]} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text
                        style={[
                          styles.statusOptionLabel,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                          },
                        ]}
                      >
                        {meta.label}
                        {isCurrent && (
                          <Text style={{ color: theme.textMuted, fontFamily: FontFamily.poppinsRegular }}> (Current)</Text>
                        )}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color={theme.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                onPress={() => setStatusModalVisible(false)}
                disabled={isUpdatingStatus}
                style={[styles.sheetCancelBtn, { backgroundColor: theme.card, borderColor: theme.border }]}
              >
                <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveStatusUpdate}
                disabled={isUpdatingStatus}
                style={[
                  styles.sheetSaveBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: isUpdatingStatus ? 0.75 : 1,
                  },
                ]}
              >
                {isUpdatingStatus ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.sheetSaveText}>Updating...</Text>
                  </View>
                ) : (
                  <Text style={styles.sheetSaveText}>Commit Status Update</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: COURIER TRACKING LIGHTBOX SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={trackingModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTrackingModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.backdropDim}>
          <View
            style={[
              styles.trackingCard,
              { backgroundColor: theme.card, borderColor: theme.border, borderWidth: 1 },
            ]}
          >
            <View style={styles.trackingHeaderRow}>
              <Ionicons name="airplane" size={24} color={isDark ? '#D1995A' : theme.primary} />
              <Text style={[styles.trackingModalTitle, { color: theme.textPrimary }]}>Courier Waybill Tracking</Text>
            </View>

            {activeOrder && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>Courier Carrier</Text>
                <Text style={[styles.specValue, { color: theme.textPrimary, fontSize: 16 }]}>
                  {activeOrder.shippingProvider}
                </Text>

                <Text style={[styles.specLabel, { color: theme.textMuted, marginTop: 10 }]}>Waybill Number</Text>
                <Text style={[styles.specValue, { color: isDark ? '#D1995A' : theme.primary, fontSize: 18, fontFamily: FontFamily.poppinsBold }]}>
                  {activeOrder.shippingTrackingNumber || 'Pending Assignment'}
                </Text>

                {activeOrder.estimatedDeliveryDate && (
                  <Text style={[styles.trackingEtaText, { color: theme.textSecondary }]}>
                    Estimated Arrival: {activeOrder.estimatedDeliveryDate}
                  </Text>
                )}

                <TouchableOpacity
                  onPress={() => {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    showToast(`Tracking link copied for ${activeOrder.orderNumber}`);
                    setTrackingModalVisible(false);
                  }}
                  style={[styles.trackingCopyPrimaryBtn, { backgroundColor: theme.primary }]}
                >
                  <Ionicons name="copy-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.trackingCopyPrimaryBtnText}>Copy Tracking Link</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setTrackingModalVisible(false)}
                  style={[styles.trackingDismissBtn, { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle }]}
                >
                  <Text style={[styles.trackingDismissText, { color: theme.textSecondary }]}>Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── Stylesheet ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
  },

  // Toast
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 44 : 20,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  toastText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    flex: 1,
  },

  // 1. Executive Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  countBadge: {
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsSemiBold,
  },

  // 2. Option A 2x2 Metric Grid (Figma Standard 183x125)
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    height: 125,
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
    height: 24,
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
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  kpiSubtitleText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#808080',
    marginTop: 1,
  },

  // 2. Search Section
  searchSection: {
    marginBottom: Spacing.sm,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13,
    paddingVertical: 0,
  },

  // 3. Status Carousel
  statusCarousel: {
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusPillText: {
    fontSize: 12,
  },

  // 3b. Active Status Filter Chips
  activeChipsContainer: {
    marginBottom: Spacing.sm,
  },
  activeChipsScroll: {
    gap: 6,
    alignItems: 'center',
    paddingVertical: 2,
  },
  activeChipsLeadLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.4,
    marginRight: 2,
  },
  activeChipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  activeChipText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },
  clearAllChip: {
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  clearAllChipText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },

  // 4. Order Cards
  ordersListContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  orderCard: {
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  orderNumberText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 14,
    letterSpacing: 0.5,
  },
  orderDateText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
    marginTop: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  clientAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 14,
  },
  customerNameText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  customerLocationText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
  },
  itemPreviewBox: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: 8,
    marginVertical: 8,
  },
  itemThumbImg: {
    width: 52,
    height: 52,
    borderRadius: Radius.md,
  },
  itemTitleText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  itemMetaText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    marginTop: 2,
  },
  extraItemsText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 10,
    marginTop: 2,
  },
  shippingSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  shippingProviderText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
  },
  trackingNumberLink: {
    paddingVertical: 2,
  },
  trackingNumberLinkText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
  },
  trackingNumberPending: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
  },
  cardDivider: {
    height: 1,
    marginVertical: 10,
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabelText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  totalAmountText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
    marginTop: 1,
  },
  footerActionsGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  updateStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  updateStatusBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
  },
  inspectOrderBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectOrderBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    color: '#FFFFFF',
  },

  // Empty state
  emptyStateCard: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: Spacing.lg,
  },
  emptyStateTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
    marginTop: 10,
  },
  emptyStateSub: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginTop: 14,
  },
  emptyResetBtnText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },

  // ── Modals / Bottom Sheets Standard ──────────────────────────────────────
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
  modalSheet: {
    height: '84%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  sheetHandleWrap: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.5,
  },
  modalHeaderAction: {
    padding: 6,
  },
  modalBody: {
    flex: 1,
  },
  modalSectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalSectionHeading: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  modalClientName: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
  },
  modalClientSub: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    marginTop: 2,
  },
  addressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    marginTop: 10,
  },
  addressText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  modalItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  modalItemImg: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
  },
  modalItemName: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
  modalItemSub: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    marginTop: 2,
  },
  variantChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  variantChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  variantChipText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 9,
  },
  modalItemTotal: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    marginLeft: 8,
  },
  specGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  specLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  specValue: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    marginTop: 2,
  },
  trackingCopyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  trackingCopyText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  copyBtnPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  copyBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    color: '#FFFFFF',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  summaryLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
  },
  summaryVal: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
  summaryDivider: {
    height: 1,
    marginVertical: 8,
  },
  summaryGrandLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  summaryGrandVal: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  modalBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radius.lg,
  },
  primaryActionBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Status Sheet Bottom Modal
  statusSheetCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: Platform.OS === 'ios' ? 36 : Spacing.lg,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sheetTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  sheetSubtitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  statusColorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusOptionLabel: {
    fontSize: 13,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  sheetCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCancelText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  sheetSaveBtn: {
    flex: 1.6,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSaveText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Tracking Dialog Modal
  backdropDim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  trackingCard: {
    width: '100%',
    borderRadius: Radius.md,
    padding: Spacing.lg,
    borderWidth: 1.5,
  },
  trackingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trackingModalTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  trackingEtaText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    marginTop: 8,
  },
  trackingCopyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginTop: 16,
  },
  trackingCopyPrimaryBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  trackingDismissBtn: {
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  trackingDismissText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  listFooterContainer: {
    marginTop: 4,
  },
  paginationCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
    gap: 12,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  paginationInfoText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  paginationButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    width: '100%',
  },
  pageNavBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    gap: 6,
  },
  pageNavBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
});

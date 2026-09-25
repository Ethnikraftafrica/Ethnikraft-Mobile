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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';

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

// ─── Mock Dataset matching Ethnikraft-BE & Ethnikraft-Vendor ───────────────────
const INITIAL_ORDERS: VendorOrderRecord[] = [
  {
    id: 'ord-9201',
    orderNumber: '#VORD-9201',
    createdAt: '2026-09-21T14:30:00.000Z',
    updatedAt: '2026-09-22T09:15:00.000Z',
    status: 'SHIPPED',
    totalAmount: 104000,
    itemsSubtotal: 96000,
    shippingCost: 8000,
    shippingProvider: 'DHL Express Nigeria',
    shippingCostPaid: true,
    shippingTrackingNumber: 'DHL-NG-98421045',
    shippingBookingId: 'BOOK-DHL-77019',
    estimatedDeliveryDate: '2026-09-24',
    customer: {
      id: 'usr-101',
      name: 'Chukwuma Obi',
      email: 'c.obi@lagosart.org',
      phone: '+234 802 334 5566',
      deliveryAddress: 'Plot 14, Admiralty Way, Lekki Phase 1',
      city: 'Lagos',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-01',
        productId: 'prod-001',
        name: 'Handwoven Royal Indigo Aso-Oke Fila & Stole',
        mainImage: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
        category: 'WEARS',
        quantity: 2,
        unitPrice: 48000,
        variantSnapshot: {
          size: 'Large (58cm)',
          color: 'Royal Indigo & Silver Lurex',
          material: 'Hand-spun Cotton',
        },
      },
    ],
    notes: 'Please pack in ceremonial gift box for wedding presentation.',
  },
  {
    id: 'ord-9195',
    orderNumber: '#VORD-9195',
    createdAt: '2026-09-20T11:20:00.000Z',
    updatedAt: '2026-09-21T16:00:00.000Z',
    status: 'IN_PRODUCTION',
    totalAmount: 335000,
    itemsSubtotal: 320000,
    shippingCost: 15000,
    shippingProvider: 'Red Star Express',
    shippingCostPaid: true,
    shippingTrackingNumber: 'RSE-LAG-55201',
    shippingBookingId: 'BOOK-RSE-88310',
    estimatedDeliveryDate: '2026-09-28',
    customer: {
      id: 'usr-102',
      name: 'Amara Nwosu',
      email: 'amara.nwosu@heritage.ng',
      phone: '+234 803 778 9900',
      deliveryAddress: '55 Gana Street, Maitama District',
      city: 'Abuja',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-02',
        productId: 'prod-002',
        name: 'Royal Benin Leopard Bronze Sculpture',
        mainImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        category: 'CRAFTS',
        quantity: 1,
        unitPrice: 320000,
        variantSnapshot: {
          material: 'Solid Lost-Wax Bronze Cast',
        },
      },
    ],
    isCustomCommission: true,
    customRequestTitle: 'Lost-Wax Bronze Leopard with Custom Patina',
    notes: 'Client requested extra protective foam packing for fine-art courier transport.',
  },
  {
    id: 'ord-9188',
    orderNumber: '#VORD-9188',
    createdAt: '2026-09-19T08:45:00.000Z',
    updatedAt: '2026-09-19T10:00:00.000Z',
    status: 'PENDING',
    totalAmount: 150000,
    itemsSubtotal: 145000,
    shippingCost: 5000,
    shippingProvider: 'GIG Logistics',
    shippingCostPaid: true,
    estimatedDeliveryDate: '2026-09-26',
    customer: {
      id: 'usr-103',
      name: 'Dr. Folake Balogun',
      email: 'f.balogun@unilag.edu.ng',
      phone: '+234 805 112 2334',
      deliveryAddress: '12 Parkview Estate, Ikoyi',
      city: 'Lagos',
      country: 'Nigeria',
    },
    orderItems: [
      {
        id: 'item-03',
        productId: 'prod-003',
        name: 'Yoruba Ceremonial Beaded Coral Crown (Ade)',
        mainImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
        category: 'ACCESSORIES',
        quantity: 1,
        unitPrice: 145000,
        variantSnapshot: {
          color: 'Imperial Coral Red',
          material: 'Natural Coral & Czech Micro-Glass',
        },
      },
    ],
    notes: 'Order confirmed and awaiting artisan workshop preparation.',
  },
  {
    id: 'ord-9174',
    orderNumber: '#VORD-9174',
    createdAt: '2026-09-15T16:10:00.000Z',
    updatedAt: '2026-09-18T12:30:00.000Z',
    status: 'DELIVERED',
    totalAmount: 98000,
    itemsSubtotal: 92000,
    shippingCost: 6000,
    shippingProvider: 'DHL Express Nigeria',
    shippingCostPaid: true,
    shippingTrackingNumber: 'DHL-NG-88392110',
    shippingBookingId: 'BOOK-DHL-66190',
    estimatedDeliveryDate: '2026-09-18',
    customer: {
      id: 'usr-104',
      name: 'Kofi Mensah',
      email: 'kofi.m@accra-atelier.gh',
      phone: '+233 24 123 4567',
      deliveryAddress: '7 Independence Avenue, Airport Residential',
      city: 'Accra',
      country: 'Ghana',
    },
    orderItems: [
      {
        id: 'item-04',
        productId: 'prod-004',
        name: 'Fulani Hand-Tooled Leather Weekend Satchel',
        mainImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
        category: 'BAGS',
        quantity: 1,
        unitPrice: 92000,
        variantSnapshot: {
          color: 'Cognac Saddle Brown',
          material: 'Vegetable-Tanned Hide',
        },
      },
    ],
    notes: 'Package signed and received by security concierge.',
  },
  {
    id: 'ord-9160',
    orderNumber: '#VORD-9160',
    createdAt: '2026-09-12T10:00:00.000Z',
    updatedAt: '2026-09-14T15:45:00.000Z',
    status: 'COMPLETED',
    totalAmount: 248000,
    itemsSubtotal: 240000,
    shippingCost: 8000,
    shippingProvider: 'GIG Logistics',
    shippingCostPaid: true,
    shippingTrackingNumber: 'GIG-5591024',
    customer: {
      id: 'usr-105',
      name: 'Lady Brenda Thornton',
      email: 'brenda.thornton@london-arts.co.uk',
      phone: '+44 20 7946 0991',
      deliveryAddress: '24 Kensington Church Street',
      city: 'London',
      country: 'United Kingdom',
    },
    orderItems: [
      {
        id: 'item-05',
        productId: 'prod-005',
        name: 'Sacred Oshogbo Grove Spirits — Oil on Canvas',
        mainImage: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
        category: 'PAINTINGS',
        quantity: 1,
        unitPrice: 240000,
      },
    ],
    notes: 'Funds settled to artisan wallet and escrow released.',
  },
];

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
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── State Management ─────────────────────────────────────────────────────────
  const [orders, setOrders] = useState<VendorOrderRecord[]>(INITIAL_ORDERS);
  const [selectedStatusTab, setSelectedStatusTab] = useState<OrderStatusType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);

  // Active Order References
  const [activeOrder, setActiveOrder] = useState<VendorOrderRecord | null>(null);
  const [newSelectedStatus, setNewSelectedStatus] = useState<OrderStatusType>('PENDING');

  // ── Toast Helper ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // ── Refresh Handler ──────────────────────────────────────────────────────────
  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Orders & logistics synchronized with courier gateway');
    }, 800);
  };

  // ── Currency Formatter Helper ────────────────────────────────────────────────
  const formatPriceValue = (val: number) => {
    return formatPrice(val, currencyCode, exchangeRate);
  };

  // ── Filtered Orders Dataset ──────────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      // Tab filter
      if (selectedStatusTab !== 'ALL') {
        if (selectedStatusTab === 'IN_PRODUCTION') {
          if (!['IN_PRODUCTION', 'IN_PROGRESS', 'PRODUCTION_PENDING'].includes(ord.status)) return false;
        } else if (ord.status !== selectedStatusTab) {
          return false;
        }
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
  }, [orders, selectedStatusTab, searchQuery]);

  // ── Aggregate Metrics ────────────────────────────────────────────────────────
  const totalOrdersCount = orders.length;
  const inFulfillmentCount = useMemo(() => {
    return orders.filter((o) => ['PENDING', 'IN_PROGRESS', 'IN_PRODUCTION', 'SHIPPED'].includes(o.status)).length;
  }, [orders]);
  const totalOrderRevenue = useMemo(() => {
    return orders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'REFUNDED')
      .reduce((sum, o) => sum + o.totalAmount, 0);
  }, [orders]);

  // ── Handlers: Modals & Status Updates ────────────────────────────────────────
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

  const handleSaveStatusUpdate = () => {
    if (!activeOrder) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

    const statusLabel = STATUS_BADGE_CONFIG[newSelectedStatus]?.label || newSelectedStatus;
    setStatusModalVisible(false);
    showToast(`${activeOrder.orderNumber} transitioned to "${statusLabel}"`);
    setActiveOrder(null);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Toast Notification Pill ────────────────────────────────────────── */}
      {toastMessage && (
        <View
          style={[
            styles.toastContainer,
            { backgroundColor: isDark ? '#1F0E04' : '#101213', borderColor: theme.primary },
          ]}
        >
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={[styles.toastText, { color: '#FFF3D6' }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Main Scroll Container ──────────────────────────────────────────── */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
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
        {/* ── 1. Orders Command Banner ────────────────────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#361300', '#1F0E04', '#120701'] : ['#5A2002', '#7D2E04', '#451700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroAvatarBox}>
              <Ionicons name="cube" size={28} color="#FFD79E" />
            </View>
            <View style={styles.heroInfoCol}>
              <View style={styles.badgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={10} color="#FFD79E" />
                  <Text style={styles.heroBadgeText}>FULFILLMENT ATELIER</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]}>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.heroBadgeText, { color: '#A7F3D0' }]}>COURIER GATEWAY ONLINE</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Orders & Dispatch</Text>
              <Text style={styles.heroSubtitle}>
                Manage active client shipments, track waybills, and update packaging milestones.
              </Text>
            </View>
          </View>

          {/* Micro Metrics Strip */}
          <View style={styles.kpiRibbon}>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{totalOrdersCount}</Text>
              <Text style={styles.kpiRibbonLabel}>Total Orders</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={[styles.kpiRibbonNum, { color: '#FFD79E' }]}>{inFulfillmentCount}</Text>
              <Text style={styles.kpiRibbonLabel}>In Fulfillment</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{formatPriceValue(totalOrderRevenue)}</Text>
              <Text style={styles.kpiRibbonLabel}>Total Revenue</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. Search Bar ────────────────────────────────────────────────── */}
        <View style={styles.searchSection}>
          <View
            style={[
              styles.searchBarWrap,
              {
                backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                borderColor: isDark ? 'rgba(209, 153, 90, 0.25)' : 'rgba(196, 108, 39, 0.18)',
              },
            ]}
          >
            <Ionicons name="search" size={18} color={theme.textMuted} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: theme.textPrimary }]}
              placeholder="Search by Order #, customer name, product..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── 3. Horizontal Status Filter Tabs Carousel ────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.statusCarousel}
        >
          {STATUS_TABS.map((tab) => {
            const isSelected = selectedStatusTab === tab.id;
            return (
              <TouchableOpacity
                key={tab.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedStatusTab(tab.id);
                }}
                style={[
                  styles.statusPill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isDark
                      ? '#1F0E04'
                      : '#FFFFFF',
                    borderColor: isSelected
                      ? theme.primary
                      : isDark
                      ? 'rgba(209, 153, 90, 0.22)'
                      : 'rgba(196, 108, 39, 0.15)',
                  },
                ]}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={tab.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? '#FFD79E' : theme.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.statusPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textPrimary,
                      fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── 4. Order Cards Listing ───────────────────────────────────────── */}
        <View style={styles.ordersListContainer}>
          {filteredOrders.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
              ]}
            >
              <Ionicons name="cube-outline" size={38} color={theme.primary} />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Orders Found</Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                No orders match your active search or status filter criteria.
              </Text>
            </View>
          ) : (
            filteredOrders.map((ord) => {
              const badgeMeta = STATUS_BADGE_CONFIG[ord.status] || STATUS_BADGE_CONFIG.PENDING;
              const mainItem = ord.orderItems[0];
              const extraCount = ord.orderItems.length - 1;

              return (
                <View
                  key={ord.id}
                  style={[
                    styles.orderCard,
                    {
                      backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(209, 153, 90, 0.22)' : 'rgba(196, 108, 39, 0.14)',
                    },
                  ]}
                >
                  {/* Header Row: Order Number, Date, Status Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.orderNumberText, { color: theme.primary }]}>{ord.orderNumber}</Text>
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
                        { backgroundColor: isDark ? '#361300' : '#FFEDD5' },
                      ]}
                    >
                      <Text style={[styles.clientAvatarText, { color: theme.primary }]}>
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
                          backgroundColor: isDark ? '#160902' : '#FAF6F0',
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
                          <Text style={[styles.extraItemsText, { color: theme.primary }]}>
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
                        <Text style={[styles.trackingNumberLinkText, { color: theme.primary }]}>
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
                      <Text style={[styles.totalAmountText, { color: theme.primary }]}>
                        {formatPriceValue(ord.totalAmount)}
                      </Text>
                    </View>

                    <View style={styles.footerActionsGroup}>
                      <TouchableOpacity
                        onPress={() => handleOpenStatusModal(ord)}
                        style={[
                          styles.updateStatusBtn,
                          {
                            backgroundColor: isDark ? '#361300' : '#FFEDD5',
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="pencil" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.updateStatusBtnText, { color: theme.primary }]}>Status</Text>
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
            })
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: FULL ORDER DETAILS & BREAKDOWN SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModalVisible(false)}
        statusBarTranslucent
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.background }]}>
          {/* Header */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.borderSubtle,
                backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
              },
            ]}
          >
            <TouchableOpacity onPress={() => setDetailModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Order Breakdown</Text>
              <Text style={[styles.modalSubtitle, { color: theme.primary }]}>
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
              <Ionicons name="pencil" size={18} color={theme.primary} />
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
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="person-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>Customer & Destination</Text>
                </View>
                <Text style={[styles.modalClientName, { color: theme.textPrimary }]}>{activeOrder.customer.name}</Text>
                <Text style={[styles.modalClientSub, { color: theme.textSecondary }]}>
                  {activeOrder.customer.email} • {activeOrder.customer.phone}
                </Text>
                <View style={[styles.addressPill, { backgroundColor: isDark ? '#160902' : '#F9F5EE' }]}>
                  <Ionicons name="location-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.addressText, { color: theme.textPrimary }]}>
                    {activeOrder.customer.deliveryAddress}, {activeOrder.customer.city}, {activeOrder.customer.country}
                  </Text>
                </View>
              </View>

              {/* Line Items List */}
              <View
                style={[
                  styles.modalSectionCard,
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="cube-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.modalSectionHeading, { color: theme.textPrimary }]}>
                    Ordered Items ({activeOrder.orderItems.length})
                  </Text>
                </View>

                {activeOrder.orderItems.map((item, idx) => (
                  <View key={item.id || idx} style={styles.modalItemRow}>
                    <Image source={{ uri: item.mainImage }} style={styles.modalItemImg} />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.modalItemName, { color: theme.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.modalItemSub, { color: theme.textSecondary }]}>
                        Qty: {item.quantity} • Unit: {formatPriceValue(item.unitPrice)}
                      </Text>
                      {item.variantSnapshot && (
                        <View style={styles.variantChipsWrap}>
                          {item.variantSnapshot.size && (
                            <View style={[styles.variantChip, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}>
                              <Text style={[styles.variantChipText, { color: theme.primary }]}>
                                {item.variantSnapshot.size}
                              </Text>
                            </View>
                          )}
                          {item.variantSnapshot.color && (
                            <View style={[styles.variantChip, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}>
                              <Text style={[styles.variantChipText, { color: theme.primary }]}>
                                {item.variantSnapshot.color}
                              </Text>
                            </View>
                          )}
                        </View>
                      )}
                    </View>
                    <Text style={[styles.modalItemTotal, { color: theme.primary }]}>
                      {formatPriceValue(item.unitPrice * item.quantity)}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Shipping & Courier Section */}
              <View
                style={[
                  styles.modalSectionCard,
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="airplane-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
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
                        { backgroundColor: isDark ? '#160902' : '#F9F5EE', borderColor: theme.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.trackingCopyText, { color: theme.primary }]}>
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
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View style={styles.sectionHeaderRow}>
                  <Ionicons name="wallet-outline" size={16} color={theme.primary} style={{ marginRight: 6 }} />
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
                  <Text style={[styles.summaryGrandVal, { color: theme.primary }]}>
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
                { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderTopColor: theme.borderSubtle },
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
        <View style={styles.backdropDimBottom}>
          <View
            style={[
              styles.statusSheetCard,
              { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' },
            ]}
          >
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeaderRow}>
              <View>
                <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Update Order Status</Text>
                <Text style={[styles.sheetSubtitle, { color: theme.primary }]}>{activeOrder?.orderNumber}</Text>
              </View>
              <TouchableOpacity onPress={() => setStatusModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
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
                          ? isDark
                            ? '#361300'
                            : '#FFEDD5'
                          : isDark
                          ? '#160902'
                          : '#F9F5EE',
                        borderColor: isSelected ? theme.primary : 'transparent',
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
                style={[styles.sheetCancelBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.sheetCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveStatusUpdate}
                style={[styles.sheetSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.sheetSaveText}>Commit Status Update</Text>
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
              { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.primary },
            ]}
          >
            <View style={styles.trackingHeaderRow}>
              <Ionicons name="airplane" size={24} color={theme.primary} />
              <Text style={[styles.trackingModalTitle, { color: theme.textPrimary }]}>Courier Waybill Tracking</Text>
            </View>

            {activeOrder && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.specLabel, { color: theme.textMuted }]}>Courier Carrier</Text>
                <Text style={[styles.specValue, { color: theme.textPrimary, fontSize: 16 }]}>
                  {activeOrder.shippingProvider}
                </Text>

                <Text style={[styles.specLabel, { color: theme.textMuted, marginTop: 10 }]}>Waybill Number</Text>
                <Text style={[styles.specValue, { color: theme.primary, fontSize: 18, fontFamily: FontFamily.poppinsBold }]}>
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
                  style={[styles.trackingDismissBtn, { borderColor: theme.borderSubtle }]}
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
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    ...Shadows.lg,
  },
  toastText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    flex: 1,
  },

  // 1. Hero Card
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    ...Shadows.md,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heroAvatarBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 215, 158, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  heroInfoCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 158, 0.2)',
    borderWidth: 1,
    borderColor: '#FFD79E',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 4,
  },
  heroBadgeText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    color: '#FFD79E',
    letterSpacing: 0.5,
    marginLeft: 3,
  },
  heroTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 20,
    color: '#FFFFFF',
    lineHeight: 25,
  },
  heroSubtitle: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    color: '#E0D0C0',
    marginTop: 2,
  },
  kpiRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  kpiRibbonItem: {
    flex: 1,
    alignItems: 'center',
  },
  kpiRibbonNum: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    color: '#FFFFFF',
  },
  kpiRibbonLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
    color: '#C0B0A0',
    marginTop: 1,
  },
  kpiRibbonDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
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

  // 4. Order Cards
  ordersListContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  orderCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
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
    borderRadius: Radius.xl,
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

  // Modal Details
  modalBackdrop: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  modalSubtitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  modalHeaderAction: {
    padding: 4,
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
  backdropDimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  statusSheetCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'center',
    marginBottom: 12,
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
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    ...Shadows.lg,
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
});

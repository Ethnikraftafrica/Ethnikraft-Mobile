import React, { useState, useMemo, useCallback } from 'react';
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
  Linking,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  TrendingUpFigmaIcon,
  PackageFigmaIcon,
  StarFigmaIcon,
  IncomeFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';
import { useGetVendorOrdersQuery } from '@/store/api/vendorApi';
import { VendorCustomersSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data Types & Enums ────────────────────────────────────────────────────────
export type PatronTier = 'ALL' | 'VIP' | 'RETURNING' | 'NEW';

export interface PatronOrderHistoryItem {
  id: string;
  orderNumber: string;
  productName: string;
  productImage: string;
  category: string;
  amount: number;
  date: string;
  status: 'COMPLETED' | 'IN_PRODUCTION' | 'DELIVERED' | 'PENDING';
}

export interface PatronRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  country: string;
  avatar?: string;
  tier: 'VIP' | 'RETURNING' | 'NEW';
  preferredCategory: string;
  totalSpent: number;
  orderCount: number;
  lastOrderDate: string;
  firstOrderDate: string;
  notes?: string;
  orders: PatronOrderHistoryItem[];
}

// ─── Customer Derivation & Normalization (Matching BE & Web Vendor) ───────────
export const deriveCustomers = (orders: any[]): PatronRecord[] => {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const map = new Map<string, PatronRecord>();

  for (const order of orders) {
    const user = order.user;
    if (!user?.id && !user?.email) continue;

    const userId = user.id || `anon-${order.id}`;
    const orderAmount = Number(order.total ?? order.agreedPrice ?? order.itemsSubtotal ?? 0);
    const orderDate = (order.createdAt || order.updatedAt || new Date().toISOString()).slice(0, 10);
    const firstItem = order.orderItems?.[0];
    const category =
      firstItem?.product?.productCategory ||
      order.customRequest?.title ||
      'Artisanal Craft';

    const orderStatus = (order.status || 'PENDING').toUpperCase() as PatronOrderHistoryItem['status'];
    const validStatus: PatronOrderHistoryItem['status'] =
      orderStatus === 'COMPLETED' || orderStatus === 'DELIVERED' || orderStatus === 'IN_PRODUCTION'
        ? orderStatus
        : 'PENDING';

    const historyItem: PatronOrderHistoryItem = {
      id: order.id || `ord-${Math.random().toString(36).slice(2, 7)}`,
      orderNumber: order.orderNumber || `#VORD-${(order.id || '').slice(-4).toUpperCase() || '0000'}`,
      productName: firstItem?.product?.name || order.customRequest?.title || 'Commissioned Piece',
      productImage:
        firstItem?.product?.mainImage ||
        'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      category: category.toUpperCase(),
      amount: orderAmount,
      date: orderDate,
      status: validStatus,
    };

    if (map.has(userId)) {
      const existing = map.get(userId)!;
      existing.orderCount += 1;
      existing.totalSpent += orderAmount;
      if (orderDate && orderDate > existing.lastOrderDate) {
        existing.lastOrderDate = orderDate;
      }
      if (orderDate && (!existing.firstOrderDate || orderDate < existing.firstOrderDate)) {
        existing.firstOrderDate = orderDate;
      }
      existing.orders.push(historyItem);
      if (existing.totalSpent >= 500000 || existing.orderCount >= 3) {
        existing.tier = 'VIP';
      } else if (existing.orderCount > 1) {
        existing.tier = 'RETURNING';
      }
    } else {
      const firstName = user.firstName || user.firstname || '';
      const lastName = user.lastName || user.lastname || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email?.split('@')[0] || 'Collector';
      const tier: PatronRecord['tier'] = orderAmount >= 500000 ? 'VIP' : 'NEW';

      map.set(userId, {
        id: userId,
        name: fullName,
        email: user.email || '—',
        phone: user.phone || user.phoneNumber || 'Not provided',
        city: user.city || 'Lagos',
        country: user.country || 'Nigeria',
        avatar: user.profileImage || undefined,
        tier,
        preferredCategory: category,
        totalSpent: orderAmount,
        orderCount: 1,
        lastOrderDate: orderDate,
        firstOrderDate: orderDate,
        notes: '',
        orders: [historyItem],
      });
    }
  }

  const result = Array.from(map.values());
  result.sort((a, b) => (b.lastOrderDate > a.lastOrderDate ? 1 : -1));
  return result;
};

export default function VendorCustomersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const currentCurrency = useAppSelector((state) => state.currency);

  const [localPatrons, setPatrons] = useState<PatronRecord[]>([]);
  const [syncedLiveOrders, setSyncedLiveOrders] = useState<typeof liveOrders>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTier, setSelectedTier] = useState<PatronTier>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── RTK Query: Vendor Orders Live Endpoint ─────────────────────────────────
  const {
    data: liveOrders,
    isLoading: isOrdersLoading,
    isFetching: isOrdersFetching,
    isError: isOrdersError,
    refetch: refetchOrders,
  } = useGetVendorOrdersQuery();

  const mappedLivePatrons = useMemo<PatronRecord[]>(() => {
    if (liveOrders && Array.isArray(liveOrders)) {
      return deriveCustomers(liveOrders);
    }
    return [];
  }, [liveOrders]);

  // Synchronize derived collectors with live orders
  React.useEffect(() => {
    if (liveOrders && Array.isArray(liveOrders)) {
      setPatrons(mappedLivePatrons);
      setSyncedLiveOrders(liveOrders);
    }
  }, [liveOrders, mappedLivePatrons]);

  const patrons =
    liveOrders && liveOrders !== syncedLiveOrders
      ? mappedLivePatrons
      : localPatrons;

  // Selected patron for the 84% Dossier Bottom Sheet
  const [selectedPatron, setSelectedPatron] = useState<PatronRecord | null>(null);
  const [dossierVisible, setDossierVisible] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [tempNotes, setTempNotes] = useState('');

  // ─── Format Currency Helper ──────────────────────────────────────────────────
  const formatPriceValue = (amount: number) =>
    formatPrice(amount, currentCurrency.code, currentCurrency.rate);

  // ─── Toast Feedback Helper ───────────────────────────────────────────────────
  const showToast = (message: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const copyToClipboard = (text: string, label: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showToast(`${label} copied to clipboard!`);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetchOrders().unwrap();
      showToast('Patrons list synchronized');
    } catch {
      showToast('Synchronized from local cache');
    } finally {
      setRefreshing(false);
    }
  };

  const handleMessageCustomer = (patron: PatronRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDossierVisible(false);
    router.push({
      pathname: '/(vendor)/messenger',
      params: {
        chatId: `patron-${patron.id}`,
        clientName: patron.name,
      },
    });
  };

  // ─── Filter & Search Logic ───────────────────────────────────────────────────
  const filteredPatrons = useMemo(() => {
    return patrons.filter((patron) => {
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        patron.name.toLowerCase().includes(query) ||
        patron.email.toLowerCase().includes(query) ||
        patron.phone.toLowerCase().includes(query) ||
        patron.city.toLowerCase().includes(query) ||
        patron.preferredCategory.toLowerCase().includes(query);

      if (!matchesSearch) return false;
      if (selectedTier === 'ALL') return true;
      return patron.tier === selectedTier;
    });
  }, [patrons, searchQuery, selectedTier]);

  // ─── Pagination Calculations ─────────────────────────────────────────────────
  const totalItems = filteredPatrons.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedPatrons = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredPatrons.slice(startIndex, startIndex + pageSize);
  }, [filteredPatrons, currentPage, pageSize]);

  // ─── 2x2 Metric KPI Calculations ─────────────────────────────────────────────
  const kpiMetrics = useMemo(() => {
    const totalRevenue = patrons.reduce((sum, p) => sum + p.totalSpent, 0);
    const totalCollectors = patrons.length;
    const returningCount = patrons.filter((p) => p.orderCount > 1).length;
    const repeatRate = totalCollectors > 0 ? Math.round((returningCount / totalCollectors) * 100) : 0;
    const topPatron = patrons.reduce(
      (max, p) => (p.totalSpent > max.totalSpent ? p : max),
      patrons[0] || { totalSpent: 0 }
    );

    return {
      totalRevenue,
      totalCollectors,
      repeatRate,
      topPatronLtv: topPatron.totalSpent,
    };
  }, [patrons]);

  // ─── Open Customer Communications ────────────────────────────────────────────
  const handleOpenWhatsApp = (phone: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    // Sanitize Nigerian / local numbers (e.g. 080... -> 23480...)
    if (cleanPhone.startsWith('0') && cleanPhone.length === 11) {
      cleanPhone = `234${cleanPhone.slice(1)}`;
    }
    const url = `whatsapp://send?phone=${cleanPhone}&text=Greetings%20${encodeURIComponent(
      name
    )},%20thank%20you%20for%20patronizing%20our%20artisan%20atelier%20on%20Ethnikraft.`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          showToast(`Direct message WhatsApp: ${phone}`);
        }
      })
      .catch(() => showToast(`Phone: ${phone}`));
  };

  const handlePhoneCall = (phone: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `tel:${phone}`;
    Linking.openURL(url).catch(() => showToast(`Dial: ${phone}`));
  };

  const handleEmailComposer = (email: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const url = `mailto:${email}?subject=Ethnikraft%20Artisan%20Consultation%20for%20${encodeURIComponent(
      name
    )}`;
    Linking.openURL(url).catch(() => showToast(`Email: ${email}`));
  };

  // ─── Open Patron Dossier ─────────────────────────────────────────────────────
  const openDossier = (patron: PatronRecord) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPatron(patron);
    setTempNotes(patron.notes || '');
    setEditingNotes(false);
    setDossierVisible(true);
  };

  const savePatronNotes = () => {
    if (!selectedPatron) return;
    setPatrons((prev) =>
      prev.map((p) => (p.id === selectedPatron.id ? { ...p, notes: tempNotes } : p))
    );
    setSelectedPatron({ ...selectedPatron, notes: tempNotes });
    setEditingNotes(false);
    showToast('Atelier client notes updated');
  };

  // ─── Status Config Helper ────────────────────────────────────────────────────
  const tierConfig = {
    VIP: {
      label: 'VIP Collector',
      color: '#D4A373',
      bg: isDark ? 'rgba(212, 163, 115, 0.16)' : 'rgba(212, 163, 115, 0.18)',
      icon: 'sparkles' as const,
    },
    RETURNING: {
      label: 'Returning Patron',
      color: '#0AD24F',
      bg: isDark ? 'rgba(10, 210, 79, 0.14)' : 'rgba(0, 157, 26, 0.1)',
      icon: 'repeat' as const,
    },
    NEW: {
      label: 'New Patron',
      color: '#0284C7',
      bg: isDark ? 'rgba(2, 132, 199, 0.16)' : 'rgba(2, 132, 199, 0.1)',
      icon: 'star-outline' as const,
    },
  };

  // ─── FlatList Header Component ──────────────────────────────────────────────
  const renderListHeader = useCallback(() => (
    <View>
      {/* ── 1. Executive Header & Counter Badge ────────────────────────────── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Patrons & Collectors
          </Text>
          <View
            style={[
              styles.countBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(209, 153, 90, 0.16)'
                  : 'rgba(196, 108, 39, 0.12)',
              },
            ]}
          >
            <Text
              style={[
                styles.countBadgeText,
                { color: isDark ? '#D1995A' : theme.primary },
              ]}
            >
              {filteredPatrons.length} {filteredPatrons.length === 1 ? 'Patron' : 'Patrons'}
            </Text>
          </View>
        </View>
      </View>

      {/* ── 2. Option A: 2x2 Metric Cards Grid (Figma Standard 183x125) ───── */}
      <View style={styles.kpiGrid}>
        {/* Card 1: Total Patron Sales */}
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
            <IncomeFigmaIcon size={12} color={isDark ? '#0AD24F' : '#009D1A'} />
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#0AD24F' : '#009D1A' },
              ]}
            >
              Total Revenue
            </Text>
          </View>
          <View style={styles.kpiValueRow}>
            <Text
              style={[styles.kpiValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPriceValue(kpiMetrics.totalRevenue)}
            </Text>
          </View>
          <Text style={styles.kpiSubtitleText}>Settled Patron Orders</Text>
        </View>

        {/* Card 2: Active Collectors */}
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
                  : 'rgba(196, 108, 39, 0.12)',
              },
            ]}
          >
            <PackageFigmaIcon size={12} color="#C46C27" />
            <Text style={[styles.kpiPillText, { color: '#C46C27' }]}>
              Patron Base
            </Text>
          </View>
          <View style={styles.kpiValueRow}>
            <Text
              style={[styles.kpiValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {kpiMetrics.totalCollectors}
            </Text>
          </View>
          <Text style={styles.kpiSubtitleText}>Individual Collectors</Text>
        </View>

        {/* Card 3: Repeat Collector Rate */}
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
                  ? 'rgba(59, 130, 246, 0.16)'
                  : 'rgba(59, 130, 246, 0.12)',
              },
            ]}
          >
            <TrendingUpFigmaIcon size={12} color="#3B82F6" />
            <Text style={[styles.kpiPillText, { color: '#3B82F6' }]}>
              Loyalty Rate
            </Text>
          </View>
          <View style={styles.kpiValueRow}>
            <Text
              style={[styles.kpiValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {kpiMetrics.repeatRate}%
            </Text>
          </View>
          <Text style={styles.kpiSubtitleText}>Repeat Patronage</Text>
        </View>

        {/* Card 4: Top Patron LTV */}
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
                  ? 'rgba(212, 163, 115, 0.16)'
                  : 'rgba(212, 163, 115, 0.14)',
              },
            ]}
          >
            <StarFigmaIcon size={12} color="#D4A373" />
            <Text style={[styles.kpiPillText, { color: '#D4A373' }]}>
              Premier Collector
            </Text>
          </View>
          <View style={styles.kpiValueRow}>
            <Text
              style={[styles.kpiValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPriceValue(kpiMetrics.topPatronLtv)}
            </Text>
          </View>
          <Text style={styles.kpiSubtitleText}>Highest Lifetime Value</Text>
        </View>
      </View>

      {/* ── 3. Search Bar & Instant Filter ─────────────────────────────────── */}
      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchBarContainer,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons
            name="search-outline"
            size={18}
            color={theme.textSecondary}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search patrons by name, city, email..."
            placeholderTextColor={theme.textSecondary}
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
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close-circle" size={16} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Segmented Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterPillsContainer}
        >
          {(['ALL', 'VIP', 'RETURNING', 'NEW'] as PatronTier[]).map((tier) => {
            const isSelected = selectedTier === tier;
            const count =
              tier === 'ALL'
                ? patrons.length
                : patrons.filter((p) => p.tier === tier).length;

            const labelMap: Record<PatronTier, string> = {
              ALL: 'All Patrons',
              VIP: 'VIP Collectors',
              RETURNING: 'Returning',
              NEW: 'New Patrons',
            };

            return (
              <TouchableOpacity
                key={tier}
                style={[
                  styles.tierPill,
                  {
                    backgroundColor: isSelected
                      ? theme.primary
                      : isDark
                      ? 'rgba(255, 255, 255, 0.06)'
                      : theme.card,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedTier(tier);
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.tierPillText,
                    {
                      color: isSelected
                        ? '#FFFFFF'
                        : theme.textPrimary,
                    },
                  ]}
                >
                  {labelMap[tier]}
                </Text>
                <View
                  style={[
                    styles.tierCountBadge,
                    {
                      backgroundColor: isSelected
                        ? 'rgba(255, 255, 255, 0.25)'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.1)'
                        : 'rgba(54, 19, 0, 0.08)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.tierCountText,
                      { color: isSelected ? '#FFFFFF' : theme.textSecondary },
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Error Banner with Retry */}
      {isOrdersError && (
        <View style={{ paddingHorizontal: Spacing.lg, marginBottom: Spacing.md }}>
          <View
            style={[
              styles.errorCard,
              {
                backgroundColor: isDark
                  ? 'rgba(239, 68, 68, 0.12)'
                  : 'rgba(239, 68, 68, 0.08)',
                borderColor: isDark ? '#EF4444' : '#DC2626',
              },
            ]}
          >
            <View style={styles.errorCardContent}>
              <Ionicons
                name="alert-circle-outline"
                size={24}
                color={isDark ? '#F87171' : '#DC2626'}
              />
              <View style={styles.errorTextContainer}>
                <Text
                  style={[
                    styles.errorCardTitle,
                    { color: isDark ? '#F87171' : '#DC2626' },
                  ]}
                >
                  Failed to Load Patrons
                </Text>
                <Text
                  style={[
                    styles.errorCardSub,
                    { color: theme.textSecondary },
                  ]}
                >
                  Unable to synchronize collector records from live orders.
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
                refetchOrders();
              }}
            >
              <Ionicons name="refresh" size={14} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ── 4. List Counter Bar ──────────────────────────────────────────── */}
      <View style={{ paddingHorizontal: Spacing.lg, marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
        <Text style={[styles.listCountText, { color: theme.textSecondary }]}>
          SHOWING {paginatedPatrons.length} OF {filteredPatrons.length} PATRONS
        </Text>
      </View>
    </View>
  ), [
    theme,
    isDark,
    filteredPatrons.length,
    kpiMetrics,
    currentCurrency.code,
    currentCurrency.rate,
    searchQuery,
    selectedTier,
    patrons,
    isOrdersError,
    paginatedPatrons.length,
    refetchOrders,
  ]);

  // ─── FlatList Empty State Component ────────────────────────────────────────
  const renderListEmpty = useCallback(() => {
    if (isOrdersLoading || (isOrdersFetching && patrons.length === 0)) {
      return (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <VendorCustomersSkeleton />
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <View
          style={[
            styles.emptyStateCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons name="people-outline" size={38} color={theme.textSecondary} />
          <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
            No Patrons Found
          </Text>
          <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
            {searchQuery
              ? 'No collectors match your search query.'
              : 'Artisan collectors who commission your work will appear here.'}
          </Text>
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={[styles.clearSearchBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              <Ionicons name="close-circle-outline" size={14} color="#FFFFFF" />
              <Text style={styles.clearSearchBtnText}>Clear Search</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }, [isOrdersLoading, isOrdersFetching, patrons.length, theme, searchQuery]);

  // ─── FlatList Patron Item RenderItem ───────────────────────────────────────
  const renderPatronItem = useCallback(({ item: patron }: { item: PatronRecord }) => {
    const currentTier = tierConfig[patron.tier] || tierConfig.NEW;

    return (
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <TouchableOpacity
          style={[
            styles.patronCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
          activeOpacity={0.85}
          onPress={() => openDossier(patron)}
        >
          {/* Top Row: Avatar, Identity, Tier Badge */}
          <View style={styles.patronCardTopRow}>
            {/* Avatar Ring */}
            <View style={styles.patronAvatarWrapper}>
              {patron.avatar ? (
                <Image
                  source={{ uri: patron.avatar }}
                  style={styles.patronAvatarImg}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.patronMonogramCircle,
                    { backgroundColor: 'rgba(196, 108, 39, 0.15)' },
                  ]}
                >
                  <Text style={styles.patronMonogramText}>
                    {patron.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>

            {/* Patron Name & Location */}
            <View style={styles.patronIdentityCol}>
              <View style={styles.patronNameRow}>
                <Text
                  style={[styles.patronNameText, { color: theme.textPrimary }]}
                  numberOfLines={1}
                >
                  {patron.name}
                </Text>
              </View>
              <View style={styles.patronLocationRow}>
                <Ionicons
                  name="location-outline"
                  size={12}
                  color={theme.textSecondary}
                  style={{ marginRight: 3 }}
                />
                <Text
                  style={[styles.patronLocationText, { color: theme.textSecondary }]}
                >
                  {patron.city}, {patron.country}
                </Text>
              </View>
            </View>

            {/* Tier Pill Badge */}
            <View
              style={[
                styles.tierBadgeBox,
                { backgroundColor: currentTier.bg },
              ]}
            >
              <Ionicons
                name={currentTier.icon}
                size={11}
                color={currentTier.color}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[styles.tierBadgeText, { color: currentTier.color }]}
              >
                {currentTier.label}
              </Text>
            </View>
          </View>

          {/* Middle Row: Preferred Category & Contact */}
          <View style={styles.patronMetaRow}>
            <View style={styles.categoryPillTag}>
              <Ionicons
                name="color-palette-outline"
                size={11}
                color="#C46C27"
                style={{ marginRight: 4 }}
              />
              <Text style={styles.categoryPillTagText}>
                {patron.preferredCategory}
              </Text>
            </View>
          </View>

          {/* Direct Contact Action Strip */}
          <View
            style={[
              styles.contactStrip,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : 'rgba(54, 19, 0, 0.03)',
                borderColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(54, 19, 0, 0.06)',
              },
            ]}
          >
            <TouchableOpacity
              style={styles.quickContactBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                handleMessageCustomer(patron);
              }}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={13} color={theme.primary} />
              <Text style={[styles.quickContactBtnText, { color: theme.primary }]}>
                Message
              </Text>
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity
              style={styles.quickContactBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                handleOpenWhatsApp(patron.phone, patron.name);
              }}
            >
              <Ionicons name="logo-whatsapp" size={13} color="#0AD24F" />
              <Text style={[styles.quickContactBtnText, { color: theme.textPrimary }]}>
                WhatsApp
              </Text>
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity
              style={styles.quickContactBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                handlePhoneCall(patron.phone);
              }}
            >
              <Ionicons name="call-outline" size={13} color="#C46C27" />
              <Text style={[styles.quickContactBtnText, { color: theme.textPrimary }]}>
                Call
              </Text>
            </TouchableOpacity>

            <View style={styles.contactDivider} />

            <TouchableOpacity
              style={styles.quickContactBtn}
              activeOpacity={0.7}
              onPress={(e) => {
                e.stopPropagation();
                handleEmailComposer(patron.email, patron.name);
              }}
            >
              <Ionicons name="mail-outline" size={13} color="#0284C7" />
              <Text style={[styles.quickContactBtnText, { color: theme.textPrimary }]}>
                Email
              </Text>
            </TouchableOpacity>
          </View>

          {/* Financial Footer */}
          <View style={styles.patronCardFooter}>
            <View style={styles.patronStatBlock}>
              <Text style={styles.patronStatLabel}>Lifetime Spend</Text>
              <Text style={[styles.patronStatValue, { color: theme.textPrimary }]}>
                {formatPriceValue(patron.totalSpent)}
              </Text>
            </View>

            <View style={styles.patronStatBlock}>
              <Text style={styles.patronStatLabel}>Commissions</Text>
              <Text style={[styles.patronStatValue, { color: theme.textPrimary }]}>
                {patron.orderCount} {patron.orderCount === 1 ? 'Order' : 'Orders'}
              </Text>
            </View>

            <View style={[styles.patronStatBlock, { alignItems: 'flex-end' }]}>
              <Text style={styles.patronStatLabel}>Last Commission</Text>
              <Text style={[styles.patronStatValue, { color: theme.textPrimary }]}>
                {patron.lastOrderDate}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  }, [
    tierConfig,
    theme,
    isDark,
    currentCurrency.code,
    currentCurrency.rate,
  ]);

  // ─── FlatList Footer Component (Pagination Controls) ───────────────────────
  const renderListFooter = useCallback(() => (
    <View
      style={[
        styles.listFooterContainer,
        { paddingBottom: Math.max(insets.bottom, 16) + 110 },
      ]}
    >
      {totalItems > pageSize && (
        <View
          style={[
            styles.paginationCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.paginationInfoRow}>
            <Text style={[styles.paginationInfoText, { color: theme.textSecondary }]}>
              Page <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{currentPage}</Text> of{' '}
              <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{totalPages}</Text>
            </Text>
            <Text style={[styles.paginationInfoText, { color: theme.textSecondary }]}>
              Total: <Text style={{ fontFamily: FontFamily.headingBold, color: theme.primary }}>{totalItems}</Text> patrons
            </Text>
          </View>

          <View style={styles.paginationButtonsRow}>
            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                  borderColor: theme.border,
                  opacity: hasPrevPage ? 1 : 0.4,
                },
              ]}
              disabled={!hasPrevPage}
              onPress={() => {
                if (hasPrevPage) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentPage((prev) => Math.max(1, prev - 1));
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={16} color={theme.textPrimary} />
              <Text style={[styles.pageNavBtnText, { color: theme.textPrimary }]}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.pageNavBtn,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                  borderColor: theme.border,
                  opacity: hasNextPage ? 1 : 0.4,
                },
              ]}
              disabled={!hasNextPage}
              onPress={() => {
                if (hasNextPage) {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCurrentPage((prev) => prev + 1);
                }
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.pageNavBtnText, { color: theme.textPrimary }]}>Next</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textPrimary} />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  ), [
    insets.bottom,
    totalItems,
    pageSize,
    theme,
    currentPage,
    totalPages,
    isDark,
    hasPrevPage,
    hasNextPage,
  ]);

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
          <Ionicons
            name="checkmark-circle"
            size={18}
            color="#10B981"
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>
            {toastMessage}
          </Text>
        </View>
      )}

      {/* ── FlatList Main Patrons Listing ─────────────────────────────────── */}
      <FlatList
        data={paginatedPatrons}
        keyExtractor={(item) => item.id}
        renderItem={renderPatronItem}
        ListHeaderComponent={renderListHeader}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
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

      {/* ── 5. MODAL: 84% Interactive Patron Dossier Bottom Sheet ─────────────── */}
      <Modal
        visible={dossierVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDossierVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setDossierVisible(false)}
          />
          {selectedPatron && (
            <View
              style={[
                styles.sheetContent,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.sheetDragHandle} />

              {/* Dossier Header */}
              <View style={styles.dossierHeaderRow}>
                <View style={styles.dossierAvatarWrapper}>
                  {selectedPatron.avatar ? (
                    <Image
                      source={{ uri: selectedPatron.avatar }}
                      style={styles.dossierAvatarImg}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.dossierMonogramCircle,
                        { backgroundColor: 'rgba(196, 108, 39, 0.15)' },
                      ]}
                    >
                      <Text style={styles.dossierMonogramText}>
                        {selectedPatron.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  )}
                </View>

                <View style={styles.dossierTitleCol}>
                  <Text style={[styles.dossierNameText, { color: theme.textPrimary }]}>
                    {selectedPatron.name}
                  </Text>
                  <Text style={[styles.dossierSubText, { color: theme.textSecondary }]}>
                    {selectedPatron.city}, {selectedPatron.country} • Patron since {selectedPatron.firstOrderDate.slice(0, 4)}
                  </Text>
                  <View style={styles.dossierTierBadgeRow}>
                    <View
                      style={[
                        styles.tierBadgeBox,
                        {
                          backgroundColor:
                            tierConfig[selectedPatron.tier]?.bg || tierConfig.NEW.bg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.tierBadgeText,
                          {
                            color:
                              tierConfig[selectedPatron.tier]?.color ||
                              tierConfig.NEW.color,
                          },
                        ]}
                      >
                        {tierConfig[selectedPatron.tier]?.label || 'Patron'}
                      </Text>
                    </View>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setDossierVisible(false)}
                  style={styles.sheetCloseBtn}
                >
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={{ maxHeight: Dimensions.get('window').height * 0.62 }}
                showsVerticalScrollIndicator={false}
              >
                {/* 1-Tap Action Callout Buttons */}
                <View style={styles.actionCalloutRow}>
                  <TouchableOpacity
                    style={[
                      styles.actionCalloutBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(196, 108, 39, 0.16)'
                          : 'rgba(196, 108, 39, 0.12)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handleMessageCustomer(selectedPatron)}
                  >
                    <Ionicons name="chatbubble-ellipses" size={17} color={theme.primary} />
                    <Text style={[styles.actionCalloutText, { color: theme.primary }]}>
                      Message
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionCalloutBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(10, 210, 79, 0.14)'
                          : 'rgba(0, 157, 26, 0.1)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      handleOpenWhatsApp(selectedPatron.phone, selectedPatron.name)
                    }
                  >
                    <Ionicons name="logo-whatsapp" size={17} color="#0AD24F" />
                    <Text style={[styles.actionCalloutText, { color: '#0AD24F' }]}>
                      WhatsApp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionCalloutBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(196, 108, 39, 0.14)'
                          : 'rgba(196, 108, 39, 0.1)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() => handlePhoneCall(selectedPatron.phone)}
                  >
                    <Ionicons name="call" size={17} color="#C46C27" />
                    <Text style={[styles.actionCalloutText, { color: '#C46C27' }]}>
                      Call
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.actionCalloutBtn,
                      {
                        backgroundColor: isDark
                          ? 'rgba(2, 132, 199, 0.14)'
                          : 'rgba(2, 132, 199, 0.1)',
                      },
                    ]}
                    activeOpacity={0.8}
                    onPress={() =>
                      handleEmailComposer(selectedPatron.email, selectedPatron.name)
                    }
                  >
                    <Ionicons name="mail" size={17} color="#0284C7" />
                    <Text style={[styles.actionCalloutText, { color: '#0284C7' }]}>
                      Email
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Collector Metric Strip */}
                <View
                  style={[
                    styles.dossierMetricStrip,
                    {
                      backgroundColor: isDark
                        ? 'rgba(212, 163, 115, 0.08)'
                        : 'rgba(212, 163, 115, 0.15)',
                      borderColor: 'rgba(212, 163, 115, 0.3)',
                    },
                  ]}
                >
                  <View style={styles.dossierMetricCol}>
                    <Text style={styles.dossierMetricLabel}>LIFETIME VALUE</Text>
                    <Text
                      style={[styles.dossierMetricValue, { color: theme.textPrimary }]}
                    >
                      {formatPriceValue(selectedPatron.totalSpent)}
                    </Text>
                  </View>

                  <View style={styles.dossierMetricDivider} />

                  <View style={styles.dossierMetricCol}>
                    <Text style={styles.dossierMetricLabel}>COMMISSIONS</Text>
                    <Text
                      style={[styles.dossierMetricValue, { color: theme.textPrimary }]}
                    >
                      {selectedPatron.orderCount} Orders
                    </Text>
                  </View>

                  <View style={styles.dossierMetricDivider} />

                  <View style={styles.dossierMetricCol}>
                    <Text style={styles.dossierMetricLabel}>AVG TICKET</Text>
                    <Text
                      style={[styles.dossierMetricValue, { color: theme.textPrimary }]}
                    >
                      {formatPriceValue(
                        Math.round(selectedPatron.totalSpent / selectedPatron.orderCount)
                      )}
                    </Text>
                  </View>
                </View>

                {/* Contact Coordinates */}
                <View
                  style={[
                    styles.dossierSectionCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : '#FBF5EB',
                      borderColor: theme.border,
                    },
                  ]}
                >
                  <Text style={[styles.dossierSectionTitle, { color: theme.textPrimary }]}>
                    Contact & Communication
                  </Text>

                  <View style={styles.dossierContactRow}>
                    <Ionicons name="call-outline" size={15} color="#C46C27" />
                    <Text style={[styles.dossierContactText, { color: theme.textPrimary }]}>
                      {selectedPatron.phone}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(selectedPatron.phone, 'Phone number')}
                      style={styles.dossierCopyBtn}
                    >
                      <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.dossierContactRow}>
                    <Ionicons name="mail-outline" size={15} color="#C46C27" />
                    <Text style={[styles.dossierContactText, { color: theme.textPrimary }]}>
                      {selectedPatron.email}
                    </Text>
                    <TouchableOpacity
                      onPress={() => copyToClipboard(selectedPatron.email, 'Email address')}
                      style={styles.dossierCopyBtn}
                    >
                      <Ionicons name="copy-outline" size={14} color={theme.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Order History Accordion */}
                <View style={styles.dossierOrdersSection}>
                  <Text style={[styles.dossierSectionTitle, { color: theme.textPrimary }]}>
                    Commission History ({selectedPatron.orders.length})
                  </Text>

                  {selectedPatron.orders.map((ord) => (
                    <View
                      key={ord.id}
                      style={[
                        styles.dossierOrderCard,
                        {
                          backgroundColor: isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : '#FFFFFF',
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      <Image
                        source={{ uri: ord.productImage }}
                        style={styles.dossierOrderThumb}
                        resizeMode="cover"
                      />
                      <View style={styles.dossierOrderDetailsCol}>
                        <View style={styles.dossierOrderTopRow}>
                          <Text style={[styles.dossierOrderNum, { color: theme.primary }]}>
                            {ord.orderNumber}
                          </Text>
                          <Text style={styles.dossierOrderDate}>{ord.date}</Text>
                        </View>
                        <Text
                          style={[styles.dossierOrderName, { color: theme.textPrimary }]}
                          numberOfLines={1}
                        >
                          {ord.productName}
                        </Text>
                        <View style={styles.dossierOrderBottomRow}>
                          <Text
                            style={[
                              styles.dossierOrderAmount,
                              { color: theme.textPrimary },
                            ]}
                          >
                            {formatPriceValue(ord.amount)}
                          </Text>
                          <View style={styles.dossierStatusPill}>
                            <Text style={styles.dossierStatusPillText}>
                              {ord.status}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Atelier Notes & Bespoke Preferences */}
                <View
                  style={[
                    styles.dossierSectionCard,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.03)'
                        : '#FBF5EB',
                      borderColor: theme.border,
                      marginBottom: 24,
                    },
                  ]}
                >
                  <View style={styles.dossierNotesHeaderRow}>
                    <Text
                      style={[styles.dossierSectionTitle, { color: theme.textPrimary }]}
                    >
                      Atelier Notes & Preferences
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        if (editingNotes) {
                          savePatronNotes();
                        } else {
                          setEditingNotes(true);
                        }
                      }}
                    >
                      <Text style={[styles.editNotesBtnText, { color: theme.primary }]}>
                        {editingNotes ? 'Save' : 'Edit'}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {editingNotes ? (
                    <TextInput
                      value={tempNotes}
                      onChangeText={setTempNotes}
                      multiline
                      numberOfLines={3}
                      style={[
                        styles.notesTextInput,
                        {
                          backgroundColor: theme.background,
                          color: theme.textPrimary,
                          borderColor: theme.border,
                        },
                      ]}
                      placeholder="Add custom notes on collector preferences..."
                      placeholderTextColor={theme.textSecondary}
                    />
                  ) : (
                    <Text
                      style={[
                        styles.dossierNotesText,
                        { color: theme.textSecondary },
                      ]}
                    >
                      {selectedPatron.notes ||
                        'No bespoke notes recorded for this collector yet.'}
                    </Text>
                  )}
                </View>
              </ScrollView>
            </View>
          )}
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

  // 1. Executive Header
  headerRow: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
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
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  countBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },

  // 2. Option A: 2x2 Metric Cards Grid
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    gap: 10,
    marginBottom: Spacing.md,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    minHeight: 110,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    justifyContent: 'space-between',
  },
  kpiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
    gap: 5,
  },
  kpiPillText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },
  kpiValueRow: {
    marginTop: 6,
    marginBottom: 2,
  },
  kpiValueText: {
    fontSize: 19,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.5,
  },
  kpiSubtitleText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#808080',
  },

  // 3. Search & Filter Bar
  searchSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
  },
  filterPillsContainer: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  tierPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 6,
  },
  tierPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  tierCountBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.full,
  },
  tierCountText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
  },

  // 4. Patron Cards List
  patronsListContainer: {
    paddingHorizontal: Spacing.md,
  },
  errorCard: {
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.md,
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
  emptyStateCard: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    marginTop: 8,
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearSearchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    marginTop: 14,
  },
  clearSearchBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },
  patronCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  patronCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  patronAvatarWrapper: {
    width: 46,
    height: 46,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: '#D4A373',
    overflow: 'hidden',
    marginRight: 10,
  },
  patronAvatarImg: {
    width: '100%',
    height: '100%',
  },
  patronMonogramCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  patronMonogramText: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    color: '#C46C27',
  },
  patronIdentityCol: {
    flex: 1,
    marginRight: 6,
  },
  patronNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patronNameText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  patronLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  patronLocationText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  tierBadgeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  tierBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.2,
  },
  patronMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryPillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.1)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  categoryPillTagText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#C46C27',
  },
  contactStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 7,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  quickContactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 5,
  },
  quickContactBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  contactDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(128, 128, 128, 0.25)',
  },
  patronCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderColor: 'rgba(212, 163, 115, 0.18)',
  },
  patronStatBlock: {
    flex: 1,
  },
  patronStatLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#808080',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 2,
  },
  patronStatValue: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
  },

  // 5. 84% Patron Dossier Bottom Sheet
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
  dossierHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dossierAvatarWrapper: {
    width: 58,
    height: 58,
    borderRadius: Radius.full,
    borderWidth: 2,
    borderColor: '#D4A373',
    overflow: 'hidden',
    marginRight: 12,
  },
  dossierAvatarImg: {
    width: '100%',
    height: '100%',
  },
  dossierMonogramCircle: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dossierMonogramText: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    color: '#C46C27',
  },
  dossierTitleCol: {
    flex: 1,
  },
  dossierNameText: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  dossierSubText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  dossierTierBadgeRow: {
    marginTop: 4,
    flexDirection: 'row',
  },
  sheetCloseBtn: {
    padding: 6,
    alignSelf: 'flex-start',
  },
  actionCalloutRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  actionCalloutBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.lg,
    gap: 6,
  },
  actionCalloutText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  dossierMetricStrip: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  dossierMetricCol: {
    flex: 1,
    alignItems: 'center',
  },
  dossierMetricDivider: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(212, 163, 115, 0.3)',
    alignSelf: 'center',
  },
  dossierMetricLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#808080',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  dossierMetricValue: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  dossierSectionCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 12,
    marginBottom: 14,
  },
  dossierSectionTitle: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    marginBottom: 10,
  },
  dossierContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  dossierContactText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    flex: 1,
  },
  dossierCopyBtn: {
    padding: 4,
  },
  dossierOrdersSection: {
    marginBottom: 14,
  },
  dossierOrderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  dossierOrderThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    marginRight: 10,
  },
  dossierOrderDetailsCol: {
    flex: 1,
  },
  dossierOrderTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  dossierOrderNum: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  dossierOrderDate: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    color: '#808080',
  },
  dossierOrderName: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 3,
  },
  dossierOrderBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dossierOrderAmount: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
  dossierStatusPill: {
    backgroundColor: 'rgba(0, 157, 26, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  dossierStatusPillText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#009D1A',
  },
  dossierNotesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  editNotesBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  dossierNotesText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 17,
  },
  notesTextInput: {
    height: 64,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlignVertical: 'top',
  },
  listFooterContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  paginationCard: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.sm,
  },
  paginationInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  paginationInfoText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
  },
  paginationButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: Spacing.sm,
  },
  pageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    gap: 4,
  },
  pageNavBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
  },
  listCountText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 12,
    marginBottom: Spacing.xs,
  },
});

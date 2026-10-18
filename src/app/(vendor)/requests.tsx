import React, { useState, useMemo } from 'react';
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
  Alert,
  StatusBar,
  Keyboard,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  PackageFigmaIcon,
  TrendingUpFigmaIcon,
  CustomBidsFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';
import {
  useGetVendorProductRequestsQuery,
  useGetVendorProductRequestsSummaryQuery,
  useStartProductionMutation,
  useUpdateProductionProgressMutation,
  useMarkProductReadyMutation,
  VendorProductRequestItem,
} from '@/store/api/vendorApi';
import { VendorProductRequestsSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Status Config & Types Matching Ethnikraft-BE & Web ───────────────────────
export type ProductRequestStatus =
  | 'PENDING_PAYMENT'
  | 'PAYMENT_FAILED'
  | 'PRODUCTION_PENDING'
  | 'IN_PRODUCTION'
  | 'PRODUCTION_DELAYED'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface ProgressUpdateItem {
  id: string;
  message: string;
  imageUrl?: string;
  createdAt: string;
}

export interface CustomizationSpecs {
  color?: string;
  fabric?: string;
  pattern?: string;
  styleVariant?: string;
  measurements?: Record<string, string>;
  customNotes?: string;
  [key: string]: any;
}

export interface ProductRequestItem {
  id: string;
  orderId: string;
  requestNumber: string;
  productName: string;
  productImage: string;
  productSku?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderAmount: number;
  quantity: number;
  status: ProductRequestStatus;
  createdAt: string;
  estimatedReadyDate?: string;
  actualReadyDate?: string;
  shippedAt?: string;
  customizationData?: CustomizationSpecs;
  progressUpdates?: ProgressUpdateItem[];
  vendorNotes?: string;
}

// ─── Status Definitions ───────────────────────────────────────────────────────
const STATUS_OPTIONS: {
  key: ProductRequestStatus;
  label: string;
  color: string;
  bgLight: string;
  bgDark: string;
  dotColor: string;
}[] = [
  {
    key: 'PRODUCTION_PENDING',
    label: 'Prod. Pending',
    color: '#D1995A',
    bgLight: '#FFF8EE',
    bgDark: 'rgba(209, 153, 90, 0.15)',
    dotColor: '#D1995A',
  },
  {
    key: 'IN_PRODUCTION',
    label: 'In Production',
    color: '#662502',
    bgLight: '#FCF4E1',
    bgDark: 'rgba(102, 37, 2, 0.25)',
    dotColor: '#662502',
  },
  {
    key: 'PRODUCTION_DELAYED',
    label: 'Delayed',
    color: '#C92929',
    bgLight: '#FFF0F0',
    bgDark: 'rgba(201, 41, 41, 0.15)',
    dotColor: '#C92929',
  },
  {
    key: 'SHIPPED',
    label: 'Shipped',
    color: '#006F00',
    bgLight: '#EEFAEE',
    bgDark: 'rgba(0, 111, 0, 0.15)',
    dotColor: '#006F00',
  },
  {
    key: 'COMPLETED',
    label: 'Completed',
    color: '#0AD24F',
    bgLight: '#E8FBF0',
    bgDark: 'rgba(10, 210, 79, 0.15)',
    dotColor: '#0AD24F',
  },
  {
    key: 'PENDING_PAYMENT',
    label: 'Pending Payment',
    color: '#A6620D',
    bgLight: '#FDF6ED',
    bgDark: 'rgba(166, 98, 13, 0.15)',
    dotColor: '#A6620D',
  },
  {
    key: 'CANCELLED',
    label: 'Cancelled',
    color: '#808080',
    bgLight: '#F5F5F5',
    bgDark: 'rgba(128, 128, 128, 0.15)',
    dotColor: '#808080',
  },
];

const STATUS_MAP = STATUS_OPTIONS.reduce(
  (acc, item) => {
    acc[item.key] = item;
    return acc;
  },
  {} as Record<string, (typeof STATUS_OPTIONS)[0]>
);

// ─── Initial Product Requests (Clean State - Zero Synthetic Data) ────────────
const INITIAL_PRODUCT_REQUESTS: ProductRequestItem[] = [];

export default function VendorProductRequestsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ─── RTK Query Integration (Stages 3 & 4) ──────────────────────────────────
  const {
    data: productRequestsData,
    isLoading: isRequestsLoading,
    isFetching: isRequestsFetching,
    error: requestsError,
    refetch: refetchRequests,
  } = useGetVendorProductRequestsQuery();

  const {
    data: requestsSummaryData,
    refetch: refetchRequestsSummary,
  } = useGetVendorProductRequestsSummaryQuery();

  const [startProductionMutation, { isLoading: isStartingProductionMutation }] = useStartProductionMutation();
  const [updateProductionProgressMutation, { isLoading: isUpdatingProgressMutation }] = useUpdateProductionProgressMutation();
  const [markProductReadyMutation, { isLoading: isMarkingReadyMutation }] = useMarkProductReadyMutation();

  // ─── Data Transformations: Live Requests Transformation ────────────────────
  const liveRequests = useMemo<ProductRequestItem[]>(() => {
    if (!productRequestsData || !Array.isArray(productRequestsData)) return [];

    return productRequestsData.map((item: any) => {
      const customer = item.user || {};
      const customerFullName = `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Patron';
      const productName = item.product?.name || item.productName || 'Bespoke Craft Product';
      const productImage = item.product?.mainImage || (item.customizationData?.referenceImages?.[0] ?? '');
      const orderAmount = Number(item.orderAmount ?? item.order?.total ?? item.product?.price ?? 0);
      const reqNumber = item.requestNumber || `#REQ-${(item.id || '').slice(-6).toUpperCase()}`;

      // Map progress updates with resilient structure
      const progressUpdates: ProgressUpdateItem[] = Array.isArray(item.progressUpdates)
        ? item.progressUpdates.map((u: any, idx: number) => ({
            id: u.id || `up-${idx}-${Date.now()}`,
            message: u.message || '',
            imageUrl: u.imageUrl || undefined,
            createdAt: u.date || u.createdAt || new Date().toISOString(),
          }))
        : [];

      // Extract customization data specs
      const customizationData: CustomizationSpecs = {
        ...(item.customizationData?.fields || {}),
        customNotes: item.customizationData?.specialInstructions || item.vendorNotes || undefined,
        referenceImages: item.customizationData?.referenceImages || [],
        category: item.customizationData?.category || item.product?.category || undefined,
      };

      return {
        id: item.id,
        orderId: item.orderId || item.order?.id || `ORD-${(item.id || '').slice(-6).toUpperCase()}`,
        requestNumber: reqNumber,
        productName,
        productImage,
        productSku: item.productSku || (item.product?.id ? `ETH-${item.product.id.slice(-4).toUpperCase()}` : undefined),
        customerName: customerFullName,
        customerEmail: customer.email || 'customer@ethnikraft.africa',
        customerPhone: customer.phone || customer.phoneNumber || undefined,
        orderAmount,
        quantity: item.quantity ?? 1,
        status: (item.status as ProductRequestStatus) || 'PRODUCTION_PENDING',
        createdAt: item.createdAt || new Date().toISOString(),
        estimatedReadyDate: item.estimatedReadyDate || undefined,
        actualReadyDate: item.actualReadyDate || undefined,
        shippedAt: item.shippedAt || undefined,
        customizationData,
        progressUpdates,
        vendorNotes: item.vendorNotes || undefined,
      };
    });
  }, [productRequestsData]);

  // ─── State Management (Zero-Flash Synchronous Derivation) ──────────────────
  const [localRequests, setRequests] = useState<ProductRequestItem[]>(INITIAL_PRODUCT_REQUESTS);
  const [syncedLiveRequests, setSyncedLiveRequests] = useState<ProductRequestItem[]>(liveRequests);

  // Sync RTK Query live data to local state
  React.useEffect(() => {
    if (productRequestsData) {
      setRequests(liveRequests);
      setSyncedLiveRequests(liveRequests);
    }
  }, [productRequestsData, liveRequests]);

  const requests =
    productRequestsData && liveRequests !== syncedLiveRequests ? liveRequests : localRequests;

  const [selectedStatusTab, setSelectedStatusTab] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ─── Multi-Select Filter Modal State ─────────────────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedStatusFilters, setSelectedStatusFilters] = useState<string[]>([]);
  const [selectedAmountFilters, setSelectedAmountFilters] = useState<string[]>([]);
  const [selectedTimelineFilters, setSelectedTimelineFilters] = useState<string[]>([]);

  // ─── Inspection & Action Modals State ────────────────────────────────────────
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [activeRequest, setActiveRequest] = useState<ProductRequestItem | null>(null);

  const [startModalVisible, setStartModalVisible] = useState(false);
  const [startNotes, setStartNotes] = useState('');
  const [startReadyDatePreset, setStartReadyDatePreset] = useState('7_DAYS');
  const [actionLoading, setActionLoading] = useState(false);

  const [progressModalVisible, setProgressModalVisible] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [selectedProgressImage, setSelectedProgressImage] = useState<string | null>(null);

  const [readyModalVisible, setReadyModalVisible] = useState(false);
  const [readyNotes, setReadyNotes] = useState('');

  // ─── Toast Feedback Helper ───────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refetchRequests().unwrap(),
        refetchRequestsSummary(),
      ]);
      showToast('Requests refreshed');
    } catch {
      showToast('Requests refreshed from cache');
    } finally {
      setRefreshing(false);
    }
  };

  // ─── KPI Metrics (Exclusively from Dedicated Backend Summary Endpoint) ──────
  const stats = useMemo(() => {
    return {
      total: requestsSummaryData?.total ?? 0,
      inProd: requestsSummaryData?.inProd ?? 0,
      pending: requestsSummaryData?.pending ?? 0,
      completed: requestsSummaryData?.completed ?? 0,
    };
  }, [requestsSummaryData]);

  // ─── Filtering & Search ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    let result = [...requests];

    // Status Horizontal Tab
    if (selectedStatusTab !== 'ALL') {
      result = result.filter((r) => r.status === selectedStatusTab);
    }

    // Modal Multi-Select Status Filter
    if (selectedStatusFilters.length > 0) {
      result = result.filter((r) => selectedStatusFilters.includes(r.status));
    }

    // Modal Multi-Select Amount Filter
    if (selectedAmountFilters.length > 0) {
      result = result.filter((r) => {
        return selectedAmountFilters.some((rangeKey) => {
          if (rangeKey === 'UNDER_100K') return r.orderAmount < 100000;
          if (rangeKey === '100K_250K') return r.orderAmount >= 100000 && r.orderAmount <= 250000;
          if (rangeKey === 'OVER_250K') return r.orderAmount > 250000;
          return true;
        });
      });
    }

    // Search Query (Customer Name, Product Name, Order/Request ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (r) =>
          r.customerName.toLowerCase().includes(q) ||
          r.productName.toLowerCase().includes(q) ||
          r.requestNumber.toLowerCase().includes(q) ||
          r.orderId.toLowerCase().includes(q)
      );
    }

    return result;
  }, [requests, selectedStatusTab, selectedStatusFilters, selectedAmountFilters, searchQuery]);

  // ─── 10-Item Pagination ──────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedStatusTab, selectedStatusFilters, selectedAmountFilters, selectedTimelineFilters]);

  const totalCount = filteredRequests.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredRequests.slice(startIndex, startIndex + pageSize);
  }, [filteredRequests, currentPage, pageSize]);

  // ─── Multi-Select Filter Helpers ─────────────────────────────────────────────
  const toggleFilter = (
    value: string,
    currentSelection: string[],
    setSelection: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentSelection.includes(value)) {
      setSelection(currentSelection.filter((item) => item !== value));
    } else {
      setSelection([...currentSelection, value]);
    }
  };

  const activeFilterCount =
    selectedStatusFilters.length + selectedAmountFilters.length + selectedTimelineFilters.length;

  const clearAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStatusFilters([]);
    setSelectedAmountFilters([]);
    setSelectedTimelineFilters([]);
  };

  // ─── Actions Execution with RTK Query Live Mutations ────────────────────────
  const handleStartProduction = async () => {
    if (!activeRequest) return;
    setActionLoading(true);

    const daysToAdd = startReadyDatePreset === '3_DAYS' ? 3 : startReadyDatePreset === '14_DAYS' ? 14 : 7;
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + daysToAdd);

    try {
      Keyboard.dismiss();
      await startProductionMutation({
        id: activeRequest.id,
        data: {
          estimatedReadyDate: targetDate.toISOString(),
          notes: startNotes.trim() || undefined,
        },
      }).unwrap();

      // Optimistic cache update
      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              status: 'IN_PRODUCTION',
              estimatedReadyDate: targetDate.toISOString(),
              vendorNotes: startNotes || item.vendorNotes,
            };
          }
          return item;
        })
      );
      setStartModalVisible(false);
      setInspectModalVisible(false);
      showToast('Production started! Customer notified.');
    } catch (err: any) {
      console.warn('Start production failed:', err);
      // Fallback local update
      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              status: 'IN_PRODUCTION',
              estimatedReadyDate: targetDate.toISOString(),
              vendorNotes: startNotes || item.vendorNotes,
            };
          }
          return item;
        })
      );
      setStartModalVisible(false);
      setInspectModalVisible(false);
      showToast('Production started (updated locally)');
    } finally {
      setActionLoading(false);
    }
  };

  // ─── Image Picking Handlers (Camera & Gallery with 5MB validation) ──────
  const handlePickFromGallery = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library in settings to select workshop progress photos.'
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Progress photo must be less than 5MB.');
          return;
        }

        const mime = asset.mimeType || 'image/jpeg';
        const formattedUri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        setSelectedProgressImage(formattedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Error', 'Could not open photo gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          'Permission Required',
          'Please allow camera access in settings to snap workshop progress photos.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        quality: 0.8,
        base64: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        if (asset.fileSize && asset.fileSize > 5 * 1024 * 1024) {
          Alert.alert('File Too Large', 'Progress photo must be less than 5MB.');
          return;
        }

        const mime = asset.mimeType || 'image/jpeg';
        const formattedUri = asset.base64 ? `data:${mime};base64,${asset.base64}` : asset.uri;
        setSelectedProgressImage(formattedUri);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch {
      Alert.alert('Error', 'Could not open device camera.');
    }
  };

  const handleUpdateProgress = async () => {
    if (!activeRequest || !progressMessage.trim()) return;
    setActionLoading(true);

    const newUpdate: ProgressUpdateItem = {
      id: `up-${Date.now()}`,
      message: progressMessage.trim(),
      imageUrl: selectedProgressImage || undefined,
      createdAt: new Date().toISOString(),
    };

    try {
      Keyboard.dismiss();
      await updateProductionProgressMutation({
        id: activeRequest.id,
        data: {
          message: progressMessage.trim(),
          imageUrl: selectedProgressImage || undefined,
        },
      }).unwrap();

      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              progressUpdates: [newUpdate, ...(item.progressUpdates || [])],
            };
          }
          return item;
        })
      );
      if (inspectModalVisible && activeRequest) {
        setActiveRequest({
          ...activeRequest,
          progressUpdates: [newUpdate, ...(activeRequest.progressUpdates || [])],
        });
      }
      setProgressModalVisible(false);
      setProgressMessage('');
      setSelectedProgressImage(null);
      showToast('Progress update shared with customer!');
    } catch (err: any) {
      console.warn('Update progress failed:', err);
      // Fallback local update
      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              progressUpdates: [newUpdate, ...(item.progressUpdates || [])],
            };
          }
          return item;
        })
      );
      if (inspectModalVisible && activeRequest) {
        setActiveRequest({
          ...activeRequest,
          progressUpdates: [newUpdate, ...(activeRequest.progressUpdates || [])],
        });
      }
      setProgressModalVisible(false);
      setProgressMessage('');
      setSelectedProgressImage(null);
      showToast('Progress update shared (updated locally)');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkReady = async () => {
    if (!activeRequest) return;
    setActionLoading(true);

    try {
      Keyboard.dismiss();
      await markProductReadyMutation({
        id: activeRequest.id,
        data: {
          notes: readyNotes.trim() || undefined,
        },
      }).unwrap();

      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              status: 'SHIPPED',
              actualReadyDate: new Date().toISOString(),
              vendorNotes: readyNotes || item.vendorNotes,
            };
          }
          return item;
        })
      );
      setReadyModalVisible(false);
      setInspectModalVisible(false);
      showToast('Marked ready! Shipping quote & payment link dispatched.');
    } catch (err: any) {
      console.warn('Mark ready failed:', err);
      // Fallback local update
      setRequests((prev) =>
        prev.map((item) => {
          if (item.id === activeRequest.id) {
            return {
              ...item,
              status: 'SHIPPED',
              actualReadyDate: new Date().toISOString(),
              vendorNotes: readyNotes || item.vendorNotes,
            };
          }
          return item;
        })
      );
      setReadyModalVisible(false);
      setInspectModalVisible(false);
      showToast('Marked ready (updated locally)');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMessageCustomer = (req?: ProductRequestItem | null) => {
    const target = req || activeRequest;
    if (!target) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setInspectModalVisible(false);
    router.push({
      pathname: '/(vendor)/messenger',
      params: {
        chatId: `req-${target.id}`,
        clientName: target.customerName,
        requestTitle: target.productName,
      },
    });
  };

  const renderRequestItem = ({ item }: { item: ProductRequestItem }) => {
    const statusCfg = STATUS_MAP[item.status] || {
      label: item.status,
      color: '#666',
      bgLight: '#EEE',
      bgDark: '#333',
      dotColor: '#666',
    };

    const canStart = item.status === 'PRODUCTION_PENDING';
    const canProgress = item.status === 'IN_PRODUCTION' || item.status === 'PRODUCTION_DELAYED';
    const canReady = item.status === 'IN_PRODUCTION' || item.status === 'PRODUCTION_DELAYED';

    const createdDateFormatted = new Date(item.createdAt).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View
        style={[
          styles.requestCard,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <Image
            source={{ uri: item.productImage }}
            style={styles.productThumbnail}
            resizeMode="cover"
          />
          <View style={styles.cardHeaderInfo}>
            <View style={styles.titleStatusRow}>
              <Text style={[styles.productNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                {item.productName}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: isDark ? statusCfg.bgDark : statusCfg.bgLight },
                ]}
              >
                <View style={[styles.statusDotSmall, { backgroundColor: statusCfg.dotColor }]} />
                <Text style={[styles.statusBadgeText, { color: statusCfg.color }]}>
                  {statusCfg.label}
                </Text>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={[styles.requestNumberText, { color: theme.textSecondary }]}>
                {item.requestNumber}
              </Text>
              <Text style={[styles.metaDivider, { color: theme.border }]}>•</Text>
              <Text style={[styles.dateText, { color: theme.textSecondary }]}>
                {createdDateFormatted}
              </Text>
            </View>
          </View>
        </View>

        {/* Customer & Financial Breakdown */}
        <View style={[styles.cardDivider, { backgroundColor: theme.border }]} />

        <View style={styles.cardMetaGrid}>
          <View style={styles.metaCol}>
            <Text style={[styles.metaColLabel, { color: theme.textSecondary }]}>Customer</Text>
            <Text style={[styles.metaColValue, { color: theme.textPrimary }]} numberOfLines={1}>
              {item.customerName}
            </Text>
            <Text style={[styles.customerEmailText, { color: theme.textSecondary }]} numberOfLines={1}>
              {item.customerEmail}
            </Text>
          </View>

          <View style={styles.metaColRight}>
            <Text style={[styles.metaColLabel, { color: theme.textSecondary }]}>Order Total</Text>
            <Text style={[styles.orderAmountValue, { color: theme.primary }]}>
              {formatPrice(item.orderAmount, currencyCode, exchangeRate)}
            </Text>
            <Text style={[styles.quantityText, { color: theme.textSecondary }]}>
              Qty: {item.quantity}
            </Text>
          </View>
        </View>

        {/* Customization Teaser */}
        {item.customizationData?.measurements && (
          <View style={[styles.specsTeaserBox, { backgroundColor: isDark ? '#222' : '#FFFBF4', borderColor: theme.border }]}>
            <View style={styles.specsTeaserHeader}>
              <Ionicons name="resize-outline" size={13} color="#D1995A" style={{ marginRight: 4 }} />
              <Text style={styles.specsTeaserTitle}>Custom Measurements Provided:</Text>
            </View>
            <Text style={[styles.specsTeaserSummary, { color: theme.textPrimary }]} numberOfLines={1}>
              {Object.entries(item.customizationData.measurements)
                .map(([k, v]) => `${k}: ${v}"`)
                .join('  |  ')}
            </Text>
          </View>
        )}

        {/* Progress Updates Teaser */}
        {item.progressUpdates && item.progressUpdates.length > 0 && (
          <View style={styles.progressTeaserRow}>
            <Ionicons name="images-outline" size={14} color="#662502" style={{ marginRight: 6 }} />
            <Text style={[styles.progressTeaserText, { color: theme.textSecondary }]}>
              {item.progressUpdates.length} workshop update{item.progressUpdates.length > 1 ? 's' : ''} logged
            </Text>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.cardActionsRow}>
          <TouchableOpacity
            style={[styles.inspectButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveRequest(item);
              setInspectModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={15} color={theme.textPrimary} style={{ marginRight: 4 }} />
            <Text style={[styles.inspectButtonText, { color: theme.textPrimary }]} numberOfLines={1}>
              Inspect
            </Text>
          </TouchableOpacity>

          {canStart && (
            <TouchableOpacity
              style={[styles.primaryActionBtn, { backgroundColor: '#662502' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveRequest(item);
                setStartModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="play" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.primaryActionBtnText} numberOfLines={1}>
                Start Production
              </Text>
            </TouchableOpacity>
          )}

          {canProgress && (
            <TouchableOpacity
              style={[styles.secondaryActionBtn, { backgroundColor: '#FCF4E1', borderColor: '#D1995A' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveRequest(item);
                setProgressModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="camera-outline" size={14} color="#662502" style={{ marginRight: 4 }} />
              <Text style={[styles.secondaryActionBtnText, { color: '#662502' }]} numberOfLines={1}>
                Update
              </Text>
            </TouchableOpacity>
          )}

          {canReady && (
            <TouchableOpacity
              style={[styles.successActionBtn, { backgroundColor: '#006F00' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setActiveRequest(item);
                setReadyModalVisible(true);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="checkmark-done" size={14} color="#FFF" style={{ marginRight: 4 }} />
              <Text style={styles.successActionBtnText} numberOfLines={1}>
                Mark Ready
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  const renderListEmpty = () => {
    if (isRequestsLoading || (isRequestsFetching && requests.length === 0)) {
      return <VendorProductRequestsSkeleton count={3} />;
    }
    if (requestsError) {
      return (
        <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: '#EF4444' }]}>
          <View style={[styles.emptyIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}>
            <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Unable to Load Requests</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            There was a problem communicating with the studio product requests server.
          </Text>
          <TouchableOpacity
            style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
            onPress={() => refetchRequests()}
          >
            <Text style={styles.emptyResetText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="file-tray-outline" size={32} color={theme.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No product requests found</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          {searchQuery || activeFilterCount > 0 || selectedStatusTab !== 'ALL'
            ? 'Try clearing your filters or changing your search criteria.'
            : 'Customizable product orders will appear here automatically.'}
        </Text>
        {(activeFilterCount > 0 || selectedStatusTab !== 'ALL' || searchQuery) && (
          <TouchableOpacity
            style={[styles.emptyResetBtn, { backgroundColor: theme.primary }]}
            onPress={() => {
              setSelectedStatusTab('ALL');
              clearAllFilters();
              setSearchQuery('');
            }}
          >
            <Text style={styles.emptyResetText}>Reset All Filters</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const renderListFooter = () => {
    if (isRequestsLoading || !!requestsError || totalCount <= pageSize) return null;
    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingVertical: 14,
          paddingHorizontal: 16,
          marginTop: 4,
          borderRadius: 12,
          borderWidth: 1,
          backgroundColor: theme.card,
          borderColor: theme.border,
        }}
      >
        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: theme.border,
            opacity: currentPage <= 1 ? 0.45 : 1,
          }}
          disabled={currentPage <= 1}
          onPress={() => {
            Haptics.selectionAsync();
            setCurrentPage((p) => Math.max(1, p - 1));
          }}
        >
          <Ionicons
            name="chevron-back"
            size={15}
            color={currentPage <= 1 ? theme.textSecondary : theme.textPrimary}
          />
          <Text
            style={{
              fontSize: 12,
              fontFamily: FontFamily.bodyBold,
              marginHorizontal: 4,
              color: currentPage <= 1 ? theme.textSecondary : theme.textPrimary,
            }}
          >
            Previous
          </Text>
        </TouchableOpacity>

        <Text style={{ fontSize: 12, fontFamily: FontFamily.headingMedium, color: theme.textSecondary }}>
          Page <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.bodyBold }}>{currentPage}</Text> of{' '}
          <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.bodyBold }}>{totalPages}</Text>
        </Text>

        <TouchableOpacity
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
            borderWidth: 1,
            borderColor: currentPage >= totalPages ? theme.border : theme.primary,
            backgroundColor: currentPage >= totalPages ? 'transparent' : theme.primary,
            opacity: currentPage >= totalPages ? 0.45 : 1,
          }}
          disabled={currentPage >= totalPages}
          onPress={() => {
            Haptics.selectionAsync();
            setCurrentPage((p) => Math.min(totalPages, p + 1));
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontFamily: FontFamily.bodyBold,
              marginHorizontal: 4,
              color: currentPage >= totalPages ? theme.textSecondary : '#FFFFFF',
            }}
          >
            Next
          </Text>
          <Ionicons
            name="chevron-forward"
            size={15}
            color={currentPage >= totalPages ? theme.textSecondary : '#FFFFFF'}
          />
        </TouchableOpacity>
      </View>
    );
  };

  const listHeaderElement = (
    <View>
      {/* ── Header Title & Subtitle ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Product <Text style={{ color: theme.primary }}>Requests</Text>
          </Text>
          <Text style={[styles.pageSubtitle, { color: theme.textSecondary }]}>
            Manage production queues, workshop updates & fulfillment
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.refreshIconButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={onRefresh}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* ── KPI Summary Cards (2x2 Grid) ── */}
      <View style={styles.kpiGrid}>
        {/* Card 1: Total */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.card, borderColor: theme.border },
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
            <View style={styles.kpiIconBox}>
              <PackageFigmaIcon size={12} color={isDark ? '#D1995A' : theme.primary} />
            </View>
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#D1995A' : theme.primary },
              ]}
            >
              Total
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
              {stats.total}
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>All Production Orders</Text>
        </View>

        {/* Card 2: In Prod. */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.kpiPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(102, 37, 2, 0.25)'
                  : '#FCF4E1',
              },
            ]}
          >
            <View style={styles.kpiIconBox}>
              <TrendingUpFigmaIcon size={6} color={isDark ? '#D1995A' : '#662502'} />
            </View>
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#D1995A' : '#662502' },
              ]}
            >
              In Prod.
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: isDark ? '#D1995A' : '#662502' }]}>
              {stats.inProd}
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Active at Atelier</Text>
        </View>

        {/* Card 3: Pending */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.kpiPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(209, 153, 90, 0.16)'
                  : '#FFF8EE',
              },
            ]}
          >
            <View style={styles.kpiIconBox}>
              <CustomBidsFigmaIcon size={12} color={isDark ? '#D1995A' : '#A6620D'} />
            </View>
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#D1995A' : '#A6620D' },
              ]}
            >
              Pending
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: isDark ? '#D1995A' : '#A6620D' }]}>
              {stats.pending}
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Awaiting Start</Text>
        </View>

        {/* Card 4: Ready */}
        <View
          style={[
            styles.kpiCard,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <View
            style={[
              styles.kpiPillBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(10, 210, 79, 0.12)'
                  : 'rgba(0, 111, 0, 0.08)',
              },
            ]}
          >
            <View style={styles.kpiIconBox}>
              <Ionicons name="checkmark-done" size={13} color={isDark ? '#0AD24F' : '#006F00'} />
            </View>
            <Text
              style={[
                styles.kpiPillText,
                { color: isDark ? '#0AD24F' : '#006F00' },
              ]}
            >
              Ready
            </Text>
          </View>

          <View style={styles.kpiValueRow}>
            <Text style={[styles.kpiValueText, { color: isDark ? '#0AD24F' : '#006F00' }]}>
              {stats.completed}
            </Text>
          </View>

          <Text style={styles.kpiSubtitleText}>Ready & Shipped</Text>
        </View>
      </View>

      {/* ── Search & Filter Controls ── */}
      <View style={styles.searchRow}>
        <View
          style={[
            styles.searchBar,
            { backgroundColor: theme.card, borderColor: theme.border },
          ]}
        >
          <Ionicons name="search-outline" size={18} color={theme.textSecondary} style={{ marginRight: 8 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.textPrimary }]}
            placeholder="Search by customer, product, order ID..."
            placeholderTextColor={theme.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && Platform.OS !== 'ios' && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Modal Trigger Button */}
        <TouchableOpacity
          style={[
            styles.filterTriggerButton,
            {
              backgroundColor: activeFilterCount > 0 ? theme.primary : theme.card,
              borderColor: activeFilterCount > 0 ? theme.primary : theme.border,
            },
          ]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={activeFilterCount > 0 ? '#FFF' : theme.textPrimary}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ── Horizontal Status Tab Pills ── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.statusTabsScroll}
      >
        <TouchableOpacity
          style={[
            styles.statusTabPill,
            selectedStatusTab === 'ALL'
              ? { backgroundColor: theme.primary, borderColor: theme.primary }
              : { backgroundColor: theme.card, borderColor: theme.border },
          ]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedStatusTab('ALL');
          }}
        >
          <Text
            style={[
              styles.statusTabText,
              { color: selectedStatusTab === 'ALL' ? '#FFF' : theme.textPrimary },
            ]}
          >
            All Requests ({requests.length})
          </Text>
        </TouchableOpacity>

        {STATUS_OPTIONS.map((item) => {
          const count = requests.filter((r) => r.status === item.key).length;
          const isSelected = selectedStatusTab === item.key;
          return (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.statusTabPill,
                isSelected
                  ? { backgroundColor: '#662502', borderColor: '#662502' }
                  : { backgroundColor: theme.card, borderColor: theme.border },
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedStatusTab(item.key);
              }}
            >
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: isSelected ? '#FFF' : item.dotColor },
                ]}
              />
              <Text
                style={[
                  styles.statusTabText,
                  { color: isSelected ? '#FFF' : theme.textPrimary },
                ]}
              >
                {item.label} ({count})
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── Active Filter Badges Row ── */}
      {activeFilterCount > 0 && (
        <View style={styles.activeFiltersRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {selectedStatusFilters.map((s) => (
              <View key={s} style={[styles.activeChip, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                <Text style={[styles.activeChipText, { color: theme.primary }]}>
                  Status: {STATUS_MAP[s]?.label || s}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedStatusFilters((prev) => prev.filter((item) => item !== s))
                  }
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}

            {selectedAmountFilters.map((a) => (
              <View key={a} style={[styles.activeChip, { backgroundColor: theme.card, borderColor: theme.primary }]}>
                <Text style={[styles.activeChipText, { color: theme.primary }]}>
                  Amount: {a.replace('_', ' ')}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setSelectedAmountFilters((prev) => prev.filter((item) => item !== a))
                  }
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="close" size={14} color={theme.primary} style={{ marginLeft: 4 }} />
                </TouchableOpacity>
              </View>
            ))}

            <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllBtn}>
              <Text style={[styles.clearAllText, { color: theme.primary }]}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor="transparent"
        translucent
      />
      {/* ── Toast Notification Bar ── */}
      {toastMessage && (
        <View style={styles.toastContainer}>
          <View style={[styles.toastPill, { backgroundColor: '#662502' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={styles.toastText}>{toastMessage}</Text>
          </View>
        </View>
      )}

      {/* ── Main Virtualized List Area ── */}
      <FlatList
        data={isRequestsLoading || !!requestsError ? [] : paginatedRequests}
        keyExtractor={(item) => item.id}
        renderItem={renderRequestItem}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 90 }]}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
      />

      {/* ── MODAL 1: Multi-Select Filter Bottom Sheet ── */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setFilterModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View style={[styles.bottomSheetContainer, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
            {/* Sheet Handle */}
            <View style={styles.sheetHandle} />

            {/* Sheet Header */}
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Filter Product Requests</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterSheetScroll} showsVerticalScrollIndicator={false}>
              {/* Group 1: Production Status */}
              <Text style={[styles.filterGroupHeader, { color: theme.textPrimary }]}>Status</Text>
              <View style={styles.filterChipsWrap}>
                {STATUS_OPTIONS.map((opt) => {
                  const isSelected = selectedStatusFilters.includes(opt.key);
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[
                        styles.filterOptionPill,
                        {
                          backgroundColor: isSelected ? '#662502' : theme.background,
                          borderColor: isSelected ? '#662502' : theme.border,
                        },
                      ]}
                      onPress={() =>
                        toggleFilter(opt.key, selectedStatusFilters, setSelectedStatusFilters)
                      }
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: isSelected ? '#FFF' : opt.dotColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: isSelected ? '#FFF' : theme.textPrimary },
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Group 2: Amount Range */}
              <Text style={[styles.filterGroupHeader, { color: theme.textPrimary, marginTop: 18 }]}>
                Order Value
              </Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { key: 'UNDER_100K', label: 'Under ₦100,000' },
                  { key: '100K_250K', label: '₦100,000 – ₦250,000' },
                  { key: 'OVER_250K', label: 'Above ₦250,000' },
                ].map((range) => {
                  const isSelected = selectedAmountFilters.includes(range.key);
                  return (
                    <TouchableOpacity
                      key={range.key}
                      style={[
                        styles.filterOptionPill,
                        {
                          backgroundColor: isSelected ? '#662502' : theme.background,
                          borderColor: isSelected ? '#662502' : theme.border,
                        },
                      ]}
                      onPress={() =>
                        toggleFilter(range.key, selectedAmountFilters, setSelectedAmountFilters)
                      }
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="cash-outline"
                        size={14}
                        color={isSelected ? '#FFF' : theme.textPrimary}
                        style={{ marginRight: 6 }}
                      />
                      <Text
                        style={[
                          styles.filterOptionText,
                          { color: isSelected ? '#FFF' : theme.textPrimary },
                        ]}
                      >
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Sheet Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={[styles.sheetSecondaryBtn, { borderColor: theme.border }]}
                onPress={clearAllFilters}
              >
                <Text style={[styles.sheetSecondaryBtnText, { color: theme.textPrimary }]}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetPrimaryBtn, { backgroundColor: theme.primary }]}
                onPress={() => setFilterModalVisible(false)}
              >
                <Text style={styles.sheetPrimaryBtnText}>Apply ({activeFilterCount})</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── MODAL 2: Full Product Request Inspector Modal (Web DetailModal Parity) ── */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setInspectModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setInspectModalVisible(false)}
          />
          <View style={[styles.inspectSheetContainer, { backgroundColor: theme.card, maxHeight: '90%' }]}>
            <View style={styles.sheetHandle} />

            {activeRequest && (
              <>
                {/* Header */}
                <View style={styles.inspectHeader}>
                  <Image
                    source={{ uri: activeRequest.productImage }}
                    style={styles.inspectProductImage}
                    resizeMode="cover"
                  />
                  <View style={styles.inspectHeaderMeta}>
                    <Text style={[styles.inspectProductName, { color: theme.textPrimary }]} numberOfLines={2}>
                      {activeRequest.productName}
                    </Text>
                    <Text style={[styles.inspectRequestNumber, { color: theme.textSecondary }]}>
                      {activeRequest.requestNumber} • Order #{activeRequest.orderId}
                    </Text>
                    <View style={{ marginTop: 6, alignSelf: 'flex-start' }}>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: isDark
                              ? STATUS_MAP[activeRequest.status]?.bgDark
                              : STATUS_MAP[activeRequest.status]?.bgLight,
                          },
                        ]}
                      >
                        <View
                          style={[
                            styles.statusDotSmall,
                            { backgroundColor: STATUS_MAP[activeRequest.status]?.dotColor || '#666' },
                          ]}
                        />
                        <Text
                          style={[
                            styles.statusBadgeText,
                            { color: STATUS_MAP[activeRequest.status]?.color || '#666' },
                          ]}
                        >
                          {STATUS_MAP[activeRequest.status]?.label || activeRequest.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => setInspectModalVisible(false)}
                    style={styles.inspectCloseBtn}
                  >
                    <Ionicons name="close" size={22} color={theme.textPrimary} />
                  </TouchableOpacity>
                </View>

                {/* Scrollable Specs Body */}
                <ScrollView
                  style={styles.inspectScrollBody}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 24 }}
                >

                  {/* Section 1: Customer & Order Details */}
                  <View style={styles.inspectSection}>
                    <Text style={[styles.inspectSectionTitle, { color: theme.textPrimary }]}>Order Information</Text>
                    <View style={[styles.inspectGrid, { backgroundColor: isDark ? '#222' : '#F9F9F9', borderColor: theme.border }]}>
                      <View style={styles.inspectGridCell}>
                        <Text style={[styles.gridCellLabel, { color: theme.textSecondary }]}>Customer</Text>
                        <Text style={[styles.gridCellValue, { color: theme.textPrimary }]}>{activeRequest.customerName}</Text>
                        <Text style={[styles.gridCellSub, { color: theme.textSecondary }]}>{activeRequest.customerEmail}</Text>
                        <TouchableOpacity
                          style={[styles.inspectMessageBtn, { backgroundColor: isDark ? theme.background : '#FFF', borderColor: '#D1995A' }]}
                          onPress={() => handleMessageCustomer(activeRequest)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="chatbubble-ellipses-outline" size={13} color="#662502" style={{ marginRight: 4 }} />
                          <Text style={styles.inspectMessageBtnText}>Message Patron</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.inspectGridCell}>
                        <Text style={[styles.gridCellLabel, { color: theme.textSecondary }]}>Order Total</Text>
                        <Text style={[styles.gridCellValueHighlight, { color: theme.primary }]}>
                          {formatPrice(activeRequest.orderAmount, currencyCode, exchangeRate)}
                        </Text>
                        <Text style={[styles.gridCellSub, { color: theme.textSecondary }]}>Qty: {activeRequest.quantity}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Section 2: Measurements Grid (Exact Web Parity) */}
                  {activeRequest.customizationData?.measurements && (
                    <View style={styles.inspectSection}>
                      <View style={styles.sectionHeaderWithIcon}>
                        <Ionicons name="shirt-outline" size={16} color="#662502" style={{ marginRight: 6 }} />
                        <Text style={[styles.inspectSectionTitle, { color: theme.textPrimary }]}>
                          Custom Measurements (Inches)
                        </Text>
                      </View>
                      <View style={styles.measurementsGrid}>
                        {Object.entries(activeRequest.customizationData.measurements).map(([key, val]) => (
                          <View
                            key={key}
                            style={[
                              styles.measurementCell,
                              { backgroundColor: isDark ? '#25201A' : '#FCF4E1', borderColor: '#D1995A' },
                            ]}
                          >
                            <Text style={styles.measurementLabel}>{key}</Text>
                            <Text style={styles.measurementValue}>{val}"</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Section 3: Fabric & Style Specs */}
                  {activeRequest.customizationData && (
                    <View style={styles.inspectSection}>
                      <Text style={[styles.inspectSectionTitle, { color: theme.textPrimary }]}>Specifications</Text>
                      {activeRequest.customizationData.fabric && (
                        <View style={styles.specRow}>
                          <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Fabric Choice:</Text>
                          <Text style={[styles.specValue, { color: theme.textPrimary }]}>{activeRequest.customizationData.fabric}</Text>
                        </View>
                      )}
                      {activeRequest.customizationData.color && (
                        <View style={styles.specRow}>
                          <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Color Style:</Text>
                          <Text style={[styles.specValue, { color: theme.textPrimary }]}>{activeRequest.customizationData.color}</Text>
                        </View>
                      )}
                      {activeRequest.customizationData.pattern && (
                        <View style={styles.specRow}>
                          <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Pattern / Motif:</Text>
                          <Text style={[styles.specValue, { color: theme.textPrimary }]}>{activeRequest.customizationData.pattern}</Text>
                        </View>
                      )}
                      {activeRequest.customizationData.styleVariant && (
                        <View style={styles.specRow}>
                          <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Style Variant:</Text>
                          <Text style={[styles.specValue, { color: theme.textPrimary }]}>{activeRequest.customizationData.styleVariant}</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Customer Notes */}
                  {activeRequest.customizationData?.customNotes && (
                    <View style={styles.inspectSection}>
                      <View style={[styles.customerNotesBox, { backgroundColor: isDark ? '#2B231B' : '#FFF9F0', borderColor: '#D1995A' }]}>
                        <View style={styles.notesBoxHeader}>
                          <Ionicons name="document-text-outline" size={15} color="#A6620D" style={{ marginRight: 6 }} />
                          <Text style={styles.notesBoxTitle}>Customer Special Instructions</Text>
                        </View>
                        <Text style={[styles.notesBoxText, { color: theme.textPrimary }]}>
                          "{activeRequest.customizationData.customNotes}"
                        </Text>
                      </View>
                    </View>
                  )}

                  {/* Section 4: Workshop Progress Feed */}
                  <View style={styles.inspectSection}>
                    <View style={styles.sectionHeaderWithIcon}>
                      <Ionicons name="hammer-outline" size={16} color="#662502" style={{ marginRight: 6 }} />
                      <Text style={[styles.inspectSectionTitle, { color: theme.textPrimary }]}>Workshop Updates</Text>
                    </View>

                    {activeRequest.progressUpdates && activeRequest.progressUpdates.length > 0 ? (
                      <View style={styles.progressTimeline}>
                        {activeRequest.progressUpdates.map((update, index) => (
                          <View key={update.id || index} style={styles.timelineItem}>
                            <View style={styles.timelineDot} />
                            <View style={[styles.timelineCard, { backgroundColor: isDark ? '#222' : '#FBFBFB', borderColor: theme.border }]}>
                              <Text style={[styles.timelineMessage, { color: theme.textPrimary }]}>
                                {update.message}
                              </Text>
                              {update.imageUrl && (
                                <Image
                                  source={{ uri: update.imageUrl }}
                                  style={styles.timelinePhoto}
                                  resizeMode="cover"
                                />
                              )}
                              <Text style={[styles.timelineDate, { color: theme.textSecondary }]}>
                                {new Date(update.createdAt).toLocaleString()}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={[styles.noUpdatesText, { color: theme.textSecondary }]}>
                        No progress updates logged yet. Once in production, you can share real-time workshop photos and messages.
                      </Text>
                    )}
                  </View>
                </ScrollView>

                {/* Fixed Sticky Action Footer */}
                <View style={[styles.inspectFooter, { borderTopColor: theme.border, backgroundColor: theme.card, paddingBottom: insets.bottom + 8 }]}>
                  {activeRequest.status === 'PRODUCTION_PENDING' && (
                    <TouchableOpacity
                      style={[styles.footerPrimaryBtn, { backgroundColor: '#662502' }]}
                      onPress={() => {
                        setStartModalVisible(true);
                      }}
                    >
                      <Ionicons name="play" size={16} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.footerPrimaryBtnText}>Start Production</Text>
                    </TouchableOpacity>
                  )}

                  {(activeRequest.status === 'IN_PRODUCTION' || activeRequest.status === 'PRODUCTION_DELAYED') && (
                    <View style={styles.footerDualButtons}>
                      <TouchableOpacity
                        style={[styles.footerSecondaryBtn, { borderColor: '#D1995A', backgroundColor: '#FCF4E1' }]}
                        onPress={() => setProgressModalVisible(true)}
                      >
                        <Ionicons name="camera-outline" size={16} color="#662502" style={{ marginRight: 6 }} />
                        <Text style={[styles.footerSecondaryBtnText, { color: '#662502' }]}>Update Progress</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.footerPrimaryBtn, { backgroundColor: '#006F00', flex: 1.2 }]}
                        onPress={() => setReadyModalVisible(true)}
                      >
                        <Ionicons name="checkmark-done" size={16} color="#FFF" style={{ marginRight: 6 }} />
                        <Text style={styles.footerPrimaryBtnText}>Mark Ready</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── MODAL 3: Start Production Modal ── */}
      <Modal
        visible={startModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setStartModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setStartModalVisible(false)}
          />
          <View style={[styles.bottomSheetContainer, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Begin Production</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
              Confirm you are starting craft work on this customizable piece.
            </Text>

            {/* Estimated Completion Timeline Presets */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Target Completion Window
            </Text>
            <View style={styles.presetsRow}>
              {[
                { id: '3_DAYS', label: '+3 Days' },
                { id: '7_DAYS', label: '+1 Week' },
                { id: '14_DAYS', label: '+2 Weeks' },
              ].map((p) => {
                const active = startReadyDatePreset === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[
                      styles.presetPill,
                      {
                        backgroundColor: active ? '#662502' : theme.background,
                        borderColor: active ? '#662502' : theme.border,
                      },
                    ]}
                    onPress={() => setStartReadyDatePreset(p.id)}
                  >
                    <Text style={[styles.presetText, { color: active ? '#FFF' : theme.textPrimary }]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Production Notes */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Initial Production Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.modalTextArea,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary },
              ]}
              placeholder="e.g. Fabric pre-washed and cut to patron measurements..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={startNotes}
              onChangeText={setStartNotes}
            />

            {/* Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={[styles.sheetSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => setStartModalVisible(false)}
              >
                <Text style={[styles.sheetSecondaryBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetPrimaryBtn, { backgroundColor: '#662502' }]}
                onPress={handleStartProduction}
                disabled={actionLoading}
              >
                <Text style={styles.sheetPrimaryBtnText}>
                  {actionLoading ? 'Starting...' : 'Confirm & Start'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 4: Update Progress Modal (With Photo Upload) ── */}
      <Modal
        visible={progressModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setProgressModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setProgressModalVisible(false)}
          />
          <View style={[styles.bottomSheetContainer, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Share Workshop Progress</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
              Send a photo and status update to keep your customer excited and informed.
            </Text>

            {/* Progress Message */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Progress Description <Text style={{ color: '#C92929' }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.modalTextArea,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary },
              ]}
              placeholder="e.g. Cutting completed, hand-embroidery on the neckline in progress..."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={progressMessage}
              onChangeText={setProgressMessage}
            />

            {/* Workshop Photo Selector */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Attach Workshop Photo (Max 5MB)
            </Text>
            {selectedProgressImage ? (
              <View style={styles.attachedPhotoContainer}>
                <Image
                  source={{ uri: selectedProgressImage }}
                  style={styles.attachedPhoto}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removePhotoBtn}
                  onPress={() => setSelectedProgressImage(null)}
                >
                  <Ionicons name="close" size={16} color="#FFF" />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPickerDualRow}>
                <TouchableOpacity
                  style={[styles.photoActionBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={handleTakePhoto}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={18} color="#662502" style={{ marginRight: 6 }} />
                  <Text style={[styles.photoActionBtnText, { color: theme.textPrimary }]}>Take Photo</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.photoActionBtn, { backgroundColor: theme.background, borderColor: theme.border }]}
                  onPress={handlePickFromGallery}
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={18} color="#D1995A" style={{ marginRight: 6 }} />
                  <Text style={[styles.photoActionBtnText, { color: theme.textPrimary }]}>From Gallery</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={[styles.sheetSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => setProgressModalVisible(false)}
              >
                <Text style={[styles.sheetSecondaryBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sheetPrimaryBtn,
                  { backgroundColor: progressMessage.trim() ? '#662502' : '#AAA' },
                ]}
                disabled={!progressMessage.trim() || actionLoading}
                onPress={handleUpdateProgress}
              >
                <Text style={styles.sheetPrimaryBtnText}>
                  {actionLoading ? 'Sending...' : 'Send Update'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── MODAL 5: Mark Ready Modal ── */}
      <Modal
        visible={readyModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setReadyModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalDismissArea}
            activeOpacity={1}
            onPress={() => setReadyModalVisible(false)}
          />
          <View style={[styles.bottomSheetContainer, { backgroundColor: theme.card, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.sheetHandle} />
            <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Mark Ready for Dispatch</Text>
            <Text style={[styles.sheetSubtitle, { color: theme.textSecondary }]}>
              Notify the patron that crafting is complete and trigger final delivery arrangements.
            </Text>

            {/* Notice Callout Box */}
            <View style={styles.readyNoticeBox}>
              <Ionicons name="information-circle" size={18} color="#006F00" style={{ marginRight: 8, marginTop: 2 }} />
              <Text style={styles.readyNoticeText}>
                Once marked ready, Ethnikraft automatically generates a delivery quote and sends the final dispatch confirmation link to the customer.
              </Text>
            </View>

            {/* Completion Notes */}
            <Text style={[styles.inputLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Final Inspection & Packaging Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.modalTextArea,
                { backgroundColor: theme.background, borderColor: theme.border, color: theme.textPrimary },
              ]}
              placeholder="e.g. Quality inspection passed. Packaged in royal dust bag with care guide."
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={3}
              value={readyNotes}
              onChangeText={setReadyNotes}
            />

            {/* Actions */}
            <View style={styles.sheetActionsRow}>
              <TouchableOpacity
                style={[styles.sheetSecondaryBtn, { borderColor: theme.border }]}
                onPress={() => setReadyModalVisible(false)}
              >
                <Text style={[styles.sheetSecondaryBtnText, { color: theme.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sheetPrimaryBtn, { backgroundColor: '#006F00' }]}
                onPress={handleMarkReady}
                disabled={actionLoading}
              >
                <Text style={styles.sheetPrimaryBtnText}>
                  {actionLoading ? 'Finalizing...' : 'Confirm Ready for Shipping'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

// ─── Stylesheet ───────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  toastContainer: {
    position: 'absolute',
    top: 10,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  toastPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    ...Shadows.md,
  },
  toastText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  pageSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  refreshIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 14,
  },
  kpiCard: {
    width: (SCREEN_WIDTH - 32 - 10) / 2,
    height: 120,
    borderRadius: Radius.md,
    paddingHorizontal: 13,
    paddingVertical: 12,
    borderWidth: 1,
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  kpiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  kpiIconBox: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  },
  searchRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    paddingVertical: 0,
  },
  filterTriggerButton: {
    width: 42,
    height: 42,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#C92929',
    borderRadius: 10,
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
  },
  statusTabsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  statusTabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusTabText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  activeFiltersRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  activeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  activeChipText: {
    fontSize: 11,
    fontFamily: FontFamily.headingMedium,
  },
  clearAllBtn: {
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  clearAllText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    textDecorationLine: 'underline',
  },
  listContainer: {
    gap: 12,
  },
  requestCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
    ...Shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  productThumbnail: {
    width: 58,
    height: 58,
    borderRadius: 10,
    backgroundColor: '#EAEAEA',
  },
  cardHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  titleStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  productNameText: {
    flex: 1,
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
  },
  statusDotSmall: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    textTransform: 'uppercase',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  requestNumberText: {
    fontSize: 11,
    fontFamily: FontFamily.headingMedium,
  },
  metaDivider: {
    fontSize: 11,
  },
  dateText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  cardDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  cardMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metaCol: {
    flex: 1,
  },
  metaColRight: {
    alignItems: 'flex-end',
  },
  metaColLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  metaColValue: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  customerEmailText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  orderAmountValue: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  quantityText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  specsTeaserBox: {
    borderRadius: 8,
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginBottom: 8,
  },
  specsTeaserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  specsTeaserTitle: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#D1995A',
    textTransform: 'uppercase',
  },
  specsTeaserSummary: {
    fontSize: 11,
    fontFamily: FontFamily.headingMedium,
  },
  progressTeaserRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressTeaserText: {
    fontSize: 11,
    fontFamily: FontFamily.headingMedium,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  inspectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  inspectButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  primaryActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  successActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 38,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  successActionBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    marginVertical: 20,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FCF4E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyResetBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  emptyResetText: {
    color: '#FFF',
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalDismissArea: {
    flex: 1,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    maxHeight: '85%',
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDD',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
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
  filterSheetScroll: {
    maxHeight: 380,
  },
  filterGroupHeader: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 12,
    fontFamily: FontFamily.headingMedium,
  },
  sheetActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  sheetSecondaryBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  sheetPrimaryBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  inspectSheetContainer: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 12,
    height: '85%',
  },
  inspectHeader: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
    gap: 12,
  },
  inspectProductImage: {
    width: 68,
    height: 68,
    borderRadius: 12,
    backgroundColor: '#EAEAEA',
  },
  inspectHeaderMeta: {
    flex: 1,
  },
  inspectProductName: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    lineHeight: 20,
  },
  inspectRequestNumber: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 3,
  },
  inspectCloseBtn: {
    padding: 4,
  },
  inspectScrollBody: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  inspectSection: {
    marginBottom: 18,
  },
  inspectSectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sectionHeaderWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inspectGrid: {
    flexDirection: 'row',
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  inspectGridCell: {
    flex: 1,
  },
  gridCellLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  gridCellValue: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  gridCellValueHighlight: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  gridCellSub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  inspectMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  inspectMessageBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#662502',
  },
  measurementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  measurementCell: {
    width: (SCREEN_WIDTH - 32 - 16) / 3,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  measurementLabel: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    color: '#662502',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  measurementValue: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
    color: '#662502',
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#EEE',
  },
  specLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
  },
  specValue: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
  },
  customerNotesBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  notesBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  notesBoxTitle: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#A6620D',
    textTransform: 'uppercase',
  },
  notesBoxText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  progressTimeline: {
    paddingLeft: 10,
    borderLeftWidth: 2,
    borderLeftColor: '#D1995A',
    marginLeft: 6,
    gap: 12,
  },
  timelineItem: {
    position: 'relative',
  },
  timelineDot: {
    position: 'absolute',
    left: -16,
    top: 4,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#662502',
  },
  timelineCard: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  timelineMessage: {
    fontSize: 12,
    fontFamily: FontFamily.headingMedium,
    marginBottom: 6,
  },
  timelinePhoto: {
    width: '100%',
    height: 120,
    borderRadius: 6,
    marginBottom: 6,
  },
  timelineDate: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
  },
  noUpdatesText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    fontStyle: 'italic',
  },
  inspectFooter: {
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  footerPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
  },
  footerPrimaryBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  footerDualButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  footerSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  footerSecondaryBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
  },
  inputLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    marginBottom: 6,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  presetPill: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  presetText: {
    fontSize: 12,
    fontFamily: FontFamily.headingMedium,
  },
  modalTextArea: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 10,
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    textAlignVertical: 'top',
    minHeight: 70,
  },
  attachedPhotoContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
  },
  attachedPhoto: {
    width: '100%',
    height: '100%',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerDualRow: {
    flexDirection: 'row',
    gap: 10,
  },
  photoActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 46,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  photoActionBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.headingMedium,
  },
  readyNoticeBox: {
    flexDirection: 'row',
    backgroundColor: '#EEFAEE',
    borderWidth: 1,
    borderColor: 'rgba(0, 111, 0, 0.2)',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  readyNoticeText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#006F00',
    lineHeight: 16,
  },
});

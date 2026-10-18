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
  Linking,
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
import {
  TrendingUpFigmaIcon,
  PackageFigmaIcon,
  CustomBidsFigmaIcon,
} from '@/components/vendor/DashboardFigmaIcons';
import {
  useGetMarketplaceRequestsQuery,
  useGetVendorBidsQuery,
  useGetVendorProductRequestsQuery,
  useGetVendorStudioSummaryQuery,
  useCreateCustomBidMutation,
  useUpdateProductionProgressMutation,
  useLazyGetChatRoomQuery,
} from '@/store/api/vendorApi';
import {
  VendorStudioRequestsSkeleton,
  VendorStudioWorkbenchSkeleton,
} from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data Types & Backend Enums ───────────────────────────────────────────────
export type CustomRequestCategory =
  | 'ALL'
  | 'WEARS'
  | 'SHOES'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CRAFTS'
  | 'PAINTINGS'
  | 'ANTIQUES';

export type RequestStatusType =
  | 'OPEN'
  | 'BIDDING'
  | 'SELECTED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type ProductionStage =
  | 'design'
  | 'crafting'
  | 'inspection'
  | 'ready_for_dispatch';

export interface CustomClientRequest {
  id: string;
  title: string;
  category: CustomRequestCategory;
  description: string;
  budget: number;
  deadlineDate: string;
  daysRemaining: number;
  status: RequestStatusType;
  quantity: number;
  materialType: string;
  materialQuality: string;
  colors: string[];
  measurements?: Record<string, string>;
  inspirationImages: string[];
  location?: string;
  deliveryAddress?: any;
  customer: {
    name: string;
    avatar?: string;
    location: string;
    verified: boolean;
    rating: number;
    completedOrders: number;
  };
  bidsCount: number;
  chatId?: string;
  myExistingBid?: {
    price: number;
    days: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    notes: string;
  };
  createdAt: string;
}

export interface ActiveWorkbenchCommission {
  id: string;
  requestId: string;
  title: string;
  category: CustomRequestCategory;
  client: {
    name: string;
    location: string;
    phone?: string;
  };
  agreedPrice: number;
  stage: ProductionStage;
  progressPercent: number;
  targetCompletionDate: string;
  daysRemaining: number;
  materialSummary: string;
  thumbnail: string;
  proofPhotos: string[];
  recentUpdateNote?: string;
  chatId?: string;
}

// ─── Resilient Location Resolver (Web Parity) ─────────────────────────────────
export const resolveRequestLocation = (request: any): string | null => {
  if (!request) return null;

  // 1. Direct location field on request
  if (typeof request.location === 'string' && request.location.trim()) {
    return request.location.trim();
  }

  // 2. Structured address object or string
  const addr = request.deliveryAddress || request.shippingAddress || request.address;
  if (typeof addr === 'string' && addr.trim()) {
    return addr.trim();
  }
  if (addr && typeof addr === 'object') {
    const cityOrState = addr.city || addr.state;
    const country = addr.country || addr.countryCode;
    const parts = [cityOrState, country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }

  // 3. Top-level city/state/country on custom request
  if (request.city || request.state || request.country) {
    const cityOrState = request.city || request.state;
    const country = request.country;
    const parts = [cityOrState, country].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
  }

  // 4. Customer profile location or address (from request.customer or request.user)
  const user = request.customer || request.user;
  if (user) {
    if (typeof user.location === 'string' && user.location.trim()) {
      return user.location.trim();
    }
    const userCityOrState = user.city || user.state;
    const userCountry = user.country;
    if (userCityOrState || userCountry) {
      const parts = [userCityOrState, userCountry].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
    if (Array.isArray(user.savedAddresses) && user.savedAddresses.length > 0) {
      const def = user.savedAddresses.find((a: any) => a.isDefault) || user.savedAddresses[0];
      const addrCity = def.city || def.state;
      const addrCountry = def.country || def.countryCode;
      const parts = [addrCity, addrCountry].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
    }
  }

  return null;
};

// ─── Format Client Name (First Name + Last Initial) ──────────────────────────
export const formatClientName = (fullName?: string): { displayName: string; initials: string; firstName: string } => {
  if (!fullName || !fullName.trim()) {
    return { displayName: 'Client', initials: 'C', firstName: 'Client' };
  }
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || 'Client';
  const lastInitial = parts[1] ? `${parts[1][0]}.` : '';
  const displayName = `${first} ${lastInitial}`.trim();
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');
  return { displayName, initials, firstName: first };
};

const CATEGORY_CHIPS: { id: CustomRequestCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Categories', icon: 'sparkles-outline' },
  { id: 'WEARS', label: 'Wears & Attire', icon: 'shirt-outline' },
  { id: 'SHOES', label: 'Footwear', icon: 'walk-outline' },
  { id: 'BAGS', label: 'Bags & Leather', icon: 'briefcase-outline' },
  { id: 'ACCESSORIES', label: 'Accessories', icon: 'watch-outline' },
  { id: 'CRAFTS', label: 'Sculptures & Crafts', icon: 'color-palette-outline' },
  { id: 'PAINTINGS', label: 'Art & Paintings', icon: 'brush-outline' },
  { id: 'ANTIQUES', label: 'Heritage Antiques', icon: 'hourglass-outline' },
];

const STAGE_CONFIG: Record<
  ProductionStage,
  { label: string; percent: number; color: string; bgLight: string; bgDark: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  design: {
    label: 'Design & Prep',
    percent: 25,
    color: '#0284C7',
    bgLight: '#E0F2FE',
    bgDark: 'rgba(2, 132, 199, 0.18)',
    icon: 'pencil-outline',
  },
  crafting: {
    label: 'In Crafting',
    percent: 60,
    color: '#C46C27',
    bgLight: '#FEF3C7',
    bgDark: 'rgba(196, 108, 39, 0.18)',
    icon: 'hammer-outline',
  },
  inspection: {
    label: 'Quality Inspection',
    percent: 85,
    color: '#B87B2E',
    bgLight: '#FDF4DC',
    bgDark: 'rgba(184, 123, 46, 0.18)',
    icon: 'shield-checkmark-outline',
  },
  ready_for_dispatch: {
    label: 'Ready for Dispatch',
    percent: 100,
    color: '#009D1A',
    bgLight: '#DCFCE7',
    bgDark: 'rgba(0, 157, 26, 0.18)',
    icon: 'cube-outline',
  },
};

export default function VendorStudioScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ─── Primary Navigation States ──────────────────────────────────────────────
  const [hubTab, setHubTab] = useState<'OPEN_REQUESTS' | 'ACTIVE_WORKBENCH'>('OPEN_REQUESTS');
  const [requestSegment, setRequestSegment] = useState<'ALL' | 'OFFERED'>('ALL'); // Web Parity: All vs Offered Sent
  const [selectedCategories, setSelectedCategories] = useState<CustomRequestCategory[]>(['ALL']);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatuses, setSelectedStatuses] = useState<('all' | 'OPEN' | 'PENDING' | 'ACCEPTED' | 'COMPLETED')[]>(['all']);
  const [sortFilter, setSortFilter] = useState<'recent' | 'oldest' | 'budget_high' | 'budget_low'>('recent');
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>(['all']);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error'>('success');
  const [messagingRequestId, setMessagingRequestId] = useState<string | null>(null);

  // ─── Multi-Select Toggle Helpers ────────────────────────────
  const toggleCategory = (cat: CustomRequestCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cat === 'ALL') {
      setSelectedCategories(['ALL']);
      return;
    }
    setSelectedCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'ALL');
      if (withoutAll.includes(cat)) {
        const remaining = withoutAll.filter((c) => c !== cat);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...withoutAll, cat];
      }
    });
  };

  const toggleStatus = (st: 'all' | 'OPEN' | 'PENDING' | 'ACCEPTED' | 'COMPLETED') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (st === 'all') {
      setSelectedStatuses(['all']);
      return;
    }
    setSelectedStatuses((prev) => {
      const withoutAll = prev.filter((s) => s !== 'all');
      if (withoutAll.includes(st)) {
        const remaining = withoutAll.filter((s) => s !== st);
        return remaining.length === 0 ? ['all'] : remaining;
      } else {
        return [...withoutAll, st];
      }
    });
  };

  const toggleMaterial = (mat: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (mat === 'all') {
      setSelectedMaterials(['all']);
      return;
    }
    setSelectedMaterials((prev) => {
      const withoutAll = prev.filter((m) => m !== 'all');
      if (withoutAll.includes(mat)) {
        const remaining = withoutAll.filter((m) => m !== mat);
        return remaining.length === 0 ? ['all'] : remaining;
      } else {
        return [...withoutAll, mat];
      }
    });
  };

  // ─── RTK Query Live Queries & Mutations (Stage 3 & 4) ───────────────────────
  const {
    data: marketplaceData,
    isLoading: isMarketplaceLoading,
    isFetching: isMarketplaceFetching,
    error: marketplaceError,
    refetch: refetchMarketplace,
  } = useGetMarketplaceRequestsQuery();

  const {
    data: vendorBidsData,
    isLoading: isBidsLoading,
    isFetching: isBidsFetching,
    refetch: refetchBids,
  } = useGetVendorBidsQuery();

  const {
    data: workbenchData,
    isLoading: isWorkbenchLoading,
    isFetching: isWorkbenchFetching,
    error: workbenchError,
    refetch: refetchWorkbench,
  } = useGetVendorProductRequestsQuery();

  const {
    data: studioSummaryData,
    refetch: refetchStudioSummary,
  } = useGetVendorStudioSummaryQuery();

  const [createCustomBidMutation, { isLoading: isSubmittingBidMutation }] = useCreateCustomBidMutation();
  const [updateProductionProgressMutation, { isLoading: isUpdatingProgressMutation }] = useUpdateProductionProgressMutation();
  const [triggerGetChatRoom] = useLazyGetChatRoomQuery();

  // ─── Data Transformations: Live Requests with Merged Vendor Bids ────────────
  const liveRequests = useMemo<CustomClientRequest[]>(() => {
    const rawRequests = marketplaceData?.requests || [];
    const myBids = vendorBidsData || [];

    return rawRequests.map((r: any) => {
      // Find matching bid by vendor
      const foundBid = myBids.find((b: any) => b.customRequestId === r.id) ||
        (Array.isArray(r.bids) && r.bids.length > 0 ? r.bids[0] : undefined);

      // Category matching
      let category: CustomRequestCategory = 'WEARS';
      const catUpper = (r.categoryType || '').toUpperCase();
      if (['WEARS', 'SHOES', 'BAGS', 'ACCESSORIES', 'CRAFTS', 'PAINTINGS', 'ANTIQUES'].includes(catUpper)) {
        category = catUpper as CustomRequestCategory;
      }

      // Timeline / days remaining
      const deadline = r.timeline || new Date(Date.now() + 14 * 86400000).toISOString();
      const daysRemaining = Math.max(
        0,
        Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      // Customer details
      const customerUser = r.user || {};
      const customerName = `${customerUser.firstName || ''} ${customerUser.lastName || ''}`.trim() || 'Client';

      return {
        id: r.id,
        title: r.title || 'Custom Commission',
        category,
        description: r.description || '',
        budget: Number(r.budget) || 0,
        deadlineDate: deadline,
        daysRemaining,
        status: (r.status as RequestStatusType) || 'OPEN',
        quantity: r.quantity ?? 1,
        materialType: r.materialType || 'Custom Artisan Material',
        materialQuality: r.materialQuality || 'Premium Handcrafted',
        colors: Array.isArray(r.colors) ? r.colors : [],
        measurements: typeof r.measurements === 'object' ? r.measurements : undefined,
        inspirationImages: Array.isArray(r.inspirationImages) ? r.inspirationImages : [],
        location: resolveRequestLocation(r) || undefined,
        deliveryAddress: r.deliveryAddress,
        customer: {
          name: customerName,
          location: resolveRequestLocation(r) || 'Nigeria',
          verified: true,
          rating: 5.0,
          completedOrders: customerUser.completedOrders || 3,
        },
        bidsCount: r._count?.bids ?? (r.bids ? r.bids.length : 0),
        chatId: r.chatId || undefined,
        myExistingBid: foundBid
          ? {
              price: Number(foundBid.price) || 0,
              days: foundBid.proposedTimeline
                ? Math.max(1, Math.ceil((new Date(foundBid.proposedTimeline).getTime() - Date.now()) / 86400000))
                : 14,
              status: foundBid.status || 'PENDING',
              notes: foundBid.notes || '',
            }
          : undefined,
        createdAt: r.createdAt || new Date().toISOString(),
      };
    });
  }, [marketplaceData, vendorBidsData]);

  // ─── Data Transformations: Live Active Workbench Items ──────────────────────
  const liveCommissions = useMemo<ActiveWorkbenchCommission[]>(() => {
    if (!workbenchData || !Array.isArray(workbenchData)) return [];

    return workbenchData.map((item: any) => {
      // Map product request status to ProductionStage
      let stage: ProductionStage = 'design';
      let progressPercent = 25;

      if (item.status === 'PRODUCTION_PENDING') {
        stage = 'design';
        progressPercent = 25;
      } else if (item.status === 'IN_PRODUCTION') {
        stage = 'crafting';
        progressPercent = 60;
      } else if (item.status === 'SHIPPED' || item.status === 'COMPLETED') {
        stage = 'ready_for_dispatch';
        progressPercent = 100;
      } else {
        stage = 'inspection';
        progressPercent = 85;
      }

      // Progress updates
      const latestUpdate = Array.isArray(item.progressUpdates) && item.progressUpdates.length > 0
        ? item.progressUpdates[item.progressUpdates.length - 1].message
        : item.vendorNotes || 'In production';

      const deadline = item.estimatedReadyDate || new Date(Date.now() + 10 * 86400000).toISOString();
      const daysRemaining = item.daysRemaining ?? Math.max(
        0,
        Math.ceil((new Date(deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      const clientName = item.customerName ||
        `${item.user?.firstName || ''} ${item.user?.lastName || ''}`.trim() || 'Client';

      const agreedPrice = Number(item.orderAmount ?? item.order?.total ?? item.product?.price ?? 0);

      let category: CustomRequestCategory = 'WEARS';
      const cat = (item.customizationData?.category || item.product?.category || '').toUpperCase();
      if (['WEARS', 'SHOES', 'BAGS', 'ACCESSORIES', 'CRAFTS', 'PAINTINGS', 'ANTIQUES'].includes(cat)) {
        category = cat as CustomRequestCategory;
      }

      return {
        id: item.id,
        requestId: item.productId || item.id,
        title: item.productName || item.product?.name || 'Bespoke Production Piece',
        category,
        client: {
          name: clientName,
          location: item.shippingQuoteSnapshot?.destination?.city || 'Nigeria',
          phone: item.user?.phone || undefined,
        },
        agreedPrice,
        stage,
        progressPercent,
        targetCompletionDate: new Date(deadline).toLocaleDateString('en-NG', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        daysRemaining,
        materialSummary: item.customizationData?.fields?.garmentType
          ? `${item.customizationData.fields.garmentType} - ${item.customizationData.fields.primaryColor || 'Custom'}`
          : 'Authentic handcrafted piece',
        thumbnail: item.product?.mainImage || (item.customizationData?.referenceImages?.[0] ?? ''),
        proofPhotos: item.customizationData?.referenceImages || [],
        recentUpdateNote: latestUpdate,
        chatId: item.chatId || item.order?.chatId || undefined,
      };
    });
  }, [workbenchData]);

  // Combined data collections with synchronous derivation to prevent empty-state flash
  const [localRequests, setRequests] = useState<CustomClientRequest[]>([]);
  const [syncedLiveRequests, setSyncedLiveRequests] = useState<CustomClientRequest[]>(liveRequests);
  const [localCommissions, setCommissions] = useState<ActiveWorkbenchCommission[]>([]);
  const [syncedLiveCommissions, setSyncedLiveCommissions] = useState<ActiveWorkbenchCommission[]>(liveCommissions);

  // Sync RTK Query data when received
  React.useEffect(() => {
    if (marketplaceData) {
      setRequests(liveRequests);
      setSyncedLiveRequests(liveRequests);
    }
  }, [marketplaceData, liveRequests]);

  React.useEffect(() => {
    if (workbenchData) {
      setCommissions(liveCommissions);
      setSyncedLiveCommissions(liveCommissions);
    }
  }, [workbenchData, liveCommissions]);

  const requests = marketplaceData && liveRequests !== syncedLiveRequests ? liveRequests : localRequests;
  const commissions = workbenchData && liveCommissions !== syncedLiveCommissions ? liveCommissions : localCommissions;

  // ─── Bottom Sheet Modals State ──────────────────────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const [imageLightboxVisible, setImageLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  // Active items for modals
  const [activeRequest, setActiveRequest] = useState<CustomClientRequest | null>(null);
  const [activeCommission, setActiveCommission] = useState<ActiveWorkbenchCommission | null>(null);

  // Offer Form State (2-Step Parity)
  const [offerStep, setOfferStep] = useState<1 | 2>(1);
  const [bidPrice, setBidPrice] = useState<number>(150000);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<number>(14);
  const [weeksInput, setWeeksInput] = useState<string>('2');
  const [proposalNotes, setProposalNotes] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // Milestone Form State
  const [selectedNewStage, setSelectedNewStage] = useState<ProductionStage>('crafting');
  const [milestoneNote, setMilestoneNote] = useState('');

  const formatPriceValue = (val: number) => {
    return formatPrice(val, currencyCode, exchangeRate);
  };

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToastType(type);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const onRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await Promise.allSettled([
        refetchMarketplace(),
        refetchBids(),
        refetchWorkbench(),
        refetchStudioSummary(),
      ]);
      showToast('Studio workbench updated');
    } catch {
      showToast('Updated local cache');
    } finally {
      setRefreshing(false);
    }
  };

  // Derive unique materials from active requests
  const materialOptions = useMemo(() => {
    const types = Array.from(new Set(requests.map((r) => r.materialType).filter(Boolean)));
    return ['all', ...types];
  }, [requests]);

  // Tab counts & Studio Pipeline KPIs (Exclusively from Dedicated Backend Summary Endpoint)
  const allRequestsCount = studioSummaryData?.openRequestsCount ?? 0;
  const offeredRequestsCount = studioSummaryData?.offeredRequestsCount ?? 0;
  const activeWorkbenchCount = studioSummaryData?.activeWorkbenchCount ?? 0;
  const totalInStudioValue = studioSummaryData?.totalPipelineValue ?? 0;
  const avgProgress = studioSummaryData?.avgWorkbenchProgress ?? 0;

  // Derive multi-select active filter states
  const isCategoryFiltered = !selectedCategories.includes('ALL') && selectedCategories.length > 0;
  const isStatusFiltered = !selectedStatuses.includes('all') && selectedStatuses.length > 0;
  const isMaterialFiltered = !selectedMaterials.includes('all') && selectedMaterials.length > 0;

  // Comprehensive Filter & Sort Logic
  const filteredRequests = useMemo(() => {
    return requests
      .filter((req) => {
        // 1. Segment pill: All vs Offers Sent
        if (requestSegment === 'OFFERED' && !req.myExistingBid) return false;

        // 2. Multi-select Categories
        if (isCategoryFiltered && !selectedCategories.includes(req.category)) return false;

        // 3. Multi-select Status filter
        if (isStatusFiltered) {
          const matchPending = selectedStatuses.includes('PENDING') && Boolean(req.myExistingBid && req.myExistingBid.status === 'PENDING');
          const matchOpen = selectedStatuses.includes('OPEN') && req.status === 'OPEN';
          if (!matchPending && !matchOpen) return false;
        }

        // 4. Multi-select Material filter
        if (isMaterialFiltered && !selectedMaterials.includes(req.materialType)) return false;

        // 5. Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const mTitle = req.title.toLowerCase().includes(q);
          const mDesc = req.description.toLowerCase().includes(q);
          const mClient = req.customer.name.toLowerCase().includes(q);
          const mMat = req.materialType.toLowerCase().includes(q);
          const mLoc = (resolveRequestLocation(req) || '').toLowerCase().includes(q);
          if (!mTitle && !mDesc && !mClient && !mMat && !mLoc) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortFilter === 'recent') {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        if (sortFilter === 'oldest') {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (sortFilter === 'budget_high') {
          return b.budget - a.budget;
        }
        if (sortFilter === 'budget_low') {
          return a.budget - b.budget;
        }
        return 0;
      });
  }, [
    requests,
    requestSegment,
    selectedCategories,
    selectedStatuses,
    selectedMaterials,
    searchQuery,
    sortFilter,
    isCategoryFiltered,
    isStatusFiltered,
    isMaterialFiltered,
  ]);

  const hasActiveFilters =
    isCategoryFiltered ||
    isStatusFiltered ||
    isMaterialFiltered ||
    sortFilter !== 'recent';

  const clearAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories(['ALL']);
    setSelectedStatuses(['all']);
    setSelectedMaterials(['all']);
    setSortFilter('recent');
    setSearchQuery('');
  };

  // ─── 10-Item Pagination ─────────────────────────────────────────────────────
  const [currentRequestsPage, setCurrentRequestsPage] = useState(1);
  const [currentWorkbenchPage, setCurrentWorkbenchPage] = useState(1);
  const pageSize = 10;

  React.useEffect(() => {
    setCurrentRequestsPage(1);
  }, [requestSegment, selectedCategories, selectedStatuses, selectedMaterials, searchQuery, sortFilter]);

  const totalRequestsCount = filteredRequests.length;
  const totalRequestsPages = Math.max(1, Math.ceil(totalRequestsCount / pageSize));
  const paginatedRequests = useMemo(() => {
    const startIndex = (currentRequestsPage - 1) * pageSize;
    return filteredRequests.slice(startIndex, startIndex + pageSize);
  }, [filteredRequests, currentRequestsPage, pageSize]);

  const totalWorkbenchCount = commissions.length;
  const totalWorkbenchPages = Math.max(1, Math.ceil(totalWorkbenchCount / pageSize));
  const paginatedCommissions = useMemo(() => {
    const startIndex = (currentWorkbenchPage - 1) * pageSize;
    return commissions.slice(startIndex, startIndex + pageSize);
  }, [commissions, currentWorkbenchPage, pageSize]);

  // ─── Action Handlers ────────────────────────────────────────────────────────
  const handleOpenInspect = (req: CustomClientRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRequest(req);
    setInspectModalVisible(true);
  };

  const handleOpenOfferSheet = (req: CustomClientRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveRequest(req);
    setOfferStep(1);
    setBidPrice(req.myExistingBid ? req.myExistingBid.price : req.budget);
    setCustomPriceInput('');
    setDeliveryDays(req.myExistingBid ? req.myExistingBid.days : 14);
    setWeeksInput(String(Math.ceil((req.myExistingBid ? req.myExistingBid.days : 14) / 7)));
    setProposalNotes(req.myExistingBid ? req.myExistingBid.notes : '');
    setInspectModalVisible(false);
    setOfferModalVisible(true);
  };

  const handleMessageClient = async (req: CustomClientRequest) => {
    if (!req.myExistingBid) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      showToast('Submit a custom offer first to unlock client chat', 'error');
      return;
    }

    if (messagingRequestId === req.id) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMessagingRequestId(req.id);

    try {
      const targetChatId = req.chatId || req.id;
      await triggerGetChatRoom(targetChatId).unwrap();
      setInspectModalVisible(false);
      router.push({
        pathname: '/(vendor)/messenger',
        params: {
          chatId: targetChatId,
          clientName: req.customer.name,
          requestTitle: req.title,
        },
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const status = err?.status;
      const backendMsg = err?.data?.message || err?.data?.error?.message;
      const errorMsg =
        status === 403
          ? 'Submit a custom offer first to join this client chat'
          : backendMsg || 'Unable to open chat right now. Please try again.';
      showToast(errorMsg, 'error');
    } finally {
      setMessagingRequestId(null);
    }
  };

  const handleAcceptClientBudget = () => {
    if (!activeRequest) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setBidPrice(activeRequest.budget);
    setOfferStep(2);
  };

  const handleSubmitBid = async () => {
    if (!activeRequest) return;
    setSubmittingBid(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const calculatedTimeline = new Date(Date.now() + deliveryDays * 86400000).toISOString();
      await createCustomBidMutation({
        customRequestId: activeRequest.id,
        price: bidPrice,
        proposedTimeline: calculatedTimeline,
        notes: proposalNotes.trim() || undefined,
      }).unwrap();

      const updatedBid = {
        price: bidPrice,
        days: deliveryDays,
        status: 'PENDING' as const,
        notes: proposalNotes,
      };

      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeRequest.id
            ? {
                ...r,
                bidsCount: r.myExistingBid ? r.bidsCount : r.bidsCount + 1,
                myExistingBid: updatedBid,
              }
            : r
        )
      );

      setActiveRequest((prev) =>
        prev && prev.id === activeRequest.id
          ? {
              ...prev,
              bidsCount: prev.myExistingBid ? prev.bidsCount : prev.bidsCount + 1,
              myExistingBid: updatedBid,
            }
          : prev
      );

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setOfferModalVisible(false);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 2400);
      showToast('Bid submitted! Client chat is now unlocked.', 'success');
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const errorMsg =
        err?.data?.message ||
        err?.data?.error?.message ||
        'Failed to submit bid. Please check your connection and try again.';
      showToast(errorMsg, 'error');
    } finally {
      setSubmittingBid(false);
    }
  };

  const handlePassOnRequest = () => {
    if (!activeRequest) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setInspectModalVisible(false);
    showToast(`Passed on ${activeRequest.id}. Removed from priority queue.`);
  };

  const handleOpenMilestoneModal = (comm: ActiveWorkbenchCommission) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommission(comm);
    setSelectedNewStage(comm.stage);
    setMilestoneNote(comm.recentUpdateNote || '');
    setMilestoneModalVisible(true);
  };

  const handleAdvanceStage = async () => {
    if (!activeCommission) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newPercent = STAGE_CONFIG[selectedNewStage].percent;

    try {
      if (milestoneNote.trim()) {
        await updateProductionProgressMutation({
          id: activeCommission.id,
          data: {
            message: milestoneNote.trim(),
          },
        }).unwrap();
      }
    } catch (err) {
      console.warn('Production progress update failed:', err);
    }

    setCommissions((prev) =>
      prev.map((c) =>
        c.id === activeCommission.id
          ? {
              ...c,
              stage: selectedNewStage,
              progressPercent: newPercent,
              recentUpdateNote: milestoneNote.trim() || c.recentUpdateNote,
            }
          : c
      )
    );

    setMilestoneModalVisible(false);
    showToast(`Updated to ${STAGE_CONFIG[selectedNewStage].label}`);
  };

  const handleOpenLightbox = (images: string[], index: number = 0) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLightboxImages(images);
    setLightboxIndex(index);
    setImageLightboxVisible(true);
  };

  const handleNextLightboxImage = () => {
    if (lightboxIndex < lightboxImages.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLightboxIndex(lightboxIndex + 1);
    }
  };

  const handlePrevLightboxImage = () => {
    if (lightboxIndex > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setLightboxIndex(lightboxIndex - 1);
    }
  };

  const renderRequestItem = (req: CustomClientRequest) => {
    const hasBid = Boolean(req.myExistingBid);
    const locationResolved = resolveRequestLocation(req);
    const { displayName, initials } = formatClientName(req.customer.name);
    const formattedDate = new Date(req.deadlineDate).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    return (
      <View
        style={[
          styles.requestCard,
          {
            backgroundColor: theme.card,
            borderColor: hasBid
              ? isDark
                ? '#D1995A'
                : theme.primary
              : theme.borderSubtle,
          },
        ]}
      >
        {/* Top Row: Patron Avatar Column & Content Header */}
        <View style={styles.requestCardHeader}>
          <View style={styles.clientRow}>
            <View
              style={[
                styles.clientAvatar,
                {
                  backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FCF4E1',
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.clientAvatarText, { color: isDark ? '#D1995A' : theme.primary }]}>
                {initials}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.clientName, { color: theme.textPrimary }]} numberOfLines={1}>
                  {displayName}
                </Text>
                {req.customer.verified && (
                  <Ionicons
                    name="checkmark-circle"
                    size={13}
                    color="#009D1A"
                    style={{ marginLeft: 4 }}
                  />
                )}
              </View>
              {locationResolved && (
                <Text style={[styles.clientLocation, { color: theme.textMuted }]} numberOfLines={1}>
                  {locationResolved}
                </Text>
              )}
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: hasBid
                  ? 'rgba(0, 157, 26, 0.14)'
                  : isDark
                  ? 'rgba(209, 153, 90, 0.16)'
                  : '#FEF3C7',
                borderColor: hasBid ? 'rgba(0, 157, 26, 0.3)' : theme.borderSubtle,
              },
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                { color: hasBid ? '#009D1A' : isDark ? '#FFD79E' : '#92400E' },
              ]}
            >
              {hasBid ? 'OFFER SENT' : `${req.daysRemaining}d left`}
            </Text>
          </View>
        </View>

        {/* Title & Description */}
        <Text style={[styles.requestTitle, { color: theme.textPrimary }]}>{req.title}</Text>
        <Text style={[styles.requestDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {req.description}
        </Text>

        {/* Inspiration Photo Thumbnails with Fullscreen Lightbox Trigger */}
        {req.inspirationImages.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.photoStrip}
            contentContainerStyle={{ gap: 8 }}
          >
            {req.inspirationImages.map((imgUrl, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => handleOpenLightbox(req.inspirationImages, i)}
                activeOpacity={0.85}
                style={[styles.photoThumb, { borderColor: theme.borderSubtle }]}
              >
                <Image source={{ uri: imgUrl }} style={styles.photoThumbImg} />
                {i === 2 && req.inspirationImages.length > 3 && (
                  <View style={styles.morePhotosOverlay}>
                    <Text style={styles.morePhotosText}>+{req.inspirationImages.length - 3}</Text>
                  </View>
                )}
                <View style={styles.zoomOverlay}>
                  <Ionicons name="expand-outline" size={10} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Web Parity Specs Strip: Qty + Big Price + Deliver by clock pill */}
        <View
          style={[
            styles.specsBox,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.borderSubtle,
            },
          ]}
        >
          <View style={{ flex: 1 }}>
            <View style={styles.qtyAndBudgetRow}>
              <Text style={[styles.specLabel, { color: theme.textMuted }]}>
                QTY: {req.quantity ?? 1}
              </Text>
            </View>
            <Text style={[styles.specValueBudget, { color: theme.primary }]}>
              {formatPriceValue(req.budget)}
            </Text>
          </View>

          <View style={[styles.specDivider, { backgroundColor: theme.borderSubtle }]} />

          <View style={{ flex: 1.3, paddingLeft: 12 }}>
            <View style={[styles.deliverByPill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)' }]}>
              <Ionicons name="time-outline" size={12} color={theme.textSecondary} style={{ marginRight: 4 }} />
              <Text style={[styles.deliverByText, { color: theme.textSecondary }]} numberOfLines={1}>
                Deliver by: <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsBold }}>{formattedDate}</Text>
              </Text>
            </View>
            <Text style={[styles.materialSubText, { color: theme.textMuted }]} numberOfLines={1}>
              {req.materialType}
            </Text>
          </View>
        </View>

        {/* Action Buttons Row with Direct Message Client Integration */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => handleMessageClient(req)}
            disabled={messagingRequestId === req.id}
            style={[
              styles.messageBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.borderSubtle,
                opacity: !hasBid ? 0.55 : messagingRequestId === req.id ? 0.75 : 1,
              },
            ]}
            activeOpacity={0.75}
          >
            {messagingRequestId === req.id ? (
              <>
                <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.messageBtnText, { color: theme.textPrimary }]}>Opening...</Text>
              </>
            ) : (
              <>
                <Ionicons
                  name={hasBid ? 'chatbubble-ellipses-outline' : 'lock-closed-outline'}
                  size={14}
                  color={hasBid ? theme.textPrimary : theme.textMuted}
                  style={{ marginRight: 4 }}
                />
                <Text style={[styles.messageBtnText, { color: hasBid ? theme.textPrimary : theme.textMuted }]}>
                  Message
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenInspect(req)}
            style={[
              styles.inspectBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.borderSubtle,
              },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons name="eye-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
            <Text style={[styles.inspectBtnText, { color: theme.textPrimary }]}>Inspect Spec</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenOfferSheet(req)}
            style={[
              styles.offerBtn,
              {
                backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name={hasBid ? 'create-outline' : 'paper-plane-outline'}
              size={14}
              color={isDark ? '#D1995A' : theme.primary}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.offerBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
              {hasBid ? 'Adjust Offer' : 'Send Offer'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderCommissionItem = (comm: ActiveWorkbenchCommission) => {
    const stageMeta = STAGE_CONFIG[comm.stage];
    return (
      <View
        style={[
          styles.commissionCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        {/* Header Strip with Stage Badge */}
        <View style={styles.commCardHeader}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <Text style={[styles.commIdBadge, { color: isDark ? '#D1995A' : theme.primary }]}>
              {comm.id}
            </Text>
            <Text style={[styles.commTitle, { color: theme.textPrimary }]} numberOfLines={1}>
              {comm.title}
            </Text>
          </View>

          <View
            style={[
              styles.stageBadge,
              {
                backgroundColor: isDark ? stageMeta.bgDark : stageMeta.bgLight,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            <Ionicons name={stageMeta.icon} size={12} color={stageMeta.color} style={{ marginRight: 4 }} />
            <Text style={[styles.stageBadgeText, { color: stageMeta.color }]}>{stageMeta.label}</Text>
          </View>
        </View>

        {/* Client & Agreed Value Row */}
        <View style={styles.commMetaRow}>
          <Text style={[styles.commClientText, { color: theme.textSecondary }]} numberOfLines={1}>
            Client: <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.headingBold }}>{comm.client.name}</Text> • {comm.client.location}
          </Text>
          <Text style={[styles.commPriceText, { color: theme.textPrimary }]}>
            {formatPriceValue(comm.agreedPrice)}
          </Text>
        </View>

        {/* Progress Track */}
        <View style={styles.progressWrap}>
          <View style={styles.progressHeaderRow}>
            <Text style={[styles.progressLabel, { color: theme.textMuted }]}>
              Stage Progress ({comm.progressPercent}%)
            </Text>
            <Text style={[styles.progressDeadline, { color: theme.textMuted }]}>
              Due: {comm.targetCompletionDate} ({comm.daysRemaining}d left)
            </Text>
          </View>
          <View
            style={[
              styles.progressTrack,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  width: `${comm.progressPercent}%`,
                  backgroundColor: stageMeta.color,
                },
              ]}
            />
          </View>
        </View>

        {/* Action Row */}
        <View style={styles.commActionRow}>
          {comm.client.phone && (
            <TouchableOpacity
              onPress={() => Linking.openURL(`tel:${comm.client.phone}`)}
              style={[
                styles.commContactBtn,
                { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons name="call-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.commContactBtnText, { color: theme.textPrimary }]}>Call Client</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(vendor)/messenger',
                params: {
                  chatId: comm.chatId || comm.requestId || comm.id,
                  clientName: comm.client.name,
                  requestTitle: comm.title,
                },
              })
            }
            style={[
              styles.commContactBtn,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
            <Text style={[styles.commContactBtnText, { color: theme.textPrimary }]}>Message</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleOpenMilestoneModal(comm)}
            style={[
              styles.commUpdateBtn,
              {
                backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
              },
            ]}
            activeOpacity={0.8}
          >
            <Ionicons
              name="checkmark-circle-outline"
              size={15}
              color={isDark ? '#D1995A' : theme.primary}
              style={{ marginRight: 5 }}
            />
            <Text style={[styles.commUpdateBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
              Update Stage
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderListEmpty = () => {
    if (hubTab === 'OPEN_REQUESTS') {
      if (isMarketplaceLoading || (isMarketplaceFetching && requests.length === 0)) {
        return <VendorStudioRequestsSkeleton count={3} />;
      }
      if (marketplaceError) {
        return (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: theme.card, borderColor: '#EF4444' },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Unable to Load Requests</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              There was a problem communicating with the studio marketplace server.
            </Text>
            <TouchableOpacity onPress={() => refetchMarketplace()} style={styles.emptyActionBtn}>
              <Text style={styles.emptyActionBtnText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        );
      }
      return (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.card, borderColor: theme.borderSubtle },
          ]}
        >
          <Ionicons name="sparkles-outline" size={36} color={theme.primary} />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Requests Found</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            {requestSegment === 'OFFERED'
              ? 'You have not submitted offers for any requests yet.'
              : 'No custom requests match your selected filters.'}
          </Text>
          {hasActiveFilters && (
            <TouchableOpacity onPress={clearAllFilters} style={styles.emptyActionBtn}>
              <Text style={styles.emptyActionBtnText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }

    if (isWorkbenchLoading || (isWorkbenchFetching && commissions.length === 0)) {
      return <VendorStudioWorkbenchSkeleton count={2} />;
    }
    if (workbenchError) {
      return (
        <View
          style={[
            styles.emptyCard,
            { backgroundColor: theme.card, borderColor: '#EF4444' },
          ]}
        >
          <Ionicons name="alert-circle-outline" size={36} color="#EF4444" />
          <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>Unable to Load Workbench</Text>
          <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
            There was a problem retrieving your active production commissions from the studio server.
          </Text>
          <TouchableOpacity onPress={() => refetchWorkbench()} style={styles.emptyActionBtn}>
            <Text style={styles.emptyActionBtnText}>Retry Connection</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return (
      <View
        style={[
          styles.emptyCard,
          { backgroundColor: theme.card, borderColor: theme.borderSubtle },
        ]}
      >
        <Ionicons name="construct-outline" size={36} color={theme.primary} />
        <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Active Commissions</Text>
        <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
          All studio pieces are currently completed or waiting for client offers.
        </Text>
      </View>
    );
  };

  const renderListFooter = () => {
    const isRequests = hubTab === 'OPEN_REQUESTS';
    const isLoading = isRequests ? isMarketplaceLoading : isWorkbenchLoading;
    const hasError = isRequests ? !!marketplaceError : !!workbenchError;
    const totalCount = isRequests ? totalRequestsCount : totalWorkbenchCount;
    const currentPage = isRequests ? currentRequestsPage : currentWorkbenchPage;
    const totalPages = isRequests ? totalRequestsPages : totalWorkbenchPages;
    const setPage = isRequests ? setCurrentRequestsPage : setCurrentWorkbenchPage;

    return (
      <View>
        {!isLoading && !hasError && totalCount > pageSize && (
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
              borderColor: theme.borderSubtle,
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
                borderColor: theme.borderSubtle,
                opacity: currentPage <= 1 ? 0.45 : 1,
              }}
              disabled={currentPage <= 1}
              onPress={() => {
                Haptics.selectionAsync();
                setPage((p) => Math.max(1, p - 1));
              }}
            >
              <Ionicons
                name="chevron-back"
                size={15}
                color={currentPage <= 1 ? theme.textMuted : theme.textPrimary}
              />
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: FontFamily.poppinsBold,
                  marginHorizontal: 4,
                  color: currentPage <= 1 ? theme.textMuted : theme.textPrimary,
                }}
              >
                Previous
              </Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 12, fontFamily: FontFamily.poppinsMedium, color: theme.textSecondary }}>
              Page <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsBold }}>{currentPage}</Text> of{' '}
              <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsBold }}>{totalPages}</Text>
            </Text>

            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: currentPage >= totalPages ? theme.borderSubtle : theme.primary,
                backgroundColor: currentPage >= totalPages ? 'transparent' : theme.primary,
                opacity: currentPage >= totalPages ? 0.45 : 1,
              }}
              disabled={currentPage >= totalPages}
              onPress={() => {
                Haptics.selectionAsync();
                setPage((p) => Math.min(totalPages, p + 1));
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontFamily: FontFamily.poppinsBold,
                  marginHorizontal: 4,
                  color: currentPage >= totalPages ? theme.textMuted : '#FFFFFF',
                }}
              >
                Next
              </Text>
              <Ionicons
                name="chevron-forward"
                size={15}
                color={currentPage >= totalPages ? theme.textMuted : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing for bottom navigation bar */}
        <View style={{ height: Math.max(insets.bottom, 16) + 120 }} />
      </View>
    );
  };

  const listHeaderElement = (
    <View>
      {/* ── 1. Header & Counter Badges ── */}
      <View style={styles.headerRow}>
        <View style={styles.headerTitleGroup}>
          <Text style={[styles.pageTitle, { color: theme.textPrimary }]}>
            Ethnikraft Studio
          </Text>
          <View style={[styles.countBadge, { backgroundColor: 'rgba(196, 108, 39, 0.16)' }]}>
            <Text style={[styles.countBadgeText, { color: isDark ? '#D1995A' : theme.primary }]}>
              {hubTab === 'OPEN_REQUESTS' ? `${allRequestsCount} Requests` : `${activeWorkbenchCount} Active`}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          onPress={onRefresh}
          style={[styles.headerRefreshBtn, { backgroundColor: theme.card, borderColor: theme.borderSubtle }]}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh" size={17} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* ── 2. Option B: Executive Hero Card + 2 Split Sub-Cards ── */}
      <View style={styles.optionBContainer}>
        {/* Top Hero Card: Total Studio Pipeline */}
        <View
          style={[
            styles.heroMetricCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.heroMetricTopRow}>
            <View
              style={[
                styles.heroPillBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(10, 210, 79, 0.12)'
                    : 'rgba(0, 157, 26, 0.08)',
                },
              ]}
            >
              <TrendingUpFigmaIcon size={6} color={isDark ? '#0AD24F' : '#009D1A'} />
              <Text
                style={[
                  styles.heroPillText,
                  { color: isDark ? '#0AD24F' : '#009D1A' },
                ]}
              >
                Live Pipeline
              </Text>
            </View>

            <View
              style={[
                styles.heroCountPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text style={[styles.heroCountPillText, { color: theme.textSecondary }]}>
                {activeWorkbenchCount} In Studio
              </Text>
            </View>
          </View>

          <View style={styles.heroValueRow}>
            <Text
              style={[styles.heroValueText, { color: theme.textPrimary }]}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {formatPriceValue(totalInStudioValue)}
            </Text>
          </View>

          <Text style={[styles.heroSubtitleText, { color: theme.textMuted }]}>
            Total Studio Pipeline
          </Text>

          {/* Studio Health / Progress Track */}
          <View style={styles.heroProgressSection}>
            <View
              style={[
                styles.heroProgressTrack,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)' },
              ]}
            >
              <View
                style={[
                  styles.heroProgressBar,
                  {
                    width: `${Math.max(8, avgProgress)}%`,
                    backgroundColor: isDark ? theme.textGold : theme.primary,
                  },
                ]}
              />
            </View>
            <View style={styles.heroProgressInfoRow}>
              <Text style={[styles.heroProgressInfoText, { color: theme.textSecondary }]}>
                Workbench Crafting Health
              </Text>
              <Text
                style={[
                  styles.heroProgressPercentText,
                  { color: isDark ? theme.textGold : theme.primary },
                ]}
              >
                {avgProgress}% avg progress
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Split Row: 2 Secondary Cards */}
        <View style={styles.splitRow}>
          {/* Split Card 1: Open Bespoke Inquiries */}
          <View
            style={[
              styles.splitCard,
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
                Open Inquiries
              </Text>
            </View>

            <View style={styles.kpiValueRow}>
              <Text style={[styles.kpiValueText, { color: theme.textPrimary }]}>
                {allRequestsCount} Requests
              </Text>
            </View>

            <Text style={styles.kpiSubtitleText}>Client Briefs</Text>
          </View>

          {/* Split Card 2: In Crafting */}
          <View
            style={[
              styles.splitCard,
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
                Workbench
              </Text>
            </View>

            <View style={styles.kpiValueRow}>
              <Text
                style={[
                  styles.kpiValueText,
                  { color: isDark ? '#D1995A' : theme.primary },
                ]}
              >
                {activeWorkbenchCount} {activeWorkbenchCount === 1 ? 'Piece' : 'Pieces'}
              </Text>
            </View>

            <Text style={styles.kpiSubtitleText}>In Crafting</Text>
          </View>
        </View>
      </View>

      {/* ── 3. Segmented 2-Way Tab Switcher ── */}
      <View
        style={[
          styles.tabTrack,
          {
            backgroundColor: theme.card,
            borderColor: theme.borderSubtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setHubTab('OPEN_REQUESTS');
          }}
          style={[
            styles.tabSegment,
            hubTab === 'OPEN_REQUESTS' && [
              styles.tabSegmentActive,
              {
                backgroundColor: isDark ? theme.cardElevated : '#FFFFFF',
                borderColor: isDark ? theme.borderAccent : 'rgba(54, 19, 0, 0.12)',
              },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="hammer-outline"
            size={15}
            color={hubTab === 'OPEN_REQUESTS' ? (isDark ? theme.textGold : theme.primary) : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabSegmentText,
              {
                color: hubTab === 'OPEN_REQUESTS' ? theme.textPrimary : theme.textMuted,
                fontFamily: hubTab === 'OPEN_REQUESTS' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
              },
            ]}
          >
            Client Requests ({allRequestsCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setHubTab('ACTIVE_WORKBENCH');
          }}
          style={[
            styles.tabSegment,
            hubTab === 'ACTIVE_WORKBENCH' && [
              styles.tabSegmentActive,
              {
                backgroundColor: isDark ? theme.cardElevated : '#FFFFFF',
                borderColor: isDark ? theme.borderAccent : 'rgba(54, 19, 0, 0.12)',
              },
            ],
          ]}
          activeOpacity={0.8}
        >
          <Ionicons
            name="construct-outline"
            size={15}
            color={hubTab === 'ACTIVE_WORKBENCH' ? (isDark ? theme.textGold : theme.primary) : theme.textMuted}
            style={{ marginRight: 6 }}
          />
          <Text
            style={[
              styles.tabSegmentText,
              {
                color: hubTab === 'ACTIVE_WORKBENCH' ? theme.textPrimary : theme.textMuted,
                fontFamily: hubTab === 'ACTIVE_WORKBENCH' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
              },
            ]}
          >
            Workbench ({activeWorkbenchCount})
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── TAB 1 HEADER CONTROLS: OPEN CLIENT REQUESTS (WEB PARITY) ─── */}
      {hubTab === 'OPEN_REQUESTS' && (
        <View>
          {/* Search Input Bar + Filter Trigger */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchBar,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Ionicons name="search" size={17} color={theme.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: theme.textPrimary }]}
                placeholder="Search requests, materials, or locations..."
                placeholderTextColor={theme.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterModalVisible(true);
              }}
              style={[
                styles.filterTriggerBtn,
                {
                  backgroundColor: hasActiveFilters ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.card,
                  borderColor: hasActiveFilters ? (isDark ? '#D1995A' : theme.primary) : theme.borderSubtle,
                },
              ]}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={18}
                color={hasActiveFilters ? (isDark ? '#FFD79E' : theme.primary) : theme.textSecondary}
              />
              {hasActiveFilters && <View style={styles.filterActiveDot} />}
            </TouchableOpacity>
          </View>

          {/* ── Web Parity Sub-Segments: All Requests vs Offers Sent ── */}
          <View style={styles.subSegmentWrapper}>
            <View
              style={[
                styles.subSegmentTrack,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#EAEDED' },
              ]}
            >
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequestSegment('ALL');
                }}
                style={[
                  styles.subSegmentBtn,
                  requestSegment === 'ALL' && [
                    styles.subSegmentBtnActive,
                    {
                      backgroundColor: isDark ? theme.cardElevated : theme.primary,
                    },
                  ],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    {
                      color: requestSegment === 'ALL' ? '#FFFFFF' : theme.textSecondary,
                      fontFamily: requestSegment === 'ALL' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                    },
                  ]}
                >
                  All Requests ({allRequestsCount})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setRequestSegment('OFFERED');
                }}
                style={[
                  styles.subSegmentBtn,
                  requestSegment === 'OFFERED' && [
                    styles.subSegmentBtnActive,
                    {
                      backgroundColor: isDark ? theme.cardElevated : theme.primary,
                    },
                  ],
                ]}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.subSegmentText,
                    {
                      color: requestSegment === 'OFFERED' ? '#FFFFFF' : theme.textSecondary,
                      fontFamily: requestSegment === 'OFFERED' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                    },
                  ]}
                >
                  Offers Sent ({offeredRequestsCount})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Active Filter Chips Bar (Web Parity) */}
          {hasActiveFilters && (
            <View style={styles.activeFiltersBar}>
              <Text style={[styles.activeFilterLabel, { color: theme.textMuted }]}>Active:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {isCategoryFiltered &&
                  selectedCategories.map((catKey) => {
                    const catLabel = CATEGORY_CHIPS.find((c) => c.id === catKey)?.label || catKey;
                    return (
                      <View
                        key={`cat-${catKey}`}
                        style={[
                          styles.activeFilterChip,
                          { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FEF3C7', borderColor: theme.borderAccent },
                        ]}
                      >
                        <Text style={[styles.activeFilterChipText, { color: isDark ? '#FFD79E' : theme.primary }]}>
                          {catLabel}
                        </Text>
                        <TouchableOpacity onPress={() => toggleCategory(catKey)}>
                          <Ionicons name="close" size={13} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                {isStatusFiltered &&
                  selectedStatuses.map((stKey) => {
                    const stLabel = stKey === 'OPEN' ? 'Open Inquiries' : stKey === 'PENDING' ? 'Offers Pending' : stKey;
                    return (
                      <View
                        key={`st-${stKey}`}
                        style={[
                          styles.activeFilterChip,
                          { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FEF3C7', borderColor: theme.borderAccent },
                        ]}
                      >
                        <Text style={[styles.activeFilterChipText, { color: isDark ? '#FFD79E' : theme.primary }]}>
                          {stLabel}
                        </Text>
                        <TouchableOpacity onPress={() => toggleStatus(stKey)}>
                          <Ionicons name="close" size={13} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                {isMaterialFiltered &&
                  selectedMaterials.map((matKey) => {
                    return (
                      <View
                        key={`mat-${matKey}`}
                        style={[
                          styles.activeFilterChip,
                          { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FEF3C7', borderColor: theme.borderAccent },
                        ]}
                      >
                        <Text style={[styles.activeFilterChipText, { color: isDark ? '#FFD79E' : theme.primary }]}>
                          {matKey}
                        </Text>
                        <TouchableOpacity onPress={() => toggleMaterial(matKey)}>
                          <Ionicons name="close" size={13} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                {sortFilter !== 'recent' && (
                  <View
                    style={[
                      styles.activeFilterChip,
                      { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FEF3C7', borderColor: theme.borderAccent },
                    ]}
                  >
                    <Text style={[styles.activeFilterChipText, { color: isDark ? '#FFD79E' : theme.primary }]}>
                      {sortFilter === 'oldest' ? 'Oldest First' : sortFilter === 'budget_high' ? 'Highest Budget' : 'Lowest Budget'}
                    </Text>
                    <TouchableOpacity onPress={() => setSortFilter('recent')}>
                      <Ionicons name="close" size={13} color={theme.primary} />
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllBtn}>
                  <Text style={[styles.clearAllText, { color: theme.textMuted }]}>Clear all</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          )}

          {/* Category Filter Chips Horizontal */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCarousel}
          >
            {CATEGORY_CHIPS.map((cat) => {
              const isSelected = selectedCategories.includes(cat.id);
              return (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => toggleCategory(cat.id)}
                  style={[
                    styles.categoryPill,
                    {
                      backgroundColor: isSelected
                        ? isDark
                          ? 'rgba(196, 108, 39, 0.18)'
                          : '#FEF3C7'
                        : theme.card,
                      borderColor: isSelected
                        ? isDark
                          ? '#D1995A'
                          : theme.primary
                        : theme.borderSubtle,
                    },
                  ]}
                  activeOpacity={0.8}
                >
                  {isSelected && cat.id !== 'ALL' ? (
                    <Ionicons
                      name="checkmark"
                      size={13}
                      color={isDark ? '#FFD79E' : theme.primary}
                      style={{ marginRight: 4 }}
                    />
                  ) : (
                    <Ionicons
                      name={cat.icon}
                      size={13}
                      color={isSelected ? (isDark ? '#FFD79E' : theme.primary) : theme.textMuted}
                      style={{ marginRight: 5 }}
                    />
                  )}
                  <Text
                    style={[
                      styles.categoryPillText,
                      {
                        color: isSelected ? (isDark ? '#FFD79E' : theme.primary) : theme.textSecondary,
                        fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Toast Notification */}
      {toastMessage && (
        <View
          style={[
            styles.toastContainer,
            {
              backgroundColor: theme.cardElevated,
              borderColor: toastType === 'error' ? '#EF4444' : theme.borderAccent,
            },
          ]}
        >
          <Ionicons
            name={toastType === 'error' ? 'alert-circle' : 'checkmark-circle'}
            size={18}
            color={toastType === 'error' ? '#EF4444' : '#009D1A'}
            style={{ marginRight: 8 }}
          />
          <Text style={[styles.toastText, { color: theme.textPrimary }]}>{toastMessage}</Text>
        </View>
      )}

      {/* Main Virtualized List Container */}
      <FlatList
        data={
          hubTab === 'OPEN_REQUESTS'
            ? isMarketplaceLoading || !!marketplaceError
              ? []
              : paginatedRequests
            : isWorkbenchLoading || !!workbenchError
            ? []
            : (paginatedCommissions as any[])
        }
        keyExtractor={(item: any) => item.id}
        renderItem={({ item }: { item: any }) =>
          hubTab === 'OPEN_REQUESTS'
            ? renderRequestItem(item as CustomClientRequest)
            : renderCommissionItem(item as ActiveWorkbenchCommission)
        }
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={renderListEmpty}
        ListFooterComponent={renderListFooter}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary, theme.accentGold]}
          />
        }
      />

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 1: 85% INSPECT SPEC BOTTOM SHEET (WITH DIRECT MESSAGING & LIGHTBOX)
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setInspectModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setInspectModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.20)'
                      : 'rgba(54, 19, 0, 0.20)',
                  },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <TouchableOpacity onPress={() => setInspectModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Request Specification</Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#D1995A' : theme.primary }]}>
                  {activeRequest ? activeRequest.id : 'COMMISSION BRIEF'}
                </Text>
              </View>
              <View style={{ width: 32 }} />
            </View>

            {activeRequest && (
              <ScrollView
                style={styles.modalBodyScroll}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Client Profile Card with Direct "Message Client" CTA */}
                <View
                  style={[
                    styles.inspectClientCard,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View
                    style={[
                      styles.clientAvatar,
                      {
                        width: 44,
                        height: 44,
                        borderRadius: 22,
                        backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FCF4E1',
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text style={[styles.clientAvatarText, { color: isDark ? '#D1995A' : theme.primary, fontSize: 18 }]}>
                      {formatClientName(activeRequest.customer.name).initials}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.clientName, { color: theme.textPrimary, fontSize: 16 }]}>
                      {activeRequest.customer.name}
                    </Text>
                    <Text style={[styles.clientLocation, { color: theme.textMuted }]}>
                      {resolveRequestLocation(activeRequest) || activeRequest.customer.location}
                    </Text>
                    <Text style={[styles.clientOrdersBadge, { color: isDark ? '#D1995A' : theme.primary }]}>
                      ★ 5.0 • {activeRequest.customer.completedOrders} bespoke orders completed
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleMessageClient(activeRequest)}
                    disabled={messagingRequestId === activeRequest.id}
                    style={[
                      styles.inspectMessageIconBtn,
                      {
                        backgroundColor: isDark ? 'rgba(196, 108, 39, 0.18)' : '#FEF3C7',
                        opacity: !activeRequest.myExistingBid ? 0.5 : 1,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    {messagingRequestId === activeRequest.id ? (
                      <ActivityIndicator size="small" color={theme.primary} />
                    ) : (
                      <Ionicons
                        name={activeRequest.myExistingBid ? 'chatbubble-ellipses' : 'lock-closed-outline'}
                        size={16}
                        color={activeRequest.myExistingBid ? theme.primary : theme.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Title & Description */}
                <Text style={[styles.inspectTitleText, { color: theme.textPrimary }]}>{activeRequest.title}</Text>
                <Text style={[styles.inspectDescText, { color: theme.textSecondary }]}>{activeRequest.description}</Text>

                {/* Inspiration Gallery with Fullscreen Lightbox trigger */}
                {activeRequest.inspirationImages.length > 0 && (
                  <View style={{ marginTop: 16 }}>
                    <View style={styles.galleryHeaderRow}>
                      <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                        Inspiration Photos ({activeRequest.inspirationImages.length})
                      </Text>
                      <TouchableOpacity onPress={() => handleOpenLightbox(activeRequest.inspirationImages, 0)}>
                        <Text style={[styles.fullscreenLink, { color: isDark ? '#D1995A' : theme.primary }]}>
                          View Fullscreen
                        </Text>
                      </TouchableOpacity>
                    </View>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                      {activeRequest.inspirationImages.map((img, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => handleOpenLightbox(activeRequest.inspirationImages, idx)}
                          style={[styles.inspectGalleryThumb, { borderColor: theme.borderSubtle }]}
                          activeOpacity={0.85}
                        >
                          <Image source={{ uri: img }} style={styles.inspectGalleryThumbImg} />
                          <View style={styles.zoomBadgeCorner}>
                            <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Specifications Strip (Quantity, Budget, Delivery Deadline) */}
                <View
                  style={[
                    styles.specsBox,
                    {
                      backgroundColor: theme.backgroundSecondary,
                      borderColor: theme.borderSubtle,
                      marginTop: 18,
                    },
                  ]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.specLabel, { color: theme.textMuted }]}>TARGET BUDGET</Text>
                    <Text style={[styles.specValueBudget, { color: theme.primary }]}>
                      {formatPriceValue(activeRequest.budget)}
                    </Text>
                  </View>
                  <View style={[styles.specDivider, { backgroundColor: theme.borderSubtle }]} />
                  <View style={{ flex: 1.2, paddingLeft: 12 }}>
                    <Text style={[styles.specLabel, { color: theme.textMuted }]}>DEADLINE & QTY</Text>
                    <Text style={[styles.specValueMaterial, { color: theme.textPrimary }]}>
                      {activeRequest.deadlineDate} • Qty {activeRequest.quantity ?? 1}
                    </Text>
                  </View>
                </View>

                {/* Material & Quality Details */}
                <View
                  style={[
                    styles.materialDetailBox,
                    { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.materialRow}>
                    <Text style={[styles.materialKeyText, { color: theme.textMuted }]}>Material:</Text>
                    <Text style={[styles.materialValText, { color: theme.textPrimary }]}>
                      {activeRequest.materialType}
                    </Text>
                  </View>
                  <View style={styles.materialRow}>
                    <Text style={[styles.materialKeyText, { color: theme.textMuted }]}>Quality Spec:</Text>
                    <Text style={[styles.materialValText, { color: theme.textPrimary }]}>
                      {activeRequest.materialQuality}
                    </Text>
                  </View>
                  {activeRequest.colors && activeRequest.colors.length > 0 && (
                    <View style={styles.materialRow}>
                      <Text style={[styles.materialKeyText, { color: theme.textMuted }]}>Colors:</Text>
                      <View style={styles.colorsPaletteWrap}>
                        {activeRequest.colors.map((c, i) => (
                          <View
                            key={i}
                            style={[styles.colorChip, { backgroundColor: theme.card, borderColor: theme.borderSubtle }]}
                          >
                            <Text style={[styles.colorChipText, { color: theme.textPrimary }]}>{c}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}
                </View>

                {/* Custom Client Measurements Grid */}
                {activeRequest.measurements && Object.keys(activeRequest.measurements).length > 0 && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                      Custom Client Measurements
                    </Text>
                    <View
                      style={[
                        styles.measurementsGrid,
                        { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                      ]}
                    >
                      {Object.entries(activeRequest.measurements).map(([key, val]) => (
                        <View key={key} style={[styles.measurementRow, { borderBottomColor: theme.borderSubtle }]}>
                          <Text style={[styles.measurementKey, { color: theme.textSecondary }]}>{key}</Text>
                          <Text style={[styles.measurementVal, { color: theme.textPrimary }]}>{val}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {/* Bottom Action Buttons */}
                <View style={{ marginTop: 22, gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => handleOpenOfferSheet(activeRequest)}
                    style={[
                      styles.modalPrimaryActionBtn,
                      {
                        backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                        borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                      },
                    ]}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name="paper-plane-outline"
                      size={16}
                      color={isDark ? '#D1995A' : theme.primary}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.modalPrimaryActionBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
                      {activeRequest.myExistingBid ? 'Adjust Submitted Offer' : 'Send Offer for this Request'}
                    </Text>
                  </TouchableOpacity>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      onPress={() => handleMessageClient(activeRequest)}
                      disabled={messagingRequestId === activeRequest.id}
                      style={[
                        styles.modalSecondaryActionBtn,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          borderColor: theme.borderSubtle,
                          flex: 1,
                          opacity: !activeRequest.myExistingBid ? 0.55 : messagingRequestId === activeRequest.id ? 0.75 : 1,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      {messagingRequestId === activeRequest.id ? (
                        <>
                          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.modalSecondaryActionBtnText, { color: theme.textPrimary }]}>Opening...</Text>
                        </>
                      ) : (
                        <>
                          <Ionicons
                            name={activeRequest.myExistingBid ? 'chatbubble-outline' : 'lock-closed-outline'}
                            size={15}
                            color={activeRequest.myExistingBid ? theme.textPrimary : theme.textMuted}
                            style={{ marginRight: 6 }}
                          />
                          <Text
                            style={[
                              styles.modalSecondaryActionBtnText,
                              { color: activeRequest.myExistingBid ? theme.textPrimary : theme.textMuted },
                            ]}
                          >
                            {activeRequest.myExistingBid ? 'Message Client' : 'Bid to Chat'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={handlePassOnRequest}
                      style={[
                        styles.modalSecondaryActionBtn,
                        { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle, flex: 1 },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="close-circle-outline" size={15} color="#DC2626" style={{ marginRight: 6 }} />
                      <Text style={[styles.modalSecondaryActionBtnText, { color: '#DC2626' }]}>Pass Request</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 2: 85% 2-STEP BID & COUNTER-OFFER BOTTOM SHEET (WEB PARITY)
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setOfferModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.20)'
                      : 'rgba(54, 19, 0, 0.20)',
                  },
                ]}
              />
            </View>

            {/* Header with Step Back Chevron */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              {offerStep === 2 ? (
                <TouchableOpacity onPress={() => setOfferStep(1)} style={styles.modalCloseBtn}>
                  <Ionicons name="chevron-back" size={22} color={theme.textPrimary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity onPress={() => setOfferModalVisible(false)} style={styles.modalCloseBtn}>
                  <Ionicons name="close" size={20} color={theme.textPrimary} />
                </TouchableOpacity>
              )}

              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                  {offerStep === 1 ? 'Step 1: Offer Strategy' : 'Step 2: Timeline & Notes'}
                </Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#D1995A' : theme.primary }]}>
                  {activeRequest?.customer.name}
                </Text>
              </View>

              <View style={{ width: 32 }} />
            </View>

            {activeRequest && (
              <ScrollView
                style={styles.modalBodyScroll}
                contentContainerStyle={{ padding: Spacing.md, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
              >
                {/* ── STEP 1: PRICING CONFIGURATION (WEB PARITY) ── */}
                {offerStep === 1 && (
                  <View>
                    <View
                      style={[
                        styles.offerTargetBanner,
                        { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                      ]}
                    >
                      <Text style={[styles.offerTargetSubtitle, { color: theme.textSecondary }]}>
                        {formatClientName(activeRequest.customer.name).firstName}&apos;s Requested Target Budget
                      </Text>
                      <Text style={[styles.offerTargetBigNum, { color: theme.textPrimary }]}>
                        {formatPriceValue(activeRequest.budget)}
                      </Text>
                      <Text style={[styles.offerTargetDays, { color: theme.textMuted }]}>
                        Target Turnaround: {activeRequest.daysRemaining} Days
                      </Text>
                    </View>

                    {/* Accept Budget Button (One-tap Web Parity) */}
                    <TouchableOpacity
                      onPress={handleAcceptClientBudget}
                      style={[
                        styles.modalPrimaryActionBtn,
                        {
                          backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                          borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                          marginTop: 14,
                        },
                      ]}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={17}
                        color={isDark ? '#D1995A' : theme.primary}
                        style={{ marginRight: 6 }}
                      />
                      <Text style={[styles.modalPrimaryActionBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
                        Accept Target Budget ({formatPriceValue(activeRequest.budget)})
                      </Text>
                    </TouchableOpacity>

                    {/* Divider */}
                    <View style={styles.orDividerRow}>
                      <View style={[styles.orDividerLine, { backgroundColor: theme.borderSubtle }]} />
                      <Text style={[styles.orDividerText, { color: theme.textMuted }]}>OR PROPOSE COUNTER OFFER</Text>
                      <View style={[styles.orDividerLine, { backgroundColor: theme.borderSubtle }]} />
                    </View>

                    {/* Quick Increments Matching Web */}
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 4 }]}>
                      Quick Increments over Budget
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                      {[5000, 15000, 25000, 35000].map((inc) => {
                        const calculated = activeRequest.budget + inc;
                        return (
                          <TouchableOpacity
                            key={inc}
                            onPress={() => {
                              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                              setBidPrice(calculated);
                              setOfferStep(2);
                            }}
                            style={[
                              styles.chipIncrement,
                              {
                                backgroundColor: theme.card,
                                borderColor: theme.borderSubtle,
                              },
                            ]}
                            activeOpacity={0.8}
                          >
                            <Text style={[styles.chipIncrementText, { color: isDark ? '#D1995A' : theme.primary }]}>
                              +{formatPriceValue(inc)} ({formatPriceValue(calculated)})
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>

                    {/* Custom Price Input */}
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Custom Offer Amount (₦)</Text>
                    <TextInput
                      style={[
                        styles.customPriceInputField,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      placeholder={String(activeRequest.budget)}
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={customPriceInput}
                      onChangeText={setCustomPriceInput}
                    />

                    <TouchableOpacity
                      onPress={() => {
                        const parsed = parseFloat(customPriceInput) || activeRequest.budget;
                        setBidPrice(parsed);
                        setOfferStep(2);
                      }}
                      style={[
                        styles.modalPrimaryActionBtn,
                        {
                          backgroundColor: customPriceInput.trim()
                            ? isDark
                              ? theme.cardElevated
                              : '#FCF4E1'
                            : isDark
                            ? 'rgba(255,255,255,0.06)'
                            : '#F0ECE6',
                          borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                          marginTop: 14,
                        },
                      ]}
                      activeOpacity={0.85}
                      disabled={!customPriceInput.trim()}
                    >
                      <Text
                        style={[
                          styles.modalPrimaryActionBtnText,
                          {
                            color: customPriceInput.trim()
                              ? isDark
                                ? '#FFF3D6'
                                : theme.primaryDark
                              : theme.textMuted,
                          },
                        ]}
                      >
                        Continue with Custom Price →
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ── STEP 2: TIMELINE, STEPPER & NOTES (WEB PARITY) ── */}
                {offerStep === 2 && (
                  <View>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary, textAlign: 'center' }]}>
                      Proposed Price Quote
                    </Text>
                    <View style={styles.priceStepperRow}>
                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBidPrice((p) => Math.max(1000, p - 1000));
                        }}
                        style={[
                          styles.stepperActionBtn,
                          { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Ionicons name="remove" size={20} color={theme.textPrimary} />
                      </TouchableOpacity>

                      <View style={styles.stepperPriceDisplay}>
                        <Text style={[styles.stepperPriceNum, { color: theme.textPrimary }]}>
                          {formatPriceValue(bidPrice)}
                        </Text>
                        <Text style={[styles.stepperPriceSub, { color: theme.textMuted }]}>Artisan Workshop Quote</Text>
                      </View>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setBidPrice((p) => p + 1000);
                        }}
                        style={[
                          styles.stepperActionBtn,
                          { backgroundColor: theme.backgroundSecondary, borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Ionicons name="add" size={20} color={theme.textPrimary} />
                      </TouchableOpacity>
                    </View>

                    {/* Timeline Input & Quick Days */}
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 18 }]}>
                      Estimated Production Time
                    </Text>

                    <View style={styles.quickDaysRow}>
                      {[7, 14, 21, 30].map((d) => (
                        <TouchableOpacity
                          key={d}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setDeliveryDays(d);
                            setWeeksInput(String(Math.ceil(d / 7)));
                          }}
                          style={[
                            styles.quickDayPill,
                            {
                              backgroundColor: deliveryDays === d ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.card,
                              borderColor: deliveryDays === d ? theme.primary : theme.borderSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.quickDayText,
                              {
                                color: deliveryDays === d ? theme.primary : theme.textSecondary,
                                fontFamily: deliveryDays === d ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                              },
                            ]}
                          >
                            {d} Days
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    <TextInput
                      style={[
                        styles.customPriceInputField,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                          marginTop: 8,
                        },
                      ]}
                      placeholder="Or enter production weeks (e.g. 2)"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={weeksInput}
                      onChangeText={(val) => {
                        setWeeksInput(val);
                        const w = parseInt(val, 10) || 1;
                        setDeliveryDays(w * 7);
                      }}
                    />
                    <Text style={[styles.timelineHelperText, { color: isDark ? '#D1995A' : theme.primary }]}>
                      📅 Ready in ~{deliveryDays} calendar days from start
                    </Text>

                    {/* Proposal Note Textarea */}
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 16 }]}>
                      Personal Proposal Note to {formatClientName(activeRequest.customer.name).displayName}
                    </Text>
                    <TextInput
                      style={[
                        styles.proposalTextArea,
                        {
                          backgroundColor: theme.backgroundSecondary,
                          color: theme.textPrimary,
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      placeholder="Describe your craftsmanship process, authentic materials, or turnaround details..."
                      placeholderTextColor={theme.textMuted}
                      multiline
                      numberOfLines={4}
                      value={proposalNotes}
                      onChangeText={setProposalNotes}
                    />

                    {/* Submit Bid Button */}
                    <TouchableOpacity
                      onPress={handleSubmitBid}
                      style={[
                        styles.modalPrimaryActionBtn,
                        {
                          backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                          borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                          marginTop: 18,
                          opacity: submittingBid || isSubmittingBidMutation ? 0.7 : 1,
                        },
                      ]}
                      activeOpacity={0.85}
                      disabled={submittingBid || isSubmittingBidMutation}
                    >
                      {submittingBid || isSubmittingBidMutation ? (
                        <ActivityIndicator
                          size="small"
                          color={isDark ? '#D1995A' : theme.primary}
                          style={{ marginRight: 8 }}
                        />
                      ) : (
                        <Ionicons
                          name="paper-plane-outline"
                          size={17}
                          color={isDark ? '#D1995A' : theme.primary}
                          style={{ marginRight: 8 }}
                        />
                      )}
                      <Text style={[styles.modalPrimaryActionBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
                        {submittingBid || isSubmittingBidMutation ? 'Dispatching Bid...' : `Submit Bid of ${formatPriceValue(bidPrice)} ✧`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 3: 72% MILESTONE UPDATER BOTTOM SHEET
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={milestoneModalVisible}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setMilestoneModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setMilestoneModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                height: '72%',
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.20)'
                      : 'rgba(54, 19, 0, 0.20)',
                  },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <TouchableOpacity onPress={() => setMilestoneModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <View style={{ alignItems: 'center' }}>
                <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Update Milestone</Text>
                <Text style={[styles.modalSubtitle, { color: isDark ? '#D1995A' : theme.primary }]} numberOfLines={1}>
                  {activeCommission?.title}
                </Text>
              </View>
              <View style={{ width: 32 }} />
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={{ padding: Spacing.md, paddingBottom: 36 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Stage Radio Cards */}
              <View style={{ gap: 8 }}>
                {(['design', 'crafting', 'inspection', 'ready_for_dispatch'] as ProductionStage[]).map((stg) => {
                  const isSelected = selectedNewStage === stg;
                  const meta = STAGE_CONFIG[stg];
                  return (
                    <TouchableOpacity
                      key={stg}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedNewStage(stg);
                      }}
                      style={[
                        styles.stageOptionCard,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? 'rgba(196, 108, 39, 0.16)'
                              : '#FEF3C7'
                            : theme.backgroundSecondary,
                          borderColor: isSelected
                            ? isDark
                              ? '#D1995A'
                              : theme.primary
                            : theme.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                        <Ionicons
                          name={meta.icon}
                          size={18}
                          color={isSelected ? (isDark ? '#FFD79E' : theme.primary) : meta.color}
                          style={{ marginRight: 10 }}
                        />
                        <View>
                          <Text
                            style={[
                              styles.stageOptionLabel,
                              {
                                color: isSelected
                                  ? isDark
                                    ? '#FFD79E'
                                    : theme.primary
                                  : theme.textPrimary,
                              },
                            ]}
                          >
                            {meta.label}
                          </Text>
                          <Text style={[styles.stageOptionPercent, { color: theme.textMuted }]}>
                            {meta.percent}% completion target
                          </Text>
                        </View>
                      </View>

                      {isSelected ? (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color={isDark ? '#D1995A' : theme.primary}
                        />
                      ) : (
                        <View style={[styles.radioCircleUnchecked, { borderColor: theme.borderSubtle }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Milestone Note */}
              <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 16 }]}>
                Production Progress Notes (Shared with Client)
              </Text>
              <TextInput
                style={[
                  styles.proposalTextArea,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    color: theme.textPrimary,
                    borderColor: theme.borderSubtle,
                  },
                ]}
                placeholder="E.g., Beads arrived from artisan collective; setting loom structure..."
                placeholderTextColor={theme.textMuted}
                multiline
                numberOfLines={3}
                value={milestoneNote}
                onChangeText={setMilestoneNote}
              />

              {/* Confirm Stage Button */}
              <TouchableOpacity
                onPress={handleAdvanceStage}
                style={[
                  styles.modalPrimaryActionBtn,
                  {
                    backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                    borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                    marginTop: 18,
                    opacity: isUpdatingProgressMutation ? 0.7 : 1,
                  },
                ]}
                activeOpacity={0.85}
                disabled={isUpdatingProgressMutation}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={17}
                  color={isDark ? '#D1995A' : theme.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.modalPrimaryActionBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
                  {isUpdatingProgressMutation ? 'Updating Milestone...' : 'Confirm Stage Update'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 4: FULLSCREEN MULTI-IMAGE LIGHTBOX WITH COUNTER
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={imageLightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageLightboxVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.lightboxBackdrop}>
          {/* Header Bar */}
          <View style={styles.lightboxHeader}>
            <Text style={styles.lightboxCounterText}>
              {lightboxImages.length > 0 ? `${lightboxIndex + 1} of ${lightboxImages.length}` : ''}
            </Text>
            <TouchableOpacity
              style={styles.lightboxCloseBtn}
              onPress={() => setImageLightboxVisible(false)}
            >
              <Ionicons name="close-circle" size={32} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Central Image View */}
          {lightboxImages[lightboxIndex] && (
            <Image
              source={{ uri: lightboxImages[lightboxIndex] }}
              style={styles.lightboxFullImage}
              resizeMode="contain"
            />
          )}

          {/* Navigation Arrows for Multi-image */}
          {lightboxImages.length > 1 && (
            <View style={styles.lightboxNavRow}>
              <TouchableOpacity
                onPress={handlePrevLightboxImage}
                disabled={lightboxIndex === 0}
                style={[styles.lightboxArrowBtn, { opacity: lightboxIndex === 0 ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-back" size={28} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleNextLightboxImage}
                disabled={lightboxIndex === lightboxImages.length - 1}
                style={[styles.lightboxArrowBtn, { opacity: lightboxIndex === lightboxImages.length - 1 ? 0.3 : 1 }]}
              >
                <Ionicons name="chevron-forward" size={28} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 5: 75% COMPREHENSIVE FILTER BOTTOM SHEET (WEB PARITY)
      ══════════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={filterModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdropDismiss}
            activeOpacity={1}
            onPress={() => setFilterModalVisible(false)}
          />
          <View
            style={[
              styles.modalSheet,
              {
                height: '75%',
                backgroundColor: theme.card,
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            {/* Sheet Handle */}
            <View style={styles.sheetHandleWrap}>
              <View
                style={[
                  styles.sheetHandle,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.20)'
                      : 'rgba(54, 19, 0, 0.20)',
                  },
                ]}
              />
            </View>

            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle }]}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Filter Inquiries</Text>
              <TouchableOpacity onPress={clearAllFilters}>
                <Text style={[styles.resetText, { color: theme.primary }]}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.modalBodyScroll}
              contentContainerStyle={{ padding: Spacing.md, paddingBottom: 36 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Filter Section: Category */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary }]}>
                Inquiry Category{isCategoryFiltered ? ` (${selectedCategories.length})` : ''}
              </Text>
              <View style={styles.filterChipsWrap}>
                {CATEGORY_CHIPS.map((cat) => {
                  const isSelected = selectedCategories.includes(cat.id);
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      onPress={() => toggleCategory(cat.id)}
                      style={[
                        styles.filterSelectChip,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.filterSelectChipText,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                          },
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter Section: Status */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary, marginTop: 18 }]}>
                Inquiry Status{isStatusFiltered ? ` (${selectedStatuses.length})` : ''}
              </Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { id: 'all', label: 'All Statuses' },
                  { id: 'OPEN', label: 'Open Inquiries' },
                  { id: 'PENDING', label: 'Offers Pending' },
                ].map((st) => {
                  const isSelected = selectedStatuses.includes(st.id as any);
                  return (
                    <TouchableOpacity
                      key={st.id}
                      onPress={() => toggleStatus(st.id as any)}
                      style={[
                        styles.filterSelectChip,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.filterSelectChipText,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                          },
                        ]}
                      >
                        {st.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Filter Section: Material */}
              {materialOptions.length > 1 && (
                <>
                  <Text style={[styles.filterSectionTitle, { color: theme.textPrimary, marginTop: 18 }]}>
                    Material Spec{isMaterialFiltered ? ` (${selectedMaterials.length})` : ''}
                  </Text>
                  <View style={styles.filterChipsWrap}>
                    {materialOptions.map((mat) => {
                      const isSelected = selectedMaterials.includes(mat);
                      return (
                        <TouchableOpacity
                          key={mat}
                          onPress={() => toggleMaterial(mat)}
                          style={[
                            styles.filterSelectChip,
                            {
                              backgroundColor: isSelected ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.backgroundSecondary,
                              borderColor: isSelected ? theme.primary : theme.borderSubtle,
                            },
                          ]}
                        >
                          {isSelected && (
                            <Ionicons name="checkmark" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                          )}
                          <Text
                            style={[
                              styles.filterSelectChipText,
                              {
                                color: isSelected ? theme.primary : theme.textPrimary,
                                fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                              },
                            ]}
                          >
                            {mat === 'all' ? 'All Materials' : mat}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Filter Section: Sort Order */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary, marginTop: 18 }]}>
                Sort Inquiries
              </Text>
              <View style={styles.filterChipsWrap}>
                {[
                  { id: 'recent', label: 'Most Recent' },
                  { id: 'oldest', label: 'Oldest First' },
                  { id: 'budget_high', label: 'Highest Budget' },
                  { id: 'budget_low', label: 'Lowest Budget' },
                ].map((s) => {
                  const isSelected = sortFilter === s.id;
                  return (
                    <TouchableOpacity
                      key={s.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSortFilter(s.id as any);
                      }}
                      style={[
                        styles.filterSelectChip,
                        {
                          backgroundColor: isSelected ? (isDark ? 'rgba(196, 108, 39, 0.22)' : '#FEF3C7') : theme.backgroundSecondary,
                          borderColor: isSelected ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={13} color={theme.primary} style={{ marginRight: 4 }} />
                      )}
                      <Text
                        style={[
                          styles.filterSelectChipText,
                          {
                            color: isSelected ? theme.primary : theme.textPrimary,
                            fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                          },
                        ]}
                      >
                        {s.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Apply Button */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setFilterModalVisible(false);
                }}
                style={[
                  styles.modalPrimaryActionBtn,
                  {
                    backgroundColor: isDark ? theme.cardElevated : '#FCF4E1',
                    borderColor: isDark ? theme.borderAccent : 'rgba(102, 37, 2, 0.25)',
                    marginTop: 24,
                  },
                ]}
                activeOpacity={0.85}
              >
                <Text style={[styles.modalPrimaryActionBtnText, { color: isDark ? '#FFF3D6' : theme.primaryDark }]}>
                  Apply Filters ({filteredRequests.length} results)
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════════
          MODAL 6: CELEBRATION FEEDBACK MODAL (WEB PARITY)
      ══════════════════════════════════════════════════════════════════════════ */}
      {showCelebration && (
        <Modal transparent animationType="fade" visible={showCelebration} statusBarTranslucent>
          <View style={styles.celebrationBackdrop}>
            <View
              style={[
                styles.celebrationCard,
                { backgroundColor: theme.card, borderColor: theme.borderSubtle },
              ]}
            >
              <View style={styles.celebrationIconBox}>
                <Ionicons name="checkmark-circle" size={48} color="#009D1A" />
              </View>
              <Text style={[styles.celebrationTitle, { color: theme.textPrimary }]}>Bid Dispatched!</Text>
              <Text style={[styles.celebrationSub, { color: theme.textSecondary }]}>
                Your offer has been delivered to {activeRequest?.customer.name}.
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

// ─── Unified Stylesheet (Standard Mobile Design) ──────────────────────────────
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
    paddingBottom: Spacing.xl + 20,
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
    borderWidth: 1,
  },
  toastText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    flex: 1,
  },

  // 1. Header
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
  headerRefreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 2. Option B: Hero Metrics Card + Split Cards
  optionBContainer: {
    marginBottom: Spacing.md,
    gap: 10,
  },
  heroMetricCard: {
    width: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  heroMetricTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  heroPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    height: 24,
    borderRadius: 4,
    gap: 6,
  },
  heroPillText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  heroCountPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  heroCountPillText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  heroValueText: {
    fontSize: 26,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.4,
  },
  heroSubtitleText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    marginTop: 2,
    marginBottom: 12,
  },
  heroProgressSection: {
    marginTop: 2,
  },
  heroProgressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  heroProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  heroProgressInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroProgressInfoText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  heroProgressPercentText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  splitRow: {
    flexDirection: 'row',
    gap: 10,
  },
  splitCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    height: 115,
    borderRadius: Radius.md,
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

  // 3. Segmented 2-Way Tab Switcher
  tabTrack: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    marginBottom: Spacing.md,
  },
  tabSegment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
  },
  tabSegmentActive: {
    borderWidth: 1,
  },
  tabSegmentText: {
    fontSize: 12,
  },

  // Search & Filter Row
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: FontFamily.latoRegular,
    padding: 0,
  },
  filterTriggerBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 9,
    right: 9,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#C46C27',
  },

  // Sub-Segment Switcher (Web Parity: All Requests vs Offers Sent)
  subSegmentWrapper: {
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  subSegmentTrack: {
    flexDirection: 'row',
    borderRadius: Radius.full,
    padding: 3,
  },
  subSegmentBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  subSegmentBtnActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  subSegmentText: {
    fontSize: 12,
  },

  // Active Filters Bar
  activeFiltersBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xs,
    paddingVertical: 4,
    gap: 6,
  },
  activeFilterLabel: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    gap: 4,
  },
  activeFilterChipText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  clearAllBtn: {
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  clearAllText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    textDecorationLine: 'underline',
  },

  // Category Carousel
  categoryCarousel: {
    paddingVertical: Spacing.xs,
    gap: 6,
    marginBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
  },

  // Cards List
  cardsList: {
    gap: Spacing.md,
  },
  emptyCard: {
    padding: Spacing.xl,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
    textAlign: 'center',
    maxWidth: 240,
  },
  emptyActionBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: '#C46C27',
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },

  // Request Card (Web Parity)
  requestCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  requestCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  clientAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  clientAvatarText: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
  },
  clientName: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  clientLocation: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
    marginTop: 1,
  },
  clientOrdersBadge: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.2,
  },
  requestTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginBottom: 4,
    lineHeight: 20,
  },
  requestDesc: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
    lineHeight: 17,
    marginBottom: 10,
  },
  photoStrip: {
    marginBottom: 10,
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  morePhotosOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  morePhotosText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },

  // Specs Box (Web Parity: Qty + Bold Price + Deliver by clock pill)
  specsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginBottom: 12,
  },
  qtyAndBudgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specLabel: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  specValueBudget: {
    fontSize: 16,
    fontFamily: FontFamily.headingBold,
  },
  specValueMaterial: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
  },
  specDivider: {
    width: 1,
    height: 28,
  },
  deliverByPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  deliverByText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  materialSubText: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
    marginTop: 2,
  },

  // Action Buttons Row with Message Client
  actionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  messageBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  messageBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  inspectBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  inspectBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  offerBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  offerBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
  },

  // Commission Card
  commissionCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  commCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commIdBadge: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 2,
  },
  commTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  stageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },
  commMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  commClientText: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
    flex: 1,
    paddingRight: 8,
  },
  commPriceText: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantBold,
    letterSpacing: -0.2,
  },
  progressWrap: {
    marginBottom: 12,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressLabel: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
  },
  progressDeadline: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  commActionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  commContactBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  commContactBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  commUpdateBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
  },
  commUpdateBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
  },

  // Bottom Sheets Standard
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropDismiss: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
  },
  modalSheet: {
    height: '85%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
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
  resetText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  modalBodyScroll: {
    flex: 1,
  },
  modalPrimaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalPrimaryActionBtnText: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
  },
  modalSecondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalSecondaryActionBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsSemiBold,
  },

  // Inspect Modal
  inspectClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 14,
  },
  inspectMessageIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inspectTitleText: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    marginBottom: 6,
    lineHeight: 24,
  },
  inspectDescText: {
    fontSize: 13,
    fontFamily: FontFamily.latoRegular,
    lineHeight: 19,
  },
  galleryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  inspectSectionHeader: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  fullscreenLink: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  inspectGalleryThumb: {
    width: 76,
    height: 76,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    marginRight: 8,
  },
  inspectGalleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  zoomBadgeCorner: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 4,
    padding: 2,
  },
  materialDetailBox: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    marginTop: 10,
    gap: 6,
  },
  materialRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  materialKeyText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    width: 90,
  },
  materialValText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
    flex: 1,
  },
  colorsPaletteWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  colorChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  colorChipText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
  },
  measurementsGrid: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    marginTop: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  measurementKey: {
    fontSize: 12,
    fontFamily: FontFamily.latoRegular,
  },
  measurementVal: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },

  // Offer Modal
  offerTargetBanner: {
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  offerTargetSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
    marginBottom: 2,
  },
  offerTargetBigNum: {
    fontSize: 24,
    fontFamily: FontFamily.cormorantBold,
    letterSpacing: -0.3,
    marginBottom: 2,
  },
  offerTargetDays: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 14,
    gap: 8,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 6,
  },
  chipIncrement: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipIncrementText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  customPriceInputField: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  stepperActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPriceDisplay: {
    alignItems: 'center',
  },
  stepperPriceNum: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
  },
  stepperPriceSub: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
  },
  quickDaysRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  quickDayPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickDayText: {
    fontSize: 11,
  },
  timelineHelperText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    marginTop: 4,
  },
  proposalTextArea: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 13,
    fontFamily: FontFamily.latoRegular,
    height: 80,
    textAlignVertical: 'top',
  },

  // Milestone Modal
  stageOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  stageOptionLabel: {
    fontSize: 14,
    fontFamily: FontFamily.headingBold,
  },
  stageOptionPercent: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
    marginTop: 1,
  },
  radioCircleUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
  },

  // Lightbox
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.94)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  lightboxCounterText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.poppinsBold,
  },
  lightboxCloseBtn: {
    padding: 4,
  },
  lightboxFullImage: {
    width: SCREEN_WIDTH * 0.92,
    height: '70%',
  },
  lightboxNavRow: {
    position: 'absolute',
    bottom: 40,
    flexDirection: 'row',
    gap: 32,
    alignItems: 'center',
  },
  lightboxArrowBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Filter Modal Elements
  filterSectionTitle: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    marginBottom: 8,
  },
  filterChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterSelectChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  filterSelectChipText: {
    fontSize: 12,
  },

  // Celebration Modal
  celebrationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.60)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: 24,
    alignItems: 'center',
  },
  celebrationIconBox: {
    marginBottom: 12,
  },
  celebrationTitle: {
    fontSize: 20,
    fontFamily: FontFamily.cormorantBold,
    marginBottom: 4,
  },
  celebrationSub: {
    fontSize: 13,
    fontFamily: FontFamily.latoRegular,
    textAlign: 'center',
    lineHeight: 18,
  },
});

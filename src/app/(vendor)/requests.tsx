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
export type CustomCategory =
  | 'ALL'
  | 'WEARS'
  | 'SHOES'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CRAFTS'
  | 'PAINTINGS'
  | 'ANTIQUES';

export interface ClientCustomRequest {
  id: string;
  requestNumber: string;
  title: string;
  category: CustomCategory;
  description: string;
  budget: number;
  deadlineDate: string;
  daysRemaining: number;
  status: 'OPEN' | 'BIDDING' | 'PENDING' | 'ACCEPTED' | 'REJECTED';
  quantity: number;
  materialType: string;
  materialQuality: string;
  colors: string[];
  measurements?: Record<string, string>;
  inspirationImages: string[];
  customer: {
    name: string;
    location: string;
    verified: boolean;
    rating: number;
    completedOrders: number;
    email?: string;
  };
  bidsCount: number;
  myExistingBid?: {
    price: number;
    days: number;
    status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
    notes?: string;
  };
  createdAt: string;
}

// ─── Mock Dataset matching Ethnikraft-BE & Ethnikraft-Vendor ───────────────────
const INITIAL_CLIENT_REQUESTS: ClientCustomRequest[] = [
  {
    id: 'req-8821',
    requestNumber: '#REQ-8821',
    title: 'Custom Beaded Royal Velvet Agbada Ensemble',
    category: 'WEARS',
    description:
      'I need an authentic bespoke 3-piece royal Agbada tailored in deep burgundy velvet with elaborate gold micro-beading along the chest plate and sleeve edges for an upcoming chieftaincy coronation in Ibadan.',
    budget: 280000,
    deadlineDate: '2026-10-12',
    daysRemaining: 14,
    status: 'OPEN',
    quantity: 1,
    materialType: 'Burgundy Velvet & Aso-Oke Accents',
    materialQuality: 'Grade-A Heavyweight Imperial Fabric',
    colors: ['Burgundy (#581845)', 'Imperial Gold (#FFD700)', 'Ebony Black (#120701)'],
    measurements: {
      Chest: '44 inches',
      Length: '58 inches',
      Shoulder: '20 inches',
      Sleeve: '27 inches',
      Waist: '38 inches',
    },
    inspirationImages: [
      'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    ],
    customer: {
      name: 'Dr. Folake Balogun',
      location: 'Ikoyi, Lagos, Nigeria',
      verified: true,
      rating: 5.0,
      completedOrders: 7,
      email: 'f.balogun@unilag.edu.ng',
    },
    bidsCount: 2,
    createdAt: '2026-09-21',
  },
  {
    id: 'req-8824',
    requestNumber: '#REQ-8824',
    title: 'Hand-Carved Seasoned Mahogany Benin Leopard Mask',
    category: 'CRAFTS',
    description:
      'Searching for a master wood sculptor to recreate an archival 16th-century Benin Kingdom ceremonial leopard mask from dry seasoned mahogany with brass whisker inserts and ancestral markings.',
    budget: 195000,
    deadlineDate: '2026-10-04',
    daysRemaining: 8,
    status: 'OPEN',
    quantity: 1,
    materialType: 'Seasoned Mahogany & Hand-Hammered Brass',
    materialQuality: 'Termite-treated, antique hand-rubbed wax finish',
    colors: ['Dark Mahogany (#4A1E0D)', 'Brass (#C59B27)'],
    measurements: {
      Height: '18 inches',
      Width: '11 inches',
      Depth: '9 inches',
      Weight: '~3.2 kg',
    },
    inspirationImages: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80',
    ],
    customer: {
      name: 'Adewale Adeleke',
      location: 'Victoria Island, Lagos',
      verified: true,
      rating: 4.9,
      completedOrders: 4,
    },
    bidsCount: 1,
    createdAt: '2026-09-20',
  },
  {
    id: 'req-8830',
    requestNumber: '#REQ-8830',
    title: 'Bespoke Hand-Tooled Fulani Leather Travel Duffle',
    category: 'BAGS',
    description:
      'Looking for a durable vegetable-tanned full-grain leather duffle with hand-stitched pyrographic tribal engravings, solid brass buckles, and reinforced shoulder straps for international travel.',
    budget: 145000,
    deadlineDate: '2026-10-18',
    daysRemaining: 20,
    status: 'OPEN',
    quantity: 1,
    materialType: 'Full-Grain Vegetable Tanned Cowhide',
    materialQuality: 'Hand-waxed, water-resistant saddle leather',
    colors: ['Cognac Tan (#A0522D)', 'Solid Brass (#D4AF37)'],
    measurements: {
      Length: '22 inches',
      Diameter: '11 inches',
      Volume: '38 Liters',
    },
    inspirationImages: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    ],
    customer: {
      name: 'Kofi Mensah',
      location: 'Accra, Ghana (Global Shipping)',
      verified: true,
      rating: 4.8,
      completedOrders: 12,
    },
    bidsCount: 4,
    createdAt: '2026-09-19',
  },
  {
    id: 'req-8835',
    requestNumber: '#REQ-8835',
    title: 'Sacred Oshun River Deities Oil Canvas (6ft x 4ft)',
    category: 'PAINTINGS',
    description:
      'Commissioning a master fine-art oil on canvas portrait depicting Yoruba river mythology using natural mineral pigments and textured palette-knife impasto for private gallery collection.',
    budget: 350000,
    deadlineDate: '2026-10-30',
    daysRemaining: 32,
    status: 'OPEN',
    quantity: 1,
    materialType: 'Belgian Linen Canvas & Mineral Oils',
    materialQuality: 'Museum-grade archival cotton duck canvas',
    colors: ['Aquamarine', 'Gold Leaf', 'Ultramarine Blue'],
    measurements: {
      Width: '72 inches (6 ft)',
      Height: '48 inches (4 ft)',
    },
    inspirationImages: [
      'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
    ],
    customer: {
      name: 'Lady Brenda Thornton',
      location: 'London, United Kingdom',
      verified: true,
      rating: 5.0,
      completedOrders: 3,
    },
    bidsCount: 0,
    createdAt: '2026-09-22',
  },
  {
    id: 'req-8840',
    requestNumber: '#REQ-8840',
    title: 'Nubian Desert Hand-Stitched Leather Riding Boots',
    category: 'SHOES',
    description:
      'Custom bespoke camel leather calf-high boots with braided side buckles and double-stitched hardened soles for desert wear.',
    budget: 85000,
    deadlineDate: '2026-10-08',
    daysRemaining: 10,
    status: 'OPEN',
    quantity: 1,
    materialType: 'Supple Camel Leather & Brass Rivets',
    materialQuality: 'Dual-layer sole, moisture-wicking lining',
    colors: ['Desert Sand (#EDC9AF)', 'Mahogany (#4A1E0D)'],
    measurements: {
      ShoeSize: 'EU 43 / UK 9',
      CalfCircumference: '16 inches',
      ShaftHeight: '14 inches',
    },
    inspirationImages: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
    ],
    customer: {
      name: 'Ibrahim Danjuma',
      location: 'Kano, Nigeria',
      verified: true,
      rating: 4.9,
      completedOrders: 5,
    },
    bidsCount: 1,
    createdAt: '2026-09-21',
  },
];

const CATEGORY_TABS: { id: CustomCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Briefs', icon: 'sparkles' },
  { id: 'WEARS', label: 'Attire & Agbada', icon: 'shirt-outline' },
  { id: 'CRAFTS', label: 'Wood & Bronze', icon: 'construct-outline' },
  { id: 'BAGS', label: 'Leather & Bags', icon: 'briefcase-outline' },
  { id: 'ACCESSORIES', label: 'Coral & Beads', icon: 'diamond-outline' },
  { id: 'PAINTINGS', label: 'Fine Art', icon: 'color-palette-outline' },
  { id: 'SHOES', label: 'Footwear', icon: 'footsteps-outline' },
];

export default function VendorRequestsScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── State Management ─────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<ClientCustomRequest[]>(INITIAL_CLIENT_REQUESTS);
  const [selectedCategory, setSelectedCategory] = useState<CustomCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [bidModalVisible, setBidModalVisible] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Active Item Reference
  const [activeRequest, setActiveRequest] = useState<ClientCustomRequest | null>(null);

  // ── 2-Step Bid Wizard State ─────────────────────────────────────────────────
  const [bidStep, setBidStep] = useState<1 | 2>(1);
  const [bidPrice, setBidPrice] = useState<number>(150000);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<number>(10);
  const [weeksInput, setWeeksInput] = useState<string>('2');
  const [proposalNotes, setProposalNotes] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // ── Reject State ─────────────────────────────────────────────────────────────
  const [rejectReason, setRejectReason] = useState<string>('Timeline too tight');

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
      showToast('Client commission requests refreshed');
    }, 800);
  };

  // ── Currency Formatter Helper ────────────────────────────────────────────────
  const formatPriceValue = (val: number) => {
    return formatPrice(val, currencyCode, exchangeRate);
  };

  // ── Filtered Requests Dataset ────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((req) => {
      if (selectedCategory !== 'ALL' && req.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = req.title.toLowerCase().includes(q);
        const matchDesc = req.description.toLowerCase().includes(q);
        const matchCustomer = req.customer.name.toLowerCase().includes(q);
        const matchLocation = req.customer.location.toLowerCase().includes(q);
        const matchMat = req.materialType.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchCustomer && !matchLocation && !matchMat) return false;
      }
      return true;
    });
  }, [requests, selectedCategory, searchQuery]);

  // Aggregate Metrics
  const totalBriefsCount = requests.length;
  const totalMarketplaceValuation = useMemo(() => {
    return requests.reduce((sum, r) => sum + r.budget, 0);
  }, [requests]);

  // ── Modal Open Handlers ──────────────────────────────────────────────────────
  const handleOpenInspect = (req: ClientCustomRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRequest(req);
    setInspectModalVisible(true);
  };

  const handleOpenBidWizard = (req: ClientCustomRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRequest(req);
    setBidPrice(req.budget);
    setCustomPriceInput('');
    setDeliveryDays(Math.max(req.daysRemaining, 5));
    setWeeksInput(String(Math.ceil(Math.max(req.daysRemaining, 5) / 7)));
    setProposalNotes('');
    setBidStep(1);
    setInspectModalVisible(false);
    setBidModalVisible(true);
  };

  const handleOpenReject = (req: ClientCustomRequest) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setActiveRequest(req);
    setInspectModalVisible(false);
    setRejectModalVisible(true);
  };

  const handleAcceptClientBudget = () => {
    if (!activeRequest) return;
    setBidPrice(activeRequest.budget);
    setBidStep(2);
  };

  const handleSubmitBid = () => {
    if (!activeRequest) return;
    setSubmittingBid(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setSubmittingBid(false);
      setBidModalVisible(false);
      setShowCelebration(true);

      // Record submitted bid locally
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeRequest.id
            ? {
                ...r,
                bidsCount: r.bidsCount + 1,
                status: 'BIDDING',
                myExistingBid: {
                  price: bidPrice,
                  days: deliveryDays,
                  status: 'PENDING',
                  notes: proposalNotes,
                },
              }
            : r
        )
      );

      setTimeout(() => {
        setShowCelebration(false);
        showToast(`Artisan offer of ${formatPriceValue(bidPrice)} dispatched to ${activeRequest.customer.name}!`);
        setActiveRequest(null);
      }, 2000);
    }, 900);
  };

  const handleConfirmReject = () => {
    if (!activeRequest) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setRequests((prev) => prev.filter((r) => r.id !== activeRequest.id));
    setRejectModalVisible(false);
    showToast(`Declined ${activeRequest.requestNumber} (${rejectReason})`);
    setActiveRequest(null);
  };

  const handleOpenLightbox = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLightboxUrl(url);
    setLightboxVisible(true);
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
        {/* ── 1. Master Commissions Marketplace Banner ─────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#361300', '#1F0E04', '#120701'] : ['#5A2002', '#7D2E04', '#451700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroAvatarBox}>
              <Ionicons name="hammer" size={28} color="#FFD79E" />
            </View>
            <View style={styles.heroInfoCol}>
              <View style={styles.badgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={10} color="#FFD79E" />
                  <Text style={styles.heroBadgeText}>BESPOKE MARKETPLACE</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]}>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.heroBadgeText, { color: '#A7F3D0' }]}>CLIENT BRIEFS LIVE</Text>
                </View>
              </View>
              <Text style={styles.heroTitle}>Client Commission Briefs</Text>
              <Text style={styles.heroSubtitle}>
                Review bespoke briefs from collectors, inspect measurements, and submit competitive artisan bids.
              </Text>
            </View>
          </View>

          {/* Micro Metrics Strip */}
          <View style={styles.kpiRibbon}>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{totalBriefsCount}</Text>
              <Text style={styles.kpiRibbonLabel}>Open Briefs</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{formatPriceValue(totalMarketplaceValuation)}</Text>
              <Text style={styles.kpiRibbonLabel}>Total Demand Value</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={[styles.kpiRibbonNum, { color: '#FFD79E' }]}>~14 Days</Text>
              <Text style={styles.kpiRibbonLabel}>Avg Turnaround</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. Search Section ────────────────────────────────────────────── */}
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
              placeholder="Search by brief title, material, client..."
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

        {/* ── 3. Category Filter Carousel ──────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryCarousel}
        >
          {CATEGORY_TABS.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat.id);
                }}
                style={[
                  styles.categoryPill,
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
                  name={cat.icon}
                  size={13}
                  color={isSelected ? '#FFFFFF' : isDark ? '#FFD79E' : theme.primary}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={[
                    styles.categoryPillText,
                    {
                      color: isSelected ? '#FFFFFF' : theme.textPrimary,
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

        {/* ── 4. Requests List ─────────────────────────────────────────────── */}
        <View style={styles.requestsListContainer}>
          {filteredRequests.length === 0 ? (
            <View
              style={[
                styles.emptyStateCard,
                { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
              ]}
            >
              <Ionicons name="sparkles-outline" size={38} color={theme.primary} />
              <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Commission Briefs Found</Text>
              <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                No client briefs currently match your active search or category filters.
              </Text>
            </View>
          ) : (
            filteredRequests.map((req) => {
              const hasBid = Boolean(req.myExistingBid);
              return (
                <View
                  key={req.id}
                  style={[
                    styles.requestCard,
                    {
                      backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                      borderColor: hasBid
                        ? theme.primary
                        : isDark
                        ? 'rgba(209, 153, 90, 0.22)'
                        : 'rgba(196, 108, 39, 0.14)',
                    },
                  ]}
                >
                  {/* Card Header: Request #, Turnaround Badge */}
                  <View style={styles.cardHeaderRow}>
                    <View>
                      <Text style={[styles.requestNumberText, { color: theme.primary }]}>{req.requestNumber}</Text>
                      <Text style={[styles.requestDateText, { color: theme.textMuted }]}>
                        Posted {req.createdAt} • {req.bidsCount} proposal{req.bidsCount !== 1 ? 's' : ''}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.daysRemainingBadge,
                        {
                          backgroundColor: hasBid
                            ? 'rgba(16, 185, 129, 0.15)'
                            : isDark
                            ? '#361300'
                            : '#FEF3C7',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.daysRemainingText,
                          { color: hasBid ? '#10B981' : isDark ? '#FFD79E' : '#B45309' },
                        ]}
                      >
                        {hasBid ? 'BID PENDING' : `⏳ Due in ${req.daysRemaining}d`}
                      </Text>
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
                        {req.customer.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Text style={[styles.customerNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {req.customer.name}
                        </Text>
                        {req.customer.verified && (
                          <Ionicons name="checkmark-circle" size={13} color="#10B981" style={{ marginLeft: 4 }} />
                        )}
                      </View>
                      <Text style={[styles.customerLocationText, { color: theme.textMuted }]} numberOfLines={1}>
                        <Ionicons name="location-sharp" size={10} color={theme.textMuted} /> {req.customer.location}
                      </Text>
                    </View>
                  </View>

                  {/* Title & Description */}
                  <Text style={[styles.requestTitleText, { color: theme.textPrimary }]}>{req.title}</Text>
                  <Text style={[styles.requestDescText, { color: theme.textSecondary }]} numberOfLines={2}>
                    {req.description}
                  </Text>

                  {/* Inspiration Photo Thumbnails */}
                  {req.inspirationImages.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={styles.photoStripScrollView}
                      contentContainerStyle={styles.photoStripContent}
                    >
                      {req.inspirationImages.map((imgUrl, i) => (
                        <TouchableOpacity
                          key={i}
                          onPress={() => handleOpenLightbox(imgUrl)}
                          activeOpacity={0.85}
                          style={styles.photoThumbWrap}
                        >
                          <Image source={{ uri: imgUrl }} style={styles.photoThumbImg} />
                          <View style={styles.zoomOverlay}>
                            <Ionicons name="search" size={12} color="#FFFFFF" />
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  {/* Material & Target Budget Specs Strip */}
                  <View
                    style={[
                      styles.specsBox,
                      {
                        backgroundColor: isDark ? '#160902' : '#FAF6F0',
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <View style={styles.specItemCol}>
                      <Text style={[styles.specItemLabel, { color: theme.textMuted }]}>TARGET BUDGET</Text>
                      <Text style={[styles.specItemBudget, { color: theme.primary }]}>
                        {formatPriceValue(req.budget)}
                      </Text>
                    </View>
                    <View style={styles.specDividerVertical} />
                    <View style={styles.specItemCol}>
                      <Text style={[styles.specItemLabel, { color: theme.textMuted }]}>PRIMARY MATERIAL</Text>
                      <Text style={[styles.specItemMaterial, { color: theme.textPrimary }]} numberOfLines={1}>
                        {req.materialType}
                      </Text>
                    </View>
                  </View>

                  {/* Action Buttons Row */}
                  <View style={styles.requestActionRow}>
                    <TouchableOpacity
                      onPress={() => handleOpenInspect(req)}
                      style={[
                        styles.inspectActionBtn,
                        {
                          backgroundColor: isDark ? '#361300' : '#FFEDD5',
                          borderColor: theme.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="eye-outline" size={14} color={theme.primary} style={{ marginRight: 4 }} />
                      <Text style={[styles.inspectActionBtnText, { color: theme.primary }]}>Inspect Spec</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenReject(req)}
                      style={[
                        styles.rejectActionBtn,
                        { borderColor: 'rgba(239, 68, 68, 0.3)' },
                      ]}
                      activeOpacity={0.75}
                    >
                      <Ionicons name="close" size={15} color="#EF4444" />
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => handleOpenBidWizard(req)}
                      style={[styles.bidActionBtn, { backgroundColor: theme.primary }]}
                      activeOpacity={0.85}
                    >
                      <Ionicons
                        name={hasBid ? 'create-outline' : 'paper-plane'}
                        size={14}
                        color="#FFFFFF"
                        style={{ marginRight: 5 }}
                      />
                      <Text style={styles.bidActionBtnText}>
                        {hasBid ? 'Adjust Bid' : '✦ Send Bid'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: FULL SPECIFICATION & INSPIRATION INSPECTION SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={inspectModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setInspectModalVisible(false)}
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
            <TouchableOpacity onPress={() => setInspectModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Commission Specification</Text>
              <Text style={[styles.modalSubtitle, { color: theme.primary }]}>
                {activeRequest?.requestNumber}
              </Text>
            </View>
            <View style={{ width: 40 }} />
          </View>

          {activeRequest && (
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Customer Profile Card */}
              <View
                style={[
                  styles.modalSectionCard,
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View
                    style={[
                      styles.clientAvatarCircle,
                      { backgroundColor: isDark ? '#361300' : '#FFEDD5', width: 48, height: 48, borderRadius: 24 },
                    ]}
                  >
                    <Text style={[styles.clientAvatarText, { color: theme.primary, fontSize: 18 }]}>
                      {activeRequest.customer.name.charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={[styles.modalClientName, { color: theme.textPrimary }]}>
                      {activeRequest.customer.name}
                    </Text>
                    <Text style={[styles.modalClientLocation, { color: theme.textMuted }]}>
                      {activeRequest.customer.location}
                    </Text>
                    <Text style={[styles.modalClientRating, { color: theme.primary }]}>
                      ★ {activeRequest.customer.rating} • {activeRequest.customer.completedOrders} bespoke orders completed
                    </Text>
                  </View>
                </View>
              </View>

              {/* Title & Description */}
              <Text style={[styles.inspectTitleText, { color: theme.textPrimary }]}>{activeRequest.title}</Text>
              <Text style={[styles.inspectDescText, { color: theme.textSecondary }]}>{activeRequest.description}</Text>

              {/* Inspiration Image Gallery */}
              {activeRequest.inspirationImages.length > 0 && (
                <View style={{ marginTop: 18 }}>
                  <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                    Client Inspiration Photos (Tap to Zoom)
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                    {activeRequest.inspirationImages.map((img, idx) => (
                      <TouchableOpacity
                        key={idx}
                        onPress={() => handleOpenLightbox(img)}
                        style={styles.inspectGalleryThumbWrap}
                        activeOpacity={0.9}
                      >
                        <Image source={{ uri: img }} style={styles.inspectGalleryThumbImg} />
                        <View style={styles.zoomBadgeCorner}>
                          <Ionicons name="expand-outline" size={14} color="#FFFFFF" />
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Custom Measurements Grid */}
              {activeRequest.measurements && Object.keys(activeRequest.measurements).length > 0 && (
                <View style={{ marginTop: 22 }}>
                  <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                    Custom Client Measurements
                  </Text>
                  <View
                    style={[
                      styles.measurementsGridBox,
                      { backgroundColor: isDark ? '#160902' : '#F9F5EE', borderColor: theme.borderSubtle },
                    ]}
                  >
                    {Object.entries(activeRequest.measurements).map(([key, val]) => (
                      <View key={key} style={styles.measurementRow}>
                        <Text style={[styles.measurementKey, { color: theme.textSecondary }]}>{key}</Text>
                        <Text style={[styles.measurementVal, { color: theme.textPrimary }]}>{val}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {/* Material & Standards Specifications */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                  Materials & Standards
                </Text>
                <View
                  style={[
                    styles.specDetailCard,
                    { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Material Standard:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.textPrimary }]}>{activeRequest.materialType}</Text>
                  </View>
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Quality Tier:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.textPrimary }]}>{activeRequest.materialQuality}</Text>
                  </View>
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Required Delivery:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.primary }]}>
                      Due {activeRequest.deadlineDate} ({activeRequest.daysRemaining} days turnaround)
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Bottom Floating Action Bar */}
          {activeRequest && (
            <View
              style={[
                styles.inspectBottomBar,
                { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderTopColor: theme.borderSubtle },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.inspectTargetLabel, { color: theme.textMuted }]}>TARGET BUDGET</Text>
                <Text style={[styles.inspectTargetValue, { color: theme.primary }]}>
                  {formatPriceValue(activeRequest.budget)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenBidWizard(activeRequest)}
                style={[styles.inspectMakeOfferBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="paper-plane" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.inspectMakeOfferBtnText}>Craft an Offer ✦</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: 2-STEP INTERACTIVE ARTISAN BID WIZARD SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={bidModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setBidModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalBackdrop, { backgroundColor: theme.background }]}
        >
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
            {bidStep === 2 ? (
              <TouchableOpacity onPress={() => setBidStep(1)} style={styles.modalCloseBtn}>
                <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setBidModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            )}

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {bidStep === 1 ? 'Step 1: Pricing Strategy' : 'Step 2: Turnaround & Proposal'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.primary }]}>
                {activeRequest?.customer.name}
              </Text>
            </View>

            <View style={{ width: 40 }} />
          </View>

          {activeRequest && (
            <ScrollView
              style={styles.modalBody}
              contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 110 }}
              showsVerticalScrollIndicator={false}
            >
              {/* STEP 1: PRICING */}
              {bidStep === 1 && (
                <View>
                  <View
                    style={[
                      styles.offerTargetBanner,
                      { backgroundColor: isDark ? '#160902' : '#FAF6F0', borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={[styles.offerTargetSubtitle, { color: theme.textSecondary }]}>
                      {activeRequest.customer.name}&apos;s Stated Target Budget
                    </Text>
                    <Text style={[styles.offerTargetBigNum, { color: theme.primary }]}>
                      {formatPriceValue(activeRequest.budget)}
                    </Text>
                    <Text style={[styles.offerTargetDays, { color: theme.textMuted }]}>
                      Turnaround Target: {activeRequest.daysRemaining} Days
                    </Text>
                  </View>

                  {/* Accept Target Budget Button */}
                  <TouchableOpacity
                    onPress={handleAcceptClientBudget}
                    style={[styles.acceptBudgetBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="checkmark-done-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.acceptBudgetBtnText}>Accept Target Budget ({formatPriceValue(activeRequest.budget)})</Text>
                  </TouchableOpacity>

                  <View style={styles.orDividerRow}>
                    <View style={[styles.orDividerLine, { backgroundColor: theme.borderSubtle }]} />
                    <Text style={[styles.orDividerText, { color: theme.textMuted }]}>OR PROPOSE COUNTER OFFER</Text>
                    <View style={[styles.orDividerLine, { backgroundColor: theme.borderSubtle }]} />
                  </View>

                  {/* Quick Price Increment Pills */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 10 }]}>
                    Quick Increments over Budget
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                    {[10000, 25000, 50000, 80000].map((inc) => {
                      const calculated = activeRequest.budget + inc;
                      return (
                        <TouchableOpacity
                          key={inc}
                          onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setBidPrice(calculated);
                            setBidStep(2);
                          }}
                          style={[
                            styles.chipIncrement,
                            {
                              backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                              borderColor: theme.primary,
                            },
                          ]}
                          activeOpacity={0.8}
                        >
                          <Text style={[styles.chipIncrementText, { color: theme.primary }]}>
                            +{formatPriceValue(inc)} ({formatPriceValue(calculated)})
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Custom Price Input */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Custom Proposal Amount (₦)</Text>
                  <TextInput
                    style={[
                      styles.customPriceInputField,
                      {
                        backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
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
                      setBidStep(2);
                    }}
                    style={[
                      styles.proceedToStep2Btn,
                      {
                        backgroundColor: customPriceInput.trim() ? theme.primary : isDark ? '#361300' : '#E5E7EB',
                      },
                    ]}
                    activeOpacity={0.85}
                    disabled={!customPriceInput.trim()}
                  >
                    <Text
                      style={[
                        styles.proceedToStep2BtnText,
                        { color: customPriceInput.trim() ? '#FFFFFF' : theme.textMuted },
                      ]}
                    >
                      Continue with Custom Price →
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* STEP 2: TURNAROUND & PROPOSAL NOTE */}
              {bidStep === 2 && (
                <View>
                  {/* Price Stepper Row */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, textAlign: 'center' }]}>
                    Proposed Artisan Offer Price
                  </Text>
                  <View style={styles.priceStepperRow}>
                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBidPrice((p) => Math.max(5000, p - 5000));
                      }}
                      style={[
                        styles.stepperActionBtn,
                        { backgroundColor: isDark ? '#361300' : '#FFEDD5', borderColor: theme.borderSubtle },
                      ]}
                    >
                      <Ionicons name="remove" size={24} color={theme.primary} />
                    </TouchableOpacity>

                    <View style={styles.stepperPriceDisplay}>
                      <Text style={[styles.stepperPriceNum, { color: theme.primary }]}>
                        {formatPriceValue(bidPrice)}
                      </Text>
                      <Text style={[styles.stepperPriceSub, { color: theme.textMuted }]}>Artisan Workshop Quote</Text>
                    </View>

                    <TouchableOpacity
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setBidPrice((p) => p + 5000);
                      }}
                      style={[
                        styles.stepperActionBtn,
                        { backgroundColor: isDark ? '#361300' : '#FFEDD5', borderColor: theme.borderSubtle },
                      ]}
                    >
                      <Ionicons name="add" size={24} color={theme.primary} />
                    </TouchableOpacity>
                  </View>

                  {/* Production Duration */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 20 }]}>
                    Estimated Production Time (Weeks)
                  </Text>
                  <TextInput
                    style={[
                      styles.customPriceInputField,
                      {
                        backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                        color: theme.textPrimary,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                    placeholder="2"
                    placeholderTextColor={theme.textMuted}
                    keyboardType="numeric"
                    value={weeksInput}
                    onChangeText={(val) => {
                      setWeeksInput(val);
                      const w = parseInt(val, 10) || 1;
                      setDeliveryDays(w * 7);
                    }}
                  />
                  <Text style={[styles.timelineHelperText, { color: theme.primary }]}>
                    📅 Ready in ~{deliveryDays} calendar days from start of commission
                  </Text>

                  {/* Proposal Note */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 18 }]}>
                    Personal Proposal Note to {activeRequest.customer.name}
                  </Text>
                  <TextInput
                    style={[
                      styles.proposalTextArea,
                      {
                        backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                        color: theme.textPrimary,
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                    placeholder="State your authentic craftsmanship methods, fabric sourcing details, or tailored adjustments..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    value={proposalNotes}
                    onChangeText={setProposalNotes}
                  />

                  {/* Dispatch Bid Button */}
                  <TouchableOpacity
                    onPress={handleSubmitBid}
                    style={[styles.finalSubmitBidBtn, { backgroundColor: theme.primary }]}
                    activeOpacity={0.85}
                    disabled={submittingBid}
                  >
                    <Ionicons name="paper-plane" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.finalSubmitBidBtnText}>
                      {submittingBid ? 'Dispatching Bid...' : `Submit Bid of ${formatPriceValue(bidPrice)} ✦`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: DECLINE / REJECT REQUEST CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={rejectModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRejectModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.backdropDim}>
          <View
            style={[
              styles.rejectModalCard,
              { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: '#EF4444' },
            ]}
          >
            <View style={styles.rejectIconCircle}>
              <Ionicons name="close-circle-outline" size={32} color="#EF4444" />
            </View>
            <Text style={[styles.rejectTitle, { color: theme.textPrimary }]}>Decline Commission Brief?</Text>
            <Text style={[styles.rejectSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to pass on &quot;{activeRequest?.title}&quot;?
            </Text>

            {/* Reason Selection */}
            <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Select Reason (Optional)
            </Text>
            <View style={styles.rejectReasonGroup}>
              {[
                'Timeline too tight',
                'Material unavailable',
                'Outside studio specialty',
                'Workshop at full capacity',
              ].map((rsn) => (
                <TouchableOpacity
                  key={rsn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setRejectReason(rsn);
                  }}
                  style={[
                    styles.reasonPill,
                    {
                      backgroundColor: rejectReason === rsn ? 'rgba(239, 68, 68, 0.15)' : isDark ? '#160902' : '#F9F5EE',
                      borderColor: rejectReason === rsn ? '#EF4444' : theme.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.reasonPillText,
                      { color: rejectReason === rsn ? '#EF4444' : theme.textSecondary },
                    ]}
                  >
                    {rsn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.rejectActionsRow}>
              <TouchableOpacity
                onPress={() => setRejectModalVisible(false)}
                style={[styles.rejectCancelBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.rejectCancelText, { color: theme.textSecondary }]}>Keep Brief</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmReject}
                style={[styles.rejectConfirmBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.rejectConfirmText}>Decline Brief</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4: FULLSCREEN LIGHTBOX PREVIEW
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={lightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLightboxVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity
            onPress={() => setLightboxVisible(false)}
            style={styles.lightboxCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          {lightboxUrl && (
            <Image source={{ uri: lightboxUrl }} style={styles.lightboxFullImage} resizeMode="contain" />
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          CELEBRATION SPLASH MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showCelebration && (
        <Modal transparent animationType="fade" visible={showCelebration} statusBarTranslucent>
          <View style={styles.celebrationBackdrop}>
            <View style={[styles.celebrationCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' }]}>
              <View style={styles.celebrationIconBox}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={[styles.celebrationTitle, { color: theme.textPrimary }]}>Bid Dispatched!</Text>
              <Text style={[styles.celebrationSub, { color: theme.textSecondary }]}>
                Your artisan offer has been submitted directly to {activeRequest?.customer.name}.
              </Text>
            </View>
          </View>
        </Modal>
      )}
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

  // Hero
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

  // Search & Categories
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
  categoryCarousel: {
    paddingBottom: Spacing.sm,
    gap: 8,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 12,
  },

  // Request Cards
  requestsListContainer: {
    gap: Spacing.md,
    marginTop: Spacing.xs,
  },
  requestCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  requestNumberText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    letterSpacing: 0.5,
  },
  requestDateText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
    marginTop: 1,
  },
  daysRemainingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  daysRemainingText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
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
  requestTitleText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    marginTop: 6,
    lineHeight: 20,
  },
  requestDescText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
  },
  photoStripScrollView: {
    marginVertical: 10,
  },
  photoStripContent: {
    gap: 8,
  },
  photoThumbWrap: {
    width: 70,
    height: 70,
    borderRadius: Radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbImg: {
    width: '100%',
    height: '100%',
  },
  zoomOverlay: {
    position: 'absolute',
    bottom: 3,
    right: 3,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specsBox: {
    flexDirection: 'row',
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginVertical: 8,
  },
  specItemCol: {
    flex: 1,
  },
  specItemLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  specItemBudget: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    marginTop: 2,
  },
  specItemMaterial: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    marginTop: 2,
  },
  specDividerVertical: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginHorizontal: 10,
  },
  requestActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 6,
  },
  inspectActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  inspectActionBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
  rejectActionBtn: {
    width: 38,
    height: 38,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bidActionBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  bidActionBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Empty State
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

  // Modal General
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
  modalBody: {
    flex: 1,
  },

  // Inspect Modal
  modalSectionCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  modalClientName: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
  },
  modalClientLocation: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    marginTop: 1,
  },
  modalClientRating: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 11,
    marginTop: 2,
  },
  inspectTitleText: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 20,
    lineHeight: 26,
  },
  inspectDescText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13,
    lineHeight: 21,
    marginTop: 6,
  },
  inspectSectionHeader: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  inspectGalleryThumbWrap: {
    width: 100,
    height: 100,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginRight: 10,
    position: 'relative',
  },
  inspectGalleryThumbImg: {
    width: '100%',
    height: '100%',
  },
  zoomBadgeCorner: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 4,
    borderRadius: Radius.full,
  },
  measurementsGridBox: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: 8,
  },
  measurementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  measurementKey: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  measurementVal: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
  specDetailCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: 8,
  },
  specDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  specDetailLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
  },
  specDetailValue: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  inspectBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
  },
  inspectTargetLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    letterSpacing: 0.5,
  },
  inspectTargetValue: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 18,
  },
  inspectMakeOfferBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.lg,
  },
  inspectMakeOfferBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    color: '#FFFFFF',
  },

  // Bid Wizard
  offerTargetBanner: {
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  offerTargetSubtitle: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
  },
  offerTargetBigNum: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 24,
    marginVertical: 4,
  },
  offerTargetDays: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 11,
  },
  acceptBudgetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
  },
  acceptBudgetBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    color: '#FFFFFF',
  },
  orDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  orDividerLine: {
    flex: 1,
    height: 1,
  },
  orDividerText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 9,
    marginHorizontal: 8,
    letterSpacing: 0.5,
  },
  fieldLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    marginBottom: 6,
  },
  chipIncrement: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  chipIncrementText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
  },
  customPriceInputField: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
    marginBottom: 12,
  },
  proceedToStep2Btn: {
    paddingVertical: 13,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proceedToStep2BtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  priceStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  stepperActionBtn: {
    width: 52,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperPriceDisplay: {
    alignItems: 'center',
  },
  stepperPriceNum: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 24,
  },
  stepperPriceSub: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
  },
  timelineHelperText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 11,
    marginTop: -6,
    marginBottom: 12,
  },
  proposalTextArea: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13,
    height: 100,
    textAlignVertical: 'top',
    marginBottom: 18,
  },
  finalSubmitBidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: Radius.lg,
  },
  finalSubmitBidBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 14,
    color: '#FFFFFF',
  },

  // Reject Modal
  backdropDim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  rejectModalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    ...Shadows.lg,
  },
  rejectIconCircle: {
    alignSelf: 'center',
    marginBottom: 8,
  },
  rejectTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 17,
    textAlign: 'center',
  },
  rejectSubtitle: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  rejectReasonGroup: {
    gap: 6,
    marginVertical: 8,
  },
  reasonPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  reasonPillText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  rejectActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  rejectCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectCancelText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  rejectConfirmBtn: {
    flex: 1.3,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectConfirmText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Lightbox
  lightboxBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 25,
    right: 20,
    zIndex: 10,
  },
  lightboxFullImage: {
    width: SCREEN_WIDTH - 20,
    height: SCREEN_WIDTH * 1.3,
  },

  // Celebration Modal
  celebrationBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  celebrationCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.lg,
  },
  celebrationIconBox: {
    marginBottom: Spacing.md,
  },
  celebrationTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 22,
    textAlign: 'center',
  },
  celebrationSub: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 19,
  },
});

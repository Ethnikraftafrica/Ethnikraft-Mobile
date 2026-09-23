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
  Linking,
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
  customer: {
    name: string;
    avatar?: string;
    location: string;
    verified: boolean;
    rating: number;
    completedOrders: number;
  };
  bidsCount: number;
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
}

// ─── Mock Dataset matching Ethnikraft-BE & Ethnikraft-Vendor ───────────────────
const INITIAL_REQUESTS: CustomClientRequest[] = [
  {
    id: 'REQ-8821',
    title: 'Custom Beaded Royal Velvet Agbada Ensemble',
    category: 'WEARS',
    description:
      'I need an authentic bespoke 3-piece royal Agbada tailored in deep burgundy velvet with elaborate gold micro-beading along the chest plate and sleeve edges for an upcoming chieftaincy coronation.',
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
    },
    bidsCount: 2,
    createdAt: '2026-09-21',
  },
  {
    id: 'REQ-8824',
    title: 'Hand-Carved Seasoned Mahogany Benin Leopard Mask',
    category: 'CRAFTS',
    description:
      'Searching for a master wood sculptor to recreate an archival 16th-century Benin Kingdom ceremonial leopard mask from dry seasoned mahogany with brass whisker inserts.',
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
    id: 'REQ-8830',
    title: 'Bespoke Hand-Tooled Fulani Leather Travel Duffle',
    category: 'BAGS',
    description:
      'Looking for a durable vegetable-tanned full-grain leather duffle with hand-stitched pyrographic tribal engravings, solid brass buckles, and reinforced shoulder straps.',
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
    id: 'REQ-8835',
    title: 'Sacred Oshun River Deities Oil Canvas (6ft x 4ft)',
    category: 'PAINTINGS',
    description:
      'Commissioning a master fine-art oil on canvas portrait depicting Yoruba river mythology using natural mineral pigments and textured palette-knife impasto.',
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
];

const INITIAL_COMMISSIONS: ActiveWorkbenchCommission[] = [
  {
    id: 'COMM-7701',
    requestId: 'REQ-8790',
    title: 'Master Yoruba Ceremonial Beaded Coral Crown',
    category: 'ACCESSORIES',
    client: {
      name: 'Chief Olatunji S.',
      location: 'Ile-Ife, Osun State',
      phone: '+234 803 123 4567',
    },
    agreedPrice: 220000,
    stage: 'crafting',
    progressPercent: 65,
    targetCompletionDate: '2026-09-28',
    daysRemaining: 5,
    materialSummary: '12,000 Micro-Glass Beads & Natural Coral Totem',
    thumbnail: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    proofPhotos: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    ],
    recentUpdateNote: 'Palm fiber frame woven; coral bird pinnacle attached.',
  },
  {
    id: 'COMM-7702',
    requestId: 'REQ-8798',
    title: 'Lost-Wax Bronze Casted Ife Queen Figurine',
    category: 'CRAFTS',
    client: {
      name: 'Ambassador Amina Bello',
      location: 'Abuja, FCT',
      phone: '+234 809 987 6543',
    },
    agreedPrice: 380000,
    stage: 'inspection',
    progressPercent: 90,
    targetCompletionDate: '2026-09-25',
    daysRemaining: 2,
    materialSummary: 'Heavy Copper-Alloy Lost Wax Cast with Antique Patina',
    thumbnail: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    proofPhotos: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    ],
    recentUpdateNote: 'Final chemical patina applied. Polishing crown jewels.',
  },
  {
    id: 'COMM-7703',
    requestId: 'REQ-8805',
    title: 'Hand-Woven Royal Indigo Aso-Oke Wrapper & Gele',
    category: 'WEARS',
    client: {
      name: 'Engr. Nnamdi Eze',
      location: 'Enugu, Nigeria',
    },
    agreedPrice: 175000,
    stage: 'design',
    progressPercent: 25,
    targetCompletionDate: '2026-10-06',
    daysRemaining: 13,
    materialSummary: 'Organic Indigo Dyed Cotton & Lurex Silver Strands',
    thumbnail: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80',
    proofPhotos: [],
    recentUpdateNote: 'Loom setup completed; indigo cotton spinning underway.',
  },
];

const CATEGORY_CHIPS: { id: CustomRequestCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Requests', icon: 'sparkles' },
  { id: 'WEARS', label: 'Wears & Attire', icon: 'shirt-outline' },
  { id: 'CRAFTS', label: 'Sculptures', icon: 'construct-outline' },
  { id: 'BAGS', label: 'Leather & Bags', icon: 'briefcase-outline' },
  { id: 'ACCESSORIES', label: 'Adornments', icon: 'diamond-outline' },
  { id: 'PAINTINGS', label: 'Fine Art', icon: 'color-palette-outline' },
  { id: 'ANTIQUES', label: 'Heritage Relics', icon: 'time-outline' },
];

const STAGE_CONFIG: Record<
  ProductionStage,
  { label: string; percent: number; color: string; bgLight: string; bgDark: string; icon: keyof typeof Ionicons.glyphMap }
> = {
  design: {
    label: '1. Design & Blueprint',
    percent: 25,
    color: '#0284C7',
    bgLight: '#E0F2FE',
    bgDark: 'rgba(2, 132, 199, 0.2)',
    icon: 'create-outline',
  },
  crafting: {
    label: '2. Atelier Crafting',
    percent: 65,
    color: '#D97706',
    bgLight: '#FEF3C7',
    bgDark: 'rgba(217, 119, 6, 0.2)',
    icon: 'hammer-outline',
  },
  inspection: {
    label: '3. Quality Inspection',
    percent: 90,
    color: '#8B5CF6',
    bgLight: '#EDE9FE',
    bgDark: 'rgba(139, 92, 246, 0.2)',
    icon: 'shield-checkmark-outline',
  },
  ready_for_dispatch: {
    label: '4. Ready for Dispatch',
    percent: 100,
    color: '#10B981',
    bgLight: '#DCFCE7',
    bgDark: 'rgba(16, 185, 129, 0.2)',
    icon: 'cube-outline',
  },
};

export default function VendorStudioScreen() {
  const router = useRouter();
  const { theme, isDark } = useAppTheme();
  const auth = useAppSelector((state) => state.auth);
  const { user, vendor } = auth;
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── Hub Mode Switcher (Open Requests vs Active Workbench) ───────────────────
  const [hubTab, setHubTab] = useState<'OPEN_REQUESTS' | 'ACTIVE_WORKBENCH'>('OPEN_REQUESTS');
  const [selectedCategory, setSelectedCategory] = useState<CustomRequestCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Data States ─────────────────────────────────────────────────────────────
  const [requests, setRequests] = useState<CustomClientRequest[]>(INITIAL_REQUESTS);
  const [commissions, setCommissions] = useState<ActiveWorkbenchCommission[]>(INITIAL_COMMISSIONS);

  // ── Modals & Sheets State ───────────────────────────────────────────────────
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [offerModalVisible, setOfferModalVisible] = useState(false);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const [imageLightboxVisible, setImageLightboxVisible] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Active item references for modals
  const [activeRequest, setActiveRequest] = useState<CustomClientRequest | null>(null);
  const [activeCommission, setActiveCommission] = useState<ActiveWorkbenchCommission | null>(null);

  // ── 2-Step Offer Wizard State ───────────────────────────────────────────────
  const [offerStep, setOfferStep] = useState<1 | 2>(1);
  const [bidPrice, setBidPrice] = useState<number>(150000);
  const [customPriceInput, setCustomPriceInput] = useState('');
  const [deliveryDays, setDeliveryDays] = useState<number>(10);
  const [weeksInput, setWeeksInput] = useState<string>('2');
  const [proposalNotes, setProposalNotes] = useState('');
  const [submittingBid, setSubmittingBid] = useState(false);

  // ── Milestone Update State ─────────────────────────────────────────────────
  const [selectedNewStage, setSelectedNewStage] = useState<ProductionStage>('crafting');
  const [milestoneNote, setMilestoneNote] = useState('');

  // ── Toast Helper ───────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2800);
  };

  // ── Refresh Handler ────────────────────────────────────────────────────────
  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Studio workbench synchronized with master database');
    }, 800);
  };

  // ── Currency Formatter Helper ───────────────────────────────────────────────
  const formatPriceValue = (val: number) => {
    return formatPrice(val, currencyCode, exchangeRate);
  };

  // ── Filtered Datasets ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      if (selectedCategory !== 'ALL' && r.category !== selectedCategory) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchDesc = r.description.toLowerCase().includes(q);
        const matchClient = r.customer.name.toLowerCase().includes(q);
        const matchMat = r.materialType.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchClient && !matchMat) return false;
      }
      return true;
    });
  }, [requests, selectedCategory, searchQuery]);

  const totalInStudioValue = useMemo(() => {
    return commissions.reduce((sum, c) => sum + c.agreedPrice, 0);
  }, [commissions]);

  // ── Handlers: Request Inspection & Bidding ─────────────────────────────────
  const handleOpenInspect = (req: CustomClientRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRequest(req);
    setInspectModalVisible(true);
  };

  const handleOpenOfferSheet = (req: CustomClientRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveRequest(req);
    setBidPrice(req.budget);
    setCustomPriceInput('');
    setDeliveryDays(Math.max(req.daysRemaining, 5));
    setWeeksInput(String(Math.ceil(Math.max(req.daysRemaining, 5) / 7)));
    setProposalNotes('');
    setOfferStep(1);
    setInspectModalVisible(false);
    setOfferModalVisible(true);
  };

  const handleAcceptClientBudget = () => {
    if (!activeRequest) return;
    setBidPrice(activeRequest.budget);
    setOfferStep(2);
  };

  const handleSubmitBid = () => {
    if (!activeRequest) return;
    setSubmittingBid(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      setSubmittingBid(false);
      setOfferModalVisible(false);
      setShowCelebration(true);

      // Update local state to record submitted bid
      setRequests((prev) =>
        prev.map((r) =>
          r.id === activeRequest.id
            ? {
                ...r,
                bidsCount: r.bidsCount + 1,
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
        showToast(`Bid of ${formatPriceValue(bidPrice)} sent to ${activeRequest.customer.name}!`);
        setActiveRequest(null);
      }, 2000);
    }, 900);
  };

  // ── Handlers: Milestone Progress ───────────────────────────────────────────
  const handleOpenMilestoneModal = (comm: ActiveWorkbenchCommission) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCommission(comm);
    setSelectedNewStage(comm.stage);
    setMilestoneNote(comm.recentUpdateNote || '');
    setMilestoneModalVisible(true);
  };

  const handleSaveMilestoneUpdate = () => {
    if (!activeCommission) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newPercent = STAGE_CONFIG[selectedNewStage].percent;

    setCommissions((prev) =>
      prev.map((c) =>
        c.id === activeCommission.id
          ? {
              ...c,
              stage: selectedNewStage,
              progressPercent: newPercent,
              recentUpdateNote: milestoneNote.trim() || `Advanced to ${STAGE_CONFIG[selectedNewStage].label}`,
            }
          : c
      )
    );

    setMilestoneModalVisible(false);
    showToast(`"${activeCommission.title}" updated to ${STAGE_CONFIG[selectedNewStage].label}!`);
    setActiveCommission(null);
  };

  // ── Lightbox Trigger ───────────────────────────────────────────────────────
  const handleOpenLightbox = (url: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLightboxImageUrl(url);
    setImageLightboxVisible(true);
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
        {/* ── 1. Master Studio Workshop Hero Card ──────────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#361300', '#1F0E04', '#120701'] : ['#5A2002', '#7D2E04', '#451700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroAvatarBox}>
              <Ionicons name="color-palette" size={30} color="#FFD79E" />
            </View>
            <View style={styles.heroInfoCol}>
              <View style={styles.badgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={10} color="#FFD79E" />
                  <Text style={styles.heroBadgeText}>ATELIER WORKBENCH</Text>
                </View>
                <View style={[styles.heroBadge, { backgroundColor: 'rgba(16, 185, 129, 0.25)', borderColor: '#10B981' }]}>
                  <View style={styles.onlineDot} />
                  <Text style={[styles.heroBadgeText, { color: '#A7F3D0' }]}>COMMISSIONS OPEN</Text>
                </View>
              </View>
              <Text style={styles.heroTitle} numberOfLines={1}>
                {vendor?.businessName || `${user?.firstName || 'Artisan'}'s Master Studio`}
              </Text>
              <Text style={styles.heroSubtitle}>
                Bespoke Heritage Commissions & Custom Client Made-to-Order Studio
              </Text>
            </View>
          </View>

          {/* Micro Metrics Strip */}
          <View style={styles.kpiRibbon}>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{requests.length}</Text>
              <Text style={styles.kpiRibbonLabel}>Open Bids</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{formatPriceValue(totalInStudioValue)}</Text>
              <Text style={styles.kpiRibbonLabel}>In-Studio Value</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={[styles.kpiRibbonNum, { color: '#FFD79E' }]}>{commissions.length}</Text>
              <Text style={styles.kpiRibbonLabel}>In Production</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. Primary 2-Way Hub Mode Switcher ────────────────────────────── */}
        <View
          style={[
            styles.hubSegmentWrap,
            {
              backgroundColor: isDark ? '#1F0E04' : '#EFE9E0',
              borderColor: isDark ? 'rgba(209, 153, 90, 0.2)' : 'rgba(196, 108, 39, 0.12)',
            },
          ]}
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHubTab('OPEN_REQUESTS');
            }}
            style={[
              styles.hubSegmentBtn,
              hubTab === 'OPEN_REQUESTS' && {
                backgroundColor: theme.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="hammer-outline"
              size={16}
              color={hubTab === 'OPEN_REQUESTS' ? '#FFFFFF' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.hubSegmentText,
                {
                  color: hubTab === 'OPEN_REQUESTS' ? '#FFFFFF' : theme.textPrimary,
                  fontFamily: hubTab === 'OPEN_REQUESTS' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                },
              ]}
            >
              Client Requests ({requests.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setHubTab('ACTIVE_WORKBENCH');
            }}
            style={[
              styles.hubSegmentBtn,
              hubTab === 'ACTIVE_WORKBENCH' && {
                backgroundColor: theme.primary,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.15,
                shadowRadius: 4,
                elevation: 3,
              },
            ]}
            activeOpacity={0.85}
          >
            <Ionicons
              name="construct-outline"
              size={16}
              color={hubTab === 'ACTIVE_WORKBENCH' ? '#FFFFFF' : theme.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.hubSegmentText,
                {
                  color: hubTab === 'ACTIVE_WORKBENCH' ? '#FFFFFF' : theme.textPrimary,
                  fontFamily: hubTab === 'ACTIVE_WORKBENCH' ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                },
              ]}
            >
              Active Workbench ({commissions.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* ─── TAB 1: OPEN CLIENT REQUESTS (MARKETPLACE) ───────────────────── */}
        {hubTab === 'OPEN_REQUESTS' && (
          <View>
            {/* Search & Category Filter Section */}
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
                  placeholder="Search requests, materials, or clients..."
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

            {/* Category Carousel Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryCarousel}
            >
              {CATEGORY_CHIPS.map((cat) => {
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

            {/* Request Cards List */}
            <View style={styles.cardsListContainer}>
              {filteredRequests.length === 0 ? (
                <View
                  style={[
                    styles.emptyStateCard,
                    { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                  ]}
                >
                  <Ionicons name="sparkles-outline" size={38} color={theme.primary} />
                  <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Requests Found</Text>
                  <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                    No custom commission requests currently match your selected filters.
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
                      {/* Card Header: Client avatar, name, and badge */}
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.clientAvatarCol}>
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
                        </View>
                        <View style={styles.clientDetailsCol}>
                          <View style={styles.clientNameRow}>
                            <Text style={[styles.clientNameText, { color: theme.textPrimary }]} numberOfLines={1}>
                              {req.customer.name}
                            </Text>
                            {req.customer.verified && (
                              <Ionicons name="checkmark-circle" size={14} color="#10B981" style={{ marginLeft: 4 }} />
                            )}
                          </View>
                          <Text style={[styles.clientLocationText, { color: theme.textMuted }]} numberOfLines={1}>
                            <Ionicons name="location-sharp" size={10} color={theme.textMuted} /> {req.customer.location}
                          </Text>
                        </View>

                        {/* Status / Bids Badge */}
                        <View
                          style={[
                            styles.statusBadgePill,
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
                              styles.statusBadgeText,
                              { color: hasBid ? '#10B981' : isDark ? '#FFD79E' : '#B45309' },
                            ]}
                          >
                            {hasBid ? 'BID SUBMITTED' : `⏳ ${req.daysRemaining}d left`}
                          </Text>
                        </View>
                      </View>

                      {/* Request Title & Description */}
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

                      {/* Financial & Material Specs Row */}
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
                          <Ionicons name="eye-outline" size={15} color={theme.primary} style={{ marginRight: 6 }} />
                          <Text style={[styles.inspectActionBtnText, { color: theme.primary }]}>Inspect Spec</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => handleOpenOfferSheet(req)}
                          style={[styles.bidActionBtn, { backgroundColor: theme.primary }]}
                          activeOpacity={0.85}
                        >
                          <Ionicons
                            name={hasBid ? 'create-outline' : 'paper-plane'}
                            size={14}
                            color="#FFFFFF"
                            style={{ marginRight: 6 }}
                          />
                          <Text style={styles.bidActionBtnText}>
                            {hasBid ? 'Adjust Offer' : '✦ Send Offer'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* ─── TAB 2: ACTIVE WORKBENCH COMMISSIONS ─────────────────────────── */}
        {hubTab === 'ACTIVE_WORKBENCH' && (
          <View style={styles.cardsListContainer}>
            {commissions.length === 0 ? (
              <View
                style={[
                  styles.emptyStateCard,
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <Ionicons name="construct-outline" size={38} color={theme.primary} />
                <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>No Active Commissions</Text>
                <Text style={[styles.emptyStateSub, { color: theme.textSecondary }]}>
                  All studio pieces are currently completed or waiting for client offers.
                </Text>
              </View>
            ) : (
              commissions.map((comm) => {
                const stageMeta = STAGE_CONFIG[comm.stage];
                return (
                  <View
                    key={comm.id}
                    style={[
                      styles.commissionCard,
                      {
                        backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(209, 153, 90, 0.22)' : 'rgba(196, 108, 39, 0.14)',
                      },
                    ]}
                  >
                    {/* Header Strip with Stage Badge */}
                    <View style={styles.commCardHeader}>
                      <View>
                        <Text style={[styles.commIdText, { color: theme.primary }]}>{comm.id}</Text>
                        <Text style={[styles.commTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                          {comm.title}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.stagePill,
                          { backgroundColor: isDark ? stageMeta.bgDark : stageMeta.bgLight },
                        ]}
                      >
                        <Ionicons name={stageMeta.icon} size={12} color={stageMeta.color} style={{ marginRight: 4 }} />
                        <Text style={[styles.stagePillText, { color: stageMeta.color }]}>{stageMeta.label}</Text>
                      </View>
                    </View>

                    {/* Client & Agreed Value */}
                    <View style={styles.commMetaRow}>
                      <Text style={[styles.commClientText, { color: theme.textSecondary }]}>
                        Client: <Text style={{ color: theme.textPrimary, fontFamily: FontFamily.poppinsBold }}>{comm.client.name}</Text> • {comm.client.location}
                      </Text>
                      <Text style={[styles.commPriceText, { color: theme.primary }]}>
                        {formatPriceValue(comm.agreedPrice)}
                      </Text>
                    </View>

                    {/* Visual Stage Progress Bar */}
                    <View style={styles.progressWrap}>
                      <View style={styles.progressHeaderRow}>
                        <Text style={[styles.progressStageLabel, { color: theme.textMuted }]}>
                          Production Progress ({comm.progressPercent}%)
                        </Text>
                        <Text style={[styles.progressDeadlineLabel, { color: theme.textMuted }]}>
                          Due: {comm.targetCompletionDate} ({comm.daysRemaining} days)
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.progressBarTrack,
                          { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB' },
                        ]}
                      >
                        <View
                          style={[
                            styles.progressBarFill,
                            {
                              width: `${comm.progressPercent}%`,
                              backgroundColor: stageMeta.color,
                            },
                          ]}
                        />
                      </View>
                    </View>

                    {/* Recent Atelier Update Note */}
                    {comm.recentUpdateNote && (
                      <View
                        style={[
                          styles.recentUpdateBox,
                          { backgroundColor: isDark ? '#160902' : '#F9F5EE', borderColor: theme.borderSubtle },
                        ]}
                      >
                        <Ionicons name="information-circle-outline" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                        <Text style={[styles.recentUpdateText, { color: theme.textSecondary }]} numberOfLines={2}>
                          {comm.recentUpdateNote}
                        </Text>
                      </View>
                    )}

                    {/* Action Bar for Workbench */}
                    <View style={styles.commActionRow}>
                      <TouchableOpacity
                        onPress={() => handleOpenMilestoneModal(comm)}
                        style={[styles.milestoneBtn, { backgroundColor: theme.primary }]}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="sync-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.milestoneBtnText}>Update Milestone</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          showToast(`Direct artisan channel opened with ${comm.client.name}`);
                        }}
                        style={[
                          styles.chatClientBtn,
                          {
                            backgroundColor: isDark ? '#361300' : '#FFEDD5',
                            borderColor: theme.borderSubtle,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="chatbubble-ellipses-outline" size={15} color={theme.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.chatClientBtnText, { color: theme.primary }]}>Message Client</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}
          </View>
        )}

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
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.background }]}>
          {/* Sheet Header */}
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
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Request Specification</Text>
              <Text style={[styles.modalSubtitle, { color: theme.primary }]}>
                {activeRequest ? activeRequest.id : 'COMMISSION BRIEF'}
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
              {/* Client Profile Header */}
              <View
                style={[
                  styles.inspectClientCard,
                  { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                ]}
              >
                <View
                  style={[
                    styles.clientAvatarCircle,
                    { backgroundColor: isDark ? '#361300' : '#FFEDD5', width: 50, height: 50, borderRadius: 25 },
                  ]}
                >
                  <Text style={[styles.clientAvatarText, { color: theme.primary, fontSize: 20 }]}>
                    {activeRequest.customer.name.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.inspectClientName, { color: theme.textPrimary }]}>
                    {activeRequest.customer.name}
                  </Text>
                  <Text style={[styles.inspectClientLocation, { color: theme.textMuted }]}>
                    {activeRequest.customer.location}
                  </Text>
                  <Text style={[styles.inspectClientOrders, { color: theme.primary }]}>
                    ★ 5.0 • {activeRequest.customer.completedOrders} bespoke orders completed
                  </Text>
                </View>
              </View>

              {/* Title & Description */}
              <Text style={[styles.inspectTitleText, { color: theme.textPrimary }]}>{activeRequest.title}</Text>
              <Text style={[styles.inspectDescText, { color: theme.textSecondary }]}>{activeRequest.description}</Text>

              {/* Inspiration Image Gallery with Lightbox */}
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

              {/* Material & Colors Specification */}
              <View style={{ marginTop: 20 }}>
                <Text style={[styles.inspectSectionHeader, { color: theme.textPrimary }]}>
                  Material & Quality Standard
                </Text>
                <View
                  style={[
                    styles.specDetailCard,
                    { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle },
                  ]}
                >
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Selected Material:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.textPrimary }]}>{activeRequest.materialType}</Text>
                  </View>
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Quality Tier:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.textPrimary }]}>{activeRequest.materialQuality}</Text>
                  </View>
                  <View style={styles.specDetailRow}>
                    <Text style={[styles.specDetailLabel, { color: theme.textMuted }]}>Target Timeline:</Text>
                    <Text style={[styles.specDetailValue, { color: theme.primary }]}>
                      Due {activeRequest.deadlineDate} ({activeRequest.daysRemaining} days turnaround)
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          )}

          {/* Bottom Floating Action Bar for Inspection */}
          {activeRequest && (
            <View
              style={[
                styles.inspectBottomBar,
                { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderTopColor: theme.borderSubtle },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.inspectTargetLabel, { color: theme.textMuted }]}>CLIENT BUDGET</Text>
                <Text style={[styles.inspectTargetValue, { color: theme.primary }]}>
                  {formatPriceValue(activeRequest.budget)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleOpenOfferSheet(activeRequest)}
                style={[styles.inspectMakeOfferBtn, { backgroundColor: theme.primary }]}
                activeOpacity={0.85}
              >
                <Ionicons name="hammer" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.inspectMakeOfferBtnText}>Craft an Offer ✦</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: 2-STEP INTERACTIVE ARTISAN BID & COUNTER-OFFER SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={offerModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setOfferModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalBackdrop, { backgroundColor: theme.background }]}
        >
          {/* Wizard Header */}
          <View
            style={[
              styles.modalHeader,
              {
                borderBottomColor: theme.borderSubtle,
                backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
              },
            ]}
          >
            {offerStep === 2 ? (
              <TouchableOpacity onPress={() => setOfferStep(1)} style={styles.modalCloseBtn}>
                <Ionicons name="chevron-back" size={24} color={theme.textPrimary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => setOfferModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            )}

            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {offerStep === 1 ? 'Step 1: Offer Strategy' : 'Step 2: Milestone & Timeline'}
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
              {/* ── STEP 1: PRICING CONFIGURATION ── */}
              {offerStep === 1 && (
                <View>
                  <View
                    style={[
                      styles.offerTargetBanner,
                      { backgroundColor: isDark ? '#160902' : '#FAF6F0', borderColor: theme.borderSubtle },
                    ]}
                  >
                    <Text style={[styles.offerTargetSubtitle, { color: theme.textSecondary }]}>
                      {activeRequest.customer.name}&apos;s Requested Target Budget
                    </Text>
                    <Text style={[styles.offerTargetBigNum, { color: theme.primary }]}>
                      {formatPriceValue(activeRequest.budget)}
                    </Text>
                    <Text style={[styles.offerTargetDays, { color: theme.textMuted }]}>
                      Target Turnaround: {activeRequest.daysRemaining} Days
                    </Text>
                  </View>

                  {/* Accept Budget Instant Button */}
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
                            setOfferStep(2);
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

                  {/* Custom Price Numerical Input */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Custom Offer Amount (₦)</Text>
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
                      setOfferStep(2);
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

              {/* ── STEP 2: FINE-TUNING STEPPER & TIMELINE ── */}
              {offerStep === 2 && (
                <View>
                  {/* Price Stepper Box */}
                  <Text style={[styles.fieldLabel, { color: theme.textPrimary, textAlign: 'center' }]}>
                    Final Agreed / Proposed Price
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

                  {/* Production Timeline Input in Weeks/Days */}
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
                    📅 Ready in ~{deliveryDays} calendar days from commission start
                  </Text>

                  {/* Message to Client / Proposal Note */}
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
                    placeholder="Describe your authentic crafting process, authentic materials, or custom adjustments you will provide..."
                    placeholderTextColor={theme.textMuted}
                    multiline
                    numberOfLines={4}
                    value={proposalNotes}
                    onChangeText={setProposalNotes}
                  />

                  {/* Submit Bid Button */}
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
          MODAL 3: MILESTONE PROGRESS UPDATER MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={milestoneModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMilestoneModalVisible(false)}
      >
        <View style={styles.backdropDim}>
          <View
            style={[
              styles.milestoneModalCard,
              { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.primary },
            ]}
          >
            <View style={styles.milestoneModalHeader}>
              <Text style={[styles.milestoneModalTitle, { color: theme.textPrimary }]}>Update Milestone</Text>
              <Text style={[styles.milestoneModalSubtitle, { color: theme.primary }]} numberOfLines={1}>
                {activeCommission?.title}
              </Text>
            </View>

            {/* Stage Selector Grid */}
            <View style={styles.stageSelectGrid}>
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
                      styles.stageOptionBtn,
                      {
                        backgroundColor: isSelected
                          ? theme.primary
                          : isDark
                          ? '#160902'
                          : '#F9F5EE',
                        borderColor: isSelected ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={meta.icon}
                      size={15}
                      color={isSelected ? '#FFFFFF' : meta.color}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.stageOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.poppinsBold : FontFamily.poppinsMedium,
                        },
                      ]}
                    >
                      {meta.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Note to Client */}
            <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 14 }]}>
              Progress Update Note for Client
            </Text>
            <TextInput
              style={[
                styles.milestoneInput,
                {
                  backgroundColor: isDark ? '#160902' : '#FFFFFF',
                  color: theme.textPrimary,
                  borderColor: theme.borderSubtle,
                },
              ]}
              placeholder="e.g. Master wood carving completed; starting brass horn assembly..."
              placeholderTextColor={theme.textMuted}
              multiline
              numberOfLines={2}
              value={milestoneNote}
              onChangeText={setMilestoneNote}
            />

            {/* Modal Actions */}
            <View style={styles.milestoneActionsRow}>
              <TouchableOpacity
                onPress={() => setMilestoneModalVisible(false)}
                style={[styles.milestoneCancelBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.milestoneCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveMilestoneUpdate}
                style={[styles.milestoneSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.milestoneSaveText}>Save Progress</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4: FULLSCREEN LIGHTBOX PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={imageLightboxVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setImageLightboxVisible(false)}
      >
        <View style={styles.lightboxBackdrop}>
          <TouchableOpacity
            onPress={() => setImageLightboxVisible(false)}
            style={styles.lightboxCloseBtn}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="close-circle" size={34} color="#FFFFFF" />
          </TouchableOpacity>
          {lightboxImageUrl && (
            <Image
              source={{ uri: lightboxImageUrl }}
              style={styles.lightboxFullImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          CELEBRATION SPLASH MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showCelebration && (
        <Modal transparent animationType="fade" visible={showCelebration}>
          <View style={styles.celebrationBackdrop}>
            <View style={[styles.celebrationCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' }]}>
              <View style={styles.celebrationIconBox}>
                <Ionicons name="checkmark-circle" size={48} color="#10B981" />
              </View>
              <Text style={[styles.celebrationTitle, { color: theme.textPrimary }]}>Bid Dispatched!</Text>
              <Text style={[styles.celebrationSub, { color: theme.textSecondary }]}>
                Your artisan proposal has been delivered to {activeRequest?.customer.name}.
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
    width: 52,
    height: 52,
    borderRadius: 26,
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
    fontSize: 19,
    color: '#FFFFFF',
    lineHeight: 24,
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

  // 2. Hub Mode Segment Switcher
  hubSegmentWrap: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  hubSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.full,
  },
  hubSegmentText: {
    fontSize: 12,
  },

  // Search & Filters
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
  cardsListContainer: {
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
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  clientAvatarCol: {
    marginRight: 10,
  },
  clientAvatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clientAvatarText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  clientDetailsCol: {
    flex: 1,
  },
  clientNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clientNameText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },
  clientLocationText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    marginTop: 1,
  },
  statusBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
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
    width: 72,
    height: 72,
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
    gap: 8,
    marginTop: 6,
  },
  inspectActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  inspectActionBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },
  bidActionBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bidActionBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    color: '#FFFFFF',
  },

  // Commission Cards (Active Workbench)
  commissionCard: {
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    ...Shadows.sm,
  },
  commCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  commIdText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    letterSpacing: 0.5,
  },
  commTitleText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    marginTop: 1,
  },
  stagePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  stagePillText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
  },
  commMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  commClientText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    flex: 1,
  },
  commPriceText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 16,
  },
  progressWrap: {
    marginTop: 10,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressStageLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
  },
  progressDeadlineLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 10,
  },
  progressBarTrack: {
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  recentUpdateBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginTop: 10,
  },
  recentUpdateText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11,
    flex: 1,
  },
  commActionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  milestoneBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.lg,
  },
  milestoneBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
    color: '#FFFFFF',
  },
  chatClientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  chatClientBtnText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
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

  // Modals General
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

  // Inspect Modal Details
  inspectClientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  inspectClientName: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
  },
  inspectClientLocation: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    marginTop: 1,
  },
  inspectClientOrders: {
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
    width: 110,
    height: 110,
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

  // Offer Sheet Wizard
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

  // Milestone Modal
  backdropDim: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  milestoneModalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1.5,
    ...Shadows.lg,
  },
  milestoneModalHeader: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  milestoneModalTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 17,
  },
  milestoneModalSubtitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  stageSelectGrid: {
    gap: 8,
    marginVertical: 6,
  },
  stageOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    paddingHorizontal: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  stageOptionText: {
    fontSize: 12,
  },
  milestoneInput: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    height: 60,
    textAlignVertical: 'top',
  },
  milestoneActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.md,
  },
  milestoneCancelBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneCancelText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
  },
  milestoneSaveBtn: {
    flex: 1.5,
    paddingVertical: 11,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  milestoneSaveText: {
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

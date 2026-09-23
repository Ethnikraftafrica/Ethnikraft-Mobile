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
  Switch,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ─── Data Types & Backend Enums ────────────────────────────────────────────────
export type ProductCategoryType =
  | 'ALL'
  | 'WEARS'
  | 'SHOES'
  | 'BAGS'
  | 'ACCESSORIES'
  | 'CRAFTS'
  | 'PAINTINGS'
  | 'ANTIQUES';

export type ProductCondition =
  | 'new'
  | 'vintage_heritage_reworked'
  | 'excellent_well_preserved'
  | 'good_minor_wear'
  | 'fair_aged_visible_damage';

export type StockFilterType =
  | 'ALL'
  | 'IN_STOCK'
  | 'LOW_STOCK'
  | 'OUT_OF_STOCK'
  | 'REQUESTABLE';

export type SortOption =
  | 'NEWEST'
  | 'PRICE_ASC'
  | 'PRICE_DESC'
  | 'STOCK_DESC'
  | 'POPULAR';

export interface CraftProductItem {
  id: string;
  name: string;
  productCategory: ProductCategoryType;
  price: number;
  basePrice?: number;
  stockQuantity: number;
  condition: ProductCondition;
  isRequestable: boolean;
  estimatedProductionDays?: number;
  isCustomizable: boolean;
  mainImage: string;
  imageList: string[];
  description: string;
  sku: string;
  rating: number;
  reviewCount: number;
  salesCount: number;
  material?: string;
  origin?: string;
  era?: string;
  weight?: number;
  weightUnit?: string;
  length?: number;
  width?: number;
  height?: number;
  packageSizeEnum?: string;
  createdAt: string;
}

// ─── Mock Product Dataset ──────────────────────────────────────────────────────
const INITIAL_PRODUCTS: CraftProductItem[] = [
  {
    id: 'prod-001',
    name: 'Royal Benin Leopard Bronze Sculpture',
    productCategory: 'CRAFTS',
    price: 320000,
    basePrice: 350000,
    stockQuantity: 1,
    condition: 'vintage_heritage_reworked',
    isRequestable: true,
    estimatedProductionDays: 14,
    isCustomizable: true,
    mainImage: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Museum-grade lost-wax bronze cast featuring traditional Edo leopard iconography with hand-chiseled ceremonial rosettes.',
    sku: 'BNN-BRZ-092',
    rating: 4.98,
    reviewCount: 24,
    salesCount: 18,
    material: 'Edo Bronze & Brass Alloy',
    origin: 'Benin Kingdom, Nigeria',
    era: 'Reworked 19th-Century Casting',
    weight: 4.5,
    weightUnit: 'kg',
    length: 32,
    width: 14,
    height: 28,
    packageSizeEnum: 'BOX_14X10X11_MEDIUM',
    createdAt: '2026-09-12',
  },
  {
    id: 'prod-002',
    name: 'Hand-Woven Royal Aso-Oke 3-Piece Agbada',
    productCategory: 'WEARS',
    price: 185000,
    stockQuantity: 8,
    condition: 'new',
    isRequestable: true,
    estimatedProductionDays: 7,
    isCustomizable: true,
    mainImage: 'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Woven on double-beam wooden looms in Iseyin using organic indigo-dyed cotton thread with metallic gold filigree accents.',
    sku: 'ASO-AGB-104',
    rating: 4.95,
    reviewCount: 42,
    salesCount: 36,
    material: 'Handloom Cotton & Silk Thread',
    origin: 'Iseyin, Oyo State',
    era: 'Contemporary Master Series',
    weight: 1.8,
    weightUnit: 'kg',
    packageSizeEnum: 'BOX_12X12X8_MEDIUM',
    createdAt: '2026-09-15',
  },
  {
    id: 'prod-003',
    name: 'Yoruba Ceremonial Beaded Coral Crown (Ade)',
    productCategory: 'ACCESSORIES',
    price: 145000,
    basePrice: 160000,
    stockQuantity: 3,
    condition: 'excellent_well_preserved',
    isRequestable: true,
    estimatedProductionDays: 21,
    isCustomizable: true,
    mainImage: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Over 12,000 micro-glass beads hand-strung onto palm fiber backing with bird totem pinnacle representing ancestral guardianship.',
    sku: 'YRB-CRN-007',
    rating: 5.0,
    reviewCount: 19,
    salesCount: 12,
    material: 'Natural Coral & Czech Glass Beads',
    origin: 'Ile-Ife, Osun State',
    era: 'Vintage 1980s Preservation',
    weight: 0.95,
    weightUnit: 'kg',
    packageSizeEnum: 'BOX_8X8X8_SMALL',
    createdAt: '2026-09-08',
  },
  {
    id: 'prod-004',
    name: 'Fulani Hand-Tooled Leather Weekend Satchel',
    productCategory: 'BAGS',
    price: 92000,
    stockQuantity: 12,
    condition: 'new',
    isRequestable: false,
    isCustomizable: false,
    mainImage: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Vegetable-tanned full-grain goat hide featuring geometric pyrographic carvings and hand-waxed brass hardware.',
    sku: 'FLN-BAG-220',
    rating: 4.88,
    reviewCount: 31,
    salesCount: 54,
    material: 'Vegetable-Tanned Hide & Solid Brass',
    origin: 'Kano Leather Quarter',
    era: 'Modern Heritage Cut',
    weight: 1.4,
    weightUnit: 'kg',
    packageSizeEnum: 'BOX_14X10X11_MEDIUM',
    createdAt: '2026-09-18',
  },
  {
    id: 'prod-005',
    name: 'Sacred Oshogbo Grove Spirits — Oil on Canvas',
    productCategory: 'PAINTINGS',
    price: 240000,
    stockQuantity: 1,
    condition: 'new',
    isRequestable: false,
    isCustomizable: false,
    mainImage: 'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Original canvas by master disciple expressing river deification and rainforest folklore through vivid mineral pigments.',
    sku: 'OSH-ART-043',
    rating: 4.97,
    reviewCount: 15,
    salesCount: 8,
    material: 'Natural Mineral Pigments & Canvas',
    origin: 'Oshogbo, Osun State',
    era: '2026 Atelier Collection',
    weight: 2.1,
    weightUnit: 'kg',
    packageSizeEnum: 'POSTER_TUBE_LARGE',
    createdAt: '2026-09-02',
  },
  {
    id: 'prod-006',
    name: '19th-Century Ashanti Carved Golden Stool Replica',
    productCategory: 'ANTIQUES',
    price: 480000,
    basePrice: 520000,
    stockQuantity: 1,
    condition: 'vintage_heritage_reworked',
    isRequestable: true,
    estimatedProductionDays: 30,
    isCustomizable: true,
    mainImage: 'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1582562124811-c09040d0a901?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Solid mahogany sacred royal stool with embossed brass bell adornments and ancestral crescent silhouette.',
    sku: 'ASH-STL-019',
    rating: 5.0,
    reviewCount: 11,
    salesCount: 6,
    material: 'Seasoned Mahogany & Hammered Brass',
    origin: 'Kumasi / Ashanti Region',
    era: 'Historical Archive Recreation',
    weight: 8.2,
    weightUnit: 'kg',
    packageSizeEnum: 'BOX_20X20X12_XLARGE',
    createdAt: '2026-08-25',
  },
  {
    id: 'prod-007',
    name: 'Nubian Desert Hand-Stitched Leather Sandals',
    productCategory: 'SHOES',
    price: 58000,
    stockQuantity: 0,
    condition: 'new',
    isRequestable: true,
    estimatedProductionDays: 5,
    isCustomizable: false,
    mainImage: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
    imageList: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&auto=format&fit=crop&q=80',
    ],
    description: 'Constructed with dual-layer camel leather soles, braided ankle wraps, and hand-stained mahogany dye.',
    sku: 'NUB-SND-115',
    rating: 4.85,
    reviewCount: 38,
    salesCount: 89,
    material: 'Full-Grain Camel Leather',
    origin: 'Northern Terraces',
    era: 'Heritage Everyday Line',
    weight: 0.65,
    weightUnit: 'kg',
    packageSizeEnum: 'BOX_8X8X8_SMALL',
    createdAt: '2026-09-01',
  },
];

// ─── Category Tab Metadata ─────────────────────────────────────────────────────
const CATEGORY_TABS: { id: ProductCategoryType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'ALL', label: 'All Crafts', icon: 'sparkles' },
  { id: 'WEARS', label: 'Wears', icon: 'shirt-outline' },
  { id: 'SHOES', label: 'Footwear', icon: 'footsteps-outline' },
  { id: 'BAGS', label: 'Leather & Bags', icon: 'briefcase-outline' },
  { id: 'ACCESSORIES', label: 'Adornments', icon: 'diamond-outline' },
  { id: 'CRAFTS', label: 'Sculptures', icon: 'construct-outline' },
  { id: 'PAINTINGS', label: 'Fine Art', icon: 'color-palette-outline' },
  { id: 'ANTIQUES', label: 'Heritage Relics', icon: 'time-outline' },
];

const CONDITION_LABELS: Record<ProductCondition, { label: string; bgLight: string; bgDark: string; textColor: string }> = {
  new: { label: 'Pristine / New', bgLight: '#DCFCE7', bgDark: 'rgba(16, 185, 129, 0.2)', textColor: '#10B981' },
  vintage_heritage_reworked: { label: 'Vintage Heritage Reworked', bgLight: '#FEF3C7', bgDark: 'rgba(245, 158, 11, 0.2)', textColor: '#D97706' },
  excellent_well_preserved: { label: 'Well Preserved', bgLight: '#EDE9FE', bgDark: 'rgba(139, 92, 246, 0.2)', textColor: '#8B5CF6' },
  good_minor_wear: { label: 'Good Minor Wear', bgLight: '#E0F2FE', bgDark: 'rgba(14, 165, 233, 0.2)', textColor: '#0284C7' },
  fair_aged_visible_damage: { label: 'Aged Relic', bgLight: '#FEE2E2', bgDark: 'rgba(239, 68, 68, 0.2)', textColor: '#EF4444' },
};

const PACKAGE_SIZE_PRESETS = [
  { id: 'A5_MINI', label: 'A5 Mini Pouch', desc: 'Up to 0.5kg (Jewelry, Small cuffs)' },
  { id: 'A4_DOCUMENT', label: 'A4 Flat Box', desc: 'Up to 1.0kg (Small textiles, prints)' },
  { id: 'BOX_8X8X8_SMALL', label: 'Box Small (8x8x8")', desc: 'Up to 2.5kg (Sandals, small crowns)' },
  { id: 'BOX_14X10X11_MEDIUM', label: 'Box Medium (14x10x11")', desc: 'Up to 6kg (Agbada, Leather bags, Bronze)' },
  { id: 'BOX_20X20X12_XLARGE', label: 'Box XL (20x20x12")', desc: 'Up to 15kg (Royal Stools, Heavy Statues)' },
  { id: 'POSTER_TUBE_LARGE', label: 'Poster Art Tube', desc: 'Rolled Fine Art Canvases' },
  { id: 'CUSTOM', label: 'Custom Dimension', desc: 'Specify bespoke weight & dimensions' },
];

export default function VendorCatalogScreen() {
  const { theme, isDark } = useAppTheme();

  // ── State Management ─────────────────────────────────────────────────────────
  const [products, setProducts] = useState<CraftProductItem[]>(INITIAL_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategoryType>('ALL');
  const [selectedCondition, setSelectedCondition] = useState<string>('ALL');
  const [selectedStockFilter, setSelectedStockFilter] = useState<StockFilterType>('ALL');
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [refreshing, setRefreshing] = useState(false);

  // ── Modals State ─────────────────────────────────────────────────────────────
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);

  // Active items for modals
  const [activeProduct, setActiveProduct] = useState<CraftProductItem | null>(null);
  const [adjustingStockVal, setAdjustingStockVal] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // ── Form State for Add / Edit ────────────────────────────────────────────────
  const [formActiveTab, setFormActiveTab] = useState<'BASIC' | 'MEDIA' | 'BESPOKE' | 'SHIPPING' | 'STORY'>('BASIC');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategoryType>('CRAFTS');
  const [formPrice, setFormPrice] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formStock, setFormStock] = useState('1');
  const [formCondition, setFormCondition] = useState<ProductCondition>('new');
  const [formDescription, setFormDescription] = useState('');
  const [formIsRequestable, setFormIsRequestable] = useState(false);
  const [formProductionDays, setFormProductionDays] = useState('7');
  const [formIsCustomizable, setFormIsCustomizable] = useState(false);
  const [formMaterial, setFormMaterial] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formPackageSize, setFormPackageSize] = useState('BOX_14X10X11_MEDIUM');
  const [formWeight, setFormWeight] = useState('2.0');
  const [formMainImage, setFormMainImage] = useState('');

  // ── Toast Trigger ────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // ── Refresh Handler ──────────────────────────────────────────────────────────
  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      showToast('Craft catalog refreshed with live workshop sync');
    }, 800);
  };

  // ── Filtered & Sorted Products ───────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchSku = p.sku.toLowerCase().includes(q);
          const matchMat = p.material?.toLowerCase().includes(q);
          if (!matchTitle && !matchDesc && !matchSku && !matchMat) return false;
        }

        // Category filter
        if (selectedCategory !== 'ALL' && p.productCategory !== selectedCategory) {
          return false;
        }

        // Condition filter
        if (selectedCondition !== 'ALL' && p.condition !== selectedCondition) {
          return false;
        }

        // Stock filter
        if (selectedStockFilter === 'IN_STOCK' && p.stockQuantity <= 0) return false;
        if (selectedStockFilter === 'LOW_STOCK' && (p.stockQuantity <= 0 || p.stockQuantity > 4)) return false;
        if (selectedStockFilter === 'OUT_OF_STOCK' && p.stockQuantity > 0) return false;
        if (selectedStockFilter === 'REQUESTABLE' && !p.isRequestable) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return a.price - b.price;
        if (sortBy === 'PRICE_DESC') return b.price - a.price;
        if (sortBy === 'STOCK_DESC') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'POPULAR') return b.salesCount - a.salesCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [products, searchQuery, selectedCategory, selectedCondition, selectedStockFilter, sortBy]);

  // ── Aggregate Metrics ────────────────────────────────────────────────────────
  const totalCraftsCount = products.length;
  const totalValuation = useMemo(() => {
    return products.reduce((sum, item) => sum + item.price * Math.max(item.stockQuantity, 1), 0);
  }, [products]);
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 5).length;
  }, [products]);
  const requestableCount = useMemo(() => {
    return products.filter((p) => p.isRequestable).length;
  }, [products]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleOpenAddForm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setActiveProduct(null);
    setFormTitle('');
    setFormCategory('CRAFTS');
    setFormPrice('');
    setFormBasePrice('');
    setFormStock('1');
    setFormCondition('new');
    setFormDescription('');
    setFormIsRequestable(false);
    setFormProductionDays('7');
    setFormIsCustomizable(false);
    setFormMaterial('Seasoned Iroko Wood & Hammered Brass');
    setFormOrigin('Oyo Atelier, Nigeria');
    setFormPackageSize('BOX_14X10X11_MEDIUM');
    setFormWeight('2.5');
    setFormMainImage('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80');
    setFormActiveTab('BASIC');
    setFormModalVisible(true);
  };

  const handleOpenEditForm = (item: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveProduct(item);
    setFormTitle(item.name);
    setFormCategory(item.productCategory);
    setFormPrice(item.price.toString());
    setFormBasePrice(item.basePrice ? item.basePrice.toString() : '');
    setFormStock(item.stockQuantity.toString());
    setFormCondition(item.condition);
    setFormDescription(item.description);
    setFormIsRequestable(item.isRequestable);
    setFormProductionDays(item.estimatedProductionDays ? item.estimatedProductionDays.toString() : '7');
    setFormIsCustomizable(item.isCustomizable);
    setFormMaterial(item.material || '');
    setFormOrigin(item.origin || '');
    setFormPackageSize(item.packageSizeEnum || 'BOX_14X10X11_MEDIUM');
    setFormWeight(item.weight ? item.weight.toString() : '1.5');
    setFormMainImage(item.mainImage);
    setFormActiveTab('BASIC');
    setFormModalVisible(true);
  };

  const handleSaveProductForm = () => {
    if (!formTitle.trim() || !formPrice.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('Please provide a Craft Title and Price');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parsedPrice = parseFloat(formPrice) || 0;
    const parsedBasePrice = formBasePrice ? parseFloat(formBasePrice) : undefined;
    const parsedStock = parseInt(formStock, 10) || 0;
    const parsedDays = formIsRequestable ? parseInt(formProductionDays, 10) || 7 : undefined;
    const parsedWeight = parseFloat(formWeight) || 1.0;

    if (activeProduct) {
      // Update
      setProducts((prev) =>
        prev.map((p) =>
          p.id === activeProduct.id
            ? {
                ...p,
                name: formTitle.trim(),
                productCategory: formCategory,
                price: parsedPrice,
                basePrice: parsedBasePrice,
                stockQuantity: parsedStock,
                condition: formCondition,
                description: formDescription.trim(),
                isRequestable: formIsRequestable,
                estimatedProductionDays: parsedDays,
                isCustomizable: formIsCustomizable,
                material: formMaterial,
                origin: formOrigin,
                packageSizeEnum: formPackageSize,
                weight: parsedWeight,
                mainImage: formMainImage || p.mainImage,
              }
            : p
        )
      );
      showToast(`"${formTitle.trim()}" updated successfully`);
    } else {
      // Create new
      const newCraft: CraftProductItem = {
        id: `prod-${Date.now().toString().slice(-4)}`,
        name: formTitle.trim(),
        productCategory: formCategory,
        price: parsedPrice,
        basePrice: parsedBasePrice,
        stockQuantity: parsedStock,
        condition: formCondition,
        isRequestable: formIsRequestable,
        estimatedProductionDays: parsedDays,
        isCustomizable: formIsCustomizable,
        mainImage: formMainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        imageList: [formMainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80'],
        description: formDescription.trim() || 'Mastercrafted authentic heritage artisan piece.',
        sku: `ETH-${formCategory.slice(0, 3)}-${Math.floor(100 + Math.random() * 900)}`,
        rating: 5.0,
        reviewCount: 0,
        salesCount: 0,
        material: formMaterial || 'Natural African Materials',
        origin: formOrigin || 'Artisan Workshop',
        era: 'New 2026 Collection',
        packageSizeEnum: formPackageSize,
        weight: parsedWeight,
        weightUnit: 'kg',
        createdAt: new Date().toISOString().split('T')[0],
      };
      setProducts((prev) => [newCraft, ...prev]);
      showToast(`Masterpiece "${formTitle.trim()}" listed in Atelier!`);
    }

    setFormModalVisible(false);
    setActiveProduct(null);
  };

  const handleOpenStockAdjust = (item: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveProduct(item);
    setAdjustingStockVal(item.stockQuantity);
    setStockModalVisible(true);
  };

  const handleSaveStockAdjust = () => {
    if (!activeProduct) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProducts((prev) =>
      prev.map((p) => (p.id === activeProduct.id ? { ...p, stockQuantity: Math.max(0, adjustingStockVal) } : p))
    );
    setStockModalVisible(false);
    showToast(`Inventory updated: ${activeProduct.name} now has ${adjustingStockVal} units`);
    setActiveProduct(null);
  };

  const handleOpenDelete = (item: CraftProductItem) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setActiveProduct(item);
    setDeleteModalVisible(true);
  };

  const handleConfirmDelete = () => {
    if (!activeProduct) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setProducts((prev) => prev.filter((p) => p.id !== activeProduct.id));
    setDeleteModalVisible(false);
    showToast(`"${activeProduct.name}" removed from workshop catalog`);
    setActiveProduct(null);
  };

  const handleOpenPreview = (item: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveProduct(item);
    setPreviewModalVisible(true);
  };

  // Helper formatting for currency
  const formatNaira = (val: number) => {
    return '₦' + val.toLocaleString('en-NG');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* ── Toast Notification Pill ────────────────────────────────────────── */}
      {toastMessage && (
        <View style={[styles.toastContainer, { backgroundColor: isDark ? '#1F0E04' : '#101213', borderColor: theme.primary }]}>
          <Ionicons name="checkmark-circle" size={18} color="#10B981" style={{ marginRight: 8 }} />
          <Text style={[styles.toastText, { color: '#FFF3D6' }]}>{toastMessage}</Text>
        </View>
      )}

      {/* ── Main Scroll Area ──────────────────────────────────────────────── */}
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
        {/* ── 1. Hero Action Banner & Metrics Strip ───────────────────────── */}
        <LinearGradient
          colors={isDark ? ['#361300', '#1F0E04', '#120701'] : ['#5A2002', '#7D2E04', '#451700']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <View style={styles.heroTextCol}>
              <View style={styles.badgeRow}>
                <View style={styles.heroBadge}>
                  <Ionicons name="sparkles" size={11} color="#FFD79E" />
                  <Text style={styles.heroBadgeText}>ATELIER INVENTORY</Text>
                </View>
                {lowStockCount > 0 && (
                  <View style={[styles.heroBadge, { backgroundColor: 'rgba(239, 68, 68, 0.25)', borderColor: '#EF4444' }]}>
                    <Ionicons name="alert-circle" size={11} color="#FCA5A5" />
                    <Text style={[styles.heroBadgeText, { color: '#FCA5A5' }]}>{lowStockCount} LOW STOCK</Text>
                  </View>
                )}
              </View>
              <Text style={styles.heroTitle}>Master Craft Catalog</Text>
              <Text style={styles.heroSubtitle}>
                Manage active inventory, bespoke made-to-order creations, and heritage certifications.
              </Text>
            </View>

            {/* + Add New Craft Button */}
            <TouchableOpacity
              onPress={handleOpenAddForm}
              style={styles.addHeroBtn}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={['#E5934C', '#C46C27']}
                style={styles.addHeroBtnGradient}
              >
                <Ionicons name="add" size={20} color="#FFFFFF" />
                <Text style={styles.addHeroBtnText}>Add Craft</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* KPI Micro Metric Ribbon */}
          <View style={styles.kpiRibbon}>
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{totalCraftsCount}</Text>
              <Text style={styles.kpiRibbonLabel}>Total Works</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={styles.kpiRibbonNum}>{formatNaira(totalValuation)}</Text>
              <Text style={styles.kpiRibbonLabel}>Catalog Value</Text>
            </View>
            <View style={styles.kpiRibbonDivider} />
            <View style={styles.kpiRibbonItem}>
              <Text style={[styles.kpiRibbonNum, { color: '#FFD79E' }]}>{requestableCount}</Text>
              <Text style={styles.kpiRibbonLabel}>Made-to-Order</Text>
            </View>
          </View>
        </LinearGradient>

        {/* ── 2. Search & Controls Bar ────────────────────────────────────── */}
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
              placeholder="Search by craft name, SKU, or material..."
              placeholderTextColor={theme.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              clearButtonMode="while-editing"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close-circle" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Modal Trigger */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setFilterModalVisible(true);
            }}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                borderColor:
                  selectedCondition !== 'ALL' || selectedStockFilter !== 'ALL' || sortBy !== 'NEWEST'
                    ? theme.primary
                    : isDark
                    ? 'rgba(209, 153, 90, 0.25)'
                    : 'rgba(196, 108, 39, 0.18)',
              },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={
                selectedCondition !== 'ALL' || selectedStockFilter !== 'ALL' || sortBy !== 'NEWEST'
                  ? theme.primary
                  : theme.textPrimary
              }
            />
            {(selectedCondition !== 'ALL' || selectedStockFilter !== 'ALL' || sortBy !== 'NEWEST') && (
              <View style={[styles.filterActiveDot, { backgroundColor: theme.primary }]} />
            )}
          </TouchableOpacity>

          {/* Grid / List Layout Switcher */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(viewMode === 'grid' ? 'list' : 'grid');
            }}
            style={[
              styles.iconBtn,
              {
                backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                borderColor: isDark ? 'rgba(209, 153, 90, 0.25)' : 'rgba(196, 108, 39, 0.18)',
              },
            ]}
            activeOpacity={0.75}
          >
            <Ionicons
              name={viewMode === 'grid' ? 'grid-outline' : 'list-outline'}
              size={18}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {/* ── 3. Horizontal Category Carousel ─────────────────────────────── */}
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
                  size={14}
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

        {/* ── 4. Active Filters Indicator & Results Count ─────────────────── */}
        <View style={styles.resultsHeaderRow}>
          <Text style={[styles.resultsCountText, { color: theme.textSecondary }]}>
            Showing <Text style={{ color: theme.primary, fontFamily: FontFamily.poppinsBold }}>{filteredProducts.length}</Text> of {totalCraftsCount} creations
          </Text>

          {(selectedCategory !== 'ALL' || selectedCondition !== 'ALL' || selectedStockFilter !== 'ALL' || searchQuery.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory('ALL');
                setSelectedCondition('ALL');
                setSelectedStockFilter('ALL');
                setSearchQuery('');
                setSortBy('NEWEST');
              }}
              style={styles.clearAllBtn}
            >
              <Text style={[styles.clearAllBtnText, { color: theme.primary }]}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── 5. Product List / Grid Rendering ────────────────────────────── */}
        {filteredProducts.length === 0 ? (
          <View style={[styles.emptyStateContainer, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle }]}>
            <View style={[styles.emptyIconCircle, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}>
              <Ionicons name="cube-outline" size={36} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.textPrimary }]}>No Crafts Found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
              No items match your active search and filter criteria in the atelier.
            </Text>
            <TouchableOpacity
              onPress={handleOpenAddForm}
              style={[styles.emptyActionBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyActionBtnText}>Create New Craft</Text>
            </TouchableOpacity>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {filteredProducts.map((item) => (
              <CraftGridCard
                key={item.id}
                item={item}
                theme={theme}
                isDark={isDark}
                onPreview={() => handleOpenPreview(item)}
                onEdit={() => handleOpenEditForm(item)}
                onAdjustStock={() => handleOpenStockAdjust(item)}
                onDelete={() => handleOpenDelete(item)}
                formatNaira={formatNaira}
              />
            ))}
          </View>
        ) : (
          <View style={styles.listContainer}>
            {filteredProducts.map((item) => (
              <CraftListCard
                key={item.id}
                item={item}
                theme={theme}
                isDark={isDark}
                onPreview={() => handleOpenPreview(item)}
                onEdit={() => handleOpenEditForm(item)}
                onAdjustStock={() => handleOpenStockAdjust(item)}
                onDelete={() => handleOpenDelete(item)}
                formatNaira={formatNaira}
              />
            ))}
          </View>
        )}

        <View style={{ height: 110 }} />
      </ScrollView>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1: ADD / EDIT UNIVERSAL PRODUCT FORM (FULL SHEET)
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={formModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setFormModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalBackdrop, { backgroundColor: theme.background }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle, backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' }]}>
            <TouchableOpacity
              onPress={() => setFormModalVisible(false)}
              style={styles.modalCloseBtn}
            >
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <View style={{ alignItems: 'center' }}>
              <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>
                {activeProduct ? 'Refine Masterpiece' : 'List New Masterpiece'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: theme.primary }]}>
                {activeProduct ? activeProduct.sku : 'ATELIER WORKBENCH'}
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleSaveProductForm}
              style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
              activeOpacity={0.8}
            >
              <Text style={styles.modalSaveBtnText}>Publish</Text>
            </TouchableOpacity>
          </View>

          {/* Segmented Form Navigation */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={[styles.formTabRibbon, { backgroundColor: isDark ? '#120701' : '#F5EFE6' }]}
            contentContainerStyle={{ paddingHorizontal: Spacing.md, paddingVertical: 8 }}
          >
            {[
              { id: 'BASIC', label: '1. Basic Info', icon: 'information-circle-outline' },
              { id: 'MEDIA', label: '2. Media Studio', icon: 'images-outline' },
              { id: 'BESPOKE', label: '3. Made-to-Order', icon: 'hammer-outline' },
              { id: 'SHIPPING', label: '4. Packaging', icon: 'cube-outline' },
              { id: 'STORY', label: '5. Heritage Story', icon: 'book-outline' },
            ].map((tab) => {
              const active = formActiveTab === tab.id;
              return (
                <TouchableOpacity
                  key={tab.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setFormActiveTab(tab.id as any);
                  }}
                  style={[
                    styles.formTabBtn,
                    {
                      backgroundColor: active ? theme.primary : 'transparent',
                      borderColor: active ? theme.primary : theme.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons
                    name={tab.icon as any}
                    size={13}
                    color={active ? '#FFFFFF' : theme.textSecondary}
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.formTabBtnText,
                      {
                        color: active ? '#FFFFFF' : theme.textSecondary,
                        fontFamily: active ? FontFamily.poppinsBold : FontFamily.poppinsRegular,
                      },
                    ]}
                  >
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Form Content Body */}
          <ScrollView
            style={styles.modalBody}
            contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}
            showsVerticalScrollIndicator={false}
          >
            {/* TAB 1: BASIC INFO */}
            {formActiveTab === 'BASIC' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Craft Name / Title *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                  placeholder="e.g. Royal Benin Bronze Leopard Sculpture"
                  placeholderTextColor={theme.textMuted}
                  value={formTitle}
                  onChangeText={setFormTitle}
                />

                <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 14 }]}>Category *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
                  {(['WEARS', 'SHOES', 'BAGS', 'ACCESSORIES', 'CRAFTS', 'PAINTINGS', 'ANTIQUES'] as ProductCategoryType[]).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      onPress={() => setFormCategory(cat)}
                      style={[
                        styles.chipOption,
                        {
                          backgroundColor: formCategory === cat ? theme.primary : isDark ? '#1F0E04' : '#FFFFFF',
                          borderColor: formCategory === cat ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                    >
                      <Text
                        style={{
                          color: formCategory === cat ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: FontFamily.poppinsMedium,
                          fontSize: 12,
                        }}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Listing Price (₦) *</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                      placeholder="85000"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={formPrice}
                      onChangeText={setFormPrice}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Base / Compare (₦)</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                      placeholder="100000"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={formBasePrice}
                      onChangeText={setFormBasePrice}
                    />
                  </View>
                </View>

                <View style={styles.twoColRow}>
                  <View style={{ flex: 1, marginRight: 8, marginTop: 14 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Initial Stock Quantity</Text>
                    <TextInput
                      style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                      placeholder="1"
                      placeholderTextColor={theme.textMuted}
                      keyboardType="numeric"
                      value={formStock}
                      onChangeText={setFormStock}
                    />
                  </View>
                  <View style={{ flex: 1, marginLeft: 8, marginTop: 14 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Craft Condition</Text>
                    <TouchableOpacity
                      onPress={() => {
                        const conditions: ProductCondition[] = [
                          'new',
                          'vintage_heritage_reworked',
                          'excellent_well_preserved',
                          'good_minor_wear',
                          'fair_aged_visible_damage',
                        ];
                        const nextIdx = (conditions.indexOf(formCondition) + 1) % conditions.length;
                        setFormCondition(conditions[nextIdx]);
                      }}
                      style={[
                        styles.formInput,
                        {
                          backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                          borderColor: theme.borderSubtle,
                          justifyContent: 'center',
                        },
                      ]}
                    >
                      <Text style={{ color: theme.primary, fontFamily: FontFamily.poppinsBold, fontSize: 12 }}>
                        {CONDITION_LABELS[formCondition]?.label || 'Pristine / New'} ↻
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 14 }]}>Atelier Description & Provenance</Text>
                <TextInput
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                      color: theme.textPrimary,
                      borderColor: theme.borderSubtle,
                      height: 100,
                      textAlignVertical: 'top',
                    },
                  ]}
                  placeholder="Detail the craftsmanship technique, materials, spiritual/cultural significance..."
                  placeholderTextColor={theme.textMuted}
                  multiline
                  numberOfLines={4}
                  value={formDescription}
                  onChangeText={setFormDescription}
                />
              </View>
            )}

            {/* TAB 2: MEDIA STUDIO */}
            {formActiveTab === 'MEDIA' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Primary Craft Showcase Photo</Text>
                <View
                  style={[
                    styles.mediaPreviewHero,
                    {
                      backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: formMainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80' }}
                    style={styles.mediaPreviewImg}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(0,0,0,0.85)']}
                    style={styles.mediaOverlay}
                  >
                    <Text style={styles.mediaOverlayText}>Primary Atelier Hero View</Text>
                  </LinearGradient>
                </View>

                <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 18 }]}>Quick Stock Photos Preset (Simulated Camera/Gallery)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
                  {[
                    'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop&q=80',
                    'https://images.unsplash.com/photo-1577083552431-6e5fd01aa342?w=800&auto=format&fit=crop&q=80',
                  ].map((imgUri, idx) => (
                    <TouchableOpacity
                      key={idx}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFormMainImage(imgUri);
                      }}
                      style={[
                        styles.mediaThumbnail,
                        {
                          borderColor: formMainImage === imgUri ? theme.primary : theme.borderSubtle,
                          borderWidth: formMainImage === imgUri ? 2.5 : 1,
                        },
                      ]}
                    >
                      <Image source={{ uri: imgUri }} style={{ width: '100%', height: '100%' }} />
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(196, 108, 39, 0.15)' : '#FFEDD5', borderColor: theme.primary, marginTop: 20 }]}>
                  <Ionicons name="sparkles" size={20} color={theme.primary} style={{ marginRight: 10 }} />
                  <Text style={[styles.infoBannerText, { color: theme.textPrimary }]}>
                    Ethnikraft authenticates image provenance. Maximum 5 high-resolution perspectives per piece.
                  </Text>
                </View>
              </View>
            )}

            {/* TAB 3: MADE-TO-ORDER & BESPOKE */}
            {formActiveTab === 'BESPOKE' && (
              <View style={styles.formSection}>
                <View style={[styles.switchCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle }]}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>Available on Request (Made-to-Order)</Text>
                    <Text style={[styles.switchSubtitle, { color: theme.textSecondary }]}>
                      Enable bespoke commissions with two-stage escrow (production deposit + shipping on completion).
                    </Text>
                  </View>
                  <Switch
                    value={formIsRequestable}
                    onValueChange={(val) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFormIsRequestable(val);
                    }}
                    trackColor={{ false: '#767577', true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>

                {formIsRequestable && (
                  <View style={{ marginTop: 16 }}>
                    <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Estimated Production Days</Text>
                    <View style={styles.daysGrid}>
                      {['3', '7', '14', '21', '30'].map((day) => (
                        <TouchableOpacity
                          key={day}
                          onPress={() => setFormProductionDays(day)}
                          style={[
                            styles.dayBtn,
                            {
                              backgroundColor: formProductionDays === day ? theme.primary : isDark ? '#1F0E04' : '#FFFFFF',
                              borderColor: formProductionDays === day ? theme.primary : theme.borderSubtle,
                            },
                          ]}
                        >
                          <Text
                            style={{
                              color: formProductionDays === day ? '#FFFFFF' : theme.textPrimary,
                              fontFamily: FontFamily.poppinsBold,
                              fontSize: 13,
                            }}
                          >
                            {day} Days
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                <View style={[styles.switchCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle, marginTop: 16 }]}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={[styles.switchTitle, { color: theme.textPrimary }]}>Customizable Dimensions / Motifs</Text>
                    <Text style={[styles.switchSubtitle, { color: theme.textSecondary }]}>
                      Allow patrons to attach custom initials, tribal clan symbols, or specific measurements during checkout.
                    </Text>
                  </View>
                  <Switch
                    value={formIsCustomizable}
                    onValueChange={(val) => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setFormIsCustomizable(val);
                    }}
                    trackColor={{ false: '#767577', true: theme.primary }}
                    thumbColor="#FFFFFF"
                  />
                </View>
              </View>
            )}

            {/* TAB 4: PACKAGING & LOGISTICS */}
            {formActiveTab === 'SHIPPING' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Package Dimensions Preset *</Text>
                {PACKAGE_SIZE_PRESETS.map((pkg) => {
                  const selected = formPackageSize === pkg.id;
                  return (
                    <TouchableOpacity
                      key={pkg.id}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setFormPackageSize(pkg.id);
                      }}
                      style={[
                        styles.pkgCard,
                        {
                          backgroundColor: selected ? (isDark ? '#361300' : '#FFEDD5') : isDark ? '#1F0E04' : '#FFFFFF',
                          borderColor: selected ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                    >
                      <Ionicons
                        name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                        size={20}
                        color={selected ? theme.primary : theme.textMuted}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.pkgLabel, { color: theme.textPrimary }]}>{pkg.label}</Text>
                        <Text style={[styles.pkgDesc, { color: theme.textSecondary }]}>{pkg.desc}</Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}

                <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 16 }]}>Shipping Weight (kg) *</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                  placeholder="2.5"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
                  value={formWeight}
                  onChangeText={setFormWeight}
                />
              </View>
            )}

            {/* TAB 5: HERITAGE STORY */}
            {formActiveTab === 'STORY' && (
              <View style={styles.formSection}>
                <Text style={[styles.fieldLabel, { color: theme.textPrimary }]}>Primary Authentic Materials</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                  placeholder="e.g. Lost-wax Cast Edo Bronze, Hand-dyed Indigo Cotton"
                  placeholderTextColor={theme.textMuted}
                  value={formMaterial}
                  onChangeText={setFormMaterial}
                />

                <Text style={[styles.fieldLabel, { color: theme.textPrimary, marginTop: 14 }]}>Kingdom / Region of Origin</Text>
                <TextInput
                  style={[styles.formInput, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', color: theme.textPrimary, borderColor: theme.borderSubtle }]}
                  placeholder="e.g. Benin Kingdom, Edo State / Iseyin, Oyo"
                  placeholderTextColor={theme.textMuted}
                  value={formOrigin}
                  onChangeText={setFormOrigin}
                />

                <View style={[styles.storyCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.borderSubtle, marginTop: 20 }]}>
                  <Ionicons name="ribbon-outline" size={24} color={theme.primary} style={{ marginBottom: 6 }} />
                  <Text style={[styles.storyCardTitle, { color: theme.textPrimary }]}>Ethnikraft Heritage Badge</Text>
                  <Text style={[styles.storyCardText, { color: theme.textSecondary }]}>
                    Authentic pieces are minted with an immutable provenance certificate, assuring international patrons of historical legitimacy and fair-trade compensation.
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2: QUICK INVENTORY STOCK ADJUSTMENT
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
      >
        <View style={styles.backdropDim}>
          <View style={[styles.stepperModalCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: theme.primary }]}>
            <View style={styles.stepperHeader}>
              <Text style={[styles.stepperTitle, { color: theme.textPrimary }]}>Adjust Workshop Stock</Text>
              <Text style={[styles.stepperSubtitle, { color: theme.primary }]} numberOfLines={1}>
                {activeProduct?.name}
              </Text>
            </View>

            {/* Stepper Controls */}
            <View style={styles.stepperRow}>
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAdjustingStockVal((v) => Math.max(0, v - 1));
                }}
                style={[styles.stepperBtn, { backgroundColor: isDark ? '#361300' : '#FFEDD5', borderColor: theme.borderSubtle }]}
              >
                <Ionicons name="remove" size={24} color={theme.primary} />
              </TouchableOpacity>

              <View style={styles.stepperValueBox}>
                <Text style={[styles.stepperValueNum, { color: theme.textPrimary }]}>{adjustingStockVal}</Text>
                <Text style={[styles.stepperValueUnit, { color: theme.textSecondary }]}>Units in Atelier</Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAdjustingStockVal((v) => v + 1);
                }}
                style={[styles.stepperBtn, { backgroundColor: isDark ? '#361300' : '#FFEDD5', borderColor: theme.borderSubtle }]}
              >
                <Ionicons name="add" size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            {/* Quick Presets */}
            <View style={styles.presetRow}>
              {[0, 1, 5, 10, 25].map((preset) => (
                <TouchableOpacity
                  key={preset}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setAdjustingStockVal(preset);
                  }}
                  style={[
                    styles.presetBtn,
                    {
                      backgroundColor: adjustingStockVal === preset ? theme.primary : isDark ? '#120701' : '#F5EFE6',
                      borderColor: adjustingStockVal === preset ? theme.primary : theme.borderSubtle,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: adjustingStockVal === preset ? '#FFFFFF' : theme.textPrimary,
                      fontFamily: FontFamily.poppinsBold,
                      fontSize: 12,
                    }}
                  >
                    {preset === 0 ? 'Out' : `+${preset}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.stepperActions}>
              <TouchableOpacity
                onPress={() => setStockModalVisible(false)}
                style={[styles.stepperCancelBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.stepperCancelText, { color: theme.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSaveStockAdjust}
                style={[styles.stepperSaveBtn, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.stepperSaveText}>Save Inventory</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3: DELETE CONFIRMATION MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.backdropDim}>
          <View style={[styles.deleteModalCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF', borderColor: '#EF4444' }]}>
            <View style={styles.deleteIconCircle}>
              <Ionicons name="trash-outline" size={28} color="#EF4444" />
            </View>
            <Text style={[styles.deleteTitle, { color: theme.textPrimary }]}>Archive Craft Piece?</Text>
            <Text style={[styles.deleteSubtitle, { color: theme.textSecondary }]}>
              Are you sure you want to remove <Text style={{ fontFamily: FontFamily.poppinsBold, color: theme.textPrimary }}>"{activeProduct?.name}"</Text> from active workshop availability?
            </Text>

            <View style={styles.deleteActionRow}>
              <TouchableOpacity
                onPress={() => setDeleteModalVisible(false)}
                style={[styles.deleteCancelBtn, { borderColor: theme.borderSubtle }]}
              >
                <Text style={[styles.deleteCancelText, { color: theme.textSecondary }]}>Keep Piece</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmDelete}
                style={[styles.deleteConfirmBtn, { backgroundColor: '#EF4444' }]}
              >
                <Text style={styles.deleteConfirmText}>Remove Craft</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4: FILTER & SORT DRAWER SHEET
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View style={styles.backdropDimBottom}>
          <View style={[styles.filterSheetCard, { backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' }]}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: theme.textPrimary }]}>Catalog Filters & Sorting</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Ionicons name="close" size={22} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 460 }}>
              {/* Condition Filter */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary }]}>Craft Condition</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {[
                  { id: 'ALL', label: 'All Conditions' },
                  { id: 'new', label: 'Pristine / New' },
                  { id: 'vintage_heritage_reworked', label: 'Vintage Heritage' },
                  { id: 'excellent_well_preserved', label: 'Well Preserved' },
                  { id: 'good_minor_wear', label: 'Good Minor Wear' },
                ].map((cond) => (
                  <TouchableOpacity
                    key={cond.id}
                    onPress={() => setSelectedCondition(cond.id)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedCondition === cond.id ? theme.primary : isDark ? '#120701' : '#F5EFE6',
                        borderColor: selectedCondition === cond.id ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedCondition === cond.id ? '#FFFFFF' : theme.textPrimary,
                        fontFamily: FontFamily.poppinsMedium,
                        fontSize: 12,
                      }}
                    >
                      {cond.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Stock Status */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary }]}>Availability & Custom Work</Text>
              <View style={styles.chipWrap}>
                {[
                  { id: 'ALL', label: 'All Inventory' },
                  { id: 'IN_STOCK', label: 'In Stock' },
                  { id: 'LOW_STOCK', label: 'Low Stock (< 5)' },
                  { id: 'OUT_OF_STOCK', label: 'Sold Out' },
                  { id: 'REQUESTABLE', label: 'Made-to-Order' },
                ].map((st) => (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => setSelectedStockFilter(st.id as any)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: selectedStockFilter === st.id ? theme.primary : isDark ? '#120701' : '#F5EFE6',
                        borderColor: selectedStockFilter === st.id ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: selectedStockFilter === st.id ? '#FFFFFF' : theme.textPrimary,
                        fontFamily: FontFamily.poppinsMedium,
                        fontSize: 12,
                      }}
                    >
                      {st.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sort By */}
              <Text style={[styles.filterSectionTitle, { color: theme.textPrimary, marginTop: 14 }]}>Sort Catalog By</Text>
              <View style={styles.chipWrap}>
                {[
                  { id: 'NEWEST', label: '✦ Newest Additions' },
                  { id: 'PRICE_ASC', label: 'Price: Low to High' },
                  { id: 'PRICE_DESC', label: 'Price: High to Low' },
                  { id: 'STOCK_DESC', label: 'Highest Stock' },
                  { id: 'POPULAR', label: '★ Most Popular' },
                ].map((so) => (
                  <TouchableOpacity
                    key={so.id}
                    onPress={() => setSortBy(so.id as any)}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: sortBy === so.id ? theme.primary : isDark ? '#120701' : '#F5EFE6',
                        borderColor: sortBy === so.id ? theme.primary : theme.borderSubtle,
                      },
                    ]}
                  >
                    <Text
                      style={{
                        color: sortBy === so.id ? '#FFFFFF' : theme.textPrimary,
                        fontFamily: FontFamily.poppinsMedium,
                        fontSize: 12,
                      }}
                    >
                      {so.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilterModalVisible(false);
              }}
              style={[styles.applyFilterBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.applyFilterBtnText}>Apply Active Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 5: DETAIL PREVIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={previewModalVisible}
        presentationStyle="pageSheet"
        animationType="slide"
        onRequestClose={() => setPreviewModalVisible(false)}
      >
        <View style={[styles.modalBackdrop, { backgroundColor: theme.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: theme.borderSubtle, backgroundColor: isDark ? '#1F0E04' : '#FFFFFF' }]}>
            <TouchableOpacity onPress={() => setPreviewModalVisible(false)} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={22} color={theme.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.textPrimary }]}>Atelier Showcase</Text>
            <TouchableOpacity
              onPress={() => {
                setPreviewModalVisible(false);
                if (activeProduct) handleOpenEditForm(activeProduct);
              }}
              style={[styles.modalSaveBtn, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.modalSaveBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {activeProduct && (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: Spacing.lg, paddingBottom: 60 }}>
              <Image source={{ uri: activeProduct.mainImage }} style={styles.previewHeroImg} resizeMode="cover" />

              <View style={{ marginTop: 16 }}>
                <View style={styles.badgeRow}>
                  <View style={[styles.cardCategoryBadge, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}>
                    <Text style={[styles.cardCategoryText, { color: theme.primary }]}>{activeProduct.productCategory}</Text>
                  </View>
                  <View
                    style={[
                      styles.conditionPill,
                      {
                        backgroundColor: isDark
                          ? CONDITION_LABELS[activeProduct.condition]?.bgDark
                          : CONDITION_LABELS[activeProduct.condition]?.bgLight,
                      },
                    ]}
                  >
                    <Text style={[styles.conditionPillText, { color: CONDITION_LABELS[activeProduct.condition]?.textColor }]}>
                      {CONDITION_LABELS[activeProduct.condition]?.label}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.previewTitle, { color: theme.textPrimary }]}>{activeProduct.name}</Text>
                <Text style={[styles.previewSku, { color: theme.textMuted }]}>SKU: {activeProduct.sku} • {activeProduct.origin || 'Master Atelier'}</Text>

                <View style={styles.previewPriceRow}>
                  <Text style={[styles.previewPrice, { color: theme.primary }]}>{formatNaira(activeProduct.price)}</Text>
                  {activeProduct.basePrice && (
                    <Text style={styles.previewBasePrice}>{formatNaira(activeProduct.basePrice)}</Text>
                  )}
                  <View
                    style={[
                      styles.stockIndicatorBadge,
                      {
                        backgroundColor:
                          activeProduct.stockQuantity === 0
                            ? 'rgba(239, 68, 68, 0.15)'
                            : activeProduct.stockQuantity < 5
                            ? 'rgba(245, 158, 11, 0.15)'
                            : 'rgba(16, 185, 129, 0.15)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.stockIndicatorText,
                        {
                          color:
                            activeProduct.stockQuantity === 0
                              ? '#EF4444'
                              : activeProduct.stockQuantity < 5
                              ? '#D97706'
                              : '#10B981',
                        },
                      ]}
                    >
                      {activeProduct.stockQuantity === 0
                        ? 'Sold Out'
                        : `${activeProduct.stockQuantity} in stock`}
                    </Text>
                  </View>
                </View>

                <Text style={[styles.previewDescHeading, { color: theme.textPrimary }]}>Artisan Description</Text>
                <Text style={[styles.previewDescText, { color: theme.textSecondary }]}>{activeProduct.description}</Text>

                {activeProduct.material && (
                  <View style={[styles.specRow, { borderColor: theme.borderSubtle }]}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Primary Materials:</Text>
                    <Text style={[styles.specVal, { color: theme.textPrimary }]}>{activeProduct.material}</Text>
                  </View>
                )}

                {activeProduct.isRequestable && (
                  <View style={[styles.specRow, { borderColor: theme.borderSubtle }]}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Made-to-Order Turnaround:</Text>
                    <Text style={[styles.specVal, { color: theme.primary }]}>~{activeProduct.estimatedProductionDays || 7} Days Production</Text>
                  </View>
                )}

                {activeProduct.weight && (
                  <View style={[styles.specRow, { borderColor: theme.borderSubtle }]}>
                    <Text style={[styles.specLabel, { color: theme.textSecondary }]}>Packaging Weight:</Text>
                    <Text style={[styles.specVal, { color: theme.textPrimary }]}>{activeProduct.weight} {activeProduct.weightUnit || 'kg'}</Text>
                  </View>
                )}
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

// ─── Component: Grid Card ───────────────────────────────────────────────────────
function CraftGridCard({
  item,
  theme,
  isDark,
  onPreview,
  onEdit,
  onAdjustStock,
  onDelete,
  formatNaira,
}: {
  item: CraftProductItem;
  theme: any;
  isDark: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onAdjustStock: () => void;
  onDelete: () => void;
  formatNaira: (v: number) => string;
}) {
  const stockState = useMemo(() => {
    if (item.stockQuantity === 0) return { label: 'Sold Out', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (item.stockQuantity < 5) return { label: `${item.stockQuantity} Left`, color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: `${item.stockQuantity} In Stock`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  }, [item.stockQuantity]);

  return (
    <View
      style={[
        styles.gridCard,
        {
          backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
          borderColor: isDark ? 'rgba(209, 153, 90, 0.22)' : 'rgba(196, 108, 39, 0.14)',
        },
      ]}
    >
      {/* Thumbnail + Overlays */}
      <TouchableOpacity onPress={onPreview} activeOpacity={0.9} style={styles.gridThumbWrap}>
        <Image source={{ uri: item.mainImage }} style={styles.gridThumbImg} resizeMode="cover" />
        <LinearGradient
          colors={['rgba(0,0,0,0.55)', 'transparent', 'rgba(0,0,0,0.7)']}
          style={styles.gridThumbGradient}
        >
          {/* Top badges */}
          <View style={styles.gridCardTopRow}>
            <View style={styles.gridCategoryPill}>
              <Text style={styles.gridCategoryText}>{item.productCategory}</Text>
            </View>

            {item.isRequestable && (
              <View style={styles.gridRequestablePill}>
                <Ionicons name="hammer" size={10} color="#FFD79E" />
                <Text style={styles.gridRequestableText}>Custom</Text>
              </View>
            )}
          </View>

          {/* Bottom Stock Badge */}
          <View style={styles.gridCardBottomRow}>
            <View style={[styles.stockPillMini, { backgroundColor: stockState.bg }]}>
              <View style={[styles.stockDotMini, { backgroundColor: stockState.color }]} />
              <Text style={[styles.stockPillTextMini, { color: stockState.color }]}>{stockState.label}</Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Card Info Body */}
      <View style={styles.gridCardBody}>
        <Text style={[styles.gridCardTitle, { color: theme.textPrimary }]} numberOfLines={2}>
          {item.name}
        </Text>

        <Text style={[styles.gridCardSku, { color: theme.textMuted }]}>{item.sku}</Text>

        <View style={styles.gridPriceRow}>
          <Text style={[styles.gridPrice, { color: theme.primary }]}>{formatNaira(item.price)}</Text>
        </View>

        {/* Action Buttons Row */}
        <View style={styles.gridActionRow}>
          <TouchableOpacity
            onPress={onAdjustStock}
            style={[styles.gridQuickStockBtn, { borderColor: theme.borderSubtle, backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="cube-outline" size={13} color={theme.primary} />
            <Text style={[styles.gridQuickStockText, { color: theme.primary }]}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onEdit}
            style={[styles.gridEditBtn, { backgroundColor: theme.primary }]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="pencil-outline" size={13} color="#FFFFFF" />
            <Text style={styles.gridEditText}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.gridDeleteBtn, { borderColor: 'rgba(239, 68, 68, 0.3)' }]}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Component: List Card ───────────────────────────────────────────────────────
function CraftListCard({
  item,
  theme,
  isDark,
  onPreview,
  onEdit,
  onAdjustStock,
  onDelete,
  formatNaira,
}: {
  item: CraftProductItem;
  theme: any;
  isDark: boolean;
  onPreview: () => void;
  onEdit: () => void;
  onAdjustStock: () => void;
  onDelete: () => void;
  formatNaira: (v: number) => string;
}) {
  const stockState = useMemo(() => {
    if (item.stockQuantity === 0) return { label: 'Sold Out', color: '#EF4444', bg: 'rgba(239, 68, 68, 0.15)' };
    if (item.stockQuantity < 5) return { label: `${item.stockQuantity} left in studio`, color: '#D97706', bg: 'rgba(245, 158, 11, 0.15)' };
    return { label: `${item.stockQuantity} in stock`, color: '#10B981', bg: 'rgba(16, 185, 129, 0.15)' };
  }, [item.stockQuantity]);

  return (
    <TouchableOpacity
      onPress={onPreview}
      activeOpacity={0.92}
      style={[
        styles.listCard,
        {
          backgroundColor: isDark ? '#1F0E04' : '#FFFFFF',
          borderColor: isDark ? 'rgba(209, 153, 90, 0.22)' : 'rgba(196, 108, 39, 0.14)',
        },
      ]}
    >
      {/* Thumbnail */}
      <Image source={{ uri: item.mainImage }} style={styles.listThumbImg} resizeMode="cover" />

      {/* Content Column */}
      <View style={styles.listCardContent}>
        <View style={styles.listCardHeaderRow}>
          <View style={[styles.listCategoryBadge, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}>
            <Text style={[styles.listCategoryText, { color: theme.primary }]}>{item.productCategory}</Text>
          </View>
          {item.isRequestable && (
            <View style={styles.listRequestableBadge}>
              <Ionicons name="hammer-outline" size={11} color="#C46C27" />
              <Text style={styles.listRequestableText}>Made-to-Order</Text>
            </View>
          )}
        </View>

        <Text style={[styles.listCardTitle, { color: theme.textPrimary }]} numberOfLines={1}>
          {item.name}
        </Text>

        <Text style={[styles.listCardDesc, { color: theme.textSecondary }]} numberOfLines={2}>
          {item.description}
        </Text>

        <View style={styles.listPriceAndStockRow}>
          <Text style={[styles.listPrice, { color: theme.primary }]}>{formatNaira(item.price)}</Text>
          <View style={[styles.stockPillMini, { backgroundColor: stockState.bg }]}>
            <View style={[styles.stockDotMini, { backgroundColor: stockState.color }]} />
            <Text style={[styles.stockPillTextMini, { color: stockState.color }]}>{stockState.label}</Text>
          </View>
        </View>

        {/* Action strip */}
        <View style={styles.listActionStrip}>
          <TouchableOpacity
            onPress={onAdjustStock}
            style={[styles.listActionBtn, { backgroundColor: isDark ? '#361300' : '#FFEDD5' }]}
          >
            <Ionicons name="cube-outline" size={13} color={theme.primary} style={{ marginRight: 4 }} />
            <Text style={[styles.listActionBtnText, { color: theme.primary }]}>Stock</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onEdit}
            style={[styles.listActionBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="pencil" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={[styles.listActionBtnText, { color: '#FFFFFF' }]}>Edit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onDelete}
            style={[styles.listActionBtn, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}
          >
            <Ionicons name="trash-outline" size={13} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
    top: 14,
    left: 20,
    right: 20,
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    ...Shadows.lg,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsMedium,
    flex: 1,
  },

  // 1. Hero Card
  heroCard: {
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(209, 153, 90, 0.35)',
    marginBottom: Spacing.md,
    ...Shadows.md,
  },
  heroHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  heroTextCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(209, 153, 90, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.35)',
    gap: 4,
  },
  heroBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFD79E',
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF3D6',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  heroSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    color: '#EBD5BA',
    lineHeight: 16,
  },
  addHeroBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadows.md,
  },
  addHeroBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radius.full,
    gap: 4,
  },
  addHeroBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },

  // KPI Ribbon
  kpiRibbon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 158, 0.15)',
  },
  kpiRibbonItem: {
    alignItems: 'center',
    flex: 1,
  },
  kpiRibbonNum: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF3D6',
  },
  kpiRibbonLabel: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsRegular,
    color: '#D1995A',
    marginTop: 1,
  },
  kpiRibbonDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 215, 158, 0.18)',
  },

  // 2. Search Section
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm + 2,
  },
  searchBarWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.sm + 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    height: '100%',
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterActiveDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  // 3. Category Carousel
  categoryCarousel: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 6,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11,
  },

  // 4. Results Header Row
  resultsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: Spacing.sm,
    paddingHorizontal: 4,
  },
  resultsCountText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
  },
  clearAllBtn: {
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  clearAllBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
  },

  // 5. Grid View
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  gridCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 12) / 2,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 4,
    ...Shadows.sm,
  },
  gridThumbWrap: {
    width: '100%',
    height: 140,
    position: 'relative',
  },
  gridThumbImg: {
    width: '100%',
    height: '100%',
  },
  gridThumbGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    padding: 8,
    justifyContent: 'space-between',
  },
  gridCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gridCategoryPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  gridCategoryText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.4,
  },
  gridRequestablePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(196, 108, 39, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 3,
  },
  gridRequestableText: {
    color: '#FFF3D6',
    fontSize: 8,
    fontFamily: FontFamily.poppinsBold,
  },
  gridCardBottomRow: {
    flexDirection: 'row',
  },
  stockPillMini: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  stockDotMini: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  stockPillTextMini: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
  },
  gridCardBody: {
    padding: 10,
  },
  gridCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.cormorantBold,
    lineHeight: 16,
    minHeight: 32,
  },
  gridCardSku: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 2,
    marginBottom: 4,
  },
  gridPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gridPrice: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantBold,
  },
  gridActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  gridQuickStockBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: Radius.sm,
    borderWidth: 1,
    gap: 3,
  },
  gridQuickStockText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
  },
  gridEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5,
    borderRadius: Radius.sm,
    gap: 3,
  },
  gridEditText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
  },
  gridDeleteBtn: {
    width: 26,
    height: 26,
    borderRadius: Radius.sm,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // List View
  listContainer: {
    gap: 12,
  },
  listCard: {
    flexDirection: 'row',
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    padding: 10,
    gap: 12,
    ...Shadows.sm,
  },
  listThumbImg: {
    width: 95,
    height: 105,
    borderRadius: Radius.md,
  },
  listCardContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  listCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  listCategoryBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  listCategoryText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
  },
  listRequestableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
    gap: 3,
  },
  listRequestableText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
  },
  listCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantBold,
  },
  listCardDesc: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 14,
  },
  listPriceAndStockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listPrice: {
    fontSize: 16,
    fontFamily: FontFamily.cormorantBold,
  },
  listActionStrip: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  listActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  listActionBtnText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },

  // Empty State
  emptyStateContainer: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    maxWidth: 260,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12,
  },

  // Modal Backdrop & Base
  modalBackdrop: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: FontFamily.cormorantBold,
  },
  modalSubtitle: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    letterSpacing: 0.8,
  },
  modalSaveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  modalSaveBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.poppinsBold,
    fontSize: 11,
  },
  formTabRibbon: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(209, 153, 90, 0.2)',
  },
  formTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 8,
  },
  formTabBtnText: {
    fontSize: 11,
  },
  modalBody: {
    flex: 1,
  },
  formSection: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 4,
  },
  formInput: {
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    fontFamily: FontFamily.poppinsRegular,
  },
  twoColRow: {
    flexDirection: 'row',
  },
  chipOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 6,
  },

  // Media Studio
  mediaPreviewHero: {
    width: '100%',
    height: 180,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImg: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    padding: 12,
  },
  mediaOverlayText: {
    color: '#FFF3D6',
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
  mediaThumbnail: {
    width: 65,
    height: 65,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginRight: 10,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  infoBannerText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    flex: 1,
    lineHeight: 16,
  },

  // Switch Card
  switchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  switchTitle: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 2,
  },
  switchSubtitle: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 14,
  },
  daysGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },

  // Packaging
  pkgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 8,
  },
  pkgLabel: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
  pkgDesc: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 1,
  },

  // Story
  storyCard: {
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  storyCardTitle: {
    fontSize: 14,
    fontFamily: FontFamily.cormorantBold,
    marginBottom: 4,
  },
  storyCardText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    textAlign: 'center',
    lineHeight: 16,
  },

  // Stepper Modal (Quick Stock Adjust)
  backdropDim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  stepperModalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  stepperHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  stepperTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
  },
  stepperSubtitle: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    marginTop: 2,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: 10,
  },
  stepperBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepperValueBox: {
    alignItems: 'center',
    minWidth: 90,
  },
  stepperValueNum: {
    fontSize: 32,
    fontFamily: FontFamily.cormorantBold,
  },
  stepperValueUnit: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 12,
  },
  presetBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  stepperActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  stepperCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  stepperCancelText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
  },
  stepperSaveBtn: {
    flex: 1.5,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  stepperSaveText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },

  // Delete Modal
  deleteModalCard: {
    width: '100%',
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    padding: Spacing.lg,
    alignItems: 'center',
    ...Shadows.lg,
  },
  deleteIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  deleteTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    marginBottom: 6,
  },
  deleteSubtitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  deleteActionRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  deleteCancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    alignItems: 'center',
  },
  deleteCancelText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.full,
    alignItems: 'center',
  },
  deleteConfirmText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },

  // Filter Sheet Bottom Modal
  backdropDimBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  filterSheetCard: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    paddingBottom: 32,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(209, 153, 90, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sheetTitle: {
    fontSize: 17,
    fontFamily: FontFamily.cormorantBold,
  },
  filterSectionTitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    marginBottom: 8,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    marginRight: 6,
  },
  applyFilterBtn: {
    paddingVertical: 12,
    borderRadius: Radius.full,
    alignItems: 'center',
    marginTop: 10,
  },
  applyFilterBtnText: {
    color: '#FFFFFF',
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
  },

  // Preview Modal
  previewHeroImg: {
    width: '100%',
    height: 240,
    borderRadius: Radius.lg,
  },
  cardCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  cardCategoryText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },
  conditionPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  conditionPillText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsBold,
  },
  previewTitle: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
    marginTop: 8,
  },
  previewSku: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsRegular,
    marginTop: 2,
  },
  previewPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 12,
  },
  previewPrice: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
  },
  previewBasePrice: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantSemiBold,
    color: '#A8998C',
    textDecorationLine: 'line-through',
  },
  stockIndicatorBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  stockIndicatorText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
  },
  previewDescHeading: {
    fontSize: 14,
    fontFamily: FontFamily.poppinsBold,
    marginTop: 10,
    marginBottom: 4,
  },
  previewDescText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
    lineHeight: 18,
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  specLabel: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsRegular,
  },
  specVal: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
  },
});

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
  Switch,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import { VendorProductsSkeleton } from '@/components/common/Skeletons';
import {
  useGetVendorProductsQuery,
  useGetVendorProductsSummaryQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  VendorProductItem,
} from '@/store/api/vendorApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  | 'OUT_OF_STOCK';

export type ProductionTypeFilter =
  | 'ALL'
  | 'STANDARD'
  | 'CUSTOMIZABLE'
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
  packageSizeEnum?: string;
  collectionId?: string;
  createdAt: string;
}

const INITIAL_PRODUCTS: CraftProductItem[] = [];

const PRODUCT_TYPE_TABS: { key: ProductionTypeFilter; label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'STANDARD', label: 'Normal/ready to ship' },
  { key: 'CUSTOMIZABLE', label: 'Customizable' },
  { key: 'REQUESTABLE', label: 'On Request' },
];

const CATEGORY_FILTER_OPTIONS: { key: ProductCategoryType; label: string }[] = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'WEARS', label: 'Wears' },
  { key: 'SHOES', label: 'Shoes' },
  { key: 'BAGS', label: 'Bags' },
  { key: 'ACCESSORIES', label: 'Accessories' },
  { key: 'CRAFTS', label: 'Crafts' },
  { key: 'PAINTINGS', label: 'Paintings' },
  { key: 'ANTIQUES', label: 'Antiques' },
];

const FORM_CONDITION_OPTIONS: { key: ProductCondition; label: string; badge: string }[] = [
  { key: 'new', label: 'Brand New', badge: 'New' },
  { key: 'vintage_heritage_reworked', label: 'Vintage / Reworked', badge: 'Vintage' },
  { key: 'excellent_well_preserved', label: 'Excellent Condition', badge: 'Excellent' },
  { key: 'good_minor_wear', label: 'Good (Minor Wear)', badge: 'Good' },
  { key: 'fair_aged_visible_damage', label: 'Fair (Visible Wear)', badge: 'Fair' },
];

const CONDITION_OPTIONS: { key: ProductCondition | 'ALL'; label: string; badge: string }[] = [
  { key: 'ALL', label: 'All Conditions', badge: 'All' },
  ...FORM_CONDITION_OPTIONS,
];

const PACKAGE_SIZES: { key: string; label: string; desc: string }[] = [
  { key: 'A4_DOCUMENT', label: 'A4 Satchel / Document', desc: 'Flat items, stoles, lightweight textiles' },
  { key: 'BOX_10X7X5_SMALL', label: 'Small Box (10x7x5 in)', desc: 'Jewelry, beads, filigree, mini crafts' },
  { key: 'BOX_14X10X11_MEDIUM', label: 'Medium Box (14x10x11 in)', desc: 'Bags, shoes, bronze figurines' },
  { key: 'BOX_20X20X12_XLARGE', label: 'Large Crate (20x20x12 in)', desc: 'Stools, thrones, heavy sculptures' },
  { key: 'CUSTOM_DIMENSIONS', label: 'Custom Artisan Freight', desc: 'Oversized murals, fragile heirlooms' },
];

export default function VendorProductsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── Server Filter Parameters & Pagination (Passed to backend API) ───────
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [selectedCategories, setSelectedCategories] = useState<ProductCategoryType[]>(['ALL']);
  const [selectedStockFilters, setSelectedStockFilters] = useState<StockFilterType[]>(['ALL']);
  const [productionTypeFilter, setProductionTypeFilter] = useState<ProductionTypeFilter>('ALL');
  const [selectedConditions, setSelectedConditions] = useState<(ProductCondition | 'ALL')[]>(['ALL']);
  const [sortBy, setSortBy] = useState<SortOption>('NEWEST');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isApplyingFilters, setIsApplyingFilters] = useState(false);

  // Compute server parameters from single-select values and pagination
  const serverQueryParams = useMemo(() => {
    const params: {
      take: number;
      skip: number;
      productCategory?: string;
      condition?: string;
    } = {
      take: pageSize,
      skip: (currentPage - 1) * pageSize,
    };

    // If exactly one category is selected, pass it directly to backend Prisma query
    const activeCats = selectedCategories.filter((c) => c !== 'ALL');
    if (activeCats.length === 1) {
      params.productCategory = activeCats[0];
    }

    // If exactly one condition is selected, pass it directly to backend Prisma query
    const activeConds = selectedConditions.filter((c) => c !== 'ALL');
    if (activeConds.length === 1) {
      params.condition = activeConds[0];
    }

    return params;
  }, [currentPage, pageSize, selectedCategories, selectedConditions]);

  // ── RTK Query API Integration with Server-Side Filter Support ──
  const {
    data: productsResponse,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useGetVendorProductsQuery(serverQueryParams);

  const {
    data: productsSummaryData,
    refetch: refetchProductsSummary,
  } = useGetVendorProductsSummaryQuery();

  const [createProductMutation, { isLoading: isCreating }] = useCreateProductMutation();
  const [updateProductMutation, { isLoading: isUpdating }] = useUpdateProductMutation();
  const [deleteProductMutation, { isLoading: isDeleting }] = useDeleteProductMutation();

  // ── Sync Server Data with Local State (Zero-Flash Synchronous Derivation) ──
  const liveProducts = useMemo<CraftProductItem[]>(() => {
    if (!productsResponse?.products || !Array.isArray(productsResponse.products)) return [];
    return productsResponse.products.map((item: VendorProductItem) => ({
      id: item.id,
      name: item.name,
      productCategory: (item.productCategory?.toUpperCase() as ProductCategoryType) || 'CRAFTS',
      price: item.price,
      basePrice: item.basePrice,
      stockQuantity: item.stockQuantity,
      condition: (item.condition as ProductCondition) || 'new',
      isRequestable: item.isRequestable,
      estimatedProductionDays: item.estimatedProductionDays,
      isCustomizable: item.isCustomizable,
      mainImage: item.mainImage,
      imageList: item.imageList,
      description: item.description,
      sku: item.sku || `ETH-${item.id.slice(-4).toUpperCase()}`,
      rating: item.rating ?? 0,
      reviewCount: item.reviewCount ?? 0,
      salesCount: item.salesCount ?? 0,
      material: item.material,
      origin: item.origin,
      era: item.era,
      weight: item.weight,
      weightUnit: item.weightUnit,
      packageSizeEnum: item.packageSize,
      createdAt: item.createdAt,
    }));
  }, [productsResponse]);

  const [localProducts, setProducts] = useState<CraftProductItem[]>([]);
  const [syncedLiveProducts, setSyncedLiveProducts] = useState<CraftProductItem[]>(liveProducts);
  const products =
    productsResponse?.products && liveProducts !== syncedLiveProducts ? liveProducts : localProducts;

  // ── Draft Filter State (Isolated within Filter Modal) ──────
  const [draftCategories, setDraftCategories] = useState<ProductCategoryType[]>(['ALL']);
  const [draftStockFilters, setDraftStockFilters] = useState<StockFilterType[]>(['ALL']);
  const [draftConditions, setDraftConditions] = useState<(ProductCondition | 'ALL')[]>(['ALL']);
  const [draftSortBy, setDraftSortBy] = useState<SortOption>('NEWEST');

  // ── Open Filter Modal with Synchronized Draft State ────────
  const handleOpenFilterModal = () => {
    setDraftCategories([...selectedCategories]);
    setDraftStockFilters([...selectedStockFilters]);
    setDraftConditions([...selectedConditions]);
    setDraftSortBy(sortBy);
    setFilterModalVisible(true);
  };

  // ── Commit Draft Filters with Visual Loading State ──────────
  const handleApplyDraftFilters = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsApplyingFilters(true);

    setSelectedCategories([...draftCategories]);
    setSelectedStockFilters([...draftStockFilters]);
    setSelectedConditions([...draftConditions]);
    setSortBy(draftSortBy);

    // Give visual feedback and await query transition
    await new Promise((resolve) => setTimeout(resolve, 350));
    setIsApplyingFilters(false);
    setFilterModalVisible(false);
  };

  // ── Multi-Select Toggle Helpers for Draft State ────────────
  const toggleDraftCategory = (cat: ProductCategoryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cat === 'ALL') {
      setDraftCategories(['ALL']);
      return;
    }
    setDraftCategories((prev) => {
      const withoutAll = prev.filter((c) => c !== 'ALL');
      if (withoutAll.includes(cat)) {
        const remaining = withoutAll.filter((c) => c !== cat);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...withoutAll, cat];
      }
    });
  };

  const toggleDraftStockFilter = (stock: StockFilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (stock === 'ALL') {
      setDraftStockFilters(['ALL']);
      return;
    }
    setDraftStockFilters((prev) => {
      const withoutAll = prev.filter((s) => s !== 'ALL');
      if (withoutAll.includes(stock)) {
        const remaining = withoutAll.filter((s) => s !== stock);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...withoutAll, stock];
      }
    });
  };

  const toggleDraftConditionFilter = (cond: ProductCondition | 'ALL') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (cond === 'ALL') {
      setDraftConditions(['ALL']);
      return;
    }
    setDraftConditions((prev) => {
      const withoutAll = prev.filter((c) => c !== 'ALL');
      if (withoutAll.includes(cond)) {
        const remaining = withoutAll.filter((c) => c !== cond);
        return remaining.length === 0 ? ['ALL'] : remaining;
      } else {
        return [...withoutAll, cond];
      }
    });
  };

  // ── Direct Chip Quick-Remove Helpers ───────────────────────
  const removeActiveCategory = (cat: ProductCategoryType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategories((prev) => {
      const remaining = prev.filter((c) => c !== cat);
      return remaining.length === 0 ? ['ALL'] : remaining;
    });
  };

  const removeActiveStockFilter = (stock: StockFilterType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedStockFilters((prev) => {
      const remaining = prev.filter((s) => s !== stock);
      return remaining.length === 0 ? ['ALL'] : remaining;
    });
  };

  const removeActiveConditionFilter = (cond: ProductCondition | 'ALL') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedConditions((prev) => {
      const remaining = prev.filter((c) => c !== cond);
      return remaining.length === 0 ? ['ALL'] : remaining;
    });
  };

  // ── Modals ─────────────────────────────────────────────────
  const [productModalVisible, setProductModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CraftProductItem | null>(null);
  const [inspectModalVisible, setInspectModalVisible] = useState(false);
  const [activeInspectProduct, setActiveInspectProduct] = useState<CraftProductItem | null>(null);
  const [stockModalVisible, setStockModalVisible] = useState(false);
  const [targetStockProduct, setTargetStockProduct] = useState<CraftProductItem | null>(null);
  const [stockEditQty, setStockEditQty] = useState(0);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [targetDeleteProduct, setTargetDeleteProduct] = useState<CraftProductItem | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);

  // ── Form State for Add / Edit ──────────────────────────────
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState<ProductCategoryType>('CRAFTS');
  const [formPrice, setFormPrice] = useState('');
  const [formBasePrice, setFormBasePrice] = useState('');
  const [formStock, setFormStock] = useState('1');
  const [formCondition, setFormCondition] = useState<ProductCondition>('new');
  const [formSku, setFormSku] = useState('');
  const [formImage, setFormImage] = useState('');
  const [formImageList, setFormImageList] = useState<string[]>([]);
  const [newGalleryInput, setNewGalleryInput] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formMaterial, setFormMaterial] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formEra, setFormEra] = useState('Contemporary Heritage');
  const [formWeight, setFormWeight] = useState('1.5');
  const [formWeightUnit, setFormWeightUnit] = useState('kg');
  const [formPackageSize, setFormPackageSize] = useState('BOX_14X10X11_MEDIUM');
  const [formRequestable, setFormRequestable] = useState(true);
  const [formEstDays, setFormEstDays] = useState('14');
  const [formCustomizable, setFormCustomizable] = useState(false);

  useEffect(() => {
    if (productsResponse?.products) {
      setProducts(liveProducts);
      setSyncedLiveProducts(liveProducts);
    }
  }, [productsResponse, liveProducts]);

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refetchProducts().unwrap(),
        refetchProductsSummary(),
      ]);
    } catch {
      // Handled by global baseApi error interceptor
    } finally {
      setRefreshing(false);
    }
  };

  // ── Derived Filtered Products (Multi-Select Supported) ─────
  const isCategoryFiltered = !selectedCategories.includes('ALL') && selectedCategories.length > 0;
  const isStockFiltered = !selectedStockFilters.includes('ALL') && selectedStockFilters.length > 0;
  const isConditionFiltered = !selectedConditions.includes('ALL') && selectedConditions.length > 0;

  const filteredProducts = useMemo(() => {
    return products
      .filter((item) => {
        // Multi-select Categories
        if (isCategoryFiltered && !selectedCategories.includes(item.productCategory)) {
          return false;
        }

        // Multi-select Stock Levels
        if (isStockFiltered) {
          const matchInStock = selectedStockFilters.includes('IN_STOCK') && item.stockQuantity > 2;
          const matchLowStock = selectedStockFilters.includes('LOW_STOCK') && (item.stockQuantity > 0 && item.stockQuantity <= 2);
          const matchOutOfStock = selectedStockFilters.includes('OUT_OF_STOCK') && item.stockQuantity <= 0;
          if (!matchInStock && !matchLowStock && !matchOutOfStock) return false;
        }

        // Production / Commission Type filtering
        if (productionTypeFilter === 'STANDARD' && (item.isCustomizable || item.isRequestable)) return false;
        if (productionTypeFilter === 'CUSTOMIZABLE' && !item.isCustomizable) return false;
        if (productionTypeFilter === 'REQUESTABLE' && !item.isRequestable) return false;

        // Multi-select Conditions
        if (isConditionFiltered && !selectedConditions.includes(item.condition)) {
          return false;
        }

        if (searchQuery.trim().length > 0) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchSku = item.sku.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchOrigin = (item.origin || '').toLowerCase().includes(q);
          const matchMaterial = (item.material || '').toLowerCase().includes(q);
          return matchName || matchSku || matchDesc || matchOrigin || matchMaterial;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'PRICE_ASC') return a.price - b.price;
        if (sortBy === 'PRICE_DESC') return b.price - a.price;
        if (sortBy === 'STOCK_DESC') return b.stockQuantity - a.stockQuantity;
        if (sortBy === 'POPULAR') return b.salesCount - a.salesCount;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [
    products,
    selectedCategories,
    selectedStockFilters,
    productionTypeFilter,
    selectedConditions,
    searchQuery,
    sortBy,
    isCategoryFiltered,
    isStockFiltered,
    isConditionFiltered,
  ]);

  const hasActiveModalFilters =
    isCategoryFiltered ||
    isStockFiltered ||
    isConditionFiltered ||
    sortBy !== 'NEWEST';
  const hasAnyFilterActive =
    productionTypeFilter !== 'ALL' ||
    hasActiveModalFilters ||
    searchQuery.trim().length > 0;

  const handleClearAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setSelectedCategories(['ALL']);
    setSelectedStockFilters(['ALL']);
    setProductionTypeFilter('ALL');
    setSelectedConditions(['ALL']);
    setSortBy('NEWEST');
  };

  // ── Inventory Metrics (Dedicated Backend Summary Endpoint + Local Fallback) ──
  const metrics = useMemo(() => {
    if (productsSummaryData) {
      return {
        totalCount: productsSummaryData.totalCount ?? 0,
        inStockCount: productsSummaryData.inStockCount ?? 0,
        lowStockCount: productsSummaryData.lowStockCount ?? 0,
        outStockCount: productsSummaryData.outStockCount ?? 0,
        totalValuation: productsSummaryData.totalValuation ?? 0,
      };
    }

    const totalCount = products.length;
    const inStockCount = products.filter((p) => p.stockQuantity > 2).length;
    const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 2).length;
    const outStockCount = products.filter((p) => p.stockQuantity === 0).length;
    const totalValuation = products.reduce((acc, p) => acc + p.price * p.stockQuantity, 0);

    return { totalCount, inStockCount, lowStockCount, outStockCount, totalValuation };
  }, [productsSummaryData, products]);

  // ── Handlers ───────────────────────────────────────────────
  const handleOpenAddProduct = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProduct(null);
    setFormName('');
    setFormCategory('CRAFTS');
    setFormPrice('');
    setFormBasePrice('');
    setFormStock('1');
    setFormCondition('new');
    setFormSku(`ETH-${Math.floor(100 + Math.random() * 900)}`);
    setFormImage('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80');
    setFormImageList([]);
    setNewGalleryInput('');
    setFormDescription('');
    setFormMaterial('');
    setFormOrigin('Lagos / Nigeria');
    setFormEra('Contemporary Heritage');
    setFormWeight('1.5');
    setFormWeightUnit('kg');
    setFormPackageSize('BOX_14X10X11_MEDIUM');
    setFormRequestable(true);
    setFormEstDays('14');
    setFormCustomizable(false);
    setProductModalVisible(true);
  };

  useEffect(() => {
    if (params?.action === 'create') {
      handleOpenAddProduct();
    }
  }, [params?.action]);

  const handleOpenEditProduct = (prod: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingProduct(prod);
    setFormName(prod.name);
    setFormCategory(prod.productCategory);
    setFormPrice(String(prod.price));
    setFormBasePrice(prod.basePrice ? String(prod.basePrice) : '');
    setFormStock(String(prod.stockQuantity));
    setFormCondition(prod.condition);
    setFormSku(prod.sku);
    setFormImage(prod.mainImage);
    setFormImageList(prod.imageList && prod.imageList.length > 1 ? prod.imageList.slice(1) : []);
    setNewGalleryInput('');
    setFormDescription(prod.description);
    setFormMaterial(prod.material || '');
    setFormOrigin(prod.origin || '');
    setFormEra(prod.era || 'Contemporary Heritage');
    setFormWeight(prod.weight ? String(prod.weight) : '1.5');
    setFormWeightUnit(prod.weightUnit || 'kg');
    setFormPackageSize(prod.packageSizeEnum || 'BOX_14X10X11_MEDIUM');
    setFormRequestable(prod.isRequestable);
    setFormEstDays(prod.estimatedProductionDays ? String(prod.estimatedProductionDays) : '14');
    setFormCustomizable(prod.isCustomizable);
    setProductModalVisible(true);
  };

  const handleOpenInspectProduct = (prod: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveInspectProduct(prod);
    setInspectModalVisible(true);
  };

  const handleAddGalleryImage = () => {
    if (!newGalleryInput.trim()) return;
    if (formImageList.length >= 4) {
      alert('Maximum 4 additional gallery images allowed (5 total with main image).');
      return;
    }
    setFormImageList((prev) => [...prev, newGalleryInput.trim()]);
    setNewGalleryInput('');
  };

  const handleRemoveGalleryImage = (index: number) => {
    setFormImageList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveProduct = async () => {
    if (!formName.trim() || !formPrice.trim()) {
      Alert.alert('Required Fields', 'Please fill in product title and price.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parsedPrice = parseFloat(formPrice.replace(/[^0-9.]/g, '')) || 0;
    const parsedBase = formBasePrice ? parseFloat(formBasePrice.replace(/[^0-9.]/g, '')) : undefined;
    const parsedStock = parseInt(formStock.replace(/[^0-9]/g, ''), 10) || 0;
    const parsedWeight = parseFloat(formWeight.replace(/[^0-9.]/g, '')) || 1.0;
    const parsedDays = parseInt(formEstDays.replace(/[^0-9]/g, ''), 10) || 7;
    const consolidatedImages = [
      formImage.trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      ...formImageList,
    ];

    try {
      if (editingProduct) {
        // Backend Update
        await updateProductMutation({
          id: editingProduct.id,
          data: {
            name: formName.trim(),
            productCategory: formCategory,
            price: parsedPrice,
            basePrice: parsedBase,
            stockQuantity: parsedStock,
            condition: formCondition,
            mainImage: consolidatedImages[0],
            imageList: consolidatedImages,
            description: formDescription.trim(),
            weight: parsedWeight,
            weightUnit: formWeightUnit,
            packageSize: formPackageSize,
            isRequestable: formRequestable,
            estimatedProductionDays: formRequestable ? parsedDays : undefined,
            isCustomizable: formCustomizable,
            details: {
              material: formMaterial.trim(),
              origin: formOrigin.trim(),
              era: formEra.trim(),
            },
          },
        }).unwrap();

        setProducts((prev) =>
          prev.map((item) =>
            item.id === editingProduct.id
              ? {
                  ...item,
                  name: formName.trim(),
                  productCategory: formCategory,
                  price: parsedPrice,
                  basePrice: parsedBase,
                  stockQuantity: parsedStock,
                  condition: formCondition,
                  sku: formSku.trim() || item.sku,
                  mainImage: consolidatedImages[0],
                  imageList: consolidatedImages,
                  description: formDescription.trim(),
                  material: formMaterial.trim(),
                  origin: formOrigin.trim(),
                  era: formEra.trim(),
                  weight: parsedWeight,
                  weightUnit: formWeightUnit,
                  packageSizeEnum: formPackageSize,
                  isRequestable: formRequestable,
                  estimatedProductionDays: formRequestable ? parsedDays : undefined,
                  isCustomizable: formCustomizable,
                }
              : item
          )
        );
      } else {
        // Backend Create
        const created = await createProductMutation({
          name: formName.trim(),
          productCategory: formCategory,
          price: parsedPrice,
          basePrice: parsedBase,
          stockQuantity: parsedStock,
          condition: formCondition,
          mainImage: consolidatedImages[0],
          imageList: consolidatedImages,
          description: formDescription.trim(),
          weight: parsedWeight,
          weightUnit: formWeightUnit,
          packageSize: formPackageSize,
          isRequestable: formRequestable,
          estimatedProductionDays: formRequestable ? parsedDays : undefined,
          isCustomizable: formCustomizable,
          details: {
            material: formMaterial.trim(),
            origin: formOrigin.trim(),
            era: formEra.trim(),
          },
        }).unwrap();

        const newProd: CraftProductItem = {
          id: created?.id || `prod-${Date.now()}`,
          name: formName.trim(),
          productCategory: formCategory,
          price: parsedPrice,
          basePrice: parsedBase,
          stockQuantity: parsedStock,
          condition: formCondition,
          sku: created?.sku || formSku.trim() || `ETH-${Math.floor(100 + Math.random() * 900)}`,
          mainImage: consolidatedImages[0],
          imageList: consolidatedImages,
          description: formDescription.trim(),
          material: formMaterial.trim(),
          origin: formOrigin.trim(),
          era: formEra.trim(),
          weight: parsedWeight,
          weightUnit: formWeightUnit,
          packageSizeEnum: formPackageSize,
          isRequestable: formRequestable,
          estimatedProductionDays: formRequestable ? parsedDays : undefined,
          isCustomizable: formCustomizable,
          rating: 0,
          reviewCount: 0,
          salesCount: 0,
          createdAt: new Date().toISOString(),
        };
        setProducts((prev) => [newProd, ...prev]);
      }
      setProductModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to save piece. Please try again.');
    }
  };

  const handleOpenStockModal = (prod: CraftProductItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTargetStockProduct(prod);
    setStockEditQty(prod.stockQuantity);
    setStockModalVisible(true);
  };

  const handleSaveStock = async () => {
    if (!targetStockProduct) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const newQty = Math.max(0, stockEditQty);
    try {
      await updateProductMutation({
        id: targetStockProduct.id,
        data: { stockQuantity: newQty },
      }).unwrap();

      setProducts((prev) =>
        prev.map((item) =>
          item.id === targetStockProduct.id ? { ...item, stockQuantity: newQty } : item
        )
      );
      setStockModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to update stock quantity.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!targetDeleteProduct) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    const delId = targetDeleteProduct.id;
    try {
      await deleteProductMutation(delId).unwrap();
      setProducts((prev) => prev.filter((p) => p.id !== delId));
      if (activeInspectProduct?.id === delId) {
        setInspectModalVisible(false);
        setActiveInspectProduct(null);
      }
      setDeleteModalVisible(false);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to delete piece from inventory.');
    }
  };

  // ── FlatList Header Component ─────────────────────────────
  const renderListHeader = useCallback(() => (
    <View>
      {/* ─── 1. TOP HEADER & ADD ACTION (ORIGINAL POSITIONING) ─── */}
      <View style={styles.topHeaderRow}>
        <View>
          <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>
            Products Inventory
          </Text>
          <Text style={[styles.screenSubheading, { color: theme.textMuted }]}>
            Manage pieces, stock tracking,{'\n'}and atelier listings
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addPieceBtn, { backgroundColor: theme.primary }]}
          onPress={handleOpenAddProduct}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addPieceBtnText}>Product</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 2. INVENTORY METRICS SUMMARY CARDS (HUB FLAT STYLE) ── */}
      <View style={styles.metricsGrid}>
        {/* Card 1: Total Listed */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              TOTAL PIECES
            </Text>
            <Ionicons name="cube-outline" size={14} color={theme.textMuted} />
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {metrics.totalCount}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            In atelier catalog
          </Text>
        </View>

        {/* Card 2: In Stock */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              IN STOCK
            </Text>
            <View style={[styles.statusDot, { backgroundColor: '#009D1A' }]} />
          </View>
          <Text style={[styles.metricValue, { color: '#009D1A' }]}>
            {metrics.inStockCount}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            Ready for dispatch
          </Text>
        </View>

        {/* Card 3: Low & Out */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              ATTENTION
            </Text>
            <Ionicons name="alert-circle-outline" size={14} color="#C46C27" />
          </View>
          <Text style={[styles.metricValue, { color: '#C46C27' }]}>
            {metrics.lowStockCount + metrics.outStockCount}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            {metrics.lowStockCount} low • {metrics.outStockCount} depleted
          </Text>
        </View>

        {/* Card 4: Inventory Valuation */}
        <View
          style={[
            styles.metricCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <View style={styles.metricHeaderRow}>
            <Text style={[styles.metricLabel, { color: theme.textMuted }]}>
              EST. VALUATION
            </Text>
            <Ionicons name="cash-outline" size={14} color={theme.textMuted} />
          </View>
          <Text
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.8}
            style={[styles.metricValue, { color: theme.textPrimary }]}
          >
            {formatPrice(metrics.totalValuation, currencyCode, exchangeRate)}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            Current atelier assets
          </Text>
        </View>
      </View>

      {/* ─── 3. SEARCH & FILTER CONTROLS ────────────────────────── */}
      <View style={styles.searchFilterRow}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="search-outline" size={16} color={theme.textMuted} />
          <TextInput
            placeholder="Search pieces, SKU, origin, tags..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              setCurrentPage(1);
            }}
            style={[styles.searchInput, { color: theme.textPrimary }]}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => {
              setSearchQuery('');
              setCurrentPage(1);
            }}>
              <Ionicons name="close-circle" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: theme.card,
              borderColor: hasActiveModalFilters ? theme.primary : theme.border,
            },
          ]}
          onPress={handleOpenFilterModal}
          activeOpacity={0.8}
        >
          <Ionicons
            name="options-outline"
            size={18}
            color={hasActiveModalFilters ? theme.primary : theme.textPrimary}
          />
          {hasActiveModalFilters && (
            <View style={[styles.activeFilterDot, { backgroundColor: theme.primary }]} />
          )}
        </TouchableOpacity>
      </View>

      {/* ─── 4. PRODUCT TYPE HORIZONTAL FILTER TABS ───────────────── */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryPillsScroll}
      >
        {PRODUCT_TYPE_TABS.map((tab) => {
          const isSelected = productionTypeFilter === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setProductionTypeFilter(tab.key);
                setCurrentPage(1);
              }}
              style={[
                styles.categoryPill,
                {
                  backgroundColor: isSelected ? theme.primary : theme.card,
                  borderColor: isSelected ? theme.primary : theme.border,
                },
              ]}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.categoryPillText,
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

      {/* ─── 4b. ACTIVE MULTI-SELECT FILTER CHIPS BAR ──────────── */}
      {hasActiveModalFilters && (
        <View style={styles.activeChipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeChipsScroll}
          >
            <Text style={[styles.activeChipsLeadLabel, { color: theme.textMuted }]}>
              Active Filters:
            </Text>

            {isCategoryFiltered &&
              selectedCategories.map((catKey) => {
                const label = CATEGORY_FILTER_OPTIONS.find((c) => c.key === catKey)?.label || catKey;
                return (
                  <TouchableOpacity
                    key={`cat-${catKey}`}
                    style={[
                      styles.activeChipPill,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FAF6EE',
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      removeActiveCategory(catKey);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.activeChipText, { color: theme.textPrimary }]}>
                      {label}
                    </Text>
                    <Ionicons name="close-circle" size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}

            {isStockFiltered &&
              selectedStockFilters.map((stkKey) => {
                const label =
                  stkKey === 'IN_STOCK'
                    ? 'In Stock (>2)'
                    : stkKey === 'LOW_STOCK'
                    ? 'Low Stock (1-2)'
                    : 'Out of Stock';
                return (
                  <TouchableOpacity
                    key={`stk-${stkKey}`}
                    style={[
                      styles.activeChipPill,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FAF6EE',
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      removeActiveStockFilter(stkKey);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.activeChipText, { color: theme.textPrimary }]}>
                      {label}
                    </Text>
                    <Ionicons name="close-circle" size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}

            {isConditionFiltered &&
              selectedConditions.map((condKey) => {
                const label = CONDITION_OPTIONS.find((c) => c.key === condKey)?.label || condKey;
                return (
                  <TouchableOpacity
                    key={`cond-${condKey}`}
                    style={[
                      styles.activeChipPill,
                      {
                        backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FAF6EE',
                        borderColor: theme.border,
                      },
                    ]}
                    onPress={() => {
                      removeActiveConditionFilter(condKey);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.activeChipText, { color: theme.textPrimary }]}>
                      {label}
                    </Text>
                    <Ionicons name="close-circle" size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                );
              })}

            {sortBy !== 'NEWEST' && (
              <TouchableOpacity
                style={[
                  styles.activeChipPill,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#FAF6EE',
                    borderColor: theme.border,
                  },
                ]}
                onPress={() => {
                  setSortBy('NEWEST');
                  setCurrentPage(1);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.activeChipText, { color: theme.textPrimary }]}>
                  Sort: {sortBy === 'POPULAR' ? 'Popular' : sortBy === 'PRICE_ASC' ? 'Price ↑' : sortBy === 'PRICE_DESC' ? 'Price ↓' : 'Highest Stock'}
                </Text>
                <Ionicons name="close-circle" size={14} color={theme.textMuted} style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.clearAllChip, { borderColor: theme.border }]}
              onPress={() => {
                handleClearAllFilters();
                setCurrentPage(1);
              }}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearAllChipText, { color: theme.textMuted }]}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ─── 5. LIST SECTION HEADER ROW ───────────────────────── */}
      <View style={[styles.listSectionHeader, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <Text style={[styles.listCountText, { color: theme.textMuted }]}>
          SHOWING {filteredProducts.length} OF {productsResponse?.total ?? products.length} PIECES
        </Text>
        {isProductsFetching && !isProductsLoading && (
          <ActivityIndicator size="small" color={theme.primary} />
        )}
      </View>
    </View>
  ), [
    theme,
    metrics,
    searchQuery,
    hasActiveModalFilters,
    productionTypeFilter,
    isCategoryFiltered,
    selectedCategories,
    isStockFiltered,
    selectedStockFilters,
    isConditionFiltered,
    selectedConditions,
    sortBy,
    filteredProducts.length,
    productsResponse?.total,
    products.length,
    isProductsFetching,
    isProductsLoading,
    currencyCode,
    exchangeRate,
    isDark,
  ]);

  // ── FlatList Empty / Skeleton State Component ──────────────
  const renderListEmpty = useCallback(() => {
    if (isProductsLoading || (isProductsFetching && products.length === 0)) {
      return <VendorProductsSkeleton count={4} />;
    }

    return (
      <View
        style={[
          styles.emptyStateCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        <Ionicons name="cube-outline" size={40} color={theme.textMuted} />
        <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
          No products found
        </Text>
        <Text style={[styles.emptyStateDesc, { color: theme.textMuted }]}>
          Try adjusting your search criteria or add a new piece to your inventory.
        </Text>
        <View style={styles.emptyButtonsRow}>
          {hasAnyFilterActive && (
            <TouchableOpacity
              style={[styles.emptyResetBtn, { borderColor: theme.border }]}
              onPress={() => {
                handleClearAllFilters();
                setCurrentPage(1);
              }}
            >
              <Ionicons name="refresh-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
              <Text style={[styles.emptyResetBtnText, { color: theme.textPrimary }]}>
                Clear Active Filters
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
            onPress={handleOpenAddProduct}
          >
            <Text style={styles.emptyAddBtnText}>Add New Piece</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    isProductsLoading,
    isProductsFetching,
    products.length,
    theme,
    hasAnyFilterActive,
  ]);

  // ── FlatList RenderItem Component ──────────────────────────
  const renderProductItem = useCallback(({ item: prod }: { item: CraftProductItem }) => {
    const isDepleted = prod.stockQuantity === 0;
    const isLow = prod.stockQuantity > 0 && prod.stockQuantity <= 2;

    return (
      <View
        style={[
          styles.productItemCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Top Row: Thumbnail + Product Info (Tappable to Inspect) */}
        <TouchableOpacity
          style={styles.cardTopRow}
          onPress={() => handleOpenInspectProduct(prod)}
          activeOpacity={0.7}
        >
          <Image
            source={{ uri: prod.mainImage }}
            style={styles.productThumb}
            resizeMode="cover"
          />

          <View style={styles.productInfoCol}>
            <View style={styles.titleCategoryRow}>
              <Text
                style={[styles.productTitleText, { color: theme.textPrimary }]}
                numberOfLines={1}
              >
                {prod.name}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.textMuted} />
            </View>

            <Text style={[styles.productSkuText, { color: theme.textMuted }]}>
              SKU: {prod.sku} • {prod.productCategory}
            </Text>

            <View style={styles.priceRow}>
              <Text style={[styles.productPriceText, { color: theme.textPrimary }]}>
                {formatPrice(prod.price, currencyCode, exchangeRate)}
              </Text>
              {prod.basePrice && prod.basePrice > prod.price && (
                <Text style={[styles.productBasePriceText, { color: theme.textMuted }]}>
                  {formatPrice(prod.basePrice, currencyCode, exchangeRate)}
                </Text>
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Middle Row: Badges (Condition, Package Size, Requestable, Stock Level) */}
        <View style={styles.cardBadgesRow}>
          {/* Stock Badge */}
          <TouchableOpacity
            style={[
              styles.stockBadgePill,
              {
                backgroundColor: isDepleted
                  ? 'rgba(239, 68, 68, 0.12)'
                  : isLow
                  ? 'rgba(245, 158, 11, 0.12)'
                  : 'rgba(0, 157, 26, 0.10)',
              },
            ]}
            onPress={() => handleOpenStockModal(prod)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.stockDot,
                {
                  backgroundColor: isDepleted
                    ? '#EF4444'
                    : isLow
                    ? '#F59E0B'
                    : '#009D1A',
                },
              ]}
            />
            <Text
              style={[
                styles.stockBadgeText,
                {
                  color: isDepleted
                    ? '#EF4444'
                    : isLow
                    ? '#F59E0B'
                    : isDark
                    ? '#0AD24F'
                    : '#009D1A',
                },
              ]}
            >
              {isDepleted
                ? 'Out of stock'
                : `${prod.stockQuantity} in stock`}
            </Text>
            <Ionicons
              name="pencil-outline"
              size={10}
              color={theme.textMuted}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Condition Pill */}
          <View
            style={[
              styles.conditionPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(54, 19, 0, 0.05)',
              },
            ]}
          >
            <Text style={[styles.conditionPillText, { color: theme.textMuted }]}>
              {CONDITION_OPTIONS.find((c) => c.key === prod.condition)?.label || prod.condition}
            </Text>
          </View>

          {/* Packaging Enum Pill */}
          <View
            style={[
              styles.conditionPill,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 255, 255, 0.06)'
                  : 'rgba(54, 19, 0, 0.05)',
              },
            ]}
          >
            <Ionicons name="cube-outline" size={10} color={theme.textMuted} style={{ marginRight: 3 }} />
            <Text style={[styles.conditionPillText, { color: theme.textMuted }]}>
              {PACKAGE_SIZES.find((p) => p.key === prod.packageSizeEnum)?.label || prod.packageSizeEnum || 'Medium Box'}
            </Text>
          </View>

          {/* Customizable Pill */}
          {prod.isCustomizable && (
            <View
              style={[
                styles.conditionPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(196, 108, 39, 0.15)'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text style={[styles.conditionPillText, { color: theme.primary }]}>
                Customizable
              </Text>
            </View>
          )}

          {/* On Request Pill */}
          {prod.isRequestable && (
            <View
              style={[
                styles.conditionPill,
                {
                  backgroundColor: isDark
                    ? 'rgba(196, 108, 39, 0.15)'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text style={[styles.conditionPillText, { color: theme.primary }]}>
                On Request ({prod.estimatedProductionDays || 14}d)
              </Text>
            </View>
          )}
        </View>

        {/* Bottom Row: Quick Action Stepper & Control Buttons */}
        <View style={[styles.cardActionRow, { borderTopColor: theme.borderSubtle }]}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenInspectProduct(prod)}
            activeOpacity={0.7}
          >
            <Ionicons name="eye-outline" size={15} color={theme.textPrimary} />
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
              Inspect
            </Text>
          </TouchableOpacity>

          <View style={[styles.actionDivider, { backgroundColor: theme.borderSubtle }]} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenStockModal(prod)}
            activeOpacity={0.7}
          >
            <Ionicons name="repeat-outline" size={15} color={theme.textPrimary} />
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
              Stock
            </Text>
          </TouchableOpacity>

          <View style={[styles.actionDivider, { backgroundColor: theme.borderSubtle }]} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => handleOpenEditProduct(prod)}
            activeOpacity={0.7}
          >
            <Ionicons name="create-outline" size={15} color={theme.textPrimary} />
            <Text style={[styles.actionBtnText, { color: theme.textPrimary }]}>
              Edit
            </Text>
          </TouchableOpacity>

          <View style={[styles.actionDivider, { backgroundColor: theme.borderSubtle }]} />

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              setTargetDeleteProduct(prod);
              setDeleteModalVisible(true);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="trash-outline" size={15} color="#DC2626" />
            <Text style={[styles.actionBtnText, { color: '#DC2626' }]}>
              Delete
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [
    theme,
    currencyCode,
    exchangeRate,
    isDark,
  ]);

  // ── FlatList Footer Component (Pagination Controls) ───────
  const totalCount = productsResponse?.total ?? products.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const hasNextPage = currentPage < totalPages;
  const hasPrevPage = currentPage > 1;

  const renderListFooter = useCallback(() => {
    return (
      <View
        style={[
          styles.listFooterContainer,
          { paddingBottom: Math.max(insets.bottom, 16) + 110 },
        ]}
      >
        {totalCount > pageSize && (
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
              <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
                Page <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{currentPage}</Text> of{' '}
                <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{totalPages}</Text>
              </Text>
              <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
                Total: <Text style={{ fontFamily: FontFamily.headingBold, color: theme.primary }}>{totalCount}</Text> items
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
                disabled={!hasPrevPage || isProductsFetching}
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
                disabled={!hasNextPage || isProductsFetching}
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
    );
  }, [
    insets.bottom,
    totalCount,
    pageSize,
    theme,
    currentPage,
    totalPages,
    isDark,
    hasPrevPage,
    hasNextPage,
    isProductsFetching,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProductItem}
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
            colors={[theme.primary]}
          />
        }
      />

      {/* ─── 6. ADD / EDIT PRODUCT MODAL ───────────────────────── */}
      <Modal
        visible={productModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setProductModalVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setProductModalVisible(false)}
          />
          <View
            style={[
              styles.productFormSheetCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                {editingProduct ? 'Edit Artisan Piece' : 'Add New Artisan Piece'}
              </Text>
              <TouchableOpacity
                onPress={() => setProductModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.formScrollContent}
            >
              {/* Product Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  PIECE TITLE *
                </Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Royal Bronze Leopard Sculpture"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Category Picker */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  ATELIER CATEGORY *
                </Text>
                <View style={styles.formCategoriesGrid}>
                  {(
                    [
                      'WEARS',
                      'SHOES',
                      'CRAFTS',
                      'ACCESSORIES',
                      'BAGS',
                      'PAINTINGS',
                      'ANTIQUES',
                    ] as ProductCategoryType[]
                  ).map((cat) => {
                    const isSelected = formCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setFormCategory(cat)}
                        style={[
                          styles.formCategoryPill,
                          {
                            backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.formCategoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                            },
                          ]}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Condition / Heritage Grade Picker */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  CONDITION / HERITAGE GRADE *
                </Text>
                <View style={styles.formCategoriesGrid}>
                  {FORM_CONDITION_OPTIONS.map((opt) => {
                    const isSelected = formCondition === opt.key;
                    return (
                      <TouchableOpacity
                        key={opt.key}
                        onPress={() => setFormCondition(opt.key)}
                        style={[
                          styles.formCategoryPill,
                          {
                            backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.formCategoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                            },
                          ]}
                        >
                          {opt.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Price & Base Price */}
              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    PRICE (NGN) *
                  </Text>
                  <TextInput
                    value={formPrice}
                    onChangeText={setFormPrice}
                    placeholder="320000"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    BASE / STRIKE PRICE
                  </Text>
                  <TextInput
                    value={formBasePrice}
                    onChangeText={setFormBasePrice}
                    placeholder="350000"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Stock Quantity & SKU */}
              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    STOCK QUANTITY *
                  </Text>
                  <TextInput
                    value={formStock}
                    onChangeText={setFormStock}
                    placeholder="4"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    SKU CODE
                  </Text>
                  <TextInput
                    value={formSku}
                    onChangeText={setFormSku}
                    placeholder="BNN-LEO-001"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Shipping Package Size Selector */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  SHIPPING & PACKAGE SIZE (COURIER CLASS) *
                </Text>
                <View style={styles.formCategoriesGrid}>
                  {PACKAGE_SIZES.map((pkg) => {
                    const isSelected = formPackageSize === pkg.key;
                    return (
                      <TouchableOpacity
                        key={pkg.key}
                        onPress={() => setFormPackageSize(pkg.key)}
                        style={[
                          styles.formCategoryPill,
                          {
                            backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.formCategoryPillText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                              fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                            },
                          ]}
                        >
                          {pkg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Weight & Unit */}
              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 2 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    ESTIMATED WEIGHT *
                  </Text>
                  <TextInput
                    value={formWeight}
                    onChangeText={setFormWeight}
                    placeholder="1.5"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    UNIT
                  </Text>
                  <View style={{ flexDirection: 'row', gap: 4, height: 38 }}>
                    {(['kg', 'g'] as const).map((unit) => {
                      const isSelected = formWeightUnit === unit;
                      return (
                        <TouchableOpacity
                          key={unit}
                          onPress={() => setFormWeightUnit(unit)}
                          style={[
                            styles.unitToggleBtn,
                            {
                              backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                              borderColor: isSelected ? theme.primary : theme.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.unitToggleText,
                              {
                                color: isSelected ? '#FFFFFF' : theme.textPrimary,
                                fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                              },
                            ]}
                          >
                            {unit}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Main Image URL */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  PRIMARY COVER IMAGE URL *
                </Text>
                <TextInput
                  value={formImage}
                  onChangeText={setFormImage}
                  placeholder="https://..."
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Additional Gallery Images (Max 4 additional images) */}
              <View style={styles.formGroup}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    ADDITIONAL GALLERY IMAGES ({formImageList.length}/4)
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    value={newGalleryInput}
                    onChangeText={setNewGalleryInput}
                    placeholder="https://... (additional photo)"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        flex: 1,
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                  <TouchableOpacity
                    onPress={handleAddGalleryImage}
                    disabled={formImageList.length >= 4 || !newGalleryInput.trim()}
                    style={[
                      styles.addGalleryBtn,
                      {
                        backgroundColor: formImageList.length >= 4 || !newGalleryInput.trim() ? theme.border : theme.primary,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={16} color="#FFFFFF" />
                    <Text style={styles.addGalleryBtnText}>Add</Text>
                  </TouchableOpacity>
                </View>

                {formImageList.length > 0 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                    {formImageList.map((url, index) => (
                      <View key={index} style={styles.galleryThumbWrapper}>
                        <Image source={{ uri: url }} style={styles.galleryThumbImage} resizeMode="cover" />
                        <TouchableOpacity
                          style={styles.galleryThumbDeleteBtn}
                          onPress={() => handleRemoveGalleryImage(index)}
                        >
                          <Ionicons name="close" size={12} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Material & Origin */}
              <View style={styles.formRowTwo}>
                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    PRIMARY MATERIAL
                  </Text>
                  <TextInput
                    value={formMaterial}
                    onChangeText={setFormMaterial}
                    placeholder="Solid Bronze Cast"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    PROVENANCE / ORIGIN
                  </Text>
                  <TextInput
                    value={formOrigin}
                    onChangeText={setFormOrigin}
                    placeholder="Benin City / Edo"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Era / Period */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  ARTISAN ERA / HISTORICAL PERIOD
                </Text>
                <TextInput
                  value={formEra}
                  onChangeText={setFormEra}
                  placeholder="e.g. Contemporary Heritage or 19th Century"
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.formInput,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  HERITAGE STORY & DESCRIPTION
                </Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Details of the craftsmanship, technique, and cultural significance..."
                  placeholderTextColor={theme.textMuted}
                  style={[
                    styles.formInputMultiline,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                      borderColor: theme.border,
                      color: theme.textPrimary,
                    },
                  ]}
                />
              </View>

              {/* Toggles */}
              <View style={[styles.toggleRow, { borderColor: theme.borderSubtle }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.textPrimary }]}>
                    Allow Custom Requests & Bids
                  </Text>
                  <Text style={[styles.toggleSubtext, { color: theme.textMuted }]}>
                    Clients can commission tailor-made versions of this piece
                  </Text>
                </View>
                <Switch
                  value={formRequestable}
                  onValueChange={setFormRequestable}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {formRequestable && (
                <View style={styles.formGroup}>
                  <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                    COMMISSION TURNAROUND TIME (DAYS) *
                  </Text>
                  <TextInput
                    value={formEstDays}
                    onChangeText={setFormEstDays}
                    placeholder="14"
                    keyboardType="numeric"
                    placeholderTextColor={theme.textMuted}
                    style={[
                      styles.formInput,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.border,
                        color: theme.textPrimary,
                      },
                    ]}
                  />
                </View>
              )}
            </ScrollView>

            {/* Modal Action Buttons */}
            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setProductModalVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formSubmitBtn,
                  {
                    backgroundColor: isCreating || isUpdating ? theme.border : theme.primary,
                    opacity: isCreating || isUpdating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSaveProduct}
                disabled={isCreating || isUpdating}
              >
                {isCreating || isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitBtnText}>
                    {editingProduct ? 'Save Changes' : 'Publish Piece'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── 7. FAST STOCK ADJUSTER MODAL ───────────────────────── */}
      <Modal
        visible={stockModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setStockModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setStockModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.quickStockCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                Adjust Stock Quantity
              </Text>
              <TouchableOpacity
                onPress={() => setStockModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text
              style={[styles.targetProductName, { color: theme.textMuted }]}
              numberOfLines={1}
            >
              {targetStockProduct?.name}
            </Text>

            {/* Stepper */}
            <View style={styles.stepperContainer}>
              <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: theme.border }]}
                onPress={() => setStockEditQty((prev) => Math.max(0, prev - 1))}
              >
                <Ionicons name="remove" size={20} color={theme.textPrimary} />
              </TouchableOpacity>

              <Text style={[styles.stepperValueText, { color: theme.textPrimary }]}>
                {stockEditQty}
              </Text>

              <TouchableOpacity
                style={[styles.stepperBtn, { borderColor: theme.border }]}
                onPress={() => setStockEditQty((prev) => prev + 1)}
              >
                <Ionicons name="add" size={20} color={theme.textPrimary} />
              </TouchableOpacity>
            </View>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setStockModalVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formSubmitBtn,
                  {
                    backgroundColor: isUpdating ? theme.border : theme.primary,
                    opacity: isUpdating ? 0.7 : 1,
                  },
                ]}
                onPress={handleSaveStock}
                disabled={isUpdating}
              >
                {isUpdating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitBtnText}>Update Stock</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── 8. DELETE CONFIRMATION MODAL ───────────────────────── */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.deleteModalCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.deleteIconWrap}>
              <Ionicons name="trash-outline" size={28} color="#DC2626" />
            </View>

            <Text style={[styles.deleteTitle, { color: theme.textPrimary }]}>
              Remove Piece from Inventory?
            </Text>

            <View
              style={[
                styles.deleteTargetBadge,
                {
                  backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                  borderColor: theme.borderSubtle,
                },
              ]}
            >
              <Text style={[styles.deleteTargetText, { color: theme.textPrimary }]} numberOfLines={1}>
                {targetDeleteProduct?.name}
              </Text>
              <Text style={[styles.deleteTargetSku, { color: theme.textMuted }]}>
                SKU: {targetDeleteProduct?.sku} • {targetDeleteProduct?.productCategory}
              </Text>
            </View>

            <View
              style={[
                styles.deleteWarningCallout,
                {
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  borderColor: 'rgba(220, 38, 38, 0.25)',
                },
              ]}
            >
              <Ionicons name="warning-outline" size={16} color="#DC2626" style={{ marginTop: 1 }} />
              <Text style={[styles.deleteWarningText, { color: isDark ? '#FCA5A5' : '#B91C1C' }]}>
                Permanent Action: This piece will be removed from your catalog and active search. Any active customer carts containing this item will be cleared.
              </Text>
            </View>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Keep Piece
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.deleteConfirmBtn,
                  {
                    backgroundColor: '#DC2626',
                    opacity: isDeleting ? 0.7 : 1,
                  },
                ]}
                onPress={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── 9. FILTER & SORT SHEET MODAL ───────────────────────── */}
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
        statusBarTranslucent
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setFilterModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[
              styles.filterSheetCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
              },
            ]}
          >
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                Filter & Sort Inventory
              </Text>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={18} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Category Filter */}
            <Text style={[styles.filterGroupTitle, { color: theme.textMuted }]}>
              CATEGORY{!draftCategories.includes('ALL') && draftCategories.length > 0 ? ` (${draftCategories.length})` : ''}
            </Text>
            <View style={styles.filterOptionsGrid}>
              {CATEGORY_FILTER_OPTIONS.map((opt) => {
                const isSelected = draftCategories.includes(opt.key);
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => toggleDraftCategory(opt.key)}
                    style={[
                      styles.filterOptionPill,
                      {
                        backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Stock Status Filter */}
            <Text style={[styles.filterGroupTitle, { color: theme.textMuted, marginTop: Spacing.md }]}>
              AVAILABILITY STATUS{!draftStockFilters.includes('ALL') && draftStockFilters.length > 0 ? ` (${draftStockFilters.length})` : ''}
            </Text>
            <View style={styles.filterOptionsGrid}>
              {(
                [
                  { key: 'ALL', label: 'All Statuses' },
                  { key: 'IN_STOCK', label: 'In Stock (>2)' },
                  { key: 'LOW_STOCK', label: 'Low Stock (1-2)' },
                  { key: 'OUT_OF_STOCK', label: 'Out of Stock' },
                ] as { key: StockFilterType; label: string }[]
              ).map((opt) => {
                const isSelected = draftStockFilters.includes(opt.key);
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => toggleDraftStockFilter(opt.key)}
                    style={[
                      styles.filterOptionPill,
                      {
                        backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Piece Condition Filter */}
            <Text style={[styles.filterGroupTitle, { color: theme.textMuted, marginTop: Spacing.md }]}>
              CONDITION{!draftConditions.includes('ALL') && draftConditions.length > 0 ? ` (${draftConditions.length})` : ''}
            </Text>
            <View style={styles.filterOptionsGrid}>
              {CONDITION_OPTIONS.map((opt) => {
                const isSelected = draftConditions.includes(opt.key);
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => toggleDraftConditionFilter(opt.key)}
                    style={[
                      styles.filterOptionPill,
                      {
                        backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Sort Options */}
            <Text style={[styles.filterGroupTitle, { color: theme.textMuted, marginTop: Spacing.md }]}>
              SORT ORDER
            </Text>
            <View style={styles.filterOptionsGrid}>
              {(
                [
                  { key: 'NEWEST', label: 'Newest First' },
                  { key: 'POPULAR', label: 'Most Popular' },
                  { key: 'PRICE_ASC', label: 'Price: Low to High' },
                  { key: 'PRICE_DESC', label: 'Price: High to Low' },
                  { key: 'STOCK_DESC', label: 'Highest Stock' },
                ] as { key: SortOption; label: string }[]
              ).map((opt) => {
                const isSelected = draftSortBy === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setDraftSortBy(opt.key);
                    }}
                    style={[
                      styles.filterOptionPill,
                      {
                        backgroundColor: isSelected ? theme.primary : isDark ? 'rgba(255,255,255,0.06)' : '#FAF6EE',
                        borderColor: isSelected ? theme.primary : theme.border,
                      },
                    ]}
                  >
                    {isSelected && (
                      <Ionicons name="checkmark" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                    )}
                    <Text
                      style={[
                        styles.filterOptionText,
                        {
                          color: isSelected ? '#FFFFFF' : theme.textPrimary,
                          fontFamily: isSelected ? FontFamily.headingBold : FontFamily.bodyRegular,
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Action buttons */}
            <View style={[styles.formActionsRow, { marginTop: Spacing.lg }]}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => {
                  setDraftCategories(['ALL']);
                  setDraftStockFilters(['ALL']);
                  setDraftConditions(['ALL']);
                  setDraftSortBy('NEWEST');
                }}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Reset
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.formSubmitBtn,
                  {
                    backgroundColor: theme.primary,
                    opacity: isApplyingFilters ? 0.75 : 1,
                  },
                ]}
                onPress={handleApplyDraftFilters}
                disabled={isApplyingFilters}
              >
                {isApplyingFilters ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                    <Text style={styles.formSubmitBtnText}>Applying...</Text>
                  </View>
                ) : (
                  <Text style={styles.formSubmitBtnText}>Apply Filters</Text>
                )}
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ─── 10. PRODUCT INSPECTION MODAL (PIECE SPECIFICATIONS & HERITAGE DETAILS) ─── */}
      <Modal
        visible={inspectModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setInspectModalVisible(false)}
        statusBarTranslucent
      >
        <View style={styles.bottomSheetContainer}>
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setInspectModalVisible(false)}
          />
          <View
            style={[
              styles.inspectSheetCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <Text style={[styles.modalTitleText, { color: theme.textPrimary }]} numberOfLines={1}>
                  {activeInspectProduct?.name}
                </Text>
                <Text style={[styles.modalSubheading, { color: theme.textMuted }]}>
                  SKU: {activeInspectProduct?.sku} • {activeInspectProduct?.productCategory}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setInspectModalVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: Spacing.sm }}
            >
              {/* Product Main Image */}
              {activeInspectProduct?.mainImage && (
                <Image
                  source={{ uri: activeInspectProduct.mainImage }}
                  style={styles.inspectHeroImage}
                  resizeMode="cover"
                />
              )}

              {/* Gallery Image Thumbnails if present */}
              {activeInspectProduct?.imageList && activeInspectProduct.imageList.length > 1 && (
                <View style={styles.inspectGalleryRow}>
                  {activeInspectProduct.imageList.map((imgUri, idx) => (
                    <Image
                      key={idx}
                      source={{ uri: imgUri }}
                      style={styles.inspectGalleryThumb}
                      resizeMode="cover"
                    />
                  ))}
                </View>
              )}

              {/* Pricing & Stock Status Section */}
              <View
                style={[
                  styles.inspectPriceSection,
                  {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : '#FAF6EE',
                    borderColor: theme.borderSubtle,
                  },
                ]}
              >
                <View>
                  <Text style={[styles.inspectPriceLabel, { color: theme.textMuted }]}>RETAIL VALUATION</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
                    <Text style={[styles.inspectPriceValue, { color: theme.textPrimary }]}>
                      {activeInspectProduct ? formatPrice(activeInspectProduct.price, currencyCode, exchangeRate) : ''}
                    </Text>
                    {activeInspectProduct?.basePrice && activeInspectProduct.basePrice > activeInspectProduct.price && (
                      <Text style={[styles.productBasePriceText, { color: theme.textMuted }]}>
                        {formatPrice(activeInspectProduct.basePrice, currencyCode, exchangeRate)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.inspectPriceLabel, { color: theme.textMuted }]}>AVAILABILITY</Text>
                  <Text
                    style={[
                      styles.inspectStockText,
                      {
                        color:
                          (activeInspectProduct?.stockQuantity ?? 0) === 0
                            ? '#EF4444'
                            : (activeInspectProduct?.stockQuantity ?? 0) <= 2
                            ? '#F59E0B'
                            : '#009D1A',
                      },
                    ]}
                  >
                    {(activeInspectProduct?.stockQuantity ?? 0) === 0
                      ? 'Out of Stock'
                      : `${activeInspectProduct?.stockQuantity} Units In Stock`}
                  </Text>
                </View>
              </View>

              {/* Detailed Specs Grid */}
              <Text style={[styles.inspectSectionTitle, { color: theme.textMuted }]}>
                TECHNICAL & ARTISAN ATTRIBUTES
              </Text>
              <View style={[styles.inspectSpecsGrid, { borderColor: theme.borderSubtle }]}>
                <View style={styles.inspectSpecRow}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Condition / Heritage Grade</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {CONDITION_OPTIONS.find((c) => c.key === activeInspectProduct?.condition)?.label || activeInspectProduct?.condition || 'Pristine'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Shipping Package Size</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {PACKAGE_SIZES.find((p) => p.key === activeInspectProduct?.packageSizeEnum)?.label || activeInspectProduct?.packageSizeEnum || 'Standard Box'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Estimated Weight</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {activeInspectProduct?.weight || '1.0'} {activeInspectProduct?.weightUnit || 'kg'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Primary Material</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {activeInspectProduct?.material || 'Handcrafted Artisan Medium'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Provenance / Origin</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {activeInspectProduct?.origin || 'West Africa'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Period / Era</Text>
                  <Text style={[styles.inspectSpecVal, { color: theme.textPrimary }]}>
                    {activeInspectProduct?.era || 'Contemporary Heritage'}
                  </Text>
                </View>

                <View style={[styles.inspectSpecRow, { borderTopWidth: 1, borderTopColor: theme.borderSubtle }]}>
                  <Text style={[styles.inspectSpecKey, { color: theme.textMuted }]}>Custom Bids & Commissions</Text>
                  <Text style={[styles.inspectSpecVal, { color: activeInspectProduct?.isRequestable ? theme.primary : theme.textMuted }]}>
                    {activeInspectProduct?.isRequestable
                      ? `Accepted (~${activeInspectProduct.estimatedProductionDays || 14} days turnaround)`
                      : 'Fixed Inventory Only'}
                  </Text>
                </View>
              </View>

              {/* Description & Cultural Significance */}
              <Text style={[styles.inspectSectionTitle, { color: theme.textMuted, marginTop: Spacing.md }]}>
                CULTURAL STORY & NOTES
              </Text>
              <Text style={[styles.inspectDescriptionText, { color: theme.textPrimary }]}>
                {activeInspectProduct?.description || 'No detailed artisan description provided for this piece.'}
              </Text>
            </ScrollView>

            {/* Quick Action Buttons */}
            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => {
                  const target = activeInspectProduct;
                  setInspectModalVisible(false);
                  if (target) {
                    handleOpenStockModal(target);
                  }
                }}
              >
                <Ionicons name="repeat-outline" size={14} color={theme.textPrimary} style={{ marginRight: 4 }} />
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Stock Qty
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  const target = activeInspectProduct;
                  setInspectModalVisible(false);
                  if (target) {
                    handleOpenEditProduct(target);
                  }
                }}
              >
                <Ionicons name="create-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                <Text style={styles.formSubmitBtnText}>Edit Piece</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
  },

  // ─── 1. TOP HEADER & ADD BUTTON ───────────────────────────
  topHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  screenHeading: {
    fontSize: 20,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
  },
  screenSubheading: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  addPieceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md, // 7px - strictly Hub flat card standard
  },
  addPieceBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── 2. INVENTORY METRICS SUMMARY CARDS ───────────────────
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  metricCard: {
    width: (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2,
    borderRadius: Radius.md, // 7px - strictly Hub flat card standard
    borderWidth: 1,
    padding: Spacing.md - 2,
    justifyContent: 'space-between',
    minHeight: 88,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  metricValue: {
    fontSize: 20,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.3,
    marginTop: 4,
  },
  metricSubtext: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },

  // ─── 3. SEARCH & FILTER CONTROLS ──────────────────────────
  searchFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    paddingVertical: 0,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── 4. CATEGORY HORIZONTAL FILTER PILLS ─────────────────
  categoryPillsScroll: {
    gap: 8,
    paddingBottom: Spacing.md,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  categoryPillText: {
    fontSize: 11.5,
  },

  // ─── 4b. ACTIVE FILTER CHIPS (MULTI-SELECT) ───────────────
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
    fontFamily: FontFamily.headingBold,
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
    fontFamily: FontFamily.bodyRegular,
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
    fontFamily: FontFamily.bodyRegular,
  },

  // ─── 5. PRODUCT LIST ITEMS (HUB FLAT CARD STANDARD) ───────
  productListSection: {
    marginTop: Spacing.xs,
  },
  listSectionHeader: {
    marginBottom: 8,
  },
  listCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
  },
  productItemCard: {
    borderRadius: Radius.md, // 7px - strictly Hub flat card standard
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: 10,
  },
  cardTopRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productThumb: {
    width: 68,
    height: 68,
    borderRadius: 6,
    backgroundColor: '#FAF6EE',
  },
  productInfoCol: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleCategoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  productTitleText: {
    fontSize: 13.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: -0.2,
    flex: 1,
  },
  productSkuText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 4,
  },
  productPriceText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  productBasePriceText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    textDecorationLine: 'line-through',
  },
  cardBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    marginBottom: 10,
  },
  stockBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  stockDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginRight: 5,
  },
  stockBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },
  conditionPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 4,
  },
  conditionPillText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
  },
  actionDivider: {
    width: 1,
    height: 14,
  },

  // ─── EMPTY STATE ──────────────────────────────────────────
  emptyStateCard: {
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    marginTop: 10,
  },
  emptyStateDesc: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
  emptyAddBtn: {
    marginTop: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.md,
  },
  emptyAddBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── MODAL & BOTTOM SHEET STYLES ──────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  bottomSheetContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetDragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(128, 128, 128, 0.4)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  productFormSheetCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
  },
  productFormCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  modalTitleText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
  },
  formScrollContent: {
    paddingVertical: 4,
  },
  formGroup: {
    marginBottom: 10,
  },
  formLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  formInput: {
    height: 38,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
  },
  formInputMultiline: {
    minHeight: 64,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    textAlignVertical: 'top',
  },
  formRowTwo: {
    flexDirection: 'row',
    gap: 10,
  },
  formCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  formCategoryPill: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 4,
    borderWidth: 1,
  },
  formCategoryPillText: {
    fontSize: 10.5,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 4,
    marginBottom: 6,
  },
  toggleTitle: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
  toggleSubtext: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  formActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.sm,
  },
  formCancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  formCancelBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
  },
  formSubmitBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  formSubmitBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── QUICK STOCK MODAL ────────────────────────────────────
  quickStockCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  targetProductName: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    marginBottom: Spacing.md,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    marginVertical: Spacing.md,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 28,
    fontFamily: FontFamily.headingBold,
    minWidth: 40,
    textAlign: 'center',
  },

  // ─── DELETE MODAL ─────────────────────────────────────────
  deleteModalCard: {
    width: '100%',
    maxWidth: 320,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md + 4,
    alignItems: 'center',
  },
  deleteIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(220, 38, 38, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  deleteTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    textAlign: 'center',
  },
  deleteSubtext: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  deleteConfirmBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  deleteConfirmBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── FILTER SHEET MODAL ───────────────────────────────────
  filterSheetCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  filterGroupTitle: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 6,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  filterOptionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
  },
  filterOptionText: {
    fontSize: 11,
  },

  // ─── PARITY & ENHANCEMENT STYLES ──────────────────────────
  activeFilterDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    position: 'absolute',
    top: 6,
    right: 6,
  },
  emptyButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  emptyResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  emptyResetBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
  },
  unitToggleBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  unitToggleText: {
    fontSize: 12,
  },
  addGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    borderRadius: Radius.md,
    justifyContent: 'center',
  },
  addGalleryBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
  galleryThumbWrapper: {
    position: 'relative',
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  galleryThumbImage: {
    width: '100%',
    height: '100%',
  },
  galleryThumbDeleteBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteTargetBadge: {
    width: '100%',
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: 'center',
    marginVertical: 8,
  },
  deleteTargetText: {
    fontSize: 13,
    fontFamily: FontFamily.headingBold,
    textAlign: 'center',
  },
  deleteTargetSku: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 2,
  },
  deleteWarningCallout: {
    flexDirection: 'row',
    gap: 8,
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginVertical: 8,
  },
  deleteWarningText: {
    flex: 1,
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 15,
  },
  inspectSheetCard: {
    width: '100%',
    maxHeight: '90%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingTop: 12,
  },
  inspectModalCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '88%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
  },
  modalSubheading: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  inspectHeroImage: {
    width: '100%',
    height: 180,
    borderRadius: Radius.md,
    marginBottom: 8,
  },
  inspectGalleryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  inspectGalleryThumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  inspectPriceSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 12,
  },
  inspectPriceLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  inspectPriceValue: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
  },
  inspectStockText: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
  },
  inspectSectionTitle: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  inspectSpecsGrid: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 10,
  },
  inspectSpecRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  inspectSpecKey: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
  },
  inspectSpecVal: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
  },
  inspectDescriptionText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
  },
  listFooterContainer: {
    marginTop: 12,
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
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    borderRadius: Radius.md,
    width: '100%',
    gap: 8,
  },
  loadMoreBtnText: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
});

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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Spacing } from '@/constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';

import {
  useGetVendorCatalogsQuery,
  useCreateVendorCatalogMutation,
  useUpdateVendorCatalogMutation,
  useDeleteVendorCatalogMutation,
  useGetVendorProductsQuery,
  VendorCatalogItem,
} from '@/store/api/vendorApi';
import { VendorCatalogSkeleton } from '@/components/common/Skeletons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface CatalogCollection {
  id: string;
  name: string;
  coverImage: string;
  description: string;
  categoryType: string;
  price?: number;
  productIds: string[];
  createdAt: string;
}

export interface CatalogProductSummary {
  id: string;
  name: string;
  price: number;
  image: string;
  category: string;
}

export const CATEGORY_TYPES = [
  'CRAFTS',
  'WEARS',
  'ACCESSORIES',
  'BAGS',
  'PAINTINGS',
  'ANTIQUES',
  'SHOES',
  'SCULPTURE',
  'TEXTILES',
] as const;

export default function VendorCatalogScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useAppTheme();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // ── RTK Query Live Hooks ───────────────────────────────────
  const {
    data: liveCatalogs,
    isLoading: isCatalogsLoading,
    isFetching: isCatalogsFetching,
    isError: isCatalogsError,
    refetch: refetchCatalogs,
  } = useGetVendorCatalogsQuery();

  const {
    data: vendorProductsData,
    isLoading: isProductsLoading,
  } = useGetVendorProductsQuery({ take: 100 });

  const [createCatalogMutation, { isLoading: isCreating }] = useCreateVendorCatalogMutation();
  const [updateCatalogMutation, { isLoading: isUpdating }] = useUpdateVendorCatalogMutation();
  const [deleteCatalogMutation, { isLoading: isDeleting }] = useDeleteVendorCatalogMutation();

  // ── State ──────────────────────────────────────────────────
  const [localCatalogs, setCatalogs] = useState<CatalogCollection[]>([]);
  const [syncedLiveCatalogs, setSyncedLiveCatalogs] = useState<typeof liveCatalogs>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const mappedLiveCatalogs = useMemo<CatalogCollection[]>(() => {
    if (liveCatalogs && Array.isArray(liveCatalogs)) {
      return liveCatalogs.map((c) => ({
        id: c.id,
        name: c.name,
        coverImage: c.image,
        description: c.description || '',
        categoryType: c.categoryType || 'CRAFTS',
        price: c.price,
        productIds: c.productIds || [],
        createdAt: c.createdAt,
      }));
    }
    return [];
  }, [liveCatalogs]);

  // Synchronize live catalogs with local state
  React.useEffect(() => {
    if (liveCatalogs && Array.isArray(liveCatalogs)) {
      setCatalogs(mappedLiveCatalogs);
      setSyncedLiveCatalogs(liveCatalogs);
    }
  }, [liveCatalogs, mappedLiveCatalogs]);

  const catalogs =
    liveCatalogs && liveCatalogs !== syncedLiveCatalogs
      ? mappedLiveCatalogs
      : localCatalogs;

  // Derived available products from vendor inventory
  const availableProducts: CatalogProductSummary[] = useMemo(() => {
    if (vendorProductsData?.products && Array.isArray(vendorProductsData.products)) {
      return vendorProductsData.products.map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        image: p.mainImage || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        category: p.productCategory || 'CRAFTS',
      }));
    }
    return [];
  }, [vendorProductsData]);

  // ── Modals & Selected States ───────────────────────────────
  const [selectedCatalog, setSelectedCatalog] = useState<CatalogCollection | null>(null);
  const [catalogDetailVisible, setCatalogDetailVisible] = useState(false);
  const [catalogFormVisible, setCatalogFormVisible] = useState(false);
  const [editingCatalog, setEditingCatalog] = useState<CatalogCollection | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [targetDeleteCatalog, setTargetDeleteCatalog] = useState<CatalogCollection | null>(null);

  // ── Form State ─────────────────────────────────────────────
  const [formName, setFormName] = useState('');
  const [formCoverImage, setFormCoverImage] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategoryType, setFormCategoryType] = useState<string>('CRAFTS');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formSelectedProducts, setFormSelectedProducts] = useState<string[]>([]);
  const [formProductSearchQuery, setFormProductSearchQuery] = useState('');
  const [detailProductSearchQuery, setDetailProductSearchQuery] = useState('');

  const showToast = (message: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await refetchCatalogs().unwrap();
      showToast('Catalogs synchronized');
    } catch {
      showToast('Synchronized from local cache');
    } finally {
      setRefreshing(false);
    }
  };

  // ── Filtered Catalogs ──────────────────────────────────────
  const filteredCatalogs = useMemo(() => {
    if (!searchQuery.trim()) return catalogs;
    const q = searchQuery.toLowerCase();
    return catalogs.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [catalogs, searchQuery]);

  // ── Pagination Calculations ────────────────────────────────
  const totalItems = filteredCatalogs.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const hasPrevPage = currentPage > 1;
  const hasNextPage = currentPage < totalPages;

  const paginatedCatalogs = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredCatalogs.slice(startIndex, startIndex + pageSize);
  }, [filteredCatalogs, currentPage, pageSize]);

  // ── Filtered Products for Form Checklist ───────────────────
  const filteredFormProducts = useMemo(() => {
    if (!formProductSearchQuery.trim()) return availableProducts;
    const q = formProductSearchQuery.toLowerCase();
    return availableProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [availableProducts, formProductSearchQuery]);

  // ── Filtered Products for Catalog Details Inspector ────────
  const filteredDetailProducts = useMemo(() => {
    if (!selectedCatalog) return [];
    const lookbookPieces = availableProducts.filter((p) =>
      selectedCatalog.productIds.includes(p.id)
    );
    if (!detailProductSearchQuery.trim()) return lookbookPieces;
    const q = detailProductSearchQuery.toLowerCase();
    return lookbookPieces.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [selectedCatalog, availableProducts, detailProductSearchQuery]);

  // ── Metrics ────────────────────────────────────────────────
  const totalPiecesInCatalogs = useMemo(() => {
    return catalogs.reduce((acc, c) => acc + c.productIds.length, 0);
  }, [catalogs]);

  // ── Handlers ───────────────────────────────────────────────
  const handleOpenCatalogDetails = (cat: CatalogCollection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCatalog(cat);
    setDetailProductSearchQuery('');
    setCatalogDetailVisible(true);
  };

  const handleOpenAddCatalog = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCatalog(null);
    setFormName('');
    setFormCoverImage('https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80');
    setFormDescription('');
    setFormCategoryType('CRAFTS');
    setFormPrice('');
    setFormSelectedProducts([]);
    setFormProductSearchQuery('');
    setCatalogFormVisible(true);
  };

  const handleOpenEditCatalog = (cat: CatalogCollection) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditingCatalog(cat);
    setFormName(cat.name);
    setFormCoverImage(cat.coverImage);
    setFormDescription(cat.description);
    setFormCategoryType(cat.categoryType || 'CRAFTS');
    setFormPrice(cat.price ? String(cat.price) : '');
    setFormSelectedProducts([...cat.productIds]);
    setFormProductSearchQuery('');
    setCatalogFormVisible(true);
  };

  const handleToggleProductSelection = (productId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAllProducts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormSelectedProducts(availableProducts.map((p) => p.id));
  };

  const handleDeselectAllProducts = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFormSelectedProducts([]);
  };

  const handleRemovePieceFromCatalog = async (productId: string) => {
    if (!selectedCatalog) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const updatedIds = selectedCatalog.productIds.filter((id) => id !== productId);

    setSelectedCatalog((prev) =>
      prev ? { ...prev, productIds: updatedIds } : null
    );

    setCatalogs((prev) =>
      prev.map((c) =>
        c.id === selectedCatalog.id ? { ...c, productIds: updatedIds } : c
      )
    );

    try {
      await updateCatalogMutation({
        id: selectedCatalog.id,
        body: { productIds: updatedIds },
      }).unwrap();
      showToast('Piece removed from lookbook');
    } catch {
      showToast('Updated locally');
    }
  };

  const handleSaveCatalog = async () => {
    if (!formName.trim()) {
      showToast('Please enter a catalog title');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const parsedPrice = formPrice.trim() ? parseFloat(formPrice.trim()) : undefined;

    if (editingCatalog) {
      const updatedItem: CatalogCollection = {
        ...editingCatalog,
        name: formName.trim(),
        coverImage: formCoverImage.trim() || editingCatalog.coverImage,
        description: formDescription.trim(),
        categoryType: formCategoryType,
        price: parsedPrice,
        productIds: formSelectedProducts,
      };

      setCatalogs((prev) =>
        prev.map((c) => (c.id === editingCatalog.id ? updatedItem : c))
      );
      if (selectedCatalog?.id === editingCatalog.id) {
        setSelectedCatalog(updatedItem);
      }
      setCatalogFormVisible(false);

      try {
        await updateCatalogMutation({
          id: editingCatalog.id,
          body: {
            name: formName.trim(),
            image: formCoverImage.trim() || editingCatalog.coverImage,
            description: formDescription.trim(),
            categoryType: formCategoryType,
            price: parsedPrice,
            productIds: formSelectedProducts,
          },
        }).unwrap();
        showToast('Lookbook updated successfully');
      } catch (err: any) {
        showToast('Saved locally');
      }
    } else {
      const tempId = `col-${Date.now()}`;
      const newCat: CatalogCollection = {
        id: tempId,
        name: formName.trim(),
        coverImage: formCoverImage.trim() || 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
        description: formDescription.trim(),
        categoryType: formCategoryType,
        price: parsedPrice,
        productIds: formSelectedProducts,
        createdAt: new Date().toISOString(),
      };
      setCatalogs((prev) => [newCat, ...prev]);
      setCatalogFormVisible(false);

      try {
        const created = await createCatalogMutation({
          name: formName.trim(),
          image: formCoverImage.trim() || newCat.coverImage,
          description: formDescription.trim(),
          categoryType: formCategoryType,
          price: parsedPrice,
          productIds: formSelectedProducts,
        }).unwrap();

        if (created?.id) {
          setCatalogs((prev) =>
            prev.map((c) => (c.id === tempId ? { ...c, id: created.id } : c))
          );
        }
        showToast('Lookbook published successfully');
      } catch (err: any) {
        showToast('Saved locally');
      }
    }
  };
  const handleConfirmDelete = async () => {
    if (!targetDeleteCatalog) return;
    const targetId = targetDeleteCatalog.id;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    setCatalogs((prev) => prev.filter((c) => c.id !== targetId));
    if (selectedCatalog?.id === targetId) {
      setCatalogDetailVisible(false);
      setSelectedCatalog(null);
    }
    setDeleteModalVisible(false);

    try {
      await deleteCatalogMutation(targetId).unwrap();
      showToast('Catalog lookbook deleted');
    } catch {
      showToast('Removed from atelier view');
    }
  };

  // ─── FlatList Header Component ──────────────────────────────────────────────
  const renderListHeader = useCallback(() => (
    <View style={{ paddingHorizontal: Spacing.lg }}>
      {/* ─── 1. TOP HEADER & CREATE ACTION (PARITY WITH PRODUCTS) ─── */}
      <View style={styles.topHeaderRow}>
        <View style={{ flex: 1, paddingRight: 8 }}>
          <Text style={[styles.screenHeading, { color: theme.textPrimary }]}>
            Catalogs & Lookbooks
          </Text>
          <Text style={[styles.screenSubheading, { color: theme.textMuted }]}>
            Thematic artisan showcases,{'\n'}and seasonal curation
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.addCatalogBtn, { backgroundColor: theme.primary }]}
          onPress={handleOpenAddCatalog}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={18} color="#FFFFFF" />
          <Text style={styles.addCatalogBtnText}>Catalog</Text>
        </TouchableOpacity>
      </View>

      {/* ─── 2. SUMMARY METRICS CARDS (HUB FLAT STYLE) ─────────── */}
      <View style={styles.metricsGrid}>
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
              ACTIVE CATALOGS
            </Text>
            <Ionicons name="library-outline" size={14} color={theme.textMuted} />
          </View>
          <Text style={[styles.metricValue, { color: theme.textPrimary }]}>
            {catalogs.length}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            Curated collections
          </Text>
        </View>

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
              CURATED PIECES
            </Text>
            <Ionicons name="grid-outline" size={14} color={theme.textMuted} />
          </View>
          <Text style={[styles.metricValue, { color: '#009D1A' }]}>
            {totalPiecesInCatalogs}
          </Text>
          <Text style={[styles.metricSubtext, { color: theme.textMuted }]}>
            Assigned across lookbooks
          </Text>
        </View>
      </View>

      {/* ─── 3. SEARCH INPUT ───────────────────────────────────── */}
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
          placeholder="Search catalogs, collections, lookbooks..."
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

      {/* ─── 4. COUNTER BAR ────────────────────────────────────── */}
      <View style={{ marginTop: Spacing.sm, marginBottom: Spacing.xs }}>
        <Text style={[styles.sectionCountText, { color: theme.textMuted }]}>
          SHOWING {paginatedCatalogs.length} OF {filteredCatalogs.length} COLLECTIONS
        </Text>
      </View>

      {/* Error Banner with Retry */}
      {isCatalogsError && (
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
                Failed to Load Catalogs
              </Text>
              <Text
                style={[
                  styles.errorCardSub,
                  { color: theme.textMuted },
                ]}
              >
                Unable to synchronize atelier lookbooks from the server.
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
              refetchCatalogs();
            }}
          >
            <Ionicons name="refresh" size={14} color="#FFFFFF" />
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  ), [
    theme,
    catalogs.length,
    totalPiecesInCatalogs,
    searchQuery,
    paginatedCatalogs.length,
    filteredCatalogs.length,
    isCatalogsError,
    isDark,
    refetchCatalogs,
  ]);

  // ─── FlatList Empty State Component ────────────────────────────────────────
  const renderListEmpty = useCallback(() => {
    if (isCatalogsLoading || (isCatalogsFetching && catalogs.length === 0)) {
      return (
        <View style={{ paddingHorizontal: Spacing.lg }}>
          <VendorCatalogSkeleton count={3} />
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: Spacing.lg }}>
        <View
          style={[
            styles.emptyStateCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}
        >
          <Ionicons name="library-outline" size={40} color={theme.textMuted} />
          <Text style={[styles.emptyStateTitle, { color: theme.textPrimary }]}>
            No catalogs found
          </Text>
          <Text style={[styles.emptyStateDesc, { color: theme.textMuted }]}>
            {searchQuery
              ? 'No lookbooks match your search query.'
              : 'Create your first curated lookbook to group pieces into thematic collections.'}
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={[
                  styles.emptyAddBtn,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255, 255, 255, 0.08)'
                      : 'rgba(54, 19, 0, 0.08)',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchQuery('');
                  setCurrentPage(1);
                }}
              >
                <Text
                  style={[
                    styles.emptyAddBtnText,
                    { color: theme.textPrimary },
                  ]}
                >
                  Clear Search
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.emptyAddBtn, { backgroundColor: theme.primary }]}
              onPress={handleOpenAddCatalog}
            >
              <Text style={styles.emptyAddBtnText}>Create Lookbook</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }, [
    isCatalogsLoading,
    isCatalogsFetching,
    catalogs.length,
    theme,
    searchQuery,
    isDark,
  ]);

  // ─── FlatList Catalog Item RenderItem ───────────────────────────────────────
  const renderCatalogItem = useCallback(({ item: cat }: { item: CatalogCollection }) => (
    <View style={{ paddingHorizontal: Spacing.lg }}>
      <TouchableOpacity
        style={[
          styles.catalogCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
        onPress={() => handleOpenCatalogDetails(cat)}
        activeOpacity={0.85}
      >
        {/* Cover Banner with Fallback */}
        {cat.coverImage ? (
          <Image
            source={{ uri: cat.coverImage }}
            style={styles.catalogCover}
            resizeMode="cover"
          />
        ) : (
          <View
            style={[
              styles.catalogCover,
              styles.coverFallbackContainer,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FAF6EE',
                borderColor: theme.borderSubtle,
              },
            ]}
          >
            <Ionicons name="images-outline" size={28} color={theme.textMuted} />
            <Text style={[styles.coverFallbackText, { color: theme.textMuted }]}>
              Artisanal Lookbook
            </Text>
          </View>
        )}

        <View style={styles.catalogCardBody}>
          {/* Title & Count Badge */}
          <View style={styles.catalogTitleRow}>
            <Text
              style={[styles.catalogTitle, { color: theme.textPrimary }]}
              numberOfLines={1}
            >
              {cat.name}
            </Text>
            <View
              style={[
                styles.piecesBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(196, 108, 39, 0.2)'
                    : '#FEF3C7',
                },
              ]}
            >
              <Text style={[styles.piecesBadgeText, { color: theme.primary }]}>
                {cat.productIds.length} {cat.productIds.length === 1 ? 'Piece' : 'Pieces'}
              </Text>
            </View>
          </View>

          <Text
            style={[styles.catalogDesc, { color: theme.textMuted }]}
            numberOfLines={2}
          >
            {cat.description}
          </Text>

          {/* Actions Row */}
          <View style={[styles.catalogCardFooter, { borderTopColor: theme.borderSubtle }]}>
            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => handleOpenCatalogDetails(cat)}
            >
              <Ionicons name="eye-outline" size={14} color={theme.textPrimary} />
              <Text style={[styles.footerBtnText, { color: theme.textPrimary }]}>
                Inspect Lookbook
              </Text>
            </TouchableOpacity>

            <View style={[styles.footerDivider, { backgroundColor: theme.borderSubtle }]} />

            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => handleOpenEditCatalog(cat)}
            >
              <Ionicons name="create-outline" size={14} color={theme.textPrimary} />
              <Text style={[styles.footerBtnText, { color: theme.textPrimary }]}>
                Edit
              </Text>
            </TouchableOpacity>

            <View style={[styles.footerDivider, { backgroundColor: theme.borderSubtle }]} />

            <TouchableOpacity
              style={styles.footerBtn}
              onPress={() => {
                setTargetDeleteCatalog(cat);
                setDeleteModalVisible(true);
              }}
            >
              <Ionicons name="trash-outline" size={14} color="#DC2626" />
              <Text style={[styles.footerBtnText, { color: '#DC2626' }]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  ), [
    theme,
    isDark,
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
            <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
              Page <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{currentPage}</Text> of{' '}
              <Text style={{ fontFamily: FontFamily.headingBold, color: theme.textPrimary }}>{totalPages}</Text>
            </Text>
            <Text style={[styles.paginationInfoText, { color: theme.textMuted }]}>
              Total: <Text style={{ fontFamily: FontFamily.headingBold, color: theme.primary }}>{totalItems}</Text> catalogs
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

      {/* ── FlatList Main Catalogs Listing ─────────────────────────────────── */}
      <FlatList
        data={paginatedCatalogs}
        keyExtractor={(item) => item.id}
        renderItem={renderCatalogItem}
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

      {/* ─── 5. CATALOG DETAIL MODAL (LOOKBOOK INSPECTOR) ───────── */}
      <Modal
        visible={catalogDetailVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatalogDetailVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setCatalogDetailVisible(false)}
          />
          <View
            style={[
              styles.detailSheetCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />

            {/* Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1, paddingRight: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text
                    style={[styles.modalTitleText, { color: theme.textPrimary }]}
                    numberOfLines={1}
                  >
                    {selectedCatalog?.name}
                  </Text>
                  {selectedCatalog?.categoryType ? (
                    <View style={[styles.categoryBadgePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(54,19,0,0.06)' }]}>
                      <Text style={[styles.categoryBadgeText, { color: theme.primary }]}>
                        {selectedCatalog.categoryType}
                      </Text>
                    </View>
                  ) : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
                  <Text style={[styles.modalSubheading, { color: theme.textMuted }]}>
                    {selectedCatalog?.productIds.length} pieces in this collection
                  </Text>
                  {selectedCatalog?.price ? (
                    <>
                      <Text style={{ fontSize: 10, color: theme.borderSubtle }}>•</Text>
                      <Text style={[styles.modalSubheading, { color: theme.primary, fontFamily: FontFamily.headingBold }]}>
                        Est. {formatPrice(selectedCatalog.price, currencyCode, exchangeRate)}
                      </Text>
                    </>
                  ) : null}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setCatalogDetailVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: Spacing.sm }}
            >
              {/* Cover Banner with Fallback */}
              {selectedCatalog?.coverImage ? (
                <Image
                  source={{ uri: selectedCatalog.coverImage }}
                  style={styles.detailCoverImage}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[
                    styles.detailCoverImage,
                    styles.coverFallbackContainer,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#FAF6EE',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="images-outline" size={36} color={theme.textMuted} />
                  <Text style={[styles.coverFallbackText, { color: theme.textMuted }]}>
                    Artisanal Lookbook Collection
                  </Text>
                </View>
              )}

              <Text style={[styles.detailDescription, { color: theme.textPrimary }]}>
                {selectedCatalog?.description}
              </Text>

              {/* Items in this Catalog */}
              <View style={styles.detailSectionHeaderRow}>
                <Text style={[styles.detailSectionHeading, { color: theme.textMuted }]}>
                  PIECES IN THIS LOOKBOOK ({selectedCatalog?.productIds.length || 0})
                </Text>
              </View>

              {/* Inline Search for Lookbook Pieces */}
              {selectedCatalog && selectedCatalog.productIds.length > 2 && (
                <View
                  style={[
                    styles.detailSearchBox,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Ionicons name="search-outline" size={14} color={theme.textMuted} />
                  <TextInput
                    placeholder="Search in lookbook..."
                    placeholderTextColor={theme.textMuted}
                    value={detailProductSearchQuery}
                    onChangeText={setDetailProductSearchQuery}
                    style={[styles.detailSearchInput, { color: theme.textPrimary }]}
                  />
                  {detailProductSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setDetailProductSearchQuery('')}>
                      <Ionicons name="close-circle" size={14} color={theme.textMuted} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {filteredDetailProducts.map((prod) => (
                <View
                  key={prod.id}
                  style={[
                    styles.detailProductRow,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.04)'
                        : '#FAF6EE',
                      borderColor: theme.borderSubtle,
                    },
                  ]}
                >
                  <Image
                    source={{ uri: prod.image }}
                    style={styles.detailProductThumb}
                    resizeMode="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.detailProductName, { color: theme.textPrimary }]}
                      numberOfLines={1}
                    >
                      {prod.name}
                    </Text>
                    <View style={styles.detailProductMetaRow}>
                      <View style={[styles.categoryBadgePill, { backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(54,19,0,0.05)' }]}>
                        <Text style={[styles.categoryBadgeText, { color: theme.textMuted }]}>
                          {prod.category}
                        </Text>
                      </View>
                      <Text style={[styles.detailProductPrice, { color: theme.primary }]}>
                        {formatPrice(prod.price, currencyCode, exchangeRate)}
                      </Text>
                    </View>
                  </View>

                  {/* Direct Piece Removal from Collection */}
                  <TouchableOpacity
                    style={styles.detailRemovePieceBtn}
                    onPress={() => handleRemovePieceFromCatalog(prod.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
                  </TouchableOpacity>
                </View>
              ))}

              {selectedCatalog?.productIds.length === 0 && (
                <Text style={[styles.noItemsText, { color: theme.textMuted }]}>
                  No pieces assigned to this lookbook yet.
                </Text>
              )}

              {selectedCatalog &&
                selectedCatalog.productIds.length > 0 &&
                filteredDetailProducts.length === 0 && (
                  <Text style={[styles.noItemsText, { color: theme.textMuted }]}>
                    No pieces in this lookbook match &ldquo;{detailProductSearchQuery}&rdquo;.
                  </Text>
                )}
            </ScrollView>

            {/* Footer Buttons */}
            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setCatalogDetailVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Close
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={() => {
                  setCatalogDetailVisible(false);
                  if (selectedCatalog) handleOpenEditCatalog(selectedCatalog);
                }}
              >
                <Text style={styles.formSubmitBtnText}>Edit Catalog</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── 6. CREATE / EDIT CATALOG MODAL ────────────────────── */}
      <Modal
        visible={catalogFormVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCatalogFormVisible(false)}
        statusBarTranslucent
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.bottomSheetContainer}
        >
          <TouchableOpacity
            style={styles.sheetBackdrop}
            activeOpacity={1}
            onPress={() => setCatalogFormVisible(false)}
          />
          <View
            style={[
              styles.catalogFormSheetCard,
              {
                backgroundColor: isDark ? theme.card : '#FFFDF9',
                borderColor: theme.border,
                paddingBottom: Math.max(insets.bottom, 16) + 8,
              },
            ]}
          >
            <View style={styles.sheetDragHandle} />
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitleText, { color: theme.textPrimary }]}>
                {editingCatalog ? 'Edit Lookbook' : 'Create New Lookbook'}
              </Text>
              <TouchableOpacity
                onPress={() => setCatalogFormVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              {/* Catalog Name */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  CATALOG TITLE *
                </Text>
                <TextInput
                  value={formName}
                  onChangeText={setFormName}
                  placeholder="e.g. Harmattan Heritage Collection"
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

              {/* Cover Image URL */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  COVER IMAGE URL
                </Text>
                <TextInput
                  value={formCoverImage}
                  onChangeText={setFormCoverImage}
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

              {/* Description */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  COLLECTION CURATOR NOTES
                </Text>
                <TextInput
                  value={formDescription}
                  onChangeText={setFormDescription}
                  multiline
                  numberOfLines={3}
                  placeholder="Story and theme behind this collection..."
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

              {/* Category Type (Required for backend classification) */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  CATEGORY CLASSIFICATION *
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8, paddingVertical: 4 }}
                >
                  {CATEGORY_TYPES.map((catType) => {
                    const isSelected = formCategoryType === catType;
                    return (
                      <TouchableOpacity
                        key={catType}
                        style={[
                          styles.catTypePill,
                          {
                            backgroundColor: isSelected
                              ? theme.primary
                              : isDark
                              ? 'rgba(255, 255, 255, 0.06)'
                              : '#FAF6EE',
                            borderColor: isSelected ? theme.primary : theme.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => {
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setFormCategoryType(catType);
                        }}
                      >
                        <Text
                          style={[
                            styles.catTypePillText,
                            {
                              color: isSelected ? '#FFFFFF' : theme.textPrimary,
                            },
                          ]}
                        >
                          {catType}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Optional Estimated Price */}
              <View style={styles.formGroup}>
                <Text style={[styles.formLabel, { color: theme.textMuted }]}>
                  FEATURED PRICE ({currencyCode}) — OPTIONAL
                </Text>
                <TextInput
                  value={formPrice}
                  onChangeText={setFormPrice}
                  placeholder="e.g. 250000"
                  placeholderTextColor={theme.textMuted}
                  keyboardType="numeric"
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

              {/* Product Selection Checklist */}
              <View style={styles.formGroup}>
                <View style={styles.formSelectHeaderRow}>
                  <Text style={[styles.formLabel, { color: theme.textMuted, marginBottom: 0 }]}>
                    SELECT PIECES TO INCLUDE ({formSelectedProducts.length} SELECTED)
                  </Text>
                  <View style={styles.formSelectActionsRow}>
                    <TouchableOpacity onPress={handleSelectAllProducts} style={styles.formSelectActionBtn}>
                      <Text style={[styles.formSelectActionText, { color: theme.primary }]}>
                        Select All
                      </Text>
                    </TouchableOpacity>
                    <Text style={[styles.formSelectActionDivider, { color: theme.border }]}>•</Text>
                    <TouchableOpacity onPress={handleDeselectAllProducts} style={styles.formSelectActionBtn}>
                      <Text style={[styles.formSelectActionText, { color: theme.textMuted }]}>
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Empty Atelier Inventory Callout */}
                {availableProducts.length === 0 && (
                  <View
                    style={[
                      styles.inventoryEmptyNotice,
                      {
                        backgroundColor: isDark ? 'rgba(196, 108, 39, 0.12)' : '#FEF3C7',
                        borderColor: isDark ? 'rgba(196, 108, 39, 0.3)' : '#FDE68A',
                      },
                    ]}
                  >
                    <Ionicons name="cube-outline" size={20} color={theme.primary} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.inventoryEmptyTitle, { color: theme.textPrimary }]}>
                        Workshop Inventory is Empty
                      </Text>
                      <Text style={[styles.inventoryEmptySub, { color: theme.textMuted }]}>
                        You haven&apos;t added any products to your workshop yet. Create products first to curate them into this lookbook.
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.inventoryAddBtn, { backgroundColor: theme.primary }]}
                      onPress={() => {
                        setCatalogFormVisible(false);
                        router.push('/(vendor)/products');
                      }}
                    >
                      <Text style={styles.inventoryAddBtnText}>Add Items</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Inline Product Search */}
                {availableProducts.length > 0 && (
                  <View
                    style={[
                      styles.formProductSearchBox,
                      {
                        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : '#FAF6EE',
                        borderColor: theme.borderSubtle,
                      },
                    ]}
                  >
                    <Ionicons name="search-outline" size={14} color={theme.textMuted} />
                    <TextInput
                      placeholder="Search pieces by name or category..."
                      placeholderTextColor={theme.textMuted}
                      value={formProductSearchQuery}
                      onChangeText={setFormProductSearchQuery}
                      style={[styles.formProductSearchInput, { color: theme.textPrimary }]}
                    />
                    {formProductSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setFormProductSearchQuery('')}>
                        <Ionicons name="close-circle" size={14} color={theme.textMuted} />
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {filteredFormProducts.map((prod) => {
                  const isChecked = formSelectedProducts.includes(prod.id);
                  return (
                    <TouchableOpacity
                      key={prod.id}
                      onPress={() => handleToggleProductSelection(prod.id)}
                      style={[
                        styles.productSelectRow,
                        {
                          backgroundColor: isChecked
                            ? isDark
                              ? 'rgba(196, 108, 39, 0.15)'
                              : '#FEF3C7'
                            : isDark
                            ? 'rgba(255, 255, 255, 0.04)'
                            : '#FAF6EE',
                          borderColor: isChecked ? theme.primary : theme.borderSubtle,
                        },
                      ]}
                      activeOpacity={0.7}
                    >
                      <Image
                        source={{ uri: prod.image }}
                        style={styles.selectRowThumb}
                        resizeMode="cover"
                      />
                      <View style={{ flex: 1 }}>
                        <Text
                          style={[styles.selectRowName, { color: theme.textPrimary }]}
                          numberOfLines={1}
                        >
                          {prod.name}
                        </Text>
                        <Text style={[styles.selectRowPrice, { color: theme.textMuted }]}>
                          {prod.category} • {formatPrice(prod.price, currencyCode, exchangeRate)}
                        </Text>
                      </View>
                      <Ionicons
                        name={isChecked ? 'checkbox' : 'square-outline'}
                        size={20}
                        color={isChecked ? theme.primary : theme.textMuted}
                      />
                    </TouchableOpacity>
                  );
                })}

                {filteredFormProducts.length === 0 && (
                  <Text style={[styles.noItemsText, { color: theme.textMuted, textAlign: 'center' }]}>
                    No atelier pieces match &ldquo;{formProductSearchQuery}&rdquo;.
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setCatalogFormVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.formSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSaveCatalog}
              >
                <Text style={styles.formSubmitBtnText}>
                  {editingCatalog ? 'Save Catalog' : 'Publish Lookbook'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ─── 7. DELETE CONFIRMATION MODAL ───────────────────────── */}
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
              Delete Catalog?
            </Text>
            <Text style={[styles.deleteSubtext, { color: theme.textMuted }]}>
              &ldquo;{targetDeleteCatalog?.name}&rdquo; will be deleted. The products within it will remain in your inventory.
            </Text>

            <View style={styles.formActionsRow}>
              <TouchableOpacity
                style={[styles.formCancelBtn, { borderColor: theme.border }]}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={[styles.formCancelBtnText, { color: theme.textPrimary }]}>
                  Keep Catalog
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, { backgroundColor: '#DC2626' }]}
                onPress={handleConfirmDelete}
              >
                <Text style={styles.deleteConfirmBtnText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
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

  // ─── 1. TOP HEADER & CREATE BUTTON ───────────────────────
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
  addCatalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.md, // 7px
  },
  addCatalogBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },

  // ─── 2. SUMMARY METRICS CARDS ─────────────────────────────
  metricsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: Spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: Radius.md,
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

  // ─── 3. SEARCH BOX ────────────────────────────────────────
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 40,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 10,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    paddingVertical: 0,
  },

  // ─── 4. CATALOGS LIST / CARDS ────────────────────────────
  catalogsListSection: {
    marginTop: Spacing.xs,
  },
  sectionCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  catalogCard: {
    borderRadius: Radius.md, // 7px
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  catalogCover: {
    width: '100%',
    height: 140,
    backgroundColor: '#FAF6EE',
  },
  catalogCardBody: {
    padding: Spacing.md,
  },
  catalogTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  catalogTitle: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    flex: 1,
    marginRight: 8,
  },
  piecesBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 4,
  },
  piecesBadgeText: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },
  catalogDesc: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 17,
    marginTop: 2,
  },
  catalogCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    paddingTop: 10,
    marginTop: 10,
  },
  footerBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 2,
  },
  footerBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
  },
  footerDivider: {
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
  detailSheetCard: {
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
  detailModalCard: {
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
  modalSubheading: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    marginTop: 1,
  },
  detailCoverImage: {
    width: '100%',
    height: 130,
    borderRadius: 6,
    marginBottom: 10,
  },
  detailDescription: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  detailSectionHeading: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  detailProductThumb: {
    width: 44,
    height: 44,
    borderRadius: 4,
  },
  detailProductName: {
    fontSize: 12.5,
    fontFamily: FontFamily.headingBold,
  },
  detailProductPrice: {
    fontSize: 11.5,
    fontFamily: FontFamily.headingBold,
    marginTop: 2,
  },
  noItemsText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    fontStyle: 'italic',
    paddingVertical: 10,
  },
  catalogFormSheetCard: {
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
  catalogFormCard: {
    width: '100%',
    maxWidth: 380,
    maxHeight: '85%',
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.md,
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
  productSelectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 6,
  },
  selectRowThumb: {
    width: 38,
    height: 38,
    borderRadius: 4,
  },
  selectRowName: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
  },
  selectRowPrice: {
    fontSize: 11,
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

  // ─── SEARCH & SELECTION PARITY STYLES ────────────────────
  detailSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  detailSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 10,
  },
  detailSearchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    paddingVertical: 0,
  },
  detailProductMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  categoryBadgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
  },
  categoryBadgeText: {
    fontSize: 9.5,
    fontFamily: FontFamily.headingBold,
  },
  detailRemovePieceBtn: {
    padding: 4,
  },
  formSelectHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  formSelectActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formSelectActionBtn: {
    paddingVertical: 2,
  },
  formSelectActionText: {
    fontSize: 10.5,
    fontFamily: FontFamily.headingBold,
  },
  formSelectActionDivider: {
    fontSize: 10,
  },
  formProductSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    borderRadius: Radius.md,
    borderWidth: 1,
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  formProductSearchInput: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    paddingVertical: 0,
  },
  toastContainer: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  toastText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
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
  catTypePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  catTypePillText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.3,
  },
  coverFallbackContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 6,
  },
  coverFallbackText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    letterSpacing: 0.2,
  },
  inventoryEmptyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  inventoryEmptyTitle: {
    fontSize: 12,
    fontFamily: FontFamily.headingBold,
    marginBottom: 2,
  },
  inventoryEmptySub: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    lineHeight: 15,
  },
  inventoryAddBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  inventoryAddBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
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
});

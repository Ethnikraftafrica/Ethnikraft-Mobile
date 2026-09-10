import React, { useState, useMemo, useRef, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import {
  useGetProductsQuery,
  useGetTopPicksWeekQuery,
  useGetAfricanPaintingsQuery,
  useGetBestsellersDecorationsQuery,
  useGetInspiredByCultureQuery,
  Product,
} from '@/store/api/productApi';
import { MOCK_PRODUCTS } from '@/constants/mockProducts';
import { ProductCard, PRODUCT_CARD_WIDTH } from '@/components/products/ProductCard';
import { ProductFilterModal, FilterState } from '@/components/products/ProductFilterModal';
import { ProductSortModal, SortOption } from '@/components/products/ProductSortModal';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'ALL', label: 'All' },
  { id: 'WEARS', label: 'Wears' },
  { id: 'SHOES', label: 'Shoes' },
  { id: 'BAGS', label: 'Bags' },
  { id: 'ACCESSORIES', label: 'Accessories' },
  { id: 'CRAFTS', label: 'Crafts' },
  { id: 'PAINTINGS', label: 'Paintings' },
  { id: 'ANTIQUES', label: 'Antiques' },
];

const INITIAL_FILTERS: FilterState = {
  category: 'ALL',
  pricePreset: 'all',
  minPrice: undefined,
  maxPrice: undefined,
  availability: 'all',
  curation: [],
};

export default function ExploreScreen() {
  const router = useRouter();
  const {
    category: urlCategory,
    collection: urlCollection,
    search: urlSearch,
    title: urlTitle,
    autoFocus: autoFocusParam,
  } = useLocalSearchParams<{
    category?: string;
    collection?: string;
    search?: string;
    title?: string;
    autoFocus?: string;
  }>();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  // Search & Filter State
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [activeCollection, setActiveCollection] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('');

  // Auto-focus search input when navigated with autoFocus=1
  React.useEffect(() => {
    if (autoFocusParam === '1') {
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [autoFocusParam]);

  // Sync params from route/navigation
  React.useEffect(() => {
    if (urlTitle) {
      setActiveTitle(urlTitle);
    }
    if (urlCollection) {
      setActiveCollection(urlCollection);
      if (urlCollection === 'african-paintings') {
        setSelectedCategory('PAINTINGS');
        setFilters((prev) => ({ ...prev, category: 'PAINTINGS' }));
      } else if (urlCollection === 'bestsellers-decorations') {
        setSelectedCategory('CRAFTS');
        setFilters((prev) => ({ ...prev, category: 'CRAFTS' }));
      }
      setPage(1);
    }
    if (urlCategory) {
      const match = CATEGORIES.find(
        (c) =>
          c.id.toUpperCase() === urlCategory.toUpperCase() ||
          c.label.toUpperCase() === urlCategory.toUpperCase()
      );
      if (match) {
        setSelectedCategory(match.id);
        setFilters((prev) => ({ ...prev, category: match.id }));
        if (!urlTitle) {
          setActiveTitle(match.label);
        }
        setPage(1);
      }
    }
    if (urlSearch) {
      setSearchQuery(urlSearch);
      setDebouncedSearch(urlSearch);
      setPage(1);
    }
  }, [urlCategory, urlCollection, urlSearch, urlTitle]);

  // Modals
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [isSortModalOpen, setIsSortModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  // Pagination & Refresh
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Handle Search Typing with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    searchTimeout.current = setTimeout(() => {
      setDebouncedSearch(text.trim());
      setPage(1);
    }, 350);
  };

  const handleClearSearch = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  // Build RTK Query params
  const queryParams = useMemo(() => {
    const params: any = {
      take: 24,
      skip: (page - 1) * 24,
    };

    if (debouncedSearch) {
      params.search = debouncedSearch;
    }

    const activeCat = filters.category !== 'ALL' ? filters.category : selectedCategory;
    if (activeCat !== 'ALL') {
      params.productCategory = activeCat;
    }

    if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
    if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;

    if (filters.curation.length > 0) {
      filters.curation.forEach((flag) => {
        params[flag] = true;
      });
    }

    return params;
  }, [debouncedSearch, selectedCategory, filters, page]);

  // Fetch live products
  const {
    data: apiResponse,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useGetProductsQuery(queryParams, {
    skip: !!activeCollection,
  });

  const {
    data: topPicksData,
    isLoading: isTopPicksLoading,
    refetch: refetchTopPicks,
  } = useGetTopPicksWeekQuery(undefined, {
    skip: activeCollection !== 'top-picks-week',
  });

  const {
    data: paintingsData,
    isLoading: isPaintingsLoading,
    refetch: refetchPaintings,
  } = useGetAfricanPaintingsQuery(undefined, {
    skip: activeCollection !== 'african-paintings',
  });

  const {
    data: decorationsData,
    isLoading: isDecorationsLoading,
    refetch: refetchDecorations,
  } = useGetBestsellersDecorationsQuery(undefined, {
    skip: activeCollection !== 'bestsellers-decorations',
  });

  const {
    data: cultureData,
    isLoading: isCultureLoading,
    refetch: refetchCulture,
  } = useGetInspiredByCultureQuery(undefined, {
    skip: activeCollection !== 'inspired-by-culture',
  });

  const isLoading =
    activeCollection === 'top-picks-week'
      ? isTopPicksLoading
      : activeCollection === 'african-paintings'
      ? isPaintingsLoading
      : activeCollection === 'bestsellers-decorations'
      ? isDecorationsLoading
      : activeCollection === 'inspired-by-culture'
      ? isCultureLoading
      : isProductsLoading;

  const isFetching = activeCollection ? isLoading : isProductsFetching;

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPage(1);
    try {
      if (activeCollection === 'top-picks-week') await refetchTopPicks();
      else if (activeCollection === 'african-paintings') await refetchPaintings();
      else if (activeCollection === 'bestsellers-decorations') await refetchDecorations();
      else if (activeCollection === 'inspired-by-culture') await refetchCulture();
      else await refetchProducts();
    } catch (e) {
      // Ignore
    } finally {
      setIsRefreshing(false);
    }
  }, [
    activeCollection,
    refetchTopPicks,
    refetchPaintings,
    refetchDecorations,
    refetchCulture,
    refetchProducts,
  ]);

  // Combine and sort products (using live API with client-side fallback)
  const displayProducts = useMemo(() => {
    let list: Product[] = [];

    if (activeCollection === 'top-picks-week' && topPicksData && topPicksData.length > 0) {
      list = [...topPicksData];
    } else if (activeCollection === 'african-paintings' && paintingsData && paintingsData.length > 0) {
      list = [...paintingsData];
    } else if (
      activeCollection === 'bestsellers-decorations' &&
      decorationsData &&
      decorationsData.length > 0
    ) {
      list = [...decorationsData];
    } else if (activeCollection === 'inspired-by-culture' && cultureData && cultureData.length > 0) {
      list = [...cultureData];
    } else if (apiResponse?.data?.products && apiResponse.data.products.length > 0) {
      list = [...apiResponse.data.products];
    } else {
      // Offline fallback: filter MOCK_PRODUCTS client-side
      list = MOCK_PRODUCTS.filter((item) => {
        if (activeCollection === 'african-paintings') {
          return item.productCategory === 'PAINTINGS';
        }
        if (activeCollection === 'top-picks-week') {
          return item.isTrending || item.isBestseller;
        }
        if (activeCollection === 'bestsellers-decorations') {
          return item.productCategory === 'CRAFTS' || item.isBestseller;
        }
        if (activeCollection === 'inspired-by-culture') {
          return (
            (item.occasionTags && item.occasionTags.length > 0) ||
            (item.artStyleTags && item.artStyleTags.length > 0)
          );
        }

        // Category filter
        const activeCat = filters.category !== 'ALL' ? filters.category : selectedCategory;
        if (activeCat !== 'ALL' && item.productCategory !== activeCat) return false;

        // Search query filter
        if (debouncedSearch) {
          const q = debouncedSearch.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description?.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }

        // Price filter
        const price = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
        if (filters.minPrice !== undefined && price < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

        // Availability
        if (filters.availability === 'in_stock' && item.stockQuantity <= 0) return false;
        if (filters.availability === 'requestable' && !item.isRequestable) return false;

        // Curation flags
        if (filters.curation.length > 0) {
          const hasMatch = filters.curation.some((flag) => (item as any)[flag] === true);
          if (!hasMatch) return false;
        }

        return true;
      });
    }

    // Apply Client-side Sorting
    switch (selectedSort) {
      case 'price_asc':
        return list.sort((a, b) => Number(a.price) - Number(b.price));
      case 'price_desc':
        return list.sort((a, b) => Number(b.price) - Number(a.price));
      case 'newest':
        return list.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      case 'rating':
        return list.sort((a, b) => (b.vendor?.rating || 0) - (a.vendor?.rating || 0));
      case 'relevance':
      default:
        return list;
    }
  }, [
    activeCollection,
    topPicksData,
    paintingsData,
    decorationsData,
    cultureData,
    apiResponse,
    selectedCategory,
    filters,
    debouncedSearch,
    selectedSort,
  ]);

  const totalCount = activeCollection
    ? displayProducts.length
    : apiResponse?.data?.total || displayProducts.length;

  const handleCategoryTabPress = (catId: string) => {
    Haptics.selectionAsync();
    setSelectedCategory(catId);
    setFilters((prev) => ({ ...prev, category: catId }));
    setActiveCollection(null);
    if (catId === 'ALL') {
      setActiveTitle('');
    } else {
      const match = CATEGORIES.find((c) => c.id === catId);
      setActiveTitle(match ? match.label : '');
    }
    setPage(1);
  };

  const handleResetAllFilters = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTitle('');
    setActiveCollection(null);
    setSelectedCategory('ALL');
    setFilters(INITIAL_FILTERS);
    setSearchQuery('');
    setDebouncedSearch('');
    setPage(1);
  };

  const handleApplyFilters = (newFilters: FilterState) => {
    setFilters(newFilters);
    setSelectedCategory(newFilters.category);
    setActiveCollection(null);
    setPage(1);
  };

  const handleWishlistToggle = (_product: Product, isNowWishlisted: boolean) => {
    setWishlistCount((prev) => (isNowWishlisted ? prev + 1 : Math.max(0, prev - 1)));
  };

  const activeFilterCount =
    (filters.category !== 'ALL' ? 1 : 0) +
    (filters.pricePreset !== 'all' ? 1 : 0) +
    (filters.availability !== 'all' ? 1 : 0) +
    filters.curation.length;

  const sortLabels: Record<SortOption, string> = {
    relevance: 'Relevance',
    price_asc: 'Price: Low to High',
    price_desc: 'Price: High to Low',
    newest: 'Newest',
    rating: 'Top Rated',
  };

  return (
    <View style={styles.container}>
      {/* ─── 1. TOP HEADER (BRAND & SEARCH) ─────────────────────────── */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 6 }]}>
        {/* Top Brand Bar */}
        <View style={styles.topBrandBar}>
          <TouchableOpacity
            style={styles.brandTitleRow}
            onPress={() => router.push('/(user)')}
            activeOpacity={0.8}
            accessibilityLabel="Ethnikraft Home"
          >
            <Image
              source={require('../../../assets/revamp/logo.jpg')}
              style={styles.brandLogoImage}
              contentFit="cover"
            />
            <View style={styles.brandTextCol}>
              <Text style={styles.brandLogoText}>Ethnikraft</Text>
              <Text style={styles.brandTaglineText}>HERITAGE • CRAFT • LUXURY</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.topRightActions}>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (!isAuthenticated) setIsAuthModalOpen(true);
              }}
            >
              <Ionicons name="heart-outline" size={19} color="#1C0D05" />
              {wishlistCount > 0 && (
                <View style={styles.headerBadge}>
                  <Text style={styles.headerBadgeText}>{wishlistCount}</Text>
                </View>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.headerActionBtn}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(user)/orders');
              }}
            >
              <Ionicons name="cart-outline" size={19} color="#1C0D05" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Input Bar with Filter Button (Matching Web Screenshot) */}
        <View style={styles.searchBarRow}>
          <View style={styles.searchInputContainer}>
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search the shop..."
              placeholderTextColor="#968574"
              value={searchQuery}
              onChangeText={handleSearchChange}
              returnKeyType="search"
              autoFocus={autoFocusParam === '1'}
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={handleClearSearch}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                style={styles.clearSearchBtn}
              >
                <Ionicons name="close-circle" size={16} color="#8C7765" />
              </TouchableOpacity>
            ) : (
              <Ionicons
                name="search"
                size={17}
                color="#8C7765"
                style={styles.searchIcon}
              />
            )}
          </View>

          {/* Filter Toggle Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFilterModalOpen(true);
            }}
            style={[
              styles.filterToggleBtn,
              activeFilterCount > 0 && styles.filterToggleBtnActive,
            ]}
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFilterCount > 0 ? '#FFF' : '#1C0D05'}
            />
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Horizontal Category Pills Carousel */}
        <View style={styles.categoriesScrollWrap}>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={CATEGORIES}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.categoryPillsList}
            renderItem={({ item }) => {
              const isSelected = selectedCategory === item.id;
              return (
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => handleCategoryTabPress(item.id)}
                  style={[
                    styles.categoryPill,
                    isSelected && styles.categoryPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.categoryPillText,
                      isSelected && styles.categoryPillTextActive,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>

      {/* ─── 2. SECTION SUBHEADER (TITLE, COUNT & SORT) ─────────────── */}
      <View style={styles.subHeaderBar}>
        <View style={styles.subHeaderLeftCol}>
          <View style={styles.headingRow}>
            <Text style={styles.shopHeading} numberOfLines={1}>
              {activeTitle ? `Shop • ${activeTitle}` : 'Shop'}
            </Text>
            {(!!activeTitle || !!activeCollection || selectedCategory !== 'ALL' || !!debouncedSearch) && (
              <TouchableOpacity
                style={styles.clearFilterChip}
                onPress={handleResetAllFilters}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Clear filter"
              >
                <Ionicons name="close-circle" size={16} color="#C46C27" />
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.productsCountText}>
            {isLoading ? 'Searching craft...' : `${totalCount} products`}
          </Text>
        </View>

        {/* Sort Button with active label */}
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setIsSortModalOpen(true);
          }}
          style={styles.sortDropdownBtn}
        >
          <Ionicons name="swap-vertical-outline" size={14} color="#5C4A3A" />
          <Text style={styles.sortDropdownText}>
            {sortLabels[selectedSort]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ─── 3. 2-COLUMN PRODUCT GRID (FLATLIST) ────────────────────── */}
      <FlatList
        data={displayProducts}
        numColumns={2}
        keyExtractor={(item) => item.id}
        columnWrapperStyle={styles.gridColumnWrapper}
        contentContainerStyle={styles.gridContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#C46C27']}
            tintColor="#C46C27"
          />
        }
        renderItem={({ item }) => (
          <ProductCard
            product={item}
            onToggleWishlist={handleWishlistToggle}
            onAddToCart={(prod) => {
              if (!isAuthenticated) setIsAuthModalOpen(true);
            }}
            onCustomize={(prod) => {
              router.push({
                pathname: '/product/[id]',
                params: { id: prod.id },
              });
            }}
          />
        )}
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#C46C27" />
              <Text style={styles.emptyTitle}>Curating authentic pieces...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={32} color="#C46C27" />
              </View>
              <Text style={styles.emptyTitle}>No Artifacts Found</Text>
              <Text style={styles.emptySub}>
                We couldn't find any products matching your search or filters.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSearchQuery('');
                  setDebouncedSearch('');
                  setFilters(INITIAL_FILTERS);
                  setSelectedCategory('ALL');
                }}
                style={styles.emptyResetBtn}
              >
                <Text style={styles.emptyResetText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          )
        }
        ListFooterComponent={
          isFetching && page > 1 ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator size="small" color="#C46C27" />
            </View>
          ) : (
            <View style={{ height: 100 }} />
          )
        }
      />

      {/* ─── 4. MODALS & DRAWERS ────────────────────────────────────── */}
      <ProductFilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
      />

      <ProductSortModal
        visible={isSortModalOpen}
        onClose={() => setIsSortModalOpen(false)}
        selectedSort={selectedSort}
        onSelectSort={setSelectedSort}
      />

      <AuthPromptModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },

  // ─── HEADER CONTAINER ──────────────────────────────────────
  headerContainer: {
    backgroundColor: '#FAF6F0',
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#EDE4D8',
    paddingBottom: Spacing.xs,
  },
  topBrandBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandLogoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2D6C7',
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandLogoText: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
    letterSpacing: 0.2,
  },
  brandTaglineText: {
    fontSize: 6.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#8C5824',
    letterSpacing: 0.8,
    marginTop: 0.5,
  },
  topRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DEC7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    ...Shadows.sm,
  },
  headerBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#C46C27',
    minWidth: 15,
    height: 15,
    borderRadius: 7.5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  headerBadgeText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF',
  },

  // ─── SEARCH & FILTER ROW ───────────────────────────────────
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.xs + 2,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E2D6C7',
    paddingHorizontal: 14,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#1C0D05',
    height: '100%',
  },
  searchIcon: {
    marginLeft: 4,
  },
  clearSearchBtn: {
    padding: 2,
  },
  filterToggleBtn: {
    width: 42,
    height: 42,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D6C7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  filterToggleBtnActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  filterBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#1E1208',
    borderWidth: 1,
    borderColor: '#E8BA7A',
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF',
  },

  // ─── CATEGORIES PILLS ──────────────────────────────────────
  categoriesScrollWrap: {
    paddingVertical: 4,
  },
  categoryPillsList: {
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D6C7',
  },
  categoryPillActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  categoryPillText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsMedium,
    color: '#5C4A3A',
  },
  categoryPillTextActive: {
    color: '#FFF5DE',
    fontFamily: FontFamily.poppinsSemiBold,
  },

  // ─── SUBHEADER (TITLE, COUNT, SORT) ────────────────────────
  subHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.xs,
  },
  subHeaderLeftCol: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  clearFilterChip: {
    padding: 2,
  },
  shopHeading: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
  },
  productsCountText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8C7765',
    marginTop: 1,
  },
  sortDropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2D6C7',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    gap: 4,
  },
  sortDropdownText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#4A3728',
  },

  // ─── 2-COLUMN GRID ─────────────────────────────────────────
  gridColumnWrapper: {
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
  },
  gridContentContainer: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxl,
  },
  footerLoader: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },

  // ─── EMPTY STATE ───────────────────────────────────────────
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#F7EDE1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#7A6250',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
  },
  emptyResetBtn: {
    backgroundColor: '#3E2210',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    borderRadius: Radius.full,
  },
  emptyResetText: {
    fontSize: 11.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
  },
});

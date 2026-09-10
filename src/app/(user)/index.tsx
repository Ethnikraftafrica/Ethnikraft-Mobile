import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WebParityHeader } from '@/components/common/WebParityHeader';
import { BrandStoryModal } from '@/components/common/BrandStoryModal';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { CartFloatingButton, CartFloatingButtonRef } from '@/components/common/CartFloatingButton';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { ProductRailSkeleton, CategoryRailSkeleton } from '@/components/common/Skeletons';
import { Colors, FontFamily, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import {
  useGetProductsQuery,
  useGetTopPicksWeekQuery,
  useGetAfricanPaintingsQuery,
  useGetBestsellersDecorationsQuery,
  useGetInspiredByCultureQuery,
  useGetHomeFilterMetadataQuery,
  Product,
} from '@/store/api/productApi';

const { width } = Dimensions.get('window');

const HERITAGE_CARD_WIDTH = 175;
const HERITAGE_GAP = 12;
const HERITAGE_SNAP_INTERVAL = HERITAGE_CARD_WIDTH + HERITAGE_GAP;

const CATEGORY_CARD_WIDTH = 165;
const PRODUCT_RAIL_CARD_WIDTH = 168;

interface HeritageCardItem {
  id: string;
  title: string;
  copy: string;
  image: any;
  category: string;
}

const HERITAGE_CARDS: HeritageCardItem[] = [
  {
    id: 'ready-to-wear',
    title: 'Ready to Wear (Aṣọ)',
    copy: 'Timeless African fashion',
    image: require('../../../assets/revamp/ready-to-wear.webp'),
    category: 'WEARS',
  },
  {
    id: 'shoes',
    title: 'Shoes (Bàtà)',
    copy: 'Rooted steps, crafted sole',
    image: require('../../../assets/revamp/shoes-card.webp'),
    category: 'SHOES',
  },
  {
    id: 'bags',
    title: 'Bags (Akpa)',
    copy: 'Handcrafted for every journey',
    image: require('../../../assets/revamp/bags-card.webp'),
    category: 'BAGS',
  },
  {
    id: 'accessories',
    title: 'Accessories (Ọ̀ṣọ́)',
    copy: 'Bold details. Rooted in culture',
    image: require('../../../assets/revamp/accessories-card.webp'),
    category: 'ACCESSORIES',
  },
  {
    id: 'crafts',
    title: 'Crafts (Nka)',
    copy: 'Made by hands that tell stories',
    image: require('../../../assets/revamp/crafts-card.webp'),
    category: 'CRAFTS',
  },
  {
    id: 'art',
    title: 'Art (Ọnà)',
    copy: 'African expression for every home',
    image: require('../../../assets/revamp/art-card.webp'),
    category: 'PAINTINGS',
  },
  {
    id: 'antiques',
    title: 'Antiques (Àtijọ́)',
    copy: 'Timeless relics of our ancestors',
    image: require('../../../assets/revamp/antiques-card.webp'),
    category: 'ANTIQUES',
  },
];

// Fallback Top Picks for offline resilience
const FALLBACK_TOP_PICKS: Product[] = [
  {
    id: 'top-1',
    name: 'Patchwork Loose-Fit Denim Aso Oke Jorts',
    description: 'Crafted from premium authentic Aso Oke fabric with frayed fringe hem.',
    price: '54000',
    stockQuantity: 10,
    condition: 'new',
    productCategory: 'WEARS',
    mainImage: 'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781276755/ethnikraft/products/dmfjyrvvk6iaiydrtmsx.jpg',
    imageList: [],
    isCustomizable: true,
    isRequestable: true,
    isTrending: true,
    vendor: { id: 'v-1', businessName: 'Faustaze Studio', rating: 4.9 },
  },
  {
    id: 'top-2',
    name: 'Indigo Royal Tapestry & Chain Shorts',
    description: 'Deep indigo hand-dyed textile with antique brass chain links.',
    price: '18000',
    stockQuantity: 12,
    condition: 'new',
    productCategory: 'WEARS',
    mainImage: 'https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781278649/ethnikraft/products/toqsouycscgnkjl0sbsc.jpg',
    imageList: [],
    isCustomizable: false,
    isRequestable: true,
    isBestseller: true,
    vendor: { id: 'v-2', businessName: 'Abeokuta Indigo Guild', rating: 4.8 },
  },
  {
    id: 'top-3',
    name: 'Handwoven Striped Emerald Aso Oke Pants',
    description: 'Fine metallic weft threads woven on traditional Yoruba broadloom.',
    price: '72000',
    stockQuantity: 5,
    condition: 'new',
    productCategory: 'WEARS',
    mainImage: 'https://res.cloudinary.com/deda2pipj/image/upload/v1747294754/Landing_page_banner_4_mid_nzrgjc.png',
    imageList: [],
    isCustomizable: true,
    isRequestable: true,
    vendor: { id: 'v-3', businessName: 'Master Kwame Studios', rating: 5.0 },
  },
  {
    id: 'top-4',
    name: 'Classic African Silhouette Beachwear Shorts',
    description: 'Breathable lightweight weave featuring subtle geometric accents.',
    price: '18000',
    stockQuantity: 18,
    condition: 'new',
    productCategory: 'WEARS',
    mainImage: 'https://res.cloudinary.com/deda2pipj/image/upload/v1747294753/Landing_page_banner_5_mid_dtgxle.png',
    imageList: [],
    isCustomizable: false,
    isRequestable: false,
    vendor: { id: 'v-4', businessName: 'Ethnikraft Atelier', rating: 4.7 },
  },
];

const getHeritageName = (name: string): string => {
  const clean = (name || '').trim();
  const lower = clean.toLowerCase();

  // Occasion
  if (lower.includes('holiday') || lower.includes('travel')) return 'Holidays & Travel (Ije)';
  if (lower.includes('summer')) return 'Summer Vibes (Ìgbà Ẹ̀rùn)';
  if (lower.includes('harmattan')) return 'Harmattan (Hunturu)';
  if (lower.includes('wedding')) return 'Weddings (Igba Nkwu)';

  // Art You Can Wear / Style
  if (lower.includes('art-inspired') || lower.includes('art inspired')) return 'Art Inspired (Ọnà)';
  if (lower.includes('symbolic motif')) return 'Symbolic Motifs (Nsibidi)';
  if (lower.includes('beaded')) return 'Beaded Apparel (Ìlẹ̀kẹ̀)';
  if (lower.includes('paint-splatter') || lower.includes('paint splatter') || lower.includes('street')) return 'Streets (Hanya)';

  // Artisan Spotlight
  if (lower.includes('heritage master')) return 'Heritage Masters (Gwani)';
  if (lower.includes('women in craft')) return 'Women in Craft (Mata)';
  if (lower.includes('mixed media')) return 'Mixed Media (Nka)';
  if (lower.includes('featured creator')) return 'Featured Creators (Gbajúmọ̀)';

  // Kitchen & Dining
  if (lower.includes('storage')) return 'Storage (Àpò)';
  if (lower.includes('kitchen decor') || lower.includes('kitchen décor')) return 'Kitchen Décor (Gida)';
  if (lower.includes('cookware')) return 'Cookware (Kasko)';
  if (lower.includes('tableware') || lower.includes('table wear')) return 'Tableware (Farantai)';

  // Explore Popular
  if (lower.includes('royalty') || lower.includes('royal')) return 'Royalty (Ade)';
  if (lower.includes('business') || lower.includes('professional')) return 'Professional (Aiki)';
  if (lower.includes('party') || lower.includes('celebration')) return 'Party & Celebration (Arise)';
  if (lower.includes('lighting')) return 'Lighting (Fitila)';
  if (lower.includes('body jewelry')) return 'Body Jewelry (Afa)';

  // Shop deals in Fashion
  if (lower.includes('clearance')) return 'Clearance Sales (Arha)';
  if (lower.includes('couple')) return 'Couple Outfits (Ibaji)';
  if (lower.includes('new arrivals on sale') || lower.includes('new on sale')) return 'New on Sale (Àṣàyàn)';
  if (lower.includes('ready-to-wear') || lower.includes('ready to wear')) return 'Ready to Wear (Aṣọ)';

  // Casual Looks
  if (lower.includes('unisex')) return 'Unisex Comfort (Sajen)';
  if (lower.includes('boho') || lower.includes('easygoing')) return 'Easygoing (Raha)';
  if (lower.includes('denim')) return 'Denim Inspired (Akwara)';
  if (lower.includes('weekend vibe')) return 'Weekend Vibes (Futuha)';

  // Discover by Style
  if (lower.includes('playful') || lower.includes('youthful')) return 'Playful & Youthful (Saurayi)';
  if (lower.includes('chic') || lower.includes('sleek')) return 'Chic & Sleek (Kwalisa)';
  if (lower.includes('classic elegance')) return 'Classic Elegance (Ere)';
  if (lower.includes('minimalist')) return 'Minimalist Heritage (Kolo)';

  // For Weddings
  if (lower.includes('bridal')) return 'Bridal Accessories (Ọ̀ṣọ́)';
  if (lower.includes('aso-ebi') || lower.includes('aso ebi')) return 'Aso-Ebi Styles (Aṣọ Ẹbí)';
  if (lower.includes('groom')) return "Groom's Attire (Maji)";
  if (lower.includes("bride's trad") || lower.includes('bride trad') || lower.includes("bride's wear") || lower.includes('bride wear')) return "Bride's Wear (Amarya)";

  // What's Trending
  if (lower.includes('bestselling wear') || lower.includes('bestselling clothing')) return 'Bestselling Wears (Aṣọ)';
  if (lower.includes('weekend style') || lower.includes('weekend staple')) return 'Weekend Style (Hanya)';
  if (lower.includes('limited edition')) return 'Limited Edition (Kayataccen)';
  if (lower.includes('gift')) return 'Gifts (Tsaraba)';

  // Collector's Picks
  if (lower.includes('vintage accessory') || lower.includes('vintage accessories')) return 'Vintage Accessories (Àtijọ́)';
  if (lower.includes('high-end')) return 'High-End Fashion (Alahu)';
  if (lower.includes('antique') && lower.includes('timeless')) return 'Timeless Antiques (Àtijọ́)';
  if (lower.includes('exclusive artifact')) return 'Artifacts (Gado)';

  // Home Beautification
  if (lower.includes('wall art') || lower.includes('print')) return 'Wall Art (Ọnà)';
  if (lower.includes('furniture')) return 'Artisan Furniture (Shimfida)';
  if (lower.includes('vintage decorative')) return 'Vintage Decorative (Àtijọ́)';
  if (lower.includes('vase')) return 'Ornamental Vases (Tukunyar)';

  // One of a Kind
  if (lower.includes('rare vintage') || lower.includes('rare antique')) return 'Rare Antiques (Àtijọ́)';
  if (lower.includes('showpiece')) return 'Showpieces (Abun Kallo)';
  if (lower.includes('sculpture')) return 'Unique Sculptures (Nka)';
  if (lower.includes('artifact') || (lower.includes('local') && lower.includes('artifact'))) return 'Local Artifacts (Gado)';

  // New Arrivals
  if (lower.includes('slippers') || lower.includes("men's shoes")) return "Men's Shoes (Bàtà)";
  if (lower.includes('peaceful') || lower.includes('rooted')) return 'Peaceful & Rooted (Lafiya)';
  if (lower.includes('bold') && lower.includes('colorful')) return 'Bold & Colorful (Rini)';
  if (lower.includes('culture curator')) return 'Culture Curator (Gado)';
  if (lower.includes('loom')) return 'Hot off the Loom (Saka)';
  if (lower.includes('decoration')) return 'Decorations (Ọ̀ṣọ́)';

  return clean;
};

export default function UserHomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});
  const cartFabRef = useRef<CartFloatingButtonRef>(null);

  // ─── LIVE RTK QUERY HOOKS ──────────────────────────────────
  const {
    data: metadataData,
    isLoading: isMetadataLoading,
    refetch: refetchMetadata,
  } = useGetHomeFilterMetadataQuery();

  const {
    data: topPicksData,
    isLoading: isTopPicksLoading,
    refetch: refetchTopPicks,
  } = useGetTopPicksWeekQuery({ limit: 8 });

  const {
    data: paintingsData,
    isLoading: isPaintingsLoading,
    refetch: refetchPaintings,
  } = useGetAfricanPaintingsQuery({ limit: 8 });

  const {
    data: menswearData,
    isLoading: isMenswearLoading,
    refetch: refetchMenswear,
  } = useGetProductsQuery({ productCategory: 'WEARS', take: 8 });

  const {
    data: accessoriesData,
    isLoading: isAccessoriesLoading,
    refetch: refetchAccessories,
  } = useGetProductsQuery({ productCategory: 'ACCESSORIES', take: 8 });

  const {
    data: decorationsData,
    isLoading: isDecorationsLoading,
    refetch: refetchDecorations,
  } = useGetBestsellersDecorationsQuery({ limit: 8 });

  const {
    data: cultureProductsData,
    isLoading: isCultureProductsLoading,
    refetch: refetchCulture,
  } = useGetInspiredByCultureQuery({ limit: 8 });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refetchMetadata(),
        refetchTopPicks(),
        refetchPaintings(),
        refetchMenswear(),
        refetchAccessories(),
        refetchDecorations(),
        refetchCulture(),
      ]);
    } catch {
      // Ignore network errors on pull-to-refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [
    refetchMetadata,
    refetchTopPicks,
    refetchPaintings,
    refetchMenswear,
    refetchAccessories,
    refetchDecorations,
    refetchCulture,
  ]);

  // Derived Products with fallbacks
  const topPicks = useMemo(() => {
    if (topPicksData && topPicksData.length > 0) return topPicksData;
    return FALLBACK_TOP_PICKS;
  }, [topPicksData]);

  const africanPaintings = useMemo(() => {
    return paintingsData || [];
  }, [paintingsData]);

  const menswearProducts = useMemo(() => {
    return menswearData?.data?.products || [];
  }, [menswearData]);

  const accessoriesProducts = useMemo(() => {
    return accessoriesData?.data?.products || [];
  }, [accessoriesData]);

  const decorationsProducts = useMemo(() => {
    return decorationsData || [];
  }, [decorationsData]);

  const cultureProducts = useMemo(() => {
    return cultureProductsData || [];
  }, [cultureProductsData]);

  // Derived category groupings by ID matching web Home.tsx
  const categoriesList = useMemo(() => {
    return metadataData?.categories || [];
  }, [metadataData]);

  const getCategoryById = useCallback(
    (id: string) => categoriesList.find((c) => c.id === id),
    [categoriesList]
  );

  const discoverByOccasion = useMemo(() => getCategoryById('2'), [getCategoryById]);
  const artisanSpotlight = useMemo(() => getCategoryById('3'), [getCategoryById]);
  const kitchenDining = useMemo(() => getCategoryById('5'), [getCategoryById]);
  const explorePopular = useMemo(() => getCategoryById('7'), [getCategoryById]);
  const shopDealsFashion = useMemo(() => getCategoryById('8'), [getCategoryById]);
  const casualLooks = useMemo(() => getCategoryById('9'), [getCategoryById]);
  const discoverByStyle = useMemo(() => getCategoryById('10'), [getCategoryById]);
  const forWeddings = useMemo(() => getCategoryById('11'), [getCategoryById]);
  const trendingPopular = useMemo(() => getCategoryById('14'), [getCategoryById]);
  const collectorsPicks = useMemo(() => getCategoryById('15'), [getCategoryById]);
  const homeBeautification = useMemo(() => getCategoryById('16'), [getCategoryById]);
  const oneOfAKind = useMemo(() => getCategoryById('17'), [getCategoryById]);
  const newArrivalsCurated = useMemo(() => getCategoryById('18'), [getCategoryById]);

  // ─── SLIDE ANIMATION REFS ──────────────────────────────────
  const heritageScrollRef = useRef<ScrollView>(null);
  const heritageIndexRef = useRef(0);
  const heritageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heritageResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHeritageUserDragging = useRef(false);

  // Auto-slide for Hero Heritage Cards
  const startHeritageAutoSlide = useCallback(() => {
    if (heritageTimerRef.current) clearInterval(heritageTimerRef.current);
    heritageTimerRef.current = setInterval(() => {
      if (isHeritageUserDragging.current || !heritageScrollRef.current) return;
      const nextIndex = (heritageIndexRef.current + 1) % HERITAGE_CARDS.length;
      heritageIndexRef.current = nextIndex;
      heritageScrollRef.current.scrollTo({
        x: nextIndex * HERITAGE_SNAP_INTERVAL,
        animated: true,
      });
    }, 3800);
  }, []);

  const pauseHeritageAutoSlide = useCallback(() => {
    if (heritageTimerRef.current) {
      clearInterval(heritageTimerRef.current);
      heritageTimerRef.current = null;
    }
    if (heritageResumeTimerRef.current) {
      clearTimeout(heritageResumeTimerRef.current);
      heritageResumeTimerRef.current = null;
    }
  }, []);

  const resumeHeritageAutoSlideAfterDelay = useCallback(() => {
    pauseHeritageAutoSlide();
    heritageResumeTimerRef.current = setTimeout(() => {
      isHeritageUserDragging.current = false;
      startHeritageAutoSlide();
    }, 4500);
  }, [pauseHeritageAutoSlide, startHeritageAutoSlide]);

  useEffect(() => {
    startHeritageAutoSlide();
    return () => {
      if (heritageTimerRef.current) clearInterval(heritageTimerRef.current);
      if (heritageResumeTimerRef.current) clearTimeout(heritageResumeTimerRef.current);
    };
  }, [startHeritageAutoSlide]);

  const handleHeritageScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
      const maxScroll = contentSize.width - layoutMeasurement.width;
      if (maxScroll > 0) {
        setScrollProgress(Math.min(1, Math.max(0, contentOffset.x / maxScroll)));
      }
      heritageIndexRef.current = Math.round(contentOffset.x / HERITAGE_SNAP_INTERVAL);
    },
    []
  );

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ─── REUSABLE SECTION SUBCOMPONENTS ─────────────────────────

  /**
   * Horizontal Product Rail with live pricing, vendor name, ratings, and click navigation
   */
  const renderProductRail = (
    title: string,
    subtitle: string,
    items: Product[],
    viewAllAction?: () => void,
    isLoading?: boolean
  ) => {
    if (!isLoading && items.length === 0) return null;

    return (
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1, paddingRight: Spacing.sm }}>
            <Text style={styles.sectionEditorialTitle}>{title}</Text>
            <Text style={styles.sectionEditorialSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          {viewAllAction && (
            <TouchableOpacity onPress={viewAllAction} style={styles.curatedViewAll}>
              <Text style={styles.viewAllOrange}>See More</Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading && items.length === 0 ? (
          <ProductRailSkeleton count={4} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.railCardsScroll}
          >
            {items.map((prod) => {
              const isFav = !!favorites[prod.id];
              const brandName = prod.vendor?.businessName || prod.createdBy || 'Ethnikraft';
              const ratingScore = prod.rating || 4.8;
              const reviewsCount = prod.reviewCount || 12;

              return (
                <TouchableOpacity
                  key={prod.id}
                  style={[styles.railCard, Shadows.sm]}
                  activeOpacity={0.92}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: prod.id },
                    });
                  }}
                >
                  <View style={styles.railImageWrapper}>
                    <Image
                      source={{ uri: prod.mainImage }}
                      style={styles.railImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />

                    {/* Badge Pill */}
                    {(prod.isTrending || prod.isBestseller || prod.isNewArrival) && (
                      <View style={styles.badgePill}>
                        <Text style={styles.badgePillText}>
                          {prod.isTrending ? 'TRENDING' : prod.isBestseller ? 'BESTSELLER' : 'NEW'}
                        </Text>
                      </View>
                    )}

                    {/* Favorite Button */}
                    <TouchableOpacity
                      style={styles.railFavBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prod.id);
                      }}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={15}
                        color={isFav ? '#D96225' : '#221208'}
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.railDetails}>
                    <Text style={styles.railPrice}>
                      {formatPrice(prod.price, currencyCode, exchangeRate)}
                    </Text>
                    <Text style={styles.railTitle} numberOfLines={2}>
                      {prod.name}
                    </Text>

                    {/* Vendor Name */}
                    <View style={styles.railVendorRow}>
                      <Ionicons name="storefront-outline" size={11} color="#8C7765" />
                      <Text style={styles.railVendorText} numberOfLines={1}>
                        {brandName}
                      </Text>
                    </View>

                    {/* Ratings */}
                    <View style={styles.railRatingRow}>
                      <Ionicons name="star" size={11} color="#C46C27" />
                      <Text style={styles.railRatingScore}>{ratingScore}</Text>
                      <Text style={styles.railReviewsCount}>({reviewsCount})</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>
    );
  };

  /**
   * Horizontal Category Cards Grid with cultural naming and touch navigation
   */
  const renderCategoryGrid = (
    title: string,
    subtitle: string,
    categoryGroup: any,
    viewAllParam?: string,
    isLoading?: boolean
  ) => {
    const filters = categoryGroup?.filters;
    if (!isLoading && (!filters || filters.length === 0)) return null;

    return (
      <View style={styles.sectionBlock}>
        <View style={styles.sectionHeaderRow}>
          <View style={{ flex: 1, paddingRight: Spacing.sm }}>
            <Text style={styles.sectionEditorialTitle}>{title}</Text>
            <Text style={styles.sectionEditorialSubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              if (viewAllParam) {
                router.push({
                  pathname: '/(user)/explore',
                  params: { search: viewAllParam, title: title },
                });
              } else {
                router.push({
                  pathname: '/(user)/explore',
                  params: { title: title },
                });
              }
            }}
            style={styles.curatedViewAll}
          >
            <Text style={styles.viewAllOrange}>Explore All</Text>
          </TouchableOpacity>
        </View>

        {isLoading && (!filters || filters.length === 0) ? (
          <CategoryRailSkeleton count={4} />
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryCardsScroll}
          >
            {filters?.map((f: any) => {
              const culturalTitle = getHeritageName(f.name);
            return (
              <TouchableOpacity
                key={f.id}
                style={[styles.categoryCard, Shadows.sm]}
                activeOpacity={0.88}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({
                    pathname: '/(user)/explore',
                    params: { search: f.slug || f.name, title: culturalTitle },
                  });
                }}
              >
                <Image
                  source={{ uri: f.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.categoryCardBody}>
                  <Text style={styles.categoryCardTitle} numberOfLines={2}>
                    {culturalTitle}
                  </Text>
                  <Text style={styles.categoryCardAction}>Shop Collection →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        )}
      </View>
    );
  };

  return (
    <View style={styles.screenContainer}>
      {/* ── Fixed Global Background Texture Matching Web (globals.css: /revamp/new-background.webp) ── */}
      <Image
        source={require('../../../assets/revamp/new-background.webp')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />

      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#C46C27']}
            tintColor="#C46C27"
          />
        }
      >
        {/* ============================================================ */}
        {/* 1. HERO SECTION & HERITAGE CAROUSEL                          */}
        {/* ============================================================ */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../../assets/revamp/main-background.webp')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />

          {/* Web Parity Horizontal Vignette: Deep on left for typography, open on right for artwork */}
          <LinearGradient
            colors={[
              'rgba(11, 16, 11, 0.92)',
              'rgba(16, 22, 14, 0.74)',
              'rgba(33, 18, 11, 0.25)',
              'rgba(55, 24, 10, 0.15)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Web Parity Vertical Ambient Lighting: clear center preserves model and hero image */}
          <LinearGradient
            colors={[
              'rgba(0, 0, 0, 0.25)',
              'rgba(0, 0, 0, 0.05)',
              'rgba(26, 14, 8, 0.45)',
            ]}
            locations={[0, 0.45, 0.9]}
            style={StyleSheet.absoluteFill}
          />

          {/* Bottom Edge Fade: Softly dissolves hero base into parchment page background */}
          <LinearGradient
            colors={['transparent', 'rgba(250, 246, 240, 0.65)', '#FAF6F0']}
            locations={[0, 0.6, 1]}
            style={styles.heroBottomFade}
            pointerEvents="none"
          />

          {/* Web Parity Header with Insets */}
          <WebParityHeader />

          {/* Hero Body */}
          <View style={styles.heroBody}>
            <View style={styles.headlineContainer}>
              <Text style={styles.headlineLine}>Discover Africa.</Text>
              <Text style={styles.headlineLine}>Own a piece</Text>
              <Text style={styles.headlineLine}>
                of our <Text style={styles.headlineHighlight}>Heritage.</Text>
              </Text>
            </View>

            <Text style={styles.heroSubtitle}>
              Exclusive collections handcrafted by master artisans across Africa.
            </Text>

            <View style={styles.ctaRow}>
              <TouchableOpacity
                style={styles.primaryCtaBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(user)/explore');
                }}
                activeOpacity={0.88}
              >
                <Text style={styles.primaryCtaText}>Shop Collections</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryCtaBtn}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setIsStoryModalOpen(true);
                }}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryCtaText}>Watch Our Story</Text>
                <View style={styles.playIconBubble}>
                  <Ionicons name="play" size={12} color="#FFF5DE" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* SHOP BY HERITAGE CAROUSEL */}
          <View style={[styles.heritageSectionContainer, Shadows.md]}>
            <View style={styles.heritageSectionHeader}>
              <Text style={styles.heritageTitle}>
                - Shop by <Text style={styles.heritageTitleAccent}>Heritage</Text>
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(user)/explore',
                    params: { title: 'All Collections' },
                  })
                }
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Text style={styles.seeAllHeritageText}>Explore All →</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={heritageScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.heritageCardsScroll}
              onScroll={handleHeritageScroll}
              scrollEventThrottle={16}
              snapToInterval={HERITAGE_SNAP_INTERVAL}
              decelerationRate="fast"
              snapToAlignment="start"
              onScrollBeginDrag={() => {
                isHeritageUserDragging.current = true;
                pauseHeritageAutoSlide();
              }}
              onScrollEndDrag={resumeHeritageAutoSlideAfterDelay}
              onMomentumScrollEnd={resumeHeritageAutoSlideAfterDelay}
            >
              {HERITAGE_CARDS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.heritageCard, Shadows.sm]}
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push({
                      pathname: '/(user)/explore',
                      params: { category: item.category, title: item.title },
                    });
                  }}
                  activeOpacity={0.88}
                >
                  <Image
                    source={item.image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  <LinearGradient
                    colors={['rgba(0,0,0,0.68)', 'rgba(0,0,0,0.22)', 'rgba(0,0,0,0.72)']}
                    style={StyleSheet.absoluteFill}
                  />

                  <View style={styles.heritageCardContent}>
                    <Text style={styles.heritageCardTitle}>{item.title}</Text>
                    <Text style={styles.heritageCardCopy}>{item.copy}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.progressBarWrapper}>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarThumb,
                    { left: `${scrollProgress * 66.7}%` },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Role Switch Banner */}
        <View style={styles.roleBannerContainer}>
          <RoleSwitchBanner />
        </View>

        {/* ============================================================ */}
        {/* 2. TOP PICKS THIS WEEK — PRODUCT RAIL                        */}
        {/* ============================================================ */}
        {renderProductRail(
          'Top picks this week',
          'Handcrafted pieces trending across our artisan network',
          topPicks,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: { collection: 'top-picks-week', title: 'Top Picks of the Week' },
            }),
          isTopPicksLoading
        )}

        {/* ============================================================ */}
        {/* 3. DISCOVER BY OCCASION — CATEGORY GRID                      */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Discover by Occasion',
          'Find curated pieces perfect for celebrations, travel, and lifestyle',
          discoverByOccasion,
          'discover-by-occasion',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 4. ARTISAN SPOTLIGHT — CATEGORY GRID                         */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Artisan Spotlight',
          'Meet master weavers, sculptors, and certified heritage creators',
          artisanSpotlight,
          'artisan-spotlight',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 5. KITCHEN & DINING — CATEGORY GRID                          */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Kitchen & Dining',
          'Artisanal tableware, carved pottery, and indigenous storage',
          kitchenDining,
          'kitchen-dining',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 6. AFRICAN PAINTINGS & FINE ART — PRODUCT RAIL               */}
        {/* ============================================================ */}
        {renderProductRail(
          'African Paintings & Fine Art',
          'Original canvases and expressive works from master painters',
          africanPaintings,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: {
                collection: 'african-paintings',
                category: 'PAINTINGS',
                title: 'African Paintings & Fine Art',
              },
            }),
          isPaintingsLoading
        )}

        {/* ============================================================ */}
        {/* 7. POPULAR PICKS — CATEGORY GRID                             */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Popular Picks',
          'Ceremonial royal beads, lighting, and statement crafts',
          explorePopular,
          'popular-picks',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 8. SHOP DEALS IN FASHION — CATEGORY GRID                     */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Shop Deals in Fashion',
          'Curated clearance, couple outfits, and ready-to-wear pieces',
          shopDealsFashion,
          'deals',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 9. BEST SELLERS IN MENSWEAR — PRODUCT RAIL                   */}
        {/* ============================================================ */}
        {renderProductRail(
          'Best Sellers in Menswear',
          'Tailored traditional silhouettes, linen kaftans, and Aso Oke',
          menswearProducts,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: { category: 'WEARS', title: 'Menswear' },
            }),
          isMenswearLoading
        )}

        {/* ============================================================ */}
        {/* 10. BEST SELLERS IN ACCESSORIES — PRODUCT RAIL               */}
        {/* ============================================================ */}
        {renderProductRail(
          'Best Sellers in Accessories',
          'Hand-beaded crowns, brass cuff bracelets, and woven leather belts',
          accessoriesProducts,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: { category: 'ACCESSORIES', title: 'Accessories' },
            }),
          isAccessoriesLoading
        )}

        {/* ============================================================ */}
        {/* 11. WHAT'S TRENDING — CATEGORY GRID                          */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          "What's Trending",
          'Limited editions, weekend styles, and gifted artisan heirlooms',
          trendingPopular,
          'trending',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 12. EDITORIAL MID-PAGE BANNER 1                              */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={[styles.editorialBannerWrapper, Shadows.md]}
          activeOpacity={0.92}
          onPress={() => router.push('/(user)/explore')}
        >
          <Image
            source={{
              uri: 'https://res.cloudinary.com/deda2pipj/image/upload/v1747294754/Landing_page_banner_4_mid_nzrgjc.png',
            }}
            style={styles.editorialBannerImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>

        {/* ============================================================ */}
        {/* 13. CASUAL LOOKS — CATEGORY GRID                             */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Casual Looks',
          'Relaxed unisex comfort, lightweight boho, and denim-inspired apparel',
          casualLooks,
          'casual-looks',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 14. DISCOVER BY STYLE — CATEGORY GRID                        */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Discover by Style',
          'Youthful streetwear, sleek elegance, and minimalist heritage aesthetics',
          discoverByStyle,
          'style',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 15. FOR WEDDINGS — CATEGORY GRID                             */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'For Weddings & Ceremonies',
          "Aso-Ebi luxury textiles, bridal coral, and groom's majesty",
          forWeddings,
          'weddings',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 16. COLLECTOR'S PICKS — CATEGORY GRID                        */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          "Collector's Picks",
          'High-end couture, museum-grade vintage jewelry, and timeless relics',
          collectorsPicks,
          'collectors',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 17. HOME BEAUTIFICATION — CATEGORY GRID                      */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'Home Beautification',
          'Handmade woven furniture, ornamental pottery, and sculpted wall art',
          homeBeautification,
          'home-beautification',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 18. ONE-OF-A-KIND FINDS — CATEGORY GRID                      */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'One-of-a-Kind Finds',
          'Rare vintage bronzes, bespoke stone carvings, and heirloom masks',
          oneOfAKind,
          'one-of-a-kind',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 19. NEW ARRIVALS CURATED — CATEGORY GRID                     */}
        {/* ============================================================ */}
        {renderCategoryGrid(
          'New Arrivals',
          'Fresh off the artisan loom, vibrant leather footwear, and crafts',
          newArrivalsCurated,
          'new-arrivals',
          isMetadataLoading
        )}

        {/* ============================================================ */}
        {/* 20. BEST SELLERS IN DÉCOR — PRODUCT RAIL                     */}
        {/* ============================================================ */}
        {renderProductRail(
          'Best Sellers in Home & Décor',
          'Transform your living space with handcrafted African decor',
          decorationsProducts,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: {
                collection: 'bestsellers-decorations',
                category: 'CRAFTS',
                title: 'Home & Décor',
              },
            }),
          isDecorationsLoading
        )}

        {/* ============================================================ */}
        {/* 21. EDITORIAL MID-PAGE BANNER 2                              */}
        {/* ============================================================ */}
        <TouchableOpacity
          style={[styles.editorialBannerWrapper, Shadows.md]}
          activeOpacity={0.92}
          onPress={() => router.push('/(user)/explore')}
        >
          <Image
            source={{
              uri: 'https://res.cloudinary.com/deda2pipj/image/upload/v1747294753/Landing_page_banner_5_mid_dtgxle.png',
            }}
            style={styles.editorialBannerImage}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </TouchableOpacity>

        {/* ============================================================ */}
        {/* 22. INSPIRED BY CULTURE — PRODUCT RAIL                       */}
        {/* ============================================================ */}
        {renderProductRail(
          'Inspired by Culture',
          'Rooted in tradition, re-imagined for contemporary life',
          cultureProducts,
          () =>
            router.push({
              pathname: '/(user)/explore',
              params: {
                collection: 'inspired-by-culture',
                title: 'Inspired by Culture',
              },
            }),
          isCultureProductsLoading
        )}

        {/* Bottom Padding for Floating Actions */}
        <View style={{ height: Spacing.xxl * 2 }} />
      </ScrollView>

      {/* Outside Dismiss Backdrop for Expanded Cart FAB */}
      {isCartExpanded && (
        <TouchableOpacity
          style={styles.cartBackdropDismiss}
          activeOpacity={1}
          onPress={() => cartFabRef.current?.collapse()}
        />
      )}

      {/* Bag / Checkout FAB (draggable) */}
      <CartFloatingButton
        ref={cartFabRef}
        onExpandChange={setIsCartExpanded}
        onRequireAuth={() => setIsAuthModalOpen(true)}
      />

      {/* Brand Story Modal */}
      <BrandStoryModal
        visible={isStoryModalOpen}
        onClose={() => setIsStoryModalOpen(false)}
      />

      {/* Auth Prompt Modal */}
      <AuthPromptModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Root Screen Background: Exact warm African Artisan Parchment matching explore.tsx and web
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  mainScrollView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl,
    backgroundColor: 'transparent',
  },

  // ─── HERO SECTION ──────────────────────────────────────────
  heroWrapper: {
    position: 'relative',
    minHeight: 570,
    backgroundColor: '#1E1208',
    paddingBottom: Spacing.md,
  },
  heroBottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 75,
    zIndex: 2,
  },
  heroBody: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
  },
  headlineContainer: {
    marginBottom: Spacing.sm,
  },
  headlineLine: {
    fontSize: 34,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF8EA',
    letterSpacing: -0.5,
    lineHeight: 40,
  },
  headlineHighlight: {
    fontFamily: FontFamily.cormorantItalic,
    color: '#D96225',
  },
  heroSubtitle: {
    fontSize: 13,
    fontFamily: FontFamily.latoRegular,
    color: '#E8DAC8',
    lineHeight: 20,
    marginBottom: Spacing.lg,
    maxWidth: width * 0.85,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
    flexWrap: 'nowrap',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C46C27',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    gap: 6,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsBold,
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: Radius.full,
    gap: 6,
  },
  secondaryCtaText: {
    color: '#FFF5DE',
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  playIconBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // ─── SHOP BY HERITAGE CONTAINER ────────────────────────────
  heritageSectionContainer: {
    backgroundColor: 'rgba(75, 49, 31, 0.82)',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.14)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
    zIndex: 5,
  },
  heritageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  heritageTitle: {
    fontSize: 20,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF2DF',
    letterSpacing: -0.2,
  },
  heritageTitleAccent: {
    fontFamily: FontFamily.cormorantItalic,
    color: '#E06A2A',
  },
  seeAllHeritageText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#E8BA7A',
  },
  heritageCardsScroll: {
    paddingHorizontal: Spacing.md,
    gap: HERITAGE_GAP,
    paddingBottom: 4,
  },
  heritageCard: {
    width: HERITAGE_CARD_WIDTH,
    height: 135,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  heritageCardContent: {
    padding: Spacing.sm + 2,
    zIndex: 10,
  },
  heritageCardTitle: {
    fontSize: 15,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF8EA',
    marginBottom: 2,
  },
  heritageCardCopy: {
    fontSize: 11,
    fontFamily: FontFamily.latoRegular,
    color: '#E0D0BF',
    lineHeight: 15,
  },
  progressBarWrapper: {
    alignItems: 'center',
    marginTop: 10,
  },
  progressBarTrack: {
    width: 48,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    position: 'relative',
    overflow: 'hidden',
  },
  progressBarThumb: {
    position: 'absolute',
    top: 0,
    width: 16,
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#D96225',
  },

  // ─── ROLE BANNER ───────────────────────────────────────────
  roleBannerContainer: {
    marginTop: Spacing.xs,
  },

  // ─── COMMON SECTION BLOCK ──────────────────────────────────
  sectionBlock: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm + 2,
  },
  sectionEditorialTitle: {
    fontSize: 22,
    fontFamily: FontFamily.cormorantBold,
    color: Colors.primaryDark,
    letterSpacing: -0.3,
  },
  sectionEditorialSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: FontFamily.latoRegular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  curatedViewAll: {
    paddingTop: 3,
    paddingLeft: Spacing.xs,
  },
  viewAllOrange: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#C46C27',
  },
  sectionLoader: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },

  // ─── PRODUCT RAIL HORIZONTAL SCROLL ────────────────────────
  railCardsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  railCard: {
    width: PRODUCT_RAIL_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EDE5D8',
    overflow: 'hidden',
  },
  railImageWrapper: {
    height: 155,
    backgroundColor: '#F8F4EE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  railImage: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    position: 'absolute',
    top: 7,
    left: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgePillText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    letterSpacing: 0.4,
  },
  railFavBtn: {
    position: 'absolute',
    top: 7,
    right: 7,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  railDetails: {
    padding: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  railPrice: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    marginBottom: 2,
  },
  railTitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: FontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    lineHeight: 16,
    minHeight: 32,
  },
  railVendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  railVendorText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  railRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  railRatingScore: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  railReviewsCount: {
    fontSize: 9.5,
    fontFamily: FontFamily.latoRegular,
    color: Colors.textMuted,
  },

  // ─── CATEGORY GRID CARDS ───────────────────────────────────
  categoryCardsScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  categoryCard: {
    width: CATEGORY_CARD_WIDTH,
    height: 125,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#EDE5D8',
    backgroundColor: '#F8F4EE',
  },
  categoryCardBody: {
    padding: Spacing.sm + 2,
    zIndex: 10,
  },
  categoryCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF8EA',
    lineHeight: 16,
  },
  categoryCardAction: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsMedium,
    color: '#E8BA7A',
    marginTop: 3,
  },

  // ─── EDITORIAL BANNERS ─────────────────────────────────────
  editorialBannerWrapper: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 135,
    backgroundColor: '#F8F4EE',
    borderWidth: 1,
    borderColor: '#EDE5D8',
  },
  editorialBannerImage: {
    width: '100%',
    height: '100%',
  },

  cartBackdropDismiss: {
    ...StyleSheet.absoluteFill,
    zIndex: 115,
    backgroundColor: 'transparent',
  },
});

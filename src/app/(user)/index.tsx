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
import { ProductCard } from '@/components/products/ProductCard';
import { Colors, FontFamily, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppSelector } from '@/store';
import {
  useGetTopPicksWeekQuery,
  useGetAfricanPaintingsQuery,
  useGetBestsellersDecorationsQuery,
  useGetInspiredByCultureQuery,
  useGetArtisanSpotlightQuery,
  useGetHomeFilterMetadataQuery,
  Product,
} from '@/store/api/productApi';

const { width } = Dimensions.get('window');

const HERITAGE_CARD_WIDTH = 175;
const HERITAGE_GAP = 12;
const HERITAGE_SNAP_INTERVAL = HERITAGE_CARD_WIDTH + HERITAGE_GAP;

const CULTURE_CARD_WIDTH = 210;
const CULTURE_GAP = 12;
const CULTURE_SNAP_INTERVAL = CULTURE_CARD_WIDTH + CULTURE_GAP;

const ART_CARD_WIDTH = 220;
const ART_GAP = 14;

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
    imageList: ['https://res.cloudinary.com/dpr3pf3kw/image/upload/v1781278649/ethnikraft/products/toqsouycscgnkjl0sbsc.jpg'],
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

const CURATED_CULTURE_CARDS = [
  {
    id: 'c-1',
    title: 'Symbolic Motifs (Nsibidi)',
    subtitle: 'Sacred indigenous typography',
    image: require('../../../assets/revamp/symbolic-motiffs-card.webp'),
  },
  {
    id: 'c-2',
    title: 'Beaded Apparel (Ìlẹ̀kẹ̀)',
    subtitle: 'Royal ceremonial beadwork',
    image: require('../../../assets/revamp/beaded-apparel-card.webp'),
  },
  {
    id: 'c-3',
    title: 'Art Inspired (Ọnà)',
    subtitle: 'Contemporary African canvases',
    image: require('../../../assets/revamp/art-inspired-card.webp'),
  },
  {
    id: 'c-4',
    title: 'Rare Antiques (Àtijọ́)',
    subtitle: 'Centuries of preserved artifacts',
    image: require('../../../assets/revamp/rare-antiques-card.webp'),
  },
];

const OCCASION_FALLBACK = [
  {
    id: '2-1',
    name: 'Holidays & Travel (Ije)',
    image: 'https://res.cloudinary.com/deda2pipj/image/upload/v1766493582/Hotel_and_Travel_mn6szz.png',
    slug: 'holidays-travel',
  },
  {
    id: '2-2',
    name: 'Summer Vibes (Ìgbà Ẹ̀rùn)',
    image: 'https://res.cloudinary.com/deda2pipj/image/upload/v1766493775/Summer_vibes_e4mypj.png',
    slug: 'summer-vibes',
  },
  {
    id: '2-3',
    name: 'Harmattan (Hunturu)',
    image: 'https://res.cloudinary.com/deda2pipj/image/upload/v1766493579/Harmattan_essentials_onkfiy.png',
    slug: 'harmattan-essentials',
  },
  {
    id: '2-4',
    name: 'Weddings (Igba Nkwu)',
    image: 'https://res.cloudinary.com/deda2pipj/image/upload/v1766493789/Weddings_ihyegg.png',
    slug: 'weddings',
  },
];

export default function UserHomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [artFavorites, setArtFavorites] = useState<Record<string, boolean>>({});
  const cartFabRef = useRef<CartFloatingButtonRef>(null);

  // ─── LIVE RTK QUERY HOOKS ──────────────────────────────────
  const {
    data: topPicksData,
    isLoading: isTopPicksLoading,
    refetch: refetchTopPicks,
  } = useGetTopPicksWeekQuery({ limit: 6 });

  const {
    data: paintingsData,
    isLoading: isPaintingsLoading,
    refetch: refetchPaintings,
  } = useGetAfricanPaintingsQuery({ limit: 8 });

  const {
    data: decorationsData,
    isLoading: isDecorationsLoading,
    refetch: refetchDecorations,
  } = useGetBestsellersDecorationsQuery({ limit: 6 });

  const {
    data: cultureProductsData,
    isLoading: isCultureProductsLoading,
    refetch: refetchCulture,
  } = useGetInspiredByCultureQuery({ limit: 8 });

  const {
    data: metadataData,
    refetch: refetchMetadata,
  } = useGetHomeFilterMetadataQuery();

  const {
    data: spotlightData,
    refetch: refetchSpotlight,
  } = useGetArtisanSpotlightQuery('heritageMasters');

  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Promise.all([
        refetchTopPicks(),
        refetchPaintings(),
        refetchDecorations(),
        refetchCulture(),
        refetchMetadata(),
        refetchSpotlight(),
      ]);
    } catch {
      // Ignore network refresh errors
    } finally {
      setIsRefreshing(false);
    }
  }, [refetchTopPicks, refetchPaintings, refetchDecorations, refetchCulture, refetchMetadata, refetchSpotlight]);

  // Derived Products with graceful fallback
  const topPicksProducts = useMemo(() => {
    if (topPicksData && topPicksData.length > 0) {
      return topPicksData.slice(0, 6);
    }
    return FALLBACK_TOP_PICKS;
  }, [topPicksData]);

  const africanPaintings = useMemo(() => {
    return paintingsData || [];
  }, [paintingsData]);

  const decorationsProducts = useMemo(() => {
    return decorationsData || [];
  }, [decorationsData]);

  const cultureProducts = useMemo(() => {
    return cultureProductsData || [];
  }, [cultureProductsData]);

  // Dynamic occasion categories from metadata
  const occasionItems = useMemo(() => {
    const cat = metadataData?.categories?.find(
      (c) => c.slug === 'discover-by-occasion' || c.id === '2'
    );
    if (cat?.filters?.length) {
      return cat.filters.map((f) => {
        let culturalName = f.name;
        const lower = f.name.toLowerCase();
        if (lower.includes('holiday') || lower.includes('travel')) culturalName = 'Holidays & Travel (Ije)';
        else if (lower.includes('summer')) culturalName = 'Summer Vibes (Ìgbà Ẹ̀rùn)';
        else if (lower.includes('harmattan')) culturalName = 'Harmattan (Hunturu)';
        else if (lower.includes('wedding')) culturalName = 'Weddings (Igba Nkwu)';
        return {
          id: f.id,
          name: culturalName,
          image: f.image,
          slug: f.slug,
        };
      });
    }
    return OCCASION_FALLBACK;
  }, [metadataData]);

  // Featured artisan spotlight info
  const featuredArtisan = useMemo(() => {
    if (spotlightData && spotlightData.length > 0) {
      const p = spotlightData[0];
      return {
        name: p.vendor?.businessName || p.createdBy || 'Master Ejiro & The Abeokuta Weavers',
        tagline: 'Certified Provenance',
        bio: p.description
          ? p.description.replace(/<[^>]*>?/gm, '').slice(0, 140) + '...'
          : 'Carrying forward three generations of indigenous craftsmanship and traditional weaving techniques.',
      };
    }
    return {
      name: 'Master Ejiro & The Abeokuta Weavers',
      tagline: 'Certified Provenance',
      bio: 'Carrying forward three generations of indigo vat dyeing and handloom weaving. Each garment takes over 40 hours of focused craftsmanship.',
    };
  }, [spotlightData]);

  // ─── SLIDE ANIMATION REFS ──────────────────────────────────
  const heritageScrollRef = useRef<ScrollView>(null);
  const heritageIndexRef = useRef(0);
  const heritageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const heritageResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isHeritageUserDragging = useRef(false);

  const cultureScrollRef = useRef<ScrollView>(null);
  const cultureIndexRef = useRef(0);
  const cultureTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cultureResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isCultureUserDragging = useRef(false);

  // ─── 1. HERITAGE CAROUSEL SLIDE ANIMATION ──────────────────
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

  // ─── 2. ONE-OF-A-KIND FINDS SLIDE ANIMATION ────────────────
  const startCultureAutoSlide = useCallback(() => {
    if (cultureTimerRef.current) clearInterval(cultureTimerRef.current);
    cultureTimerRef.current = setInterval(() => {
      if (isCultureUserDragging.current || !cultureScrollRef.current) return;
      const nextIndex = (cultureIndexRef.current + 1) % CURATED_CULTURE_CARDS.length;
      cultureIndexRef.current = nextIndex;
      cultureScrollRef.current.scrollTo({
        x: nextIndex * CULTURE_SNAP_INTERVAL,
        animated: true,
      });
    }, 4200);
  }, []);

  const pauseCultureAutoSlide = useCallback(() => {
    if (cultureTimerRef.current) {
      clearInterval(cultureTimerRef.current);
      cultureTimerRef.current = null;
    }
    if (cultureResumeTimerRef.current) {
      clearTimeout(cultureResumeTimerRef.current);
      cultureResumeTimerRef.current = null;
    }
  }, []);

  const resumeCultureAutoSlideAfterDelay = useCallback(() => {
    pauseCultureAutoSlide();
    cultureResumeTimerRef.current = setTimeout(() => {
      isCultureUserDragging.current = false;
      startCultureAutoSlide();
    }, 4500);
  }, [pauseCultureAutoSlide, startCultureAutoSlide]);

  useEffect(() => {
    startCultureAutoSlide();
    return () => {
      if (cultureTimerRef.current) clearInterval(cultureTimerRef.current);
      if (cultureResumeTimerRef.current) clearTimeout(cultureResumeTimerRef.current);
    };
  }, [startCultureAutoSlide]);

  // ─── SCROLL HANDLERS ───────────────────────────────────────
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

  const handleCultureScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset } = e.nativeEvent;
      cultureIndexRef.current = Math.round(contentOffset.x / CULTURE_SNAP_INTERVAL);
    },
    []
  );

  const toggleArtFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setArtFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatPrice = (price: string | number | undefined): string => {
    if (price === undefined || price === null) return 'NGN 0.00';
    const num = typeof price === 'string' ? parseFloat(price) : price;
    return isNaN(num)
      ? 'NGN 0.00'
      : `NGN ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <View style={styles.screenContainer}>
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
        {/* 1. HERO SECTION — LUXURY ETHNIKRAFT EDITORIAL LANDING        */}
        {/* ============================================================ */}
        <View style={styles.heroWrapper}>
          <Image
            source={require('../../../assets/revamp/main-background.webp')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />

          <LinearGradient
            colors={[
              'rgba(11, 16, 11, 0.94)',
              'rgba(16, 22, 14, 0.82)',
              'rgba(33, 18, 11, 0.40)',
              'rgba(55, 24, 10, 0.28)',
            ]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.25)', 'rgba(38, 20, 9, 0.95)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Web Parity Header with Notification & Cart access */}
          <WebParityHeader />

          {/* Hero Content Area */}
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
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
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
                  <Ionicons name="play" size={13} color="#FFF5DE" style={{ marginLeft: 2 }} />
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ============================================================ */}
          {/* SHOP BY HERITAGE — INTERACTIVE CATEGORY CAROUSEL            */}
          {/* ============================================================ */}
          <View style={[styles.heritageSectionContainer, Shadows.md]}>
            <View style={styles.heritageSectionHeader}>
              <Text style={styles.heritageTitle}>
                - Shop by <Text style={styles.heritageTitleAccent}>Heritage</Text>
              </Text>
              <TouchableOpacity
                onPress={() => router.push('/(user)/explore')}
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
                      params: { category: item.category },
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
        {/* 2. TOP PICKS THIS WEEK — DYNAMIC LIVE PRODUCTS               */}
        {/* ============================================================ */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEditorialTitle}>Top picks this week</Text>
              <Text style={styles.sectionEditorialSubtitle}>
                Handcrafted pieces trending across our artisan network
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(user)/explore')}
              style={styles.curatedViewAll}
            >
              <Text style={styles.viewAllOrange}>See More</Text>
            </TouchableOpacity>
          </View>

          {isTopPicksLoading && !topPicksProducts.length ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator size="small" color="#C46C27" />
            </View>
          ) : (
            <View style={styles.productsGrid}>
              {topPicksProducts.map((prod) => (
                <ProductCard
                  key={prod.id}
                  product={prod}
                  onAddToCart={() => {
                    if (!isAuthenticated) setIsAuthModalOpen(true);
                  }}
                  onCustomize={() => {
                    router.push({
                      pathname: '/product/[id]',
                      params: { id: prod.id },
                    });
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* ============================================================ */}
        {/* 3. DISCOVER BY OCCASION — CEREMONY & LIFESTYLE SHOWCASE     */}
        {/* ============================================================ */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEditorialTitle}>Discover by Occasion</Text>
              <Text style={styles.sectionEditorialSubtitle}>
                Find curated pieces perfect for celebrations, travel, and lifestyle
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => router.push('/(user)/explore')}
              style={styles.curatedViewAll}
            >
              <Text style={styles.viewAllOrange}>View All</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.occasionScroll}
          >
            {occasionItems.map((occ) => (
              <TouchableOpacity
                key={occ.id}
                style={[styles.occasionCard, Shadows.sm]}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push({
                    pathname: '/(user)/explore',
                    params: { search: occ.slug },
                  });
                }}
                activeOpacity={0.88}
              >
                <Image
                  source={{ uri: occ.image }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.78)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.occasionCardBody}>
                  <Text style={styles.occasionCardTitle}>{occ.name}</Text>
                  <Text style={styles.occasionCardAction}>Explore Collection →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* 4. AFRICAN PAINTINGS & FINE ART GALLERY                      */}
        {/* ============================================================ */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEditorialTitle}>African Paintings & Fine Art</Text>
              <Text style={styles.sectionEditorialSubtitle}>
                Original canvases and expressive works from master painters
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(user)/explore',
                  params: { category: 'PAINTINGS' },
                });
              }}
              style={styles.curatedViewAll}
            >
              <Text style={styles.viewAllOrange}>View Gallery</Text>
            </TouchableOpacity>
          </View>

          {isPaintingsLoading && !africanPaintings.length ? (
            <View style={styles.sectionLoader}>
              <ActivityIndicator size="small" color="#C46C27" />
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.paintingsScroll}
            >
              {africanPaintings.map((art) => {
                const isFav = !!artFavorites[art.id];
                return (
                  <TouchableOpacity
                    key={art.id}
                    style={[styles.artCard, Shadows.sm]}
                    activeOpacity={0.92}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: art.id },
                      });
                    }}
                  >
                    <View style={styles.artImageWrapper}>
                      <Image
                        source={{ uri: art.mainImage }}
                        style={styles.artImage}
                        contentFit="cover"
                        cachePolicy="memory-disk"
                      />
                      <View style={styles.artBadgePill}>
                        <Text style={styles.artBadgeText}>FINE ART</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.artFavBtn}
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleArtFavorite(art.id);
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

                    <View style={styles.artDetails}>
                      <Text style={styles.artTitle} numberOfLines={2}>
                        {art.name}
                      </Text>
                      <Text style={styles.artArtist} numberOfLines={1}>
                        By {art.vendor?.businessName || art.createdBy || 'Authentic African Painter'}
                      </Text>
                      <View style={styles.artPriceRow}>
                        <Text style={styles.artPrice}>{formatPrice(art.price)}</Text>
                        <View style={styles.artViewTag}>
                          <Text style={styles.artViewTagText}>View Piece</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* ============================================================ */}
        {/* 5. MID-PAGE EDITORIAL BANNER 1                               */}
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
        {/* 6. ARTISAN GUILD SPOTLIGHT — EDITORIAL HERO CARD             */}
        {/* ============================================================ */}
        <View style={[styles.spotlightCard, Shadows.md]}>
          <View style={styles.spotlightTop}>
            <View style={styles.spotlightBadge}>
              <Text style={styles.spotlightBadgeText}>ARTISAN GUILD SPOTLIGHT</Text>
            </View>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={14} color="#E8BA7A" />
              <Text style={styles.verifiedText}>{featuredArtisan.tagline}</Text>
            </View>
          </View>

          <Text style={styles.spotlightHeading}>{featuredArtisan.name}</Text>
          <Text style={styles.spotlightDescription}>{featuredArtisan.bio}</Text>

          <TouchableOpacity
            style={styles.spotlightActionBtn}
            onPress={() => router.push('/(user)/studio')}
            activeOpacity={0.88}
          >
            <Text style={styles.spotlightActionText}>Commission Bespoke Piece</Text>
            <Ionicons name="sparkles" size={14} color="#FFF5DE" />
          </TouchableOpacity>
        </View>

        {/* ============================================================ */}
        {/* 7. ONE-OF-A-KIND FINDS — CURATED HORIZONTAL SLIDER           */}
        {/* ============================================================ */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEditorialTitle}>One-of-a-Kind Finds</Text>
              <Text style={styles.sectionEditorialSubtitle}>
                Rare artifacts, antique relics, and bespoke sculpture
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => {
                router.push({
                  pathname: '/(user)/explore',
                  params: { category: 'ANTIQUES' },
                });
              }}
              style={styles.curatedViewAll}
            >
              <Text style={styles.viewAllOrange}>See More</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            ref={cultureScrollRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.cultureCardsScroll}
            onScroll={handleCultureScroll}
            scrollEventThrottle={16}
            snapToInterval={CULTURE_SNAP_INTERVAL}
            decelerationRate="fast"
            snapToAlignment="start"
            onScrollBeginDrag={() => {
              isCultureUserDragging.current = true;
              pauseCultureAutoSlide();
            }}
            onScrollEndDrag={resumeCultureAutoSlideAfterDelay}
            onMomentumScrollEnd={resumeCultureAutoSlideAfterDelay}
          >
            {CURATED_CULTURE_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[styles.cultureCard, Shadows.sm]}
                onPress={() => {
                  router.push({
                    pathname: '/(user)/explore',
                    params: { category: 'ANTIQUES' },
                  });
                }}
                activeOpacity={0.88}
              >
                <Image
                  source={card.image}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0.2)', 'rgba(0,0,0,0.85)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cultureCardBody}>
                  <Text style={styles.cultureCardTitle}>{card.title}</Text>
                  <Text style={styles.cultureCardSub}>{card.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ============================================================ */}
        {/* 8. BESTSELLERS IN HOME & DÉCOR                               */}
        {/* ============================================================ */}
        {decorationsProducts.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEditorialTitle}>Bestsellers in Home & Décor</Text>
                <Text style={styles.sectionEditorialSubtitle}>
                  Transform your living space with handcrafted African decor
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  router.push({
                    pathname: '/(user)/explore',
                    params: { category: 'CRAFTS' },
                  });
                }}
                style={styles.curatedViewAll}
              >
                <Text style={styles.viewAllOrange}>Explore Décor</Text>
              </TouchableOpacity>
            </View>

            {isDecorationsLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color="#C46C27" />
              </View>
            ) : (
              <View style={styles.productsGrid}>
                {decorationsProducts.map((prod) => (
                  <ProductCard
                    key={prod.id}
                    product={prod}
                    onAddToCart={() => {
                      if (!isAuthenticated) setIsAuthModalOpen(true);
                    }}
                    onCustomize={() => {
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: prod.id },
                      });
                    }}
                  />
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============================================================ */}
        {/* 9. MID-PAGE EDITORIAL BANNER 2                               */}
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
        {/* 10. INSPIRED BY CULTURE — CULTURAL APPAREL & ACCESSORIES     */}
        {/* ============================================================ */}
        {cultureProducts.length > 0 && (
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <View>
                <Text style={styles.sectionEditorialTitle}>Inspired by Culture</Text>
                <Text style={styles.sectionEditorialSubtitle}>
                  Rooted in tradition, re-imagined for contemporary life
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push('/(user)/explore')}
                style={styles.curatedViewAll}
              >
                <Text style={styles.viewAllOrange}>See More</Text>
              </TouchableOpacity>
            </View>

            {isCultureProductsLoading ? (
              <View style={styles.sectionLoader}>
                <ActivityIndicator size="small" color="#C46C27" />
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.paintingsScroll}
              >
                {cultureProducts.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.cultureProductCard, Shadows.sm]}
                    activeOpacity={0.9}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({
                        pathname: '/product/[id]',
                        params: { id: item.id },
                      });
                    }}
                  >
                    <Image
                      source={{ uri: item.mainImage }}
                      style={styles.cultureProductImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(0,0,0,0.85)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.cultureProductContent}>
                      <Text style={styles.cultureProductTitle} numberOfLines={2}>
                        {item.name}
                      </Text>
                      <Text style={styles.cultureProductPrice}>
                        {formatPrice(item.price)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        )}

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xxl * 1.5 }} />
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContentContainer: {
    paddingBottom: Spacing.xxl,
  },

  // ─── HERO SECTION ──────────────────────────────────────────
  heroWrapper: {
    position: 'relative',
    minHeight: 580,
    backgroundColor: '#1E1208',
    paddingBottom: Spacing.md,
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
    gap: 10,
    marginBottom: Spacing.sm,
    flexWrap: 'wrap',
  },
  primaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C46C27',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 4,
    borderRadius: Radius.full,
    gap: 8,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 6,
  },
  primaryCtaText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontFamily: FontFamily.poppinsBold,
  },
  secondaryCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    gap: 8,
  },
  secondaryCtaText: {
    color: '#FFF5DE',
    fontSize: Typography.fontSize.xs,
    fontFamily: FontFamily.poppinsSemiBold,
  },
  playIconBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },

  // ─── SHOP BY HERITAGE CONTAINER ────────────────────────────
  heritageSectionContainer: {
    backgroundColor: '#3E2413',
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: Radius.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm + 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
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
    marginTop: Spacing.sm,
  },

  // ─── SECTION STYLES ────────────────────────────────────────
  sectionBlock: {
    marginTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
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
    maxWidth: width * 0.72,
  },
  curatedViewAll: {
    paddingBottom: 2,
  },
  viewAllOrange: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#C46C27',
  },
  sectionLoader: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
  },

  // ─── 2-COLUMN PRODUCTS GRID ────────────────────────────────
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // ─── OCCASION SCROLL CARDS ─────────────────────────────────
  occasionScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  occasionCard: {
    width: 170,
    height: 125,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#E8DAC8',
  },
  occasionCardBody: {
    padding: Spacing.sm + 2,
    zIndex: 10,
  },
  occasionCardTitle: {
    fontSize: 13,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF8EA',
  },
  occasionCardAction: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: '#E8BA7A',
    marginTop: 2,
  },

  // ─── AFRICAN PAINTINGS GALLERY ─────────────────────────────
  paintingsScroll: {
    gap: ART_GAP,
    paddingVertical: 4,
  },
  artCard: {
    width: ART_CARD_WIDTH,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EFE6D8',
    overflow: 'hidden',
  },
  artImageWrapper: {
    height: 165,
    backgroundColor: '#F5ECE1',
    position: 'relative',
  },
  artImage: {
    width: '100%',
    height: '100%',
  },
  artBadgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  artBadgeText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    letterSpacing: 0.5,
  },
  artFavBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  artDetails: {
    padding: Spacing.sm + 2,
  },
  artTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: FontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    lineHeight: 17,
    minHeight: 34,
  },
  artArtist: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsMedium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  artPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs + 2,
  },
  artPrice: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  artViewTag: {
    backgroundColor: '#FAF2E6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: '#E8DAC8',
  },
  artViewTagText: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#C46C27',
  },

  // ─── EDITORIAL BANNERS ─────────────────────────────────────
  editorialBannerWrapper: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    height: 140,
    backgroundColor: '#2A170A',
  },
  editorialBannerImage: {
    width: '100%',
    height: '100%',
  },

  // ─── SPOTLIGHT CARD ────────────────────────────────────────
  spotlightCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xl,
    backgroundColor: '#2A170A',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#4A2B15',
  },
  spotlightTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  spotlightBadge: {
    backgroundColor: '#C46C27',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  spotlightBadgeText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF',
    letterSpacing: 0.6,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#E8BA7A',
  },
  spotlightHeading: {
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF5DE',
    marginBottom: 4,
  },
  spotlightDescription: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FontFamily.latoRegular,
    color: '#D8C7B8',
    marginBottom: Spacing.md,
  },
  spotlightActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#3E2210',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#62381B',
    gap: 6,
  },
  spotlightActionText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
  },

  // ─── CULTURE CARDS ─────────────────────────────────────────
  cultureCardsScroll: {
    gap: CULTURE_GAP,
    paddingVertical: 4,
  },
  cultureCard: {
    width: CULTURE_CARD_WIDTH,
    height: 140,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#E8DAC8',
  },
  cultureCardBody: {
    padding: Spacing.md,
    zIndex: 10,
  },
  cultureCardTitle: {
    fontSize: 14,
    fontFamily: FontFamily.cormorantBold,
    color: '#FFF8EA',
  },
  cultureCardSub: {
    fontSize: 10,
    fontFamily: FontFamily.latoRegular,
    color: '#E0D0BF',
    marginTop: 2,
  },

  // ─── CULTURE PRODUCT CARDS ─────────────────────────────────
  cultureProductCard: {
    width: 175,
    height: 220,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'flex-end',
    borderWidth: 1,
    borderColor: '#EFE6D8',
  },
  cultureProductImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cultureProductContent: {
    padding: Spacing.sm + 2,
    zIndex: 10,
  },
  cultureProductTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#FFF8EA',
    lineHeight: 16,
  },
  cultureProductPrice: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
    marginTop: 2,
  },

  cartBackdropDismiss: {
    ...StyleSheet.absoluteFill,
    zIndex: 115,
    backgroundColor: 'transparent',
  },
});

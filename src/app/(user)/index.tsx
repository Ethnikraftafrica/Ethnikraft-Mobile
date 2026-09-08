import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { WebParityHeader } from '@/components/common/WebParityHeader';
import { BrandStoryModal } from '@/components/common/BrandStoryModal';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { CartFloatingButton } from '@/components/common/CartFloatingButton';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { Colors, FontFamily, Radius, Shadows, Spacing, Typography } from '@/constants/theme';
import { useAppSelector } from '@/store';

const { width } = Dimensions.get('window');

const HERITAGE_CARD_WIDTH = 175;
const HERITAGE_GAP = 12;
const HERITAGE_SNAP_INTERVAL = HERITAGE_CARD_WIDTH + HERITAGE_GAP;

const CULTURE_CARD_WIDTH = 210;
const CULTURE_GAP = 12;
const CULTURE_SNAP_INTERVAL = CULTURE_CARD_WIDTH + CULTURE_GAP;

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
    category: 'Wears',
  },
  {
    id: 'shoes',
    title: 'Shoes (Bàtà)',
    copy: 'Rooted steps, crafted sole',
    image: require('../../../assets/revamp/shoes-card.webp'),
    category: 'Shoes',
  },
  {
    id: 'bags',
    title: 'Bags (Akpa)',
    copy: 'Handcrafted for every journey',
    image: require('../../../assets/revamp/bags-card.webp'),
    category: 'Bags',
  },
  {
    id: 'accessories',
    title: 'Accessories (Ọ̀ṣọ́)',
    copy: 'Bold details. Rooted in culture',
    image: require('../../../assets/revamp/accessories-card.webp'),
    category: 'Accessories',
  },
  {
    id: 'crafts',
    title: 'Crafts (Nka)',
    copy: 'Made by hands that tell stories',
    image: require('../../../assets/revamp/crafts-card.webp'),
    category: 'Crafts',
  },
  {
    id: 'art',
    title: 'Art (Ọnà)',
    copy: 'African expression for every home',
    image: require('../../../assets/revamp/art-card.webp'),
    category: 'Paintings',
  },
  {
    id: 'antiques',
    title: 'Antiques (Àtijọ́)',
    copy: 'Timeless relics of our ancestors',
    image: require('../../../assets/revamp/antiques-card.webp'),
    category: 'Antiques',
  },
];

interface ProductItem {
  id: string;
  title: string;
  artisan: string;
  origin: string;
  price: string;
  rating: number;
  reviews: number;
  image: any;
  badge: string;
}

const TOP_PICKS_PRODUCTS: ProductItem[] = [
  {
    id: 'top-1',
    title: 'Patchwork Loose-Fit Denim Aso Oke Jorts',
    artisan: 'Faustaze Studio',
    origin: 'Lagos, Nigeria',
    price: 'NGN 54,000.00',
    rating: 4.9,
    reviews: 18,
    image: require('../../../assets/revamp/asoke-shorts-grid.webp'),
    badge: 'Popular',
  },
  {
    id: 'top-2',
    title: 'Indigo Royal Tapestry & Chain Shorts',
    artisan: 'Abeokuta Indigo Guild',
    origin: 'Ogun, Nigeria',
    price: 'NGN 18,000.00',
    rating: 4.8,
    reviews: 24,
    image: require('../../../assets/revamp/asoke-blue-shorts-model.webp'),
    badge: 'Bestseller',
  },
  {
    id: 'top-3',
    title: 'Handwoven Striped Emerald Aso Oke Pants',
    artisan: 'Master Kwame Studios',
    origin: 'Kumasi, Ghana',
    price: 'NGN 72,000.00',
    rating: 5.0,
    reviews: 31,
    image: require('../../../assets/revamp/asoke-pants.webp'),
    badge: 'Masterwork',
  },
  {
    id: 'top-4',
    title: 'Classic African Silhouette Beachwear Shorts',
    artisan: 'Ethnikraft Atelier',
    origin: 'Accra, Ghana',
    price: 'NGN 18,000.00',
    rating: 4.7,
    reviews: 12,
    image: require('../../../assets/revamp/asoke-model.webp'),
    badge: 'Trending',
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

export default function UserHomeScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({});

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

  const toggleFavorite = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFavorites((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleProtectedAction = (target: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isAuthenticated) {
      router.push(target as any);
    } else {
      setIsAuthModalOpen(true);
    }
  };

  return (
    <View style={styles.screenContainer}>
      <ScrollView
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================ */}
        {/* HERO SECTION — 1:1 REPLICATION OF WEB LUXURY LANDING        */}
        {/* ============================================================ */}
        <View style={styles.heroWrapper}>
          {/* High-Resolution Hero Background Image */}
          <Image
            source={require('../../../assets/revamp/main-background.webp')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={300}
          />

          {/* Layer 1: Horizontal Deep Forest & Coffee Atmospheric Gradient */}
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

          {/* Layer 2: Vertical Dark Fade towards Bottom for Seamless Flow */}
          <LinearGradient
            colors={['transparent', 'rgba(0, 0, 0, 0.25)', 'rgba(38, 20, 9, 0.95)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Top Parity Header (with Safe Area Inset) */}
          <WebParityHeader />

          {/* Hero Content Area */}
          <View style={styles.heroBody}>
            {/* Editorial Headline */}
            <View style={styles.headlineContainer}>
              <Text style={styles.headlineLine}>Discover Africa.</Text>
              <Text style={styles.headlineLine}>Own a piece</Text>
              <Text style={styles.headlineLine}>
                of our <Text style={styles.headlineHighlight}>Heritage.</Text>
              </Text>
            </View>

            {/* Subtitle */}
            <Text style={styles.heroSubtitle}>
              Exclusive collections handcrafted by master artisans across Africa.
            </Text>

            {/* CTA Buttons Row */}
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
          {/* SHOP BY HERITAGE SECTION — LUXURY EMBEDDED CAROUSEL         */}
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

            {/* Horizontal Heritage Cards Scroll with Smooth Slide Animations */}
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
                    router.push('/(user)/explore');
                  }}
                  activeOpacity={0.88}
                >
                  <Image
                    source={item.image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                  />
                  {/* Subtle Darkening Overlay */}
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

            {/* Sleek Progress Indicator Bar */}
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
        {/* TOP PICKS THIS WEEK — PRODUCT SHOWCASE                       */}
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

          <View style={styles.productsGrid}>
            {TOP_PICKS_PRODUCTS.map((prod) => {
              const isFav = !!favorites[prod.id];
              return (
                <View key={prod.id} style={[styles.productCard, Shadows.sm]}>
                  {/* Visual Image Container */}
                  <View style={styles.productImageWrapper}>
                    <Image
                      source={prod.image}
                      style={styles.productImage}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                    />

                    {/* Badge Pill */}
                    <View style={styles.badgePill}>
                      <Text style={styles.badgePillText}>{prod.badge}</Text>
                    </View>

                    {/* Favorite Heart Button */}
                    <TouchableOpacity
                      style={styles.favIconBtn}
                      onPress={() => toggleFavorite(prod.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isFav ? 'heart' : 'heart-outline'}
                        size={17}
                        color={isFav ? '#D96225' : '#221208'}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Product Details */}
                  <View style={styles.productDetails}>
                    <Text style={styles.productOriginTag}>{prod.origin}</Text>
                    <Text style={styles.productItemTitle} numberOfLines={2}>
                      {prod.title}
                    </Text>

                    {/* Artisan Signature */}
                    <View style={styles.artisanRow}>
                      <Ionicons name="storefront-outline" size={12} color="#C46C27" />
                      <Text style={styles.artisanNameText} numberOfLines={1}>
                        {prod.artisan}
                      </Text>
                    </View>

                    {/* Rating Stars */}
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={12} color="#E8BA7A" />
                      <Text style={styles.ratingScore}>{prod.rating}</Text>
                      <Text style={styles.reviewsCount}>({prod.reviews})</Text>
                    </View>

                    {/* Price and Add to Bag */}
                    <View style={styles.priceActionRow}>
                      <Text style={styles.priceValue}>{prod.price}</Text>
                      <TouchableOpacity
                        style={styles.addMiniBtn}
                        onPress={() => handleProtectedAction('/(user)/orders')}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="add" size={17} color="#FFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ============================================================ */}
        {/* ONE-OF-A-KIND FINDS — CURATED HORIZONTAL SLIDER             */}
        {/* ============================================================ */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionHeaderRow}>
            <View>
              <Text style={styles.sectionEditorialTitle}>One-of-a-Kind Finds</Text>
              <Text style={styles.sectionEditorialSubtitle}>
                Rare artifacts, antique relics, and bespoke sculpture
              </Text>
            </View>
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
                onPress={() => router.push('/(user)/explore')}
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
        {/* ARTISAN SPOTLIGHT — EDITORIAL HERO CARD                      */}
        {/* ============================================================ */}
        <View style={[styles.spotlightCard, Shadows.md]}>
          <View style={styles.spotlightTop}>
            <View style={styles.spotlightBadge}>
              <Text style={styles.spotlightBadgeText}>ARTISAN GUILD SPOTLIGHT</Text>
            </View>
            <View style={styles.verifiedRow}>
              <Ionicons name="shield-checkmark" size={14} color="#E8BA7A" />
              <Text style={styles.verifiedText}>Certified Provenance</Text>
            </View>
          </View>

          <Text style={styles.spotlightHeading}>Master Ejiro & The Abeokuta Weavers</Text>
          <Text style={styles.spotlightDescription}>
            Carrying forward three generations of indigo vat dyeing and handloom weaving.
            Each garment takes over 40 hours of focused craftsmanship.
          </Text>

          <TouchableOpacity
            style={styles.spotlightActionBtn}
            onPress={() => router.push('/(user)/studio')}
            activeOpacity={0.88}
          >
            <Text style={styles.spotlightActionText}>Commission Bespoke Piece</Text>
            <Ionicons name="sparkles" size={14} color="#FFF5DE" />
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: Spacing.xxl }} />
      </ScrollView>

      {/* ─── DRAGGABLE FLOATING ACTION BUTTONS (FABs) ────────────── */}
      {/* 1. Bag / Checkout FAB (draggable) */}
      <CartFloatingButton
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
    backgroundColor: '#FAF6F0', // African Warm Parchment
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
    color: '#D96225', // Terracotta Brand Accent
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
    backgroundColor: '#3E2413', // Rich dark chocolate container matching web
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

  // ─── TOP PICKS & CURATED SECTIONS ──────────────────────────
  sectionBlock: {
    marginTop: Spacing.lg,
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
    maxWidth: width * 0.7,
  },
  curatedViewAll: {
    paddingBottom: 2,
  },
  viewAllOrange: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsSemiBold,
    color: '#C46C27',
  },
  productsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  productCard: {
    width: (width - Spacing.md * 2 - Spacing.sm) / 2,
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EFE6D8',
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  productImageWrapper: {
    height: 160,
    backgroundColor: '#F7EFE4',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgePillText: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    textTransform: 'uppercase',
  },
  favIconBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productDetails: {
    padding: Spacing.sm + 2,
  },
  productOriginTag: {
    fontSize: 9,
    fontFamily: FontFamily.poppinsSemiBold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  productItemTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: FontFamily.poppinsSemiBold,
    color: Colors.textPrimary,
    lineHeight: 17,
    minHeight: 34,
  },
  artisanRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  artisanNameText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: Colors.textSecondary,
    flex: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 4,
  },
  ratingScore: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  reviewsCount: {
    fontSize: 10,
    fontFamily: FontFamily.latoRegular,
    color: Colors.textMuted,
  },
  priceActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs + 2,
  },
  priceValue: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsBold,
    color: Colors.primaryDark,
  },
  addMiniBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#C46C27',
    justifyContent: 'center',
    alignItems: 'center',
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
});

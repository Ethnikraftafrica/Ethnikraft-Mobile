import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Share,
  NativeSyntheticEvent,
  NativeScrollEvent,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useGetProductByIdQuery, Product } from '@/store/api/productApi';
import { MOCK_PRODUCTS } from '@/constants/mockProducts';
import { Colors, FontFamily, Radius, Shadows } from '@/constants/theme';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { useAppSelector } from '@/store';
import { ProductSizeChart, detectCategory } from '@/components/products/ProductSizeChart';
import { ProductSpecifications } from '@/components/products/ProductSpecifications';
import { ProductArtisanStory } from '@/components/products/ProductArtisanStory';
import { ProductShippingSpecs } from '@/components/products/ProductShippingSpecs';
import { ProductReviewsSection } from '@/components/products/ProductReviewsSection';
import { ProductAlsoViewed } from '@/components/products/ProductAlsoViewed';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE_HEIGHT = SCREEN_WIDTH * 1.12;

const COLOR_MAP: Record<string, string> = {
  black: '#141414',
  blue: '#002BFF',
  gold: '#E8BA7A',
  gray: '#808080',
  grey: '#808080',
  magenta: '#E6008B',
  maroon: '#6B0000',
  brown: '#5C381E',
  cyan: '#00E5FF',
  green: '#00873E',
  white: '#FFFFFF',
  red: '#D32F2F',
  yellow: '#FFB300',
  tan: '#D2B48C',
  natural: '#EED9C4',
  orange: '#FFA500',
  purple: '#800080',
  indigo: '#4B0082',
  beige: '#F5F5DC',
  terracotta: '#CC4E33',
};

type DetailTab = 'overview' | 'specs' | 'size_chart' | 'story' | 'shipping' | 'reviews';

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isNotified, setIsNotified] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch product from API with graceful fallback to mock data
  const { data: apiProduct, isLoading } = useGetProductByIdQuery(id || '', {
    skip: !id,
  });

  const fallbackProduct = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
  const resolvedProduct = (apiProduct as any)?.product || apiProduct;
  const product: Product = resolvedProduct || fallbackProduct;

  const images = product?.imageList?.length ? product.imageList : [product?.mainImage];
  const category = detectCategory(product);

  const defaultSizes =
    category === 'shoes'
      ? ['EU 40', 'EU 41', 'EU 42', 'EU 43', 'EU 44', 'EU 45']
      : ['S', 'M', 'L', 'XL', 'XXL', 'Bespoke Free Size'];

  const sizeOptions =
    product?.details?.sizeOptions?.length
      ? product.details.sizeOptions
      : product?.details?.size
      ? [product.details.size]
      : defaultSizes;

  const colorOptions =
    product?.details?.colorOptions?.length
      ? product.details.colorOptions
      : ['Indigo Blue', 'Imperial Gold', 'Terracotta', 'Ebony Black'];

  const numPrice = typeof product?.price === 'string' ? parseFloat(product.price) : product?.price || 0;
  const formattedPrice = `₦${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const maxQuantity = product.stockQuantity || 10;
  const isOutOfStock = !product.isRequestable && (product.stockQuantity === 0 || product.stockQuantity === undefined);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (slide !== activeImageIndex) {
      setActiveImageIndex(slide);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    try {
      await Share.share({
        message: `Discover "${product.name}" on Ethnikraft — handcrafted African heritage luxury: https://home.ethnikraft.africa/products/${product.id}`,
        title: product.name,
      });
    } catch {
      // User cancelled
    }
  };

  const handleWishlistToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWishlisted(!isWishlisted);
  };

  const handleQuantityChange = (delta: number) => {
    Haptics.selectionAsync();
    const newQty = quantity + delta;
    if (newQty >= 1 && newQty <= maxQuantity) {
      setQuantity(newQty);
    }
  };

  const handleAddToCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    setIsAddingToCart(true);
    setTimeout(() => {
      setIsAddingToCart(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push('/(user)/orders');
    }, 600);
  };

  const handleBuyNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }
    router.push('/(user)/orders');
  };

  const handleCustomizeRequest = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/(user)/studio');
  };

  const handleNotifyMe = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsNotified(true);
  };

  if (isLoading && !product) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#C46C27" />
        <Text style={styles.loadingText}>Unveiling master artisan piece...</Text>
      </View>
    );
  }

  const tabs: { key: DetailTab; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'overview', label: 'Overview', icon: 'eye-outline' },
    { key: 'specs', label: 'Specs', icon: 'list-outline' },
    { key: 'size_chart', label: 'Size Guide', icon: 'resize-outline' },
    { key: 'story', label: 'Artisan Story', icon: 'sparkles-outline' },
    { key: 'shipping', label: 'Dimensions', icon: 'cube-outline' },
    { key: 'reviews', label: 'Reviews', icon: 'star-outline' },
  ];

  return (
    <View style={[styles.screenContainer, { paddingBottom: insets.bottom }]}>
      {/* Top Floating Navigation Bar */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.topBarPillBtn}
        >
          <Ionicons name="arrow-back" size={16} color="#1C0D05" />
          <Text style={styles.topBarPillText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.categoryBadgeText}>
          {product.productCategory || 'ARTISANAL'}
        </Text>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleShare}
          style={styles.topBarCircleBtn}
        >
          <Ionicons name="share-social-outline" size={18} color="#1C0D05" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image Showcase Carousel */}
        <View style={styles.carouselContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {images.map((imgUri, index) => (
              <View key={index} style={styles.carouselSlide}>
                <Image
                  source={{ uri: imgUri }}
                  style={styles.heroImage}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              </View>
            ))}
          </ScrollView>

          {/* Availability Pill on image */}
          <View
            style={[
              styles.availabilityBadge,
              product.isRequestable
                ? styles.badgeReq
                : isOutOfStock
                ? styles.badgeSoldOut
                : styles.badgeStock,
            ]}
          >
            <View
              style={[
                styles.badgeDot,
                product.isRequestable
                  ? { backgroundColor: '#B9472B' }
                  : isOutOfStock
                  ? { backgroundColor: '#D84C23' }
                  : { backgroundColor: '#2E7D32' },
              ]}
            />
            <Text
              style={[
                styles.availabilityBadgeText,
                product.isRequestable
                  ? { color: '#B9472B' }
                  : isOutOfStock
                  ? { color: '#D84C23' }
                  : { color: '#2E7D32' },
              ]}
            >
              {product.isRequestable
                ? 'AVAILABLE ON REQUEST'
                : isOutOfStock
                ? 'OUT OF STOCK'
                : 'IN STOCK'}
            </Text>
          </View>

          {/* Floating Wishlist Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleWishlistToggle}
            style={styles.wishlistHeartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isWishlisted ? 'heart' : 'heart-outline'}
              size={20}
              color={isWishlisted ? '#C46C27' : '#1C0D05'}
            />
          </TouchableOpacity>

          {/* Carousel Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.dotsRow}>
              {images.map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.dot,
                    activeImageIndex === i && styles.dotActive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Product Details Card */}
        <View style={[styles.detailsCard, Shadows.md]}>
          {/* Vendor Breadcrumb */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              if (product.vendor?.id || product.vendorId) {
                router.push(`/(user)/vendor/${product.vendor?.id || product.vendorId}` as any);
              }
            }}
            style={styles.vendorRow}
          >
            <View style={styles.vendorAvatar}>
              {product.vendor?.businessLogo ? (
                <Image
                  source={{ uri: product.vendor.businessLogo }}
                  style={styles.vendorAvatarImg}
                  contentFit="cover"
                />
              ) : (
                <Text style={styles.vendorAvatarInitial}>
                  {(product.vendor?.businessName || 'E')[0]}
                </Text>
              )}
            </View>
            <Text style={styles.vendorTitleText} numberOfLines={1}>
              {(product.vendor?.businessName || 'ETHNIKRAFT GUILD').toUpperCase()} •{' '}
              {product.productCategory || 'ARTISANAL'}
            </Text>
          </TouchableOpacity>

          {/* Title and Price Row */}
          <View style={styles.titlePriceRow}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.priceValue}>{formattedPrice}</Text>
          </View>
          <Text style={styles.taxSubText}>
            Local taxes included (where applicable)
          </Text>

          {/* Category-Aware Size Selection Chips */}
          <View style={styles.sectionBlock}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.fieldLabel}>SELECT SIZE</Text>
              <TouchableOpacity
                onPress={() => {
                  Haptics.selectionAsync();
                  setActiveTab('size_chart');
                }}
              >
                <Text style={styles.sizeGuideLink}>Size Guide</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sizeChipsRow}>
              {sizeOptions.map((sz) => {
                const isSelected = selectedSize === sz;
                return (
                  <TouchableOpacity
                    key={sz}
                    activeOpacity={0.8}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedSize(sz);
                    }}
                    style={[
                      styles.sizeChip,
                      isSelected && styles.sizeChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sizeChipText,
                        isSelected && styles.sizeChipTextActive,
                      ]}
                    >
                      {sz}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Colour Swatches */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>
              COLOUR {selectedColor ? `— ${selectedColor}` : ''}
            </Text>
            <View style={styles.colorSwatchesRow}>
              {colorOptions.map((cName) => {
                const hex =
                  COLOR_MAP[cName.toLowerCase()] ||
                  COLOR_MAP[cName.toLowerCase().split(' ')[0]] ||
                  '#C46C27';
                const isSelected = selectedColor === cName;

                return (
                  <TouchableOpacity
                    key={cName}
                    activeOpacity={0.85}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedColor(cName);
                    }}
                    style={[
                      styles.colorDotWrapper,
                      isSelected && styles.colorDotWrapperActive,
                    ]}
                  >
                    <View
                      style={[
                        styles.colorDot,
                        { backgroundColor: hex },
                        hex === '#FFFFFF' && { borderWidth: 1, borderColor: '#D4C4B2' },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>

        {/* Interactive Segmented Tabs Navigation */}
        <View style={styles.tabsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsScrollContent}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  activeOpacity={0.8}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveTab(tab.key);
                  }}
                  style={[styles.tabBtn, isActive && styles.tabBtnActive]}
                >
                  <Ionicons
                    name={tab.icon}
                    size={14}
                    color={isActive ? '#FFFFFF' : '#6B5A50'}
                    style={{ marginRight: 5 }}
                  />
                  <Text style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}>
                    {tab.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Active Tab Content Area */}
          <View style={styles.tabContentContainer}>
            {activeTab === 'overview' && (
              <View>
                {/* Description Body */}
                <View style={styles.overviewCard}>
                  <Text style={styles.overviewSubHeader}>ARTISAN DESCRIPTION</Text>
                  <Text style={styles.descriptionBody}>
                    {product.description?.replace(/<\/?[^>]+(>|$)/g, '\n').trim() ||
                      'Exquisite handmade masterpiece crafted with century-old artisanal heritage techniques.'}
                  </Text>

                  {/* Trust guarantees */}
                  <View style={styles.trustRow}>
                    <View style={styles.trustPill}>
                      <Ionicons name="sparkles" size={12} color="#8C532B" />
                      <Text style={styles.trustText}>100% Handcrafted</Text>
                    </View>
                    <View style={styles.trustPill}>
                      <Ionicons name="shield-checkmark" size={12} color="#8C532B" />
                      <Text style={styles.trustText}>Verified Provenance</Text>
                    </View>
                    <View style={styles.trustPill}>
                      <Ionicons name="globe-outline" size={12} color="#8C532B" />
                      <Text style={styles.trustText}>Insured Global Shipping</Text>
                    </View>
                  </View>
                </View>

                {/* Quick specs preview */}
                <ProductSpecifications product={product} />
              </View>
            )}

            {activeTab === 'specs' && <ProductSpecifications product={product} />}

            {activeTab === 'size_chart' && <ProductSizeChart product={product} />}

            {activeTab === 'story' && <ProductArtisanStory product={product} />}

            {activeTab === 'shipping' && <ProductShippingSpecs product={product} />}

            {activeTab === 'reviews' && <ProductReviewsSection product={product} />}
          </View>
        </View>

        {/* Want Something Specific? Bespoke Commission Block */}
        {(product.isRequestable || product.isCustomizable) && (
          <View style={[styles.bespokeCard, Shadows.sm]}>
            <View style={styles.bespokeIconWrap}>
              <Ionicons name="cut-outline" size={22} color="#8C532B" />
            </View>
            <View style={styles.bespokeTextCol}>
              <Text style={styles.bespokeTitle}>Want something bespoke?</Text>
              <Text style={styles.bespokeSub}>
                Commission this master piece customized to your exact body measurements, fabric, or palette.
              </Text>
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handleCustomizeRequest}
                style={styles.bespokeActionBtn}
              >
                <Text style={styles.bespokeActionBtnText}>Launch Custom Request</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Customers Also Viewed Horizontal Carousel */}
        <ProductAlsoViewed
          currentProductId={product.id}
          category={product.productCategory}
        />
      </ScrollView>

      {/* Sticky Bottom Action Dock */}
      <View style={[styles.bottomDock, Shadows.lg, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        {product.isRequestable ? (
          <View style={styles.ctaRowRequestable}>
            <View style={styles.ctaPriceColumn}>
              <Text style={styles.ctaPriceLabel}>MADE TO ORDER</Text>
              <Text style={styles.ctaPriceValue}>{formattedPrice}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleCustomizeRequest}
              style={styles.customRequestBtn}
            >
              <Ionicons name="cut-outline" size={16} color="#FFFFFF" />
              <Text style={styles.customRequestBtnText}>Customize / Request</Text>
            </TouchableOpacity>
          </View>
        ) : isOutOfStock ? (
          <View style={styles.ctaRowSoldOut}>
            <View style={styles.ctaPriceColumn}>
              <Text style={[styles.ctaPriceLabel, { color: '#D84C23' }]}>SOLD OUT</Text>
              <Text style={styles.ctaPriceValue}>{formattedPrice}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleNotifyMe}
              disabled={isNotified}
              style={[styles.notifyBtn, isNotified && styles.notifyBtnDone]}
            >
              <Ionicons
                name={isNotified ? 'checkmark-circle' : 'notifications-outline'}
                size={16}
                color={isNotified ? '#2E7D32' : '#8C532B'}
              />
              <Text style={[styles.notifyBtnText, isNotified && { color: '#2E7D32' }]}>
                {isNotified ? 'Notification Set' : 'Notify Me When Available'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.ctaRowPurchasable}>
            {/* Quantity Controls */}
            <View style={styles.qtyStepper}>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                style={[styles.qtyBtn, quantity <= 1 && styles.qtyBtnDisabled]}
              >
                <Text style={styles.qtyBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={styles.qtyNumberText}>{quantity}</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
                style={[styles.qtyBtn, quantity >= maxQuantity && styles.qtyBtnDisabled]}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            {/* Add to Cart Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleAddToCart}
              disabled={isAddingToCart}
              style={styles.addToCartBtn}
            >
              {isAddingToCart ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.addToCartText}>Add to Cart</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Buy Now Button */}
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={handleBuyNow}
              style={styles.buyNowBtn}
            >
              <Ionicons name="card-outline" size={15} color="#8C532B" />
              <Text style={styles.buyNowText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Auth Modal */}
      <AuthPromptModal
        visible={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Artisan Guild Account Required"
        message="Please sign in or create an account to curate, customize, or purchase authentic pieces."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    marginTop: 12,
  },
  topBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  topBarPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EADBCC',
    ...Shadows.sm,
  },
  topBarPillText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#1C0D05',
  },
  categoryBadgeText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  topBarCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  scrollContent: {
    paddingBottom: 130,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: HERO_IMAGE_HEIGHT,
    backgroundColor: '#1C0D05',
    position: 'relative',
  },
  carouselSlide: {
    width: SCREEN_WIDTH,
    height: HERO_IMAGE_HEIGHT,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  availabilityBadge: {
    position: 'absolute',
    bottom: 24,
    left: 18,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    ...Shadows.sm,
  },
  badgeReq: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FADCD0',
  },
  badgeStock: {
    backgroundColor: '#EEF8F0',
    borderColor: '#D7EBD9',
  },
  badgeSoldOut: {
    backgroundColor: '#FFF1EF',
    borderColor: '#F3D3CE',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  availabilityBadgeText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 1,
  },
  wishlistHeartBtn: {
    position: 'absolute',
    bottom: 22,
    right: 18,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 8,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#C46C27',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -20,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  vendorAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    overflow: 'hidden',
  },
  vendorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  vendorAvatarInitial: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  vendorTitleText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1.5,
    flexShrink: 1,
  },
  titlePriceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    marginTop: 4,
  },
  productTitle: {
    flex: 1,
    fontSize: 20,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
    lineHeight: 26,
  },
  priceValue: {
    fontSize: 20,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
    textAlign: 'right',
  },
  taxSubText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
    marginTop: 2,
  },
  sectionBlock: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F2E8DC',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  sizeGuideLink: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    textDecorationLine: 'underline',
  },
  sizeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 4,
  },
  sizeChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  sizeChipActive: {
    backgroundColor: '#8C532B',
    borderColor: '#8C532B',
  },
  sizeChipText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#4A3B32',
  },
  sizeChipTextActive: {
    color: '#FFFFFF',
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
    alignItems: 'center',
  },
  colorDotWrapper: {
    padding: 3,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotWrapperActive: {
    borderColor: '#8C532B',
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  tabsSection: {
    marginTop: 14,
    paddingHorizontal: 14,
  },
  tabsScrollContent: {
    gap: 8,
    paddingVertical: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  tabBtnActive: {
    backgroundColor: '#8C532B',
    borderColor: '#8C532B',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyBold,
    color: '#6B5A50',
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },
  tabContentContainer: {
    marginTop: 4,
  },
  overviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginVertical: 10,
  },
  overviewSubHeader: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  descriptionBody: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#4A3B32',
    lineHeight: 20,
  },
  trustRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F2E8DC',
  },
  trustPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  trustText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  bespokeCard: {
    marginHorizontal: 14,
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  bespokeIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bespokeTextCol: {
    flex: 1,
  },
  bespokeTitle: {
    fontSize: 16,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
  },
  bespokeSub: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#6B5A50',
    lineHeight: 17,
    marginTop: 4,
  },
  bespokeActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#8C532B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginTop: 10,
  },
  bespokeActionBtnText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderTopWidth: 1,
    borderTopColor: '#EADBCC',
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  ctaRowPurchasable: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  qtyStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EADBCC',
    borderRadius: 14,
    backgroundColor: '#FAF6F0',
    height: 42,
    paddingHorizontal: 4,
  },
  qtyBtn: {
    width: 32,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtnDisabled: {
    opacity: 0.35,
  },
  qtyBtnText: {
    fontSize: 16,
    fontFamily: FontFamily.bodyBold,
    color: '#2A1810',
  },
  qtyNumberText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    color: '#2A1810',
    minWidth: 22,
    textAlign: 'center',
  },
  addToCartBtn: {
    flex: 1.2,
    height: 42,
    backgroundColor: '#8C532B',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...Shadows.sm,
  },
  addToCartText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },
  buyNowBtn: {
    flex: 1,
    height: 42,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8C532B',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  buyNowText: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  ctaRowRequestable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  ctaPriceColumn: {
    justifyContent: 'center',
  },
  ctaPriceLabel: {
    fontSize: 9.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1,
  },
  ctaPriceValue: {
    fontSize: 16,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
  },
  customRequestBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#8C532B',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Shadows.sm,
  },
  customRequestBtnText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    color: '#FFFFFF',
  },
  ctaRowSoldOut: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  notifyBtn: {
    flex: 1,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#8C532B',
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  notifyBtnDone: {
    backgroundColor: '#EEF8F0',
    borderColor: '#2E7D32',
  },
  notifyBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
});

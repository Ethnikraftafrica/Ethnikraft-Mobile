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
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';
import { AuthPromptModal } from '@/components/common/AuthPromptModal';
import { useAppSelector } from '@/store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HERO_IMAGE_HEIGHT = SCREEN_WIDTH * 1.15;

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
};

export default function ProductDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Fetch product from API with graceful fallback to mock data
  const { data: apiProduct, isLoading } = useGetProductByIdQuery(id || '', {
    skip: !id,
  });

  const fallbackProduct = MOCK_PRODUCTS.find((p) => p.id === id) || MOCK_PRODUCTS[0];
  const product: Product = apiProduct || fallbackProduct;

  const images = product?.imageList?.length ? product.imageList : [product?.mainImage];
  const colorOptions = product?.details?.colorOptions || ['Black', 'Blue', 'Gold', 'Brown', 'Green'];
  const sizeOptions = product?.details?.sizeOptions || ['Small', 'Medium', 'Large', 'Custom Free Size'];

  const numPrice = typeof product?.price === 'string' ? parseFloat(product.price) : product?.price || 0;
  const formattedPrice = `NGN ${numPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        message: `Discover "${product.name}" on Ethnikraft — handcrafted African heritage craft & luxury: https://home.ethnikraft.africa/products/${product.id}`,
      });
    } catch (error) {
      // Ignore dismiss
    }
  };

  const handleWishlistToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsWishlisted(!isWishlisted);
  };

  const handleAction = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    if (!isAuthenticated) {
      setIsAuthModalOpen(true);
      return;
    }

    if (product.isRequestable || product.isCustomizable) {
      // Navigate to bespoke custom request or confirmation
      router.push('/(user)/studio');
    } else {
      // Add to cart flow
      router.push('/(user)/orders');
    }
  };

  if (isLoading && !product) {
    return (
      <View style={[styles.loadingContainer, { paddingTop: insets.top }]}>
        <ActivityIndicator size="large" color="#C46C27" />
        <Text style={styles.loadingText}>Unveiling artisan craft...</Text>
      </View>
    );
  }

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
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={17} color="#1C0D05" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.categoryBadgeText}>
          {product.productCategory || 'WEARS'}
        </Text>
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

          {/* Availability Pill on top-left of image */}
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityBadgeText}>
              {product.isRequestable ? 'AVAILABLE ON REQUEST' : 'IN STOCK'}
            </Text>
          </View>

          {/* Floating Heart Button on top-right of image */}
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

        {/* Product Details Card (White Rounded Container matching screenshot) */}
        <View style={[styles.detailsCard, Shadows.md]}>
          {/* Vendor Breadcrumb */}
          <View style={styles.vendorRow}>
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
            <Text style={styles.vendorTitleText}>
              {(product.vendor?.businessName || 'FAUSTAZE').toUpperCase()} •{' '}
              {product.productCategory}
            </Text>
          </View>

          {/* Title and Price Row */}
          <View style={styles.titlePriceRow}>
            <Text style={styles.productTitle}>{product.name}</Text>
            <Text style={styles.priceValue}>{formattedPrice}</Text>
          </View>
          <Text style={styles.taxSubText}>
            Local taxes included (where applicable)
          </Text>

          {/* Size Selection */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>SELECT SIZE</Text>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                Haptics.selectionAsync();
                setIsSizeDropdownOpen(!isSizeDropdownOpen);
              }}
              style={styles.dropdownBtn}
            >
              <Text style={styles.dropdownValueText}>
                {selectedSize || 'Select a size'}
              </Text>
              <Ionicons
                name={isSizeDropdownOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                color="#5C4A3A"
              />
            </TouchableOpacity>

            {/* Expandable Size Chips */}
            {isSizeDropdownOpen && (
              <View style={styles.sizeOptionsWrap}>
                {sizeOptions.map((sz) => {
                  const isSelected = selectedSize === sz;
                  return (
                    <TouchableOpacity
                      key={sz}
                      activeOpacity={0.8}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSize(sz);
                        setIsSizeDropdownOpen(false);
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
              </View>
            )}
          </View>

          {/* Colour Swatches */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>COLOUR</Text>
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

          {/* Description & Story */}
          <View style={styles.sectionBlock}>
            <Text style={styles.fieldLabel}>DETAILS & SPECIFICATIONS</Text>
            <Text style={styles.descriptionBody}>
              {product.description?.replace(/<\/?[^>]+(>|$)/g, '\n').trim() ||
                'Exquisite handmade masterpiece crafted with century-old artisanal heritage techniques.'}
            </Text>
          </View>

          {/* Artisan Workshop Guarantee Card */}
          <View style={styles.workshopCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#C46C27" />
            <View style={styles.workshopCardTextCol}>
              <Text style={styles.workshopCardTitle}>Artisan Guild Verified</Text>
              <Text style={styles.workshopCardSub}>
                Guaranteed authentic mastercraft with direct ethical artisan royalty payments.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Dock */}
      <View style={[styles.bottomDock, Shadows.lg]}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={handleAction}
          style={styles.primaryActionBtn}
        >
          <Ionicons
            name={
              product.isRequestable || product.isCustomizable
                ? 'cut-outline'
                : 'cart-outline'
            }
            size={18}
            color="#FFF5DE"
          />
          <Text style={styles.primaryActionText}>
            {product.isRequestable || product.isCustomizable
              ? 'Customize / Request'
              : 'Add to cart'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={handleShare}
          style={styles.shareBtn}
        >
          <Ionicons name="share-social-outline" size={19} color="#1C0D05" />
        </TouchableOpacity>
      </View>

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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#FAF6F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsMedium,
    color: '#7A6250',
    marginTop: Spacing.sm,
  },
  topBar: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E8DAC8',
    gap: 4,
    ...Shadows.sm,
  },
  backButtonText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsMedium,
    color: '#1C0D05',
  },
  categoryBadgeText: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  carouselContainer: {
    width: SCREEN_WIDTH,
    height: HERO_IMAGE_HEIGHT,
    backgroundColor: '#EAE2D5',
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
    top: 75,
    left: Spacing.md,
    backgroundColor: 'rgba(28, 13, 5, 0.75)',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(232, 186, 122, 0.4)',
  },
  availabilityBadgeText: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF5DE',
    letterSpacing: 0.6,
  },
  wishlistHeartBtn: {
    position: 'absolute',
    top: 75,
    right: Spacing.md,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.sm,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#C46C27',
  },
  detailsCard: {
    marginTop: -22,
    marginHorizontal: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#ECE3D5',
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  vendorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1E1208',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  vendorAvatarImg: {
    width: '100%',
    height: '100%',
  },
  vendorAvatarInitial: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#E8BA7A',
  },
  vendorTitleText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsBold,
    color: '#8C7765',
    letterSpacing: 0.6,
  },
  titlePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
    lineHeight: 22,
  },
  priceValue: {
    fontSize: 16,
    fontFamily: FontFamily.poppinsBold,
    color: '#1C0D05',
  },
  taxSubText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8C7765',
    marginTop: 2,
    marginBottom: Spacing.md,
  },
  sectionBlock: {
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#F0E8DC',
    marginBottom: Spacing.xs,
  },
  fieldLabel: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#3E2210',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  dropdownBtn: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#E2D6C7',
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  dropdownValueText: {
    fontSize: 12.5,
    fontFamily: FontFamily.poppinsMedium,
    color: '#5C4A3A',
  },
  sizeOptionsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  sizeChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#D8C7B8',
    backgroundColor: '#FFFFFF',
  },
  sizeChipActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  sizeChipText: {
    fontSize: 11,
    fontFamily: FontFamily.poppinsMedium,
    color: '#5C4A3A',
  },
  sizeChipTextActive: {
    color: '#FFF',
  },
  colorSwatchesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingTop: 2,
  },
  colorDotWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorDotWrapperActive: {
    borderColor: '#C46C27',
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  descriptionBody: {
    fontSize: 12,
    lineHeight: 19,
    fontFamily: FontFamily.latoRegular,
    color: '#5C4A3A',
  },
  workshopCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8DEC7',
    gap: 12,
  },
  workshopCardTextCol: {
    flex: 1,
  },
  workshopCardTitle: {
    fontSize: 12,
    fontFamily: FontFamily.poppinsBold,
    color: '#1C0D05',
  },
  workshopCardSub: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsRegular,
    color: '#7A6250',
    marginTop: 1,
    lineHeight: 14,
  },
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FAF6F0',
    borderTopWidth: 1,
    borderTopColor: '#ECE3D5',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm + 2,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.full,
    gap: 8,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF5DE',
  },
  shareBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D4C4B2',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

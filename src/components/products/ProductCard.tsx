import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';
import { Product } from '@/store/api/productApi';
import { Colors, FontFamily, Radius, Shadows, Spacing } from '@/constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
export const PRODUCT_CARD_WIDTH = (SCREEN_WIDTH - Spacing.md * 2 - Spacing.sm) / 2;

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onCustomize?: (product: Product) => void;
  onToggleWishlist?: (product: Product, isWishlisted: boolean) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onAddToCart,
  onCustomize,
  onToggleWishlist,
}) => {
  const router = useRouter();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const heartScale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.965,
      friction: 8,
      tension: 100,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 80,
      useNativeDriver: true,
    }).start();
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  const handleWishlistToggle = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);

    Animated.sequence([
      Animated.spring(heartScale, {
        toValue: 1.35,
        friction: 3,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.spring(heartScale, {
        toValue: 1,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleWishlist?.(product, nextState);
  };

  const handleActionPress = (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (product.isRequestable || product.isCustomizable) {
      if (onCustomize) {
        onCustomize(product);
      } else {
        router.push({
          pathname: '/product/[id]',
          params: { id: product.id },
        });
      }
    } else {
      if (onAddToCart) {
        onAddToCart(product);
      } else {
        router.push({
          pathname: '/product/[id]',
          params: { id: product.id },
        });
      }
    }
  };

  // Format currency dynamically based on active Redux currency
  const formattedPrice = formatPrice(product.price, currencyCode, exchangeRate);

  const isOutOfStock = product.stockQuantity === 0 && !product.isRequestable;
  const brandName = product.vendor?.businessName || 'Ethnikraft';
  const rating = product.vendor?.rating || 0;

  return (
    <Animated.View
      style={[
        styles.cardContainer,
        Shadows.sm,
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handleCardPress}
        style={styles.innerTouchable}
      >
        {/* Product Image Container */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: product.mainImage }}
            style={styles.productImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
          />

          {/* Out of stock dark overlay */}
          {isOutOfStock && (
            <View style={styles.outOfStockOverlay}>
              <View style={styles.outOfStockBadge}>
                <Text style={styles.outOfStockText}>OUT OF STOCK</Text>
              </View>
            </View>
          )}

          {/* Floating Wishlist Heart */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleWishlistToggle}
            style={styles.wishlistBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <Ionicons
                name={isWishlisted ? 'heart' : 'heart-outline'}
                size={17}
                color={isWishlisted ? '#C46C27' : '#7A6250'}
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* Info Block */}
        <View style={styles.infoBlock}>
          {/* Brand & Badges Row */}
          <View style={styles.brandRow}>
            <Text style={styles.brandText} numberOfLines={1}>
              {brandName}
            </Text>
          </View>

          {/* Custom / Request Badges */}
          {product.isRequestable && (
            <View style={styles.badgeRow}>
              <View style={styles.customPill}>
                <Text style={styles.customPillText}>+ CUSTOM</Text>
              </View>
              <View style={styles.requestPill}>
                <Text style={styles.requestPillText}>REQUEST</Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Text style={styles.productTitle} numberOfLines={2}>
            {product.name}
          </Text>

          {/* Rating Stars */}
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.floor(rating) ? 'star' : 'star-outline'}
                size={11}
                color="#C46C27"
              />
            ))}
            <Text style={styles.ratingCount}>({rating > 0 ? rating.toFixed(1) : '0'})</Text>
          </View>

          {/* Price */}
          <Text style={styles.priceText} numberOfLines={1}>
            {formattedPrice}
          </Text>

          {/* Quick Action Button */}
          {isOutOfStock ? (
            <View style={styles.disabledActionBtn}>
              <Text style={styles.disabledActionText}>Out of stock</Text>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleActionPress}
              style={styles.actionBtn}
            >
              <Ionicons
                name={
                  product.isRequestable || product.isCustomizable
                    ? 'chatbox-ellipses-outline'
                    : 'cart-outline'
                }
                size={13}
                color="#FFF5DE"
              />
              <Text style={styles.actionBtnText} numberOfLines={1}>
                {product.isRequestable || product.isCustomizable
                  ? 'Customize & Add'
                  : 'Add to cart'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    width: PRODUCT_CARD_WIDTH,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE5D8',
    marginBottom: Spacing.md,
  },
  innerTouchable: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 185,
    backgroundColor: '#F8F4EE',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(25, 12, 4, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockBadge: {
    backgroundColor: '#1E1208',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E8BA7A',
  },
  outOfStockText: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF',
    letterSpacing: 0.6,
  },
  wishlistBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoBlock: {
    padding: Spacing.sm + 2,
    backgroundColor: '#FFFFFF',
  },
  brandRow: {
    marginBottom: 2,
  },
  brandText: {
    fontSize: 10,
    fontFamily: FontFamily.poppinsMedium,
    color: '#8C7765',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  customPill: {
    backgroundColor: '#F9EDE1',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
    borderWidth: 0.8,
    borderColor: '#E8BA7A',
  },
  customPillText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    letterSpacing: 0.2,
  },
  requestPill: {
    backgroundColor: '#EAE5DB',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 3,
  },
  requestPillText: {
    fontSize: 8.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#5C4A3A',
    letterSpacing: 0.2,
  },
  productTitle: {
    fontSize: 12.5,
    fontFamily: FontFamily.cormorantBold,
    color: '#1C0D05',
    lineHeight: 16,
    minHeight: 32,
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  ratingCount: {
    fontSize: 9.5,
    fontFamily: FontFamily.poppinsRegular,
    color: '#8C7765',
    marginLeft: 3,
  },
  priceText: {
    fontSize: 13,
    fontFamily: FontFamily.poppinsBold,
    color: '#C46C27',
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 7,
    borderRadius: Radius.full,
    gap: 4,
    shadowColor: '#C46C27',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsBold,
    color: '#FFF5DE',
  },
  disabledActionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBE5DC',
    paddingVertical: 7,
    borderRadius: Radius.full,
  },
  disabledActionText: {
    fontSize: 10.5,
    fontFamily: FontFamily.poppinsMedium,
    color: '#A09384',
  },
});

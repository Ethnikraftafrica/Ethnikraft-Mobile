import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius } from '@/constants/theme';
import { Product } from '@/store/api/productApi';

interface ProductSpecificationsProps {
  product: Partial<Product>;
}

export const ProductSpecifications: React.FC<ProductSpecificationsProps> = ({ product }) => {
  const router = useRouter();

  const getDepartment = () => {
    const category = product?.productCategory;
    if (!category) return 'Unisex Artisanal';

    const map: Record<string, string> = {
      ACCESSORIES: 'Accessories',
      CLOTHING: 'Clothing',
      HOME_DECOR: 'Home & Living',
      ART: 'Art & Collectibles',
      JEWELRY: 'Jewelry',
      SHOES: 'Shoes & Footwear',
      WEARS: 'Wears & Apparel',
      CRAFTS: 'Crafts & Handmade',
      ANTIQUES: 'Antiques & Collectibles',
      PAINTINGS: 'Paintings & Wall Art',
      PAINTING: 'Paintings & Wall Art',
      BAGS: 'Bags & Leather Goods',
    };

    return map[category] || category.replace(/_/g, ' ');
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Artisan Preserved';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Artisan Preserved';
    }
  };

  const vendorDisplayName =
    product.vendor?.businessName ||
    product.details?.vendorName ||
    'Faustaze Artisan Guild';

  const vendorLogo = product.vendor?.businessLogo;
  const rating = Number(product.rating || product.details?.averageRating || 4.9).toFixed(1);
  const reviewCount = product.reviewCount || product.details?.reviewCount || 12;
  const verifiedOrders = product.details?.sales || 38;

  // Build curated tags
  const buildTags = (): string[] => {
    const tags: string[] = [];
    if (product.isBestseller) tags.push('Bestseller');
    if (product.isTrending) tags.push('Trending');
    if (product.isNewArrival) tags.push('New Arrival');
    if (product.isOnDeals) tags.push('On Sale');
    if (product.isHeritagemaster) tags.push('Heritage Master');
    if (product.isWomenInCraft) tags.push('Women in Craft');
    if (product.isMixedMediaInnovator) tags.push('Mixed Media Innovator');
    if (product.isFeaturedCreator) tags.push('Featured Creator');

    if (Array.isArray(product.occasionTags)) {
      product.occasionTags.forEach((t) => tags.push(t.replace(/_/g, ' ')));
    }
    if (Array.isArray(product.artStyleTags)) {
      product.artStyleTags.forEach((t) => tags.push(t.replace(/_/g, ' ')));
    }

    if (tags.length === 0) {
      tags.push('Handwoven', 'Traditional Heritage', 'Authentic African Craft');
    }

    return Array.from(new Set(tags));
  };

  const curatedTags = buildTags();

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>SPECIFICATIONS</Text>
          <Text style={styles.title}>Product Details</Text>
        </View>

        {/* Availability Badge */}
        <View
          style={[
            styles.badge,
            product.isRequestable
              ? styles.badgeRequestable
              : product.stockQuantity && product.stockQuantity > 0
              ? styles.badgeInStock
              : styles.badgeOutOfStock,
          ]}
        >
          <View
            style={[
              styles.badgeDot,
              product.isRequestable
                ? { backgroundColor: '#B9472B' }
                : product.stockQuantity && product.stockQuantity > 0
                ? { backgroundColor: '#2E7D32' }
                : { backgroundColor: '#D84C23' },
            ]}
          />
          <Text
            style={[
              styles.badgeText,
              product.isRequestable
                ? { color: '#B9472B' }
                : product.stockQuantity && product.stockQuantity > 0
                ? { color: '#2E7D32' }
                : { color: '#D84C23' },
            ]}
          >
            {product.isRequestable
              ? 'AVAILABLE ON REQUEST'
              : product.stockQuantity && product.stockQuantity > 0
              ? 'IN STOCK'
              : 'OUT OF STOCK'}
          </Text>
        </View>
      </View>

      {/* Key-Value Specifications List */}
      <View style={styles.specsList}>
        <View style={styles.specRow}>
          <Text style={styles.specKey}>Department</Text>
          <Text style={styles.specVal}>{getDepartment()}</Text>
        </View>

        {product.dimensions && (
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Dimensions</Text>
            <Text style={styles.specVal}>{product.dimensions}</Text>
          </View>
        )}

        <View style={styles.specRow}>
          <Text style={styles.specKey}>Origin</Text>
          <Text style={styles.specVal}>
            {product.details?.origin || 'Nigeria (West Africa)'}
          </Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specKey}>Condition</Text>
          <Text style={[styles.specVal, { textTransform: 'capitalize' }]}>
            {product.condition || 'New (Handmade)'}
          </Text>
        </View>

        <View style={styles.specRow}>
          <Text style={styles.specKey}>Listed Date</Text>
          <Text style={styles.specVal}>{formatDate(product.createdAt)}</Text>
        </View>

        {!product.isRequestable && (
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Availability</Text>
            <Text
              style={[
                styles.specVal,
                { color: product.stockQuantity && product.stockQuantity > 0 ? '#2E7D32' : '#D84C23' },
              ]}
            >
              {product.stockQuantity && product.stockQuantity > 0
                ? `${product.stockQuantity} ${product.stockQuantity === 1 ? 'unit' : 'units'} available`
                : 'Sold out'}
            </Text>
          </View>
        )}

        {(product.isCustomizable || product.isRequestable) && (
          <View style={styles.specRow}>
            <Text style={styles.specKey}>Customization</Text>
            <Text style={[styles.specVal, { color: '#8C532B', fontFamily: FontFamily.bodyBold }]}>
              Available upon request
            </Text>
          </View>
        )}
      </View>

      {/* Ratings & Orders Strip */}
      <View style={styles.ratingsStrip}>
        <View style={styles.ratingLeft}>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(Number(rating)) ? 'star' : 'star-outline'}
                size={14}
                color="#C46C27"
              />
            ))}
          </View>
          <Text style={styles.ratingNumber}>{rating}</Text>
          <Text style={styles.reviewCountText}>({reviewCount} reviews)</Text>
        </View>

        <Text style={styles.ordersText}>
          <Text style={{ fontFamily: FontFamily.bodyBold, color: '#8C532B' }}>
            {verifiedOrders}
          </Text>{' '}
          verified orders
        </Text>
      </View>

      {/* Sold By Vendor Card */}
      <View style={styles.vendorCard}>
        <View style={styles.vendorInfo}>
          <Text style={styles.soldByLabel}>SOLD BY</Text>
          <View style={styles.vendorNameRow}>
            {vendorLogo ? (
              <Image
                source={{ uri: vendorLogo }}
                style={styles.vendorLogo}
                contentFit="cover"
              />
            ) : (
              <View style={styles.vendorLogoFallback}>
                <Text style={styles.vendorLogoLetter}>
                  {vendorDisplayName[0]?.toUpperCase() || 'E'}
                </Text>
              </View>
            )}
            <Text style={styles.vendorNameText} numberOfLines={1}>
              {vendorDisplayName}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => {
            Haptics.selectionAsync();
            if (product.vendor?.id || product.vendorId) {
              router.push(`/(user)/vendor/${product.vendor?.id || product.vendorId}` as any);
            }
          }}
          style={styles.visitStoreBtn}
        >
          <Text style={styles.visitStoreText}>Visit Store</Text>
          <Ionicons name="chevron-forward" size={14} color="#8C532B" />
        </TouchableOpacity>
      </View>

      {/* Curated Tags */}
      {curatedTags.length > 0 && (
        <View style={styles.tagsContainer}>
          <Text style={styles.tagsHeader}>CURATED TAGS</Text>
          <View style={styles.tagChipsWrap}>
            {curatedTags.map((tag) => (
              <View key={tag} style={styles.tagChip}>
                <Text style={styles.tagChipText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Trust Guarantees */}
      <View style={styles.guaranteeRow}>
        <View style={styles.guaranteeBadge}>
          <Ionicons name="hand-left-outline" size={12} color="#8C532B" />
          <Text style={styles.guaranteeText}>100% Handcrafted</Text>
        </View>
        <View style={styles.guaranteeBadge}>
          <Ionicons name="shield-checkmark-outline" size={12} color="#8C532B" />
          <Text style={styles.guaranteeText}>Verified Provenance</Text>
        </View>
        <View style={styles.guaranteeBadge}>
          <Ionicons name="airplane-outline" size={12} color="#8C532B" />
          <Text style={styles.guaranteeText}>Insured Delivery</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8DC',
  },
  subHeader: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 18,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeRequestable: {
    backgroundColor: '#FFF5F0',
    borderColor: '#FADCD0',
  },
  badgeInStock: {
    backgroundColor: '#EEF8F0',
    borderColor: '#D7EBD9',
  },
  badgeOutOfStock: {
    backgroundColor: '#FFF1EF',
    borderColor: '#F3D3CE',
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    letterSpacing: 0.8,
  },
  specsList: {
    paddingVertical: 6,
  },
  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#FAF4ED',
  },
  specKey: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#7A685D',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  specVal: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#2A1810',
  },
  ratingsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8DC',
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginRight: 6,
  },
  ratingNumber: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    color: '#2A1810',
    marginRight: 4,
  },
  reviewCountText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
  },
  ordersText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
  },
  vendorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F2E8DC',
  },
  vendorInfo: {
    flex: 1,
    marginRight: 10,
  },
  soldByLabel: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#7A685D',
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  vendorNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vendorLogo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginRight: 8,
  },
  vendorLogoFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  vendorLogoLetter: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  vendorNameText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    flexShrink: 1,
  },
  visitStoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  visitStoreText: {
    fontSize: 11,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  tagsContainer: {
    paddingTop: 12,
    paddingBottom: 6,
  },
  tagsHeader: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#7A685D',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagChip: {
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagChipText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  guaranteeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    paddingTop: 14,
  },
  guaranteeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FAF6F0',
    borderWidth: 1,
    borderColor: '#EADBCC',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  guaranteeText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
});

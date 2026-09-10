import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius, Shadows } from '@/constants/theme';
import { Product, useGetProductsQuery } from '@/store/api/productApi';
import { MOCK_PRODUCTS } from '@/constants/mockProducts';
import { useAppSelector } from '@/store';
import { formatPrice } from '@/utils/price';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = Math.min(SCREEN_WIDTH * 0.46, 190);

interface ProductAlsoViewedProps {
  currentProductId?: string;
  category?: string;
}

export const ProductAlsoViewed: React.FC<ProductAlsoViewedProps> = ({
  currentProductId,
  category,
}) => {
  const router = useRouter();
  const { code: currencyCode, rate: exchangeRate } = useAppSelector((state) => state.currency);

  // Fetch related products by category
  const { data: apiResponse } = useGetProductsQuery(
    {
      take: 8,
      productCategory: category && category !== 'ALL' ? category : undefined,
    },
    { skip: !category }
  );

  const apiProducts = apiResponse?.data?.products || [];
  const candidateProducts = apiProducts.length > 0 ? apiProducts : MOCK_PRODUCTS;

  // Filter out the currently viewed product
  const related = candidateProducts.filter((p) => p.id !== currentProductId).slice(0, 6);

  if (related.length === 0) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>CURATED RECOMMENDATIONS</Text>
          <Text style={styles.title}>Customers Also Viewed</Text>
        </View>
        <Ionicons name="sparkles" size={18} color="#C46C27" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {related.map((item) => {
          const formattedPrice = formatPrice(item.price, currencyCode, exchangeRate);
          const rating = Number(item.rating || item.details?.averageRating || 4.9).toFixed(1);

          return (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.88}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/product/${item.id}` as any);
              }}
              style={[styles.card, Shadows.sm]}
            >
              <View style={styles.imageWrap}>
                <Image
                  source={{ uri: item.mainImage }}
                  style={styles.cardImg}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
                {item.isRequestable && (
                  <View style={styles.requestablePill}>
                    <Text style={styles.requestablePillText}>BESPOKE</Text>
                  </View>
                )}
              </View>

              <View style={styles.cardContent}>
                <Text style={styles.vendorText} numberOfLines={1}>
                  {item.vendor?.businessName || 'ETHNIKRAFT MASTER'}
                </Text>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.name}
                </Text>

                <View style={styles.ratingRow}>
                  <View style={styles.starsRow}>
                    {[...Array(5)].map((_, i) => (
                      <Ionicons
                        key={i}
                        name={i < Math.floor(Number(rating)) ? 'star' : 'star-outline'}
                        size={10}
                        color="#C46C27"
                      />
                    ))}
                  </View>
                  <Text style={styles.ratingText}>({rating})</Text>
                </View>

                <Text style={styles.priceText}>{formattedPrice}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    paddingVertical: 18,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginVertical: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    marginBottom: 14,
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
  scrollList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: CARD_WIDTH,
    backgroundColor: '#FAF6F0',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  imageWrap: {
    width: '100%',
    height: CARD_WIDTH * 1.05,
    backgroundColor: '#EADBCC',
    position: 'relative',
  },
  cardImg: {
    width: '100%',
    height: '100%',
  },
  requestablePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(28, 13, 5, 0.85)',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  requestablePillText: {
    fontSize: 8,
    fontFamily: FontFamily.bodyBold,
    color: '#FAF6F0',
    letterSpacing: 0.8,
  },
  cardContent: {
    padding: 10,
  },
  vendorText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#2A1810',
    lineHeight: 16,
    minHeight: 32,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 4,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingText: {
    fontSize: 9.5,
    fontFamily: FontFamily.bodyBold,
    color: '#7A685D',
  },
  priceText: {
    fontSize: 13,
    fontFamily: FontFamily.displayBold,
    color: '#8C532B',
    marginTop: 2,
  },
});

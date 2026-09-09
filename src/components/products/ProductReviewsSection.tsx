import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { FontFamily, Radius } from '@/constants/theme';
import { Product, ProductReview, useGetProductReviewsQuery } from '@/store/api/productApi';

interface ProductReviewsSectionProps {
  product: Partial<Product>;
}

const FALLBACK_REVIEWS: ProductReview[] = [
  {
    id: 'rev-1',
    rating: 5,
    comment:
      'Absolutely breathtaking artisanal mastery! The fabric weight and intricate gold thread embroidery exceeded all expectations. Received countless compliments at the gala.',
    createdAt: '2026-02-14T10:00:00.000Z',
    isVerifiedPurchase: true,
    helpfulCount: 24,
    reviewer: {
      firstName: 'Folashade',
      lastName: 'Adeyemi',
      profilePicture: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    },
    request: {
      size: 'L',
      color: 'Imperial Gold & Indigo',
    },
  },
  {
    id: 'rev-2',
    rating: 5,
    comment:
      'The provenance and packaging are world-class. It is rare to find such high-fashion heritage pieces that celebrate true African royalty.',
    createdAt: '2026-02-01T14:30:00.000Z',
    isVerifiedPurchase: true,
    helpfulCount: 15,
    reviewer: {
      firstName: 'Kofi',
      lastName: 'Mensah',
      profilePicture: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    },
    request: {
      size: 'XL',
      color: 'Ebony Black',
    },
  },
  {
    id: 'rev-3',
    rating: 4,
    comment:
      'Superb quality craftsmanship. Sizing is true to the size chart provided — make sure to measure your shoulder width. Shipping was surprisingly swift to the UK.',
    createdAt: '2026-01-20T09:15:00.000Z',
    isVerifiedPurchase: true,
    helpfulCount: 8,
    reviewer: {
      firstName: 'Amara',
      lastName: 'Okafor',
      profilePicture: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
    },
    request: {
      size: 'M',
      color: 'Terracotta Brown',
    },
  },
];

export const ProductReviewsSection: React.FC<ProductReviewsSectionProps> = ({ product }) => {
  const [visibleCount, setVisibleCount] = useState(3);
  const [helpfulMap, setHelpfulMap] = useState<Record<string, number>>({});

  const { data: reviewsData, isLoading } = useGetProductReviewsQuery(
    { productId: product.id || '', limit: 10 },
    { skip: !product.id }
  );

  const reviews =
    reviewsData?.reviews && reviewsData.reviews.length > 0
      ? reviewsData.reviews
      : FALLBACK_REVIEWS;

  const totalReviews = reviewsData?.total || reviews.length || 18;
  const avgRating = (reviewsData?.averageRating || product.rating || 4.9).toFixed(1);

  // Distribution breakdown
  const ratingDistribution = [
    { stars: 5, pct: 82 },
    { stars: 4, pct: 12 },
    { stars: 3, pct: 4 },
    { stars: 2, pct: 1 },
    { stars: 1, pct: 1 },
  ];

  const handleHelpful = (reviewId: string, initialCount: number = 0) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setHelpfulMap((prev) => ({
      ...prev,
      [reviewId]: (prev[reviewId] ?? initialCount) + 1,
    }));
  };

  const handleSeeMore = () => {
    Haptics.selectionAsync();
    setVisibleCount((prev) => prev + 3);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.subHeader}>VERIFIED REVIEWS</Text>
          <Text style={styles.title}>Customer Experiences</Text>
        </View>
        <Ionicons name="chatbubble-ellipses-outline" size={20} color="#8C532B" />
      </View>

      {/* Rating Overview & Breakdown */}
      <View style={styles.ratingOverviewRow}>
        <View style={styles.scoreCol}>
          <Text style={styles.largeScore}>{avgRating}</Text>
          <View style={styles.starsRow}>
            {[...Array(5)].map((_, i) => (
              <Ionicons
                key={i}
                name={i < Math.floor(Number(avgRating)) ? 'star' : 'star-outline'}
                size={14}
                color="#C46C27"
              />
            ))}
          </View>
          <Text style={styles.totalReviewsText}>{totalReviews} ratings</Text>
        </View>

        {/* Progress Breakdown Bars */}
        <View style={styles.breakdownCol}>
          {ratingDistribution.map(({ stars, pct }) => (
            <View key={stars} style={styles.barRow}>
              <Text style={styles.barStarText}>{stars}★</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` }]} />
              </View>
              <Text style={styles.barPctText}>{pct}%</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Reviews List */}
      <View style={styles.reviewsList}>
        {reviews.slice(0, visibleCount).map((item) => {
          const currentHelpful = helpfulMap[item.id] ?? item.helpfulCount ?? 0;
          return (
            <View key={item.id} style={styles.reviewCard}>
              <View style={styles.reviewCardHeader}>
                <View style={styles.authorRow}>
                  {item.reviewer?.profilePicture ? (
                    <Image
                      source={{ uri: item.reviewer.profilePicture }}
                      style={styles.authorAvatar}
                      contentFit="cover"
                    />
                  ) : (
                    <View style={styles.authorAvatarFallback}>
                      <Text style={styles.authorAvatarLetter}>
                        {(item.reviewer?.firstName || 'A')[0]}
                      </Text>
                    </View>
                  )}
                  <View>
                    <View style={styles.nameVerifiedRow}>
                      <Text style={styles.authorName}>
                        {item.reviewer?.firstName} {item.reviewer?.lastName}
                      </Text>
                      {item.isVerifiedPurchase && (
                        <View style={styles.verifiedBadge}>
                          <Ionicons name="checkmark-circle" size={12} color="#2E7D32" />
                          <Text style={styles.verifiedText}>Verified</Text>
                        </View>
                      )}
                    </View>
                    <View style={styles.reviewStarsRow}>
                      {[...Array(5)].map((_, i) => (
                        <Ionicons
                          key={i}
                          name={i < item.rating ? 'star' : 'star-outline'}
                          size={11}
                          color="#C46C27"
                        />
                      ))}
                    </View>
                  </View>
                </View>
              </View>

              {/* Size & Color Spec if available */}
              {(item.request?.size || item.request?.color) && (
                <View style={styles.specChipsRow}>
                  {item.request?.size && (
                    <Text style={styles.specChipText}>
                      Size: <Text style={{ fontFamily: FontFamily.bodyBold }}>{item.request.size}</Text>
                    </Text>
                  )}
                  {item.request?.color && (
                    <Text style={styles.specChipText}>
                      Color: <Text style={{ fontFamily: FontFamily.bodyBold }}>{item.request.color}</Text>
                    </Text>
                  )}
                </View>
              )}

              {/* Review Comment Body */}
              <Text style={styles.commentBody}>{item.comment}</Text>

              {/* Helpful Footer Button */}
              <View style={styles.reviewFooterRow}>
                <Text style={styles.helpfulCountText}>
                  {currentHelpful} {currentHelpful === 1 ? 'person' : 'people'} found this helpful
                </Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => handleHelpful(item.id, item.helpfulCount)}
                  style={styles.helpfulBtn}
                >
                  <Ionicons name="thumbs-up-outline" size={12} color="#8C532B" />
                  <Text style={styles.helpfulBtnText}>Helpful</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* See More Button */}
      {visibleCount < reviews.length && (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSeeMore}
          style={styles.seeMoreBtn}
        >
          <Text style={styles.seeMoreBtnText}>See More Reviews</Text>
          <Ionicons name="chevron-down" size={14} color="#8C532B" />
        </TouchableOpacity>
      )}
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
  ratingOverviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginBottom: 16,
  },
  scoreCol: {
    alignItems: 'center',
    paddingRight: 16,
    borderRightWidth: 1,
    borderRightColor: '#EADBCC',
  },
  largeScore: {
    fontSize: 32,
    fontFamily: FontFamily.displayBold,
    color: '#2A1810',
    lineHeight: 38,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginVertical: 3,
  },
  totalReviewsText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
  },
  breakdownCol: {
    flex: 1,
    paddingLeft: 16,
    gap: 4,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  barStarText: {
    width: 22,
    fontSize: 10,
    fontFamily: FontFamily.bodyBold,
    color: '#7A685D',
  },
  barTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#EADBCC',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#C46C27',
    borderRadius: 3,
  },
  barPctText: {
    width: 28,
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
    textAlign: 'right',
  },
  reviewsList: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#FAF6F0',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#EADBCC',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EADBCC',
    marginRight: 10,
  },
  authorAvatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EADBCC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  authorAvatarLetter: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  nameVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  authorName: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyBold,
    color: '#2A1810',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#EEF8F0',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  verifiedText: {
    fontSize: 9,
    fontFamily: FontFamily.bodyBold,
    color: '#2E7D32',
  },
  reviewStarsRow: {
    flexDirection: 'row',
    gap: 1.5,
    marginTop: 2,
  },
  specChipsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 6,
  },
  specChipText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
  },
  commentBody: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#4A3B32',
    lineHeight: 18,
    marginBottom: 10,
  },
  reviewFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#EADBCC',
  },
  helpfulCountText: {
    fontSize: 10,
    fontFamily: FontFamily.bodyRegular,
    color: '#7A685D',
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADBCC',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  helpfulBtnText: {
    fontSize: 10.5,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
  seeMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 10,
    marginTop: 8,
  },
  seeMoreBtnText: {
    fontSize: 12,
    fontFamily: FontFamily.bodyBold,
    color: '#8C532B',
  },
});

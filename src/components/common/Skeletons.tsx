import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Shimmer } from './Shimmer';
import { Colors, Radius, Spacing, Shadows } from '@/constants/theme';
import { PRODUCT_CARD_WIDTH } from '@/components/products/ProductCard';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PRODUCT_RAIL_CARD_WIDTH = 168;

/**
 * 1. ProductCardSkeleton - Matches the 2-column grid product card layout
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <View style={[styles.cardSkeleton, Shadows.sm, { width: PRODUCT_CARD_WIDTH }]}>
      {/* Image box placeholder */}
      <Shimmer
        style={styles.cardImagePlaceholder}
        borderRadius={Radius.md}
      />

      {/* Content lines */}
      <View style={styles.cardBody}>
        {/* Vendor tag placeholder */}
        <Shimmer width={70} height={10} borderRadius={4} style={{ marginBottom: 8 }} />
        {/* Title placeholder */}
        <Shimmer width="90%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
        <Shimmer width="60%" height={14} borderRadius={4} style={{ marginBottom: 10 }} />
        {/* Price placeholder */}
        <Shimmer width={80} height={16} borderRadius={4} style={{ marginBottom: 12 }} />
        {/* Button placeholder */}
        <Shimmer width="100%" height={32} borderRadius={Radius.sm} />
      </View>
    </View>
  );
};

/**
 * 2. ProductRailCardSkeleton - Matches the horizontal home product rail card
 */
export const ProductRailCardSkeleton: React.FC = () => {
  return (
    <View style={[styles.railCardSkeleton, Shadows.sm]}>
      {/* Image box */}
      <Shimmer
        style={styles.railImagePlaceholder}
        borderRadius={Radius.md}
      />

      {/* Rail card details */}
      <View style={styles.railDetails}>
        <Shimmer width={75} height={15} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="92%" height={13} borderRadius={4} style={{ marginBottom: 4 }} />
        <Shimmer width="65%" height={13} borderRadius={4} style={{ marginBottom: 8 }} />
        <View style={styles.vendorRow}>
          <Shimmer width={14} height={14} borderRadius={7} style={{ marginRight: 6 }} />
          <Shimmer width={80} height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
};

/**
 * 3. ProductRailSkeleton - Renders horizontal scrolling rail of skeletons
 */
export const ProductRailSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.railScrollContainer}
    >
      {items.map((key) => (
        <ProductRailCardSkeleton key={key} />
      ))}
    </ScrollView>
  );
};

/**
 * 4. CategoryRailSkeleton - Horizontal cards for curated category lists
 */
export const CategoryRailSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryScrollContainer}
    >
      {items.map((key) => (
        <View key={key} style={[styles.categoryCardSkeleton, Shadows.sm]}>
          <Shimmer style={StyleSheet.absoluteFill} borderRadius={Radius.md} />
          <View style={styles.categoryCardBottom}>
            <Shimmer width={100} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
            <Shimmer width={70} height={10} borderRadius={4} />
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

/**
 * 5. ProductGridSkeleton - 2-column grid placeholder for explore page
 */
export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={styles.gridContainer}>
      {items.map((key) => (
        <ProductCardSkeleton key={key} />
      ))}
    </View>
  );
};

/**
 * 6. ProductDetailSkeleton - Full page skeleton for product detail loading
 */
export const ProductDetailSkeleton: React.FC = () => {
  return (
    <View style={styles.detailContainer}>
      {/* Hero Image placeholder */}
      <View style={styles.detailHeroWrapper}>
        <Shimmer
          width={SCREEN_WIDTH - 32}
          height={Math.round((SCREEN_WIDTH - 32) * 1.05)}
          borderRadius={Radius.lg}
        />
      </View>

      {/* Info Block */}
      <View style={styles.detailContent}>
        <View style={styles.detailHeaderRow}>
          <View style={{ flex: 1 }}>
            <Shimmer width={100} height={14} borderRadius={4} style={{ marginBottom: 8 }} />
            <Shimmer width="85%" height={22} borderRadius={4} style={{ marginBottom: 6 }} />
            <Shimmer width="60%" height={22} borderRadius={4} style={{ marginBottom: 12 }} />
          </View>
        </View>

        {/* Price & Stock */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Shimmer width={120} height={26} borderRadius={4} style={{ marginRight: 12 }} />
          <Shimmer width={80} height={20} borderRadius={Radius.full} />
        </View>

        {/* Options (Color / Size) */}
        <Shimmer width={60} height={12} borderRadius={4} style={{ marginBottom: 10 }} />
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          <Shimmer width={40} height={40} borderRadius={20} />
          <Shimmer width={40} height={40} borderRadius={20} />
          <Shimmer width={40} height={40} borderRadius={20} />
          <Shimmer width={40} height={40} borderRadius={20} />
        </View>

        {/* Tabs Bar */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <Shimmer width={80} height={32} borderRadius={Radius.sm} />
          <Shimmer width={80} height={32} borderRadius={Radius.sm} />
          <Shimmer width={80} height={32} borderRadius={Radius.sm} />
        </View>

        {/* Description Body */}
        <Shimmer width="100%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="95%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="75%" height={14} borderRadius={4} style={{ marginBottom: 24 }} />

        {/* Action Button */}
        <Shimmer width="100%" height={48} borderRadius={Radius.md} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardSkeleton: {
    backgroundColor: '#FDFBF7',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EAE0D3',
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  cardImagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
  },
  cardBody: {
    padding: Spacing.sm,
  },
  railCardSkeleton: {
    width: PRODUCT_RAIL_CARD_WIDTH,
    backgroundColor: '#FDFBF7',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#EAE0D3',
    overflow: 'hidden',
    marginRight: 12,
  },
  railImagePlaceholder: {
    width: '100%',
    height: 180,
  },
  railDetails: {
    padding: 10,
  },
  vendorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  railScrollContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  categoryScrollContainer: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  categoryCardSkeleton: {
    width: 165,
    height: 180,
    backgroundColor: '#FDFBF7',
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginRight: 12,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  categoryCardBottom: {
    padding: 12,
    zIndex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  detailContainer: {
    paddingTop: Spacing.sm,
  },
  detailHeroWrapper: {
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  detailContent: {
    paddingHorizontal: Spacing.md,
  },
  detailHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
});

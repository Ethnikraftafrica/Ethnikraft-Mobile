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

/**
 * 7. VendorKpiCardSkeleton - 2x2 grid card skeleton matching exact 183x130 Figma specs
 */
export const VendorKpiCardSkeleton: React.FC = () => {
  const cardWidth = (SCREEN_WIDTH - Spacing.md * 2 - 10) / 2;
  return (
    <View style={[styles.vendorKpiSkeletonCard, { width: cardWidth }]}>
      <Shimmer width={72} height={20} borderRadius={4} />
      <View style={{ marginVertical: 8 }}>
        <Shimmer width="80%" height={24} borderRadius={4} />
      </View>
      <Shimmer width="60%" height={12} borderRadius={4} />
    </View>
  );
};

/**
 * 8. VendorKpiGridSkeleton - 4 cards placeholder matching the dashboard 2x2 grid
 */
export const VendorKpiGridSkeleton: React.FC = () => {
  return (
    <View style={styles.vendorKpiSkeletonGrid}>
      <VendorKpiCardSkeleton />
      <VendorKpiCardSkeleton />
      <VendorKpiCardSkeleton />
      <VendorKpiCardSkeleton />
    </View>
  );
};

/**
 * 9. VendorOrdersSkeleton - Skeleton for 170px Studio Orders container card
 */
export const VendorOrdersSkeleton: React.FC = () => {
  return (
    <View style={styles.vendorOrdersSkeletonContainer}>
      <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#EAE0D3' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Shimmer width={70} height={14} borderRadius={4} />
          <Shimmer width={64} height={14} borderRadius={4} />
        </View>
        <Shimmer width="75%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="45%" height={11} borderRadius={4} />
      </View>
      <View style={{ paddingVertical: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
          <Shimmer width={70} height={14} borderRadius={4} />
          <Shimmer width={64} height={14} borderRadius={4} />
        </View>
        <Shimmer width="65%" height={14} borderRadius={4} style={{ marginBottom: 6 }} />
        <Shimmer width="40%" height={11} borderRadius={4} />
      </View>
    </View>
  );
};
/**
 * 9b. VendorOrderCardsSkeleton - Skeleton for full Orders screen feed
 */
export const VendorOrderCardsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorOrderCardSkeleton}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
            <View>
              <Shimmer width={100} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <Shimmer width={120} height={12} borderRadius={4} />
            </View>
            <Shimmer width={84} height={24} borderRadius={Radius.full} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <Shimmer width={64} height={64} borderRadius={Radius.md} />
            <View style={{ flex: 1, justifyContent: 'space-around' }}>
              <Shimmer width="80%" height={15} borderRadius={4} />
              <Shimmer width="45%" height={12} borderRadius={4} />
              <Shimmer width="30%" height={14} borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width={110} height={14} borderRadius={4} />
            <Shimmer width={90} height={28} borderRadius={Radius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};
/**
 * 10. VendorProductsSkeleton - Skeleton for Products screen list/cards
 */
export const VendorProductsSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingHorizontal: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorProductSkeletonCard}>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Shimmer width={84} height={84} borderRadius={Radius.md} />
            <View style={{ flex: 1, justifyContent: 'space-between' }}>
              <View>
                <Shimmer width="70%" height={16} borderRadius={4} style={{ marginBottom: 6 }} />
                <Shimmer width="40%" height={12} borderRadius={4} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Shimmer width={90} height={18} borderRadius={4} />
                <Shimmer width={60} height={18} borderRadius={10} />
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 11. VendorStudioRequestsSkeleton - Skeleton for Custom Commission Requests feed
 */
export const VendorStudioRequestsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorStudioSkeletonCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Shimmer width={100} height={20} borderRadius={Radius.full} />
            <Shimmer width={80} height={16} borderRadius={4} />
          </View>
          <Shimmer width="85%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          <Shimmer width="100%" height={14} borderRadius={4} style={{ marginBottom: 4 }} />
          <Shimmer width="70%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 12 }}>
            <Shimmer width={60} height={60} borderRadius={Radius.sm} />
            <Shimmer width={60} height={60} borderRadius={Radius.sm} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width={120} height={18} borderRadius={4} />
            <Shimmer width={90} height={32} borderRadius={Radius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 12. VendorStudioWorkbenchSkeleton - Skeleton for Active Workbench items
 */
export const VendorStudioWorkbenchSkeleton: React.FC<{ count?: number }> = ({ count = 2 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorStudioSkeletonCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Shimmer width={110} height={20} borderRadius={Radius.full} />
            <Shimmer width={70} height={16} borderRadius={4} />
          </View>
          <Shimmer width="80%" height={18} borderRadius={4} style={{ marginBottom: 8 }} />
          <Shimmer width="50%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
          <Shimmer width="100%" height={8} borderRadius={4} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width={100} height={16} borderRadius={4} />
            <Shimmer width={110} height={32} borderRadius={Radius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 13. VendorProductRequestsSkeleton - Skeleton for Bespoke Product Requests list
 */
export const VendorProductRequestsSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorStudioSkeletonCard}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
            <Shimmer width={120} height={20} borderRadius={Radius.full} />
            <Shimmer width={85} height={18} borderRadius={4} />
          </View>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
            <Shimmer width={70} height={70} borderRadius={Radius.md} />
            <View style={{ flex: 1, justifyContent: 'space-around' }}>
              <Shimmer width="85%" height={18} borderRadius={4} />
              <Shimmer width="60%" height={14} borderRadius={4} />
              <Shimmer width="45%" height={14} borderRadius={4} />
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width={100} height={16} borderRadius={4} />
            <Shimmer width={100} height={32} borderRadius={Radius.md} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 14. VendorCustomersSkeleton - Skeleton for Patrons & Collectors screen
 */
export const VendorCustomersSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorStudioSkeletonCard}>
          {/* Top row: Avatar, Info, Tier Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <Shimmer width={46} height={46} borderRadius={Radius.full} style={{ marginRight: 12 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <Shimmer width="65%" height={16} borderRadius={4} />
              <Shimmer width="45%" height={12} borderRadius={4} />
            </View>
            <Shimmer width={80} height={22} borderRadius={Radius.full} />
          </View>

          {/* Category tag */}
          <Shimmer width={140} height={18} borderRadius={4} style={{ marginBottom: 12 }} />

          {/* Quick contact strip */}
          <View style={{ flexDirection: 'row', gap: 8, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width="48%" height={32} borderRadius={Radius.sm} />
            <Shimmer width="48%" height={32} borderRadius={Radius.sm} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 15. VendorCatalogSkeleton - Skeleton for Lookbooks & Catalogs screen
 */
export const VendorCatalogSkeleton: React.FC<{ count?: number }> = ({ count = 3 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {items.map((key) => (
        <View key={key} style={styles.vendorStudioSkeletonCard}>
          {/* Cover image banner */}
          <Shimmer width="100%" height={150} borderRadius={Radius.md} style={{ marginBottom: 12 }} />
          {/* Title and piece badge */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Shimmer width="60%" height={18} borderRadius={4} />
            <Shimmer width={75} height={20} borderRadius={Radius.full} />
          </View>
          {/* Description line */}
          <Shimmer width="90%" height={13} borderRadius={4} style={{ marginBottom: 12 }} />
          {/* Actions footer */}
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
            <Shimmer width={100} height={16} borderRadius={4} />
            <Shimmer width={60} height={16} borderRadius={4} />
            <Shimmer width={60} height={16} borderRadius={4} />
          </View>
        </View>
      ))}
    </View>
  );
};

/**
 * 16. VendorStatisticsSkeleton - Skeleton for Analytics & Statistics screen
 */
export const VendorStatisticsSkeleton: React.FC = () => {
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {/* 2x2 KPI Grid Skeleton */}
      <VendorKpiGridSkeleton />

      {/* Perspective Tabs Bar Skeleton */}
      <View style={{ flexDirection: 'row', gap: 10, paddingVertical: 4 }}>
        <Shimmer width={120} height={36} borderRadius={Radius.full} />
        <Shimmer width={120} height={36} borderRadius={Radius.full} />
        <Shimmer width={120} height={36} borderRadius={Radius.full} />
      </View>

      {/* Hero Financial / Demographic Card Skeleton */}
      <View style={styles.vendorStudioSkeletonCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
          <View style={{ gap: 6, flex: 1 }}>
            <Shimmer width="60%" height={18} borderRadius={4} />
            <Shimmer width="80%" height={12} borderRadius={4} />
          </View>
          <Shimmer width={70} height={20} borderRadius={Radius.full} />
        </View>
        <Shimmer width="100%" height={60} borderRadius={Radius.md} style={{ marginBottom: 14 }} />
        <Shimmer width="100%" height={12} borderRadius={6} style={{ marginBottom: 14 }} />
        <View style={{ gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#EAE0D3' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Shimmer width={140} height={14} borderRadius={4} />
            <Shimmer width={80} height={14} borderRadius={4} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Shimmer width={160} height={14} borderRadius={4} />
            <Shimmer width={70} height={14} borderRadius={4} />
          </View>
        </View>
      </View>
    </View>
  );
};

/**
 * 17. VendorMessengerSkeleton - Skeleton for Conversations thread list
 */
export const VendorMessengerSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  const items = Array.from({ length: count }, (_, i) => i);
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {/* Search & Channel Filter Bar Skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 8 }}>
        <Shimmer width="75%" height={40} borderRadius={Radius.md} />
        <Shimmer width={40} height={40} borderRadius={Radius.md} />
      </View>

      {/* Channel Pills Skeleton */}
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: Spacing.md, marginBottom: 12 }}>
        <Shimmer width={60} height={32} borderRadius={Radius.full} />
        <Shimmer width={90} height={32} borderRadius={Radius.full} />
        <Shimmer width={85} height={32} borderRadius={Radius.full} />
        <Shimmer width={70} height={32} borderRadius={Radius.full} />
      </View>

      {/* Conversation Thread Rows */}
      <View style={{ paddingHorizontal: Spacing.md, gap: 10 }}>
        {items.map((key) => (
          <View
            key={key}
            style={[
              styles.vendorStudioSkeletonCard,
              { flexDirection: 'row', alignItems: 'center', padding: Spacing.md },
            ]}
          >
            <Shimmer width={52} height={52} borderRadius={26} style={{ marginRight: 12 }} />
            <View style={{ flex: 1, gap: 6 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Shimmer width="55%" height={16} borderRadius={4} />
                <Shimmer width={45} height={12} borderRadius={4} />
              </View>
              <Shimmer width="80%" height={13} borderRadius={4} />
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                <Shimmer width={60} height={18} borderRadius={Radius.full} />
                <Shimmer width="40%" height={11} borderRadius={4} />
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
};

/**
 * 18. VendorChatRoomSkeleton - Skeleton for active in-thread conversation view
 */
export const VendorChatRoomSkeleton: React.FC = () => {
  return (
    <View style={{ flex: 1, padding: Spacing.md, justifyContent: 'space-between' }}>
      {/* Header Context Bar */}
      <View
        style={[
          styles.vendorStudioSkeletonCard,
          { flexDirection: 'row', alignItems: 'center', padding: Spacing.sm, marginBottom: 16 },
        ]}
      >
        <Shimmer width={40} height={40} borderRadius={Radius.sm} style={{ marginRight: 10 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <Shimmer width="70%" height={14} borderRadius={4} />
          <Shimmer width="40%" height={11} borderRadius={4} />
        </View>
        <Shimmer width={70} height={24} borderRadius={Radius.full} />
      </View>

      {/* Chat Messages Shimmer */}
      <View style={{ gap: 14, flex: 1 }}>
        <View style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
          <Shimmer width={220} height={50} borderRadius={Radius.md} />
          <Shimmer width={50} height={10} borderRadius={3} style={{ marginTop: 4 }} />
        </View>
        <View style={{ alignSelf: 'flex-end', maxWidth: '80%' }}>
          <Shimmer width={240} height={60} borderRadius={Radius.md} />
          <Shimmer width={50} height={10} borderRadius={3} style={{ marginTop: 4, alignSelf: 'flex-end' }} />
        </View>
        <View style={{ alignSelf: 'flex-start', maxWidth: '80%' }}>
          <Shimmer width={180} height={40} borderRadius={Radius.md} style={{ marginBottom: 6 }} />
          <Shimmer width={200} height={120} borderRadius={Radius.md} />
        </View>
      </View>

      {/* Input Bar */}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', paddingTop: 10 }}>
        <Shimmer width={40} height={40} borderRadius={20} />
        <Shimmer width="72%" height={40} borderRadius={Radius.full} />
        <Shimmer width={40} height={40} borderRadius={20} />
      </View>
    </View>
  );
};

/**
 * 19. VendorSettingsSkeleton - Skeleton for Settings and Atelier Preferences
 */
export const VendorSettingsSkeleton: React.FC = () => {
  return (
    <View style={{ gap: Spacing.md, paddingTop: Spacing.sm }}>
      {/* Identity Medallion Card Skeleton */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <Shimmer width={64} height={64} borderRadius={32} />
          <View style={{ flex: 1, gap: 6 }}>
            <Shimmer width="70%" height={18} borderRadius={4} />
            <Shimmer width="50%" height={12} borderRadius={4} />
            <Shimmer width={90} height={20} borderRadius={Radius.full} />
          </View>
        </View>
      </View>

      {/* Operational Settings Group */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md, gap: 16 }]}>
        <Shimmer width="40%" height={16} borderRadius={4} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Shimmer width="60%" height={14} borderRadius={4} />
            <Shimmer width="40%" height={11} borderRadius={4} />
          </View>
          <Shimmer width={44} height={24} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Shimmer width="55%" height={14} borderRadius={4} />
            <Shimmer width="35%" height={11} borderRadius={4} />
          </View>
          <Shimmer width={44} height={24} borderRadius={12} />
        </View>
      </View>

      {/* Notifications and Preferences Group */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md, gap: 16 }]}>
        <Shimmer width="45%" height={16} borderRadius={4} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Shimmer width="70%" height={14} borderRadius={4} />
            <Shimmer width="50%" height={11} borderRadius={4} />
          </View>
          <Shimmer width={44} height={24} borderRadius={12} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ gap: 4, flex: 1 }}>
            <Shimmer width="65%" height={14} borderRadius={4} />
            <Shimmer width="45%" height={11} borderRadius={4} />
          </View>
          <Shimmer width={44} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  );
};

/**
 * 20. VendorProfileSkeleton - Skeleton for Vendor Workshop Profile and Verification
 */
export const VendorProfileSkeleton: React.FC = () => {
  return (
    <View style={{ gap: Spacing.md }}>
      {/* Cover and Floating Avatar */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: 0, overflow: 'hidden' }]}>
        <Shimmer width="100%" height={160} borderRadius={0} />
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: Spacing.md, marginTop: -35, marginBottom: Spacing.sm }}>
          <Shimmer width={76} height={76} borderRadius={38} />
          <View style={{ flex: 1, marginLeft: 12, marginBottom: 8 }}>
            <Shimmer width="60%" height={16} borderRadius={4} />
            <Shimmer width="40%" height={12} borderRadius={4} style={{ marginTop: 6 }} />
          </View>
        </View>
      </View>

      {/* Completion Meter Card */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md, flexDirection: 'row', alignItems: 'center', gap: 14 }]}>
        <Shimmer width={54} height={54} borderRadius={27} />
        <View style={{ flex: 1, gap: 6 }}>
          <Shimmer width="70%" height={15} borderRadius={4} />
          <Shimmer width="90%" height={12} borderRadius={4} />
        </View>
      </View>

      {/* Workshop & Craft Story Section */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md, gap: 12 }]}>
        <Shimmer width="50%" height={16} borderRadius={4} />
        <Shimmer width="35%" height={24} borderRadius={12} />
        <Shimmer width="100%" height={40} borderRadius={6} />
      </View>

      {/* Settlement & Banking Section */}
      <View style={[styles.vendorStudioSkeletonCard, { padding: Spacing.md, gap: 12 }]}>
        <Shimmer width="55%" height={16} borderRadius={4} />
        <Shimmer width="100%" height={70} borderRadius={8} />
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
  vendorKpiSkeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.md,
  },
  vendorKpiSkeletonCard: {
    height: 130,
    borderRadius: Radius.md,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#EAE0D3',
    paddingHorizontal: 13,
    paddingVertical: 12,
    justifyContent: 'space-between',
  },
  vendorOrdersSkeletonContainer: {
    height: 170,
    borderRadius: Radius.md,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#EAE0D3',
    padding: Spacing.sm,
    justifyContent: 'space-around',
  },
  vendorProductSkeletonCard: {
    borderRadius: Radius.md,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#EAE0D3',
    padding: Spacing.md,
  },
  vendorOrderCardSkeleton: {
    borderRadius: Radius.md,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#EAE0D3',
    padding: Spacing.md,
  },
  vendorStudioSkeletonCard: {
    borderRadius: Radius.md,
    backgroundColor: '#FDFBF7',
    borderWidth: 1,
    borderColor: '#EAE0D3',
    padding: Spacing.md,
  },
});

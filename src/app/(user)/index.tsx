import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function UserHomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = [
    { name: 'All', icon: 'sparkles' },
    { name: 'Menswear', icon: 'shirt' },
    { name: 'Paintings', icon: 'color-palette' },
    { name: 'Jewelry', icon: 'diamond' },
    { name: 'Sculptures', icon: 'cube' },
    { name: 'Shoes', icon: 'footsteps' },
  ];

  const featuredProducts = [
    {
      id: '1',
      title: 'Royal Aso Oke Agbada (3-Piece)',
      artisan: 'Master Kwame',
      origin: 'Accra, Ghana',
      price: '₦185,000',
      badge: 'Masterwork',
      category: 'Menswear',
    },
    {
      id: '2',
      title: 'Hand-carved Benin Ivory Queen Mask',
      artisan: 'Studio Ejiro',
      origin: 'Benin City, Nigeria',
      price: '₦240,000',
      badge: 'Heritage',
      category: 'Sculptures',
    },
    {
      id: '3',
      title: 'Adire Ochre Indigo Tapestry',
      artisan: 'Aisha Weaves',
      origin: 'Abeokuta, Nigeria',
      price: '₦95,000',
      badge: 'Eco-Craft',
      category: 'Paintings',
    },
    {
      id: '4',
      title: 'Royal Coral Beaded Choker & Earrings',
      artisan: 'Madam Ovia',
      origin: 'Warri, Nigeria',
      price: '₦130,000',
      badge: 'Ceremonial',
      category: 'Jewelry',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <RoleSwitchBanner />

      {/* Luxury Search Bar */}
      <View style={[styles.searchContainer, Shadows.sm]}>
        <Ionicons name="search-outline" size={18} color={Colors.textMuted} style={styles.searchIcon} />
        <TextInput
          placeholder="Search handmade luxury, artisans, fabrics..."
          placeholderTextColor={Colors.textMuted}
          style={styles.searchInput}
        />
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="options-outline" size={16} color={Colors.primaryDark} />
        </TouchableOpacity>
      </View>

      {/* Editorial Hero Banner */}
      <View style={[styles.heroCard, Shadows.md]}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>HERITAGE & LUXURY 2026</Text>
          </View>
          <View style={styles.verifiedRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.accentGold} />
            <Text style={styles.verifiedText}>Verified Origin</Text>
          </View>
        </View>

        <Text style={styles.heroTitle}>The African Master Artisan Collection</Text>
        <Text style={styles.heroSubtitle}>
          Directly commissioned bespoke pieces, preserving centuries of ancestral craftsmanship.
        </Text>

        <View style={styles.heroActions}>
          <TouchableOpacity style={styles.heroBtnPrimary}>
            <Text style={styles.heroBtnPrimaryText}>Explore Curation</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.heroBtnSecondary}>
            <Ionicons name="sparkles" size={14} color={Colors.accentGold} />
            <Text style={styles.heroBtnSecondaryText}>Custom Studio</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Categories Horizontal Scroller */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Curated Departments</Text>
        <TouchableOpacity>
          <Text style={styles.seeAllText}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryScrollContainer}
      >
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.name;
          return (
            <TouchableOpacity
              key={cat.name}
              onPress={() => setSelectedCategory(cat.name)}
              activeOpacity={0.8}
              style={[
                styles.categoryChip,
                isActive && styles.categoryChipActive,
                Shadows.sm,
              ]}
            >
              <Ionicons
                name={cat.icon as any}
                size={14}
                color={isActive ? Colors.textInverse : Colors.primaryDark}
                style={styles.categoryIcon}
              />
              <Text
                style={[
                  styles.categoryChipText,
                  isActive && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Featured Products Grid */}
      <View style={styles.sectionHeader}>
        <View>
          <Text style={styles.sectionTitle}>Artisan Masterpieces</Text>
          <Text style={styles.sectionSubtitle}>Handcrafted one-of-a-kind treasures</Text>
        </View>
      </View>

      <View style={styles.productGrid}>
        {featuredProducts.map((item) => (
          <TouchableOpacity
            key={item.id}
            activeOpacity={0.9}
            style={[styles.productCard, Shadows.sm]}
          >
            {/* Visual Canvas */}
            <View style={styles.productCanvas}>
              <View style={styles.badgePill}>
                <Text style={styles.badgePillText}>{item.badge}</Text>
              </View>
              <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
                <Ionicons name="heart-outline" size={16} color={Colors.primaryDark} />
              </TouchableOpacity>
              <Ionicons name="sparkles-outline" size={36} color={Colors.primaryLight} />
            </View>

            {/* Product Meta */}
            <View style={styles.productInfo}>
              <Text style={styles.productOrigin}>{item.origin}</Text>
              <Text style={styles.productTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.artisanName}>by {item.artisan}</Text>
              <View style={styles.priceRow}>
                <Text style={styles.productPrice}>{item.price}</Text>
                <View style={styles.cartAddMini}>
                  <Ionicons name="add" size={16} color={Colors.textInverse} />
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Artisan Spotlight Banner */}
      <View style={[styles.spotlightCard, Shadows.sm]}>
        <View style={styles.spotlightLeft}>
          <Text style={styles.spotlightTag}>CREATOR SPOTLIGHT</Text>
          <Text style={styles.spotlightTitle}>Master Ejiro Agbada</Text>
          <Text style={styles.spotlightBio}>
            Third-generation weaver blending raw silk and Aso Oke with modern sculptural silhouettes.
          </Text>
          <TouchableOpacity style={styles.spotlightBtn}>
            <Text style={styles.spotlightBtnText}>View Workshop Profile</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0', // Warm African parchment tone
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#EFE6D8',
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Typography.fontSize.sm,
    color: Colors.textPrimary,
  },
  filterBtn: {
    padding: Spacing.xs,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.full,
  },
  heroCard: {
    backgroundColor: '#271100', // Luxury Deep Coffee
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#4A2A10',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  heroBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  heroBadgeText: {
    color: Colors.textInverse,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    color: Colors.accentGold,
    fontSize: Typography.fontSize.xs,
    fontWeight: '600',
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
    lineHeight: 28,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#D6C8B5',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  heroActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  heroBtnPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 4,
  },
  heroBtnPrimaryText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  heroBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3E1C03',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    gap: 4,
    borderWidth: 1,
    borderColor: '#603310',
  },
  heroBtnSecondaryText: {
    color: Colors.accentGold,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  seeAllText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '700',
  },
  categoryScrollContainer: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    gap: Spacing.xs + 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  categoryChipActive: {
    backgroundColor: Colors.primaryDark,
    borderColor: Colors.primaryDark,
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
    fontWeight: '700',
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  productCanvas: {
    height: 140,
    backgroundColor: '#F8F1E7',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFFE0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFFFFFE0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    padding: Spacing.sm + 2,
  },
  productOrigin: {
    fontSize: 10,
    color: Colors.textMuted,
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  productTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
    lineHeight: 18,
    minHeight: 36,
  },
  artisanName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.primary,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: Spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  productPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.primaryDark,
  },
  cartAddMini: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightCard: {
    marginHorizontal: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: '#FFF8EE',
    borderWidth: 1,
    borderColor: '#E8D4BE',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
  },
  spotlightLeft: {
    flex: 1,
  },
  spotlightTag: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  spotlightTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  spotlightBio: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  spotlightBtn: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  spotlightBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
});

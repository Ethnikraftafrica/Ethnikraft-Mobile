import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function UserHomeScreen() {
  const categories = ['All', 'Menswear', 'Paintings', 'Accessories', 'Sculptures', 'Shoes'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RoleSwitchBanner />

      {/* Hero Banner */}
      <View style={styles.heroCard}>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>African Luxury Artisan Craft</Text>
        </View>
        <Text style={styles.heroTitle}>Discover Heritage & Handmade Elegance</Text>
        <Text style={styles.heroSubtitle}>
          Direct from verified African masters, bespoke tailors, and mixed-media creators.
        </Text>
      </View>

      {/* Categories Bar */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Curated Collections</Text>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
        {categories.map((category, index) => (
          <TouchableOpacity
            key={category}
            style={[styles.categoryChip, index === 0 && styles.categoryChipActive]}
          >
            <Text
              style={[
                styles.categoryChipText,
                index === 0 && styles.categoryChipTextActive,
              ]}
            >
              {category}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Showcase Cards */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Artisan Spotlight</Text>
      </View>
      <View style={styles.cardGrid}>
        <View style={styles.productCard}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="shirt-outline" size={32} color={Colors.primary} />
          </View>
          <Text style={styles.cardTitle}>Royal Aso Oke Agbada</Text>
          <Text style={styles.cardVendor}>Master Artisan Kwame</Text>
          <Text style={styles.cardPrice}>₦185,000</Text>
        </View>
        <View style={styles.productCard}>
          <View style={styles.imagePlaceholder}>
            <Ionicons name="color-palette-outline" size={32} color={Colors.secondary} />
          </View>
          <Text style={styles.cardTitle}>Adire Ochre Tapestry</Text>
          <Text style={styles.cardVendor}>Studio Ejiro</Text>
          <Text style={styles.cardPrice}>₦95,000</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingBottom: Spacing.xl,
  },
  heroCard: {
    backgroundColor: Colors.primaryDark,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
  },
  heroBadgeText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  heroTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginBottom: Spacing.xs,
    lineHeight: 26,
  },
  heroSubtitle: {
    fontSize: Typography.fontSize.sm,
    color: Colors.surfaceMuted,
    lineHeight: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  categoriesScroll: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: Typography.fontSize.sm,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
  categoryChipTextActive: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
  },
  cardGrid: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
  },
  imagePlaceholder: {
    height: 120,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardVendor: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 4,
  },
  cardPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
});

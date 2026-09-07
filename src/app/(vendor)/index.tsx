import React from 'react';
import { ScrollView, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function VendorOverviewScreen() {
  const stats = [
    { title: 'Total Revenue', value: '₦1,850,000', icon: 'cash-outline', color: Colors.secondary },
    { title: 'Pending Orders', value: '7', icon: 'time-outline', color: Colors.primary },
    { title: 'Active Studio Bids', value: '4', icon: 'hammer-outline', color: Colors.accentGold },
    { title: 'Active Products', value: '38', icon: 'cube-outline', color: Colors.info },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <RoleSwitchBanner />

      {/* Workshop Header */}
      <View style={styles.workshopCard}>
        <View style={styles.workshopBadge}>
          <Text style={styles.workshopBadgeText}>Verified Master Artisan</Text>
        </View>
        <Text style={styles.workshopTitle}>Ejiro Heritage Studio</Text>
        <Text style={styles.workshopSubtitle}>
          Specializing in bespoke Aso Oke & hand-loomed textiles • Lagos, Nigeria
        </Text>
      </View>

      {/* Stat Grid */}
      <Text style={styles.sectionTitle}>Performance Metrics</Text>
      <View style={styles.statGrid}>
        {stats.map((stat) => (
          <View key={stat.title} style={styles.statCard}>
            <View style={[styles.statIconCircle, { backgroundColor: `${stat.color}15` }]}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
            </View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.title}</Text>
          </View>
        ))}
      </View>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Operations</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="add-circle" size={20} color={Colors.textInverse} style={styles.actionIcon} />
          <Text style={styles.actionBtnText}>Add New Product</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary]}>
          <Ionicons name="search" size={20} color={Colors.textPrimary} style={styles.actionIcon} />
          <Text style={styles.actionBtnTextDark}>Browse Custom Bids</Text>
        </TouchableOpacity>
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
  workshopCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  workshopBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
    marginBottom: Spacing.xs,
  },
  workshopBadgeText: {
    color: '#166534',
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  workshopTitle: {
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  workshopSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
  },
  statCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  actionRow: {
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  actionIcon: {
    marginRight: Spacing.xs,
  },
  actionBtnText: {
    color: Colors.textInverse,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.sm,
  },
  actionBtnTextDark: {
    color: Colors.textPrimary,
    fontWeight: Typography.fontWeight.bold,
    fontSize: Typography.fontSize.sm,
  },
});

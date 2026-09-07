import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RoleSwitchBanner } from '@/components/common/RoleSwitchBanner';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function VendorOverviewScreen() {
  const kpis = [
    {
      title: 'Net Revenue',
      value: '₦1,850,000',
      subtext: '+14.2% this month',
      icon: 'cash-outline',
      color: '#15803D',
      bg: '#DCFCE7',
    },
    {
      title: 'Orders in Studio',
      value: '7 Orders',
      subtext: '3 due for shipping',
      icon: 'time-outline',
      color: Colors.primary,
      bg: '#FFEDD5',
    },
    {
      title: 'Active Bids',
      value: '4 Requests',
      subtext: '2 customer responses',
      icon: 'hammer-outline',
      color: '#B45309',
      bg: '#FEF3C7',
    },
    {
      title: 'Inventory Count',
      value: '38 Items',
      subtext: '2 items low in stock',
      icon: 'cube-outline',
      color: '#0369A1',
      bg: '#E0F2FE',
    },
  ];

  const recentInquiries = [
    {
      id: 'BID-901',
      client: 'Chief Folami',
      item: 'Ceremonial Velvet Agbada Set',
      budget: '₦240,000',
      time: '35m ago',
    },
    {
      id: 'BID-898',
      client: 'Bisi Adeleke',
      item: 'Handwoven Aso Oke Fila (Custom size 60cm)',
      budget: '₦45,000',
      time: '2h ago',
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <RoleSwitchBanner />

      {/* Workshop Profile Card */}
      <View style={[styles.workshopCard, Shadows.sm]}>
        <View style={styles.workshopHeaderRow}>
          <View style={styles.avatarBadge}>
            <Ionicons name="sparkles" size={20} color={Colors.textInverse} />
          </View>
          <View style={styles.workshopTextCol}>
            <View style={styles.badgeRow}>
              <View style={styles.verifiedChip}>
                <Text style={styles.verifiedChipText}>VERIFIED MASTER WORKSHOP</Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>Commissions Open</Text>
              </View>
            </View>
            <Text style={styles.workshopTitle}>Ejiro Heritage Studio</Text>
            <Text style={styles.workshopLocation}>Lagos, Nigeria • 4.96 ★ (142 completed bespoke works)</Text>
          </View>
        </View>
      </View>

      {/* 2x2 Metric Grid */}
      <Text style={styles.sectionTitle}>Workshop Performance</Text>
      <View style={styles.gridContainer}>
        {kpis.map((kpi) => (
          <View key={kpi.title} style={[styles.metricCard, Shadows.sm]}>
            <View style={[styles.metricIconWrap, { backgroundColor: kpi.bg }]}>
              <Ionicons name={kpi.icon as any} size={20} color={kpi.color} />
            </View>
            <Text style={styles.metricValue}>{kpi.value}</Text>
            <Text style={styles.metricTitle}>{kpi.title}</Text>
            <Text style={[styles.metricSubtext, { color: kpi.color }]}>{kpi.subtext}</Text>
          </View>
        ))}
      </View>

      {/* Quick Artisan Actions */}
      <Text style={styles.sectionTitle}>Artisan Actions</Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary, Shadows.sm]} activeOpacity={0.85}>
          <Ionicons name="add-circle" size={18} color={Colors.textInverse} />
          <Text style={styles.actionBtnPrimaryText}>Add New Product</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.actionBtn, styles.actionBtnSecondary, Shadows.sm]} activeOpacity={0.85}>
          <Ionicons name="receipt-outline" size={18} color={Colors.primaryDark} />
          <Text style={styles.actionBtnSecondaryText}>View Bids</Text>
        </TouchableOpacity>
      </View>

      {/* Studio Commission Inquiries */}
      <View style={styles.inquiriesHeaderRow}>
        <Text style={styles.sectionTitle}>New Bespoke Commission Requests</Text>
        <TouchableOpacity>
          <Text style={styles.viewAllText}>Review All</Text>
        </TouchableOpacity>
      </View>

      {recentInquiries.map((inq) => (
        <View key={inq.id} style={[styles.inquiryCard, Shadows.sm]}>
          <View style={styles.inquiryTop}>
            <Text style={styles.inquiryId}>{inq.id}</Text>
            <Text style={styles.inquiryTime}>{inq.time}</Text>
          </View>
          <Text style={styles.inquiryItem}>{inq.item}</Text>
          <Text style={styles.inquiryClient}>Client: {inq.client}</Text>

          <View style={styles.inquiryDivider} />

          <View style={styles.inquiryBottom}>
            <View>
              <Text style={styles.inquiryBudgetLabel}>ESTIMATED BUDGET</Text>
              <Text style={styles.inquiryBudgetValue}>{inq.budget}</Text>
            </View>
            <TouchableOpacity style={styles.sendQuoteBtn} activeOpacity={0.8}>
              <Text style={styles.sendQuoteText}>Send Quote</Text>
              <Ionicons name="arrow-forward" size={14} color={Colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  content: {
    paddingBottom: Spacing.xxl,
  },
  workshopCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.md,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  workshopHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  workshopTextCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  verifiedChip: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  verifiedChipText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 0.5,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#16A34A',
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#16A34A',
  },
  workshopTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  workshopLocation: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    width: '48%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  metricIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  metricTitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '600',
  },
  metricSubtext: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    gap: 6,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.secondary,
  },
  actionBtnPrimaryText: {
    color: Colors.textInverse,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  actionBtnSecondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#E8DEC8',
  },
  actionBtnSecondaryText: {
    color: Colors.primaryDark,
    fontWeight: '700',
    fontSize: Typography.fontSize.xs,
  },
  inquiriesHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: Spacing.md,
  },
  viewAllText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.secondary,
    fontWeight: '700',
  },
  inquiryCard: {
    backgroundColor: Colors.surface,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  inquiryTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  inquiryId: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.primary,
  },
  inquiryTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  inquiryItem: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  inquiryClient: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  inquiryDivider: {
    height: 1,
    backgroundColor: '#F3EDE2',
    marginVertical: Spacing.sm,
  },
  inquiryBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inquiryBudgetLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.6,
  },
  inquiryBudgetValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.secondary,
  },
  sendQuoteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
    gap: 4,
  },
  sendQuoteText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
});

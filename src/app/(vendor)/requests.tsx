import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function VendorRequestsScreen() {
  const requests = [
    {
      id: 'REQ-3901',
      customer: 'Dr. Adeyemi',
      title: 'Custom Velvet Agbada with Hand-beaded Neckline',
      budget: '₦220,000 - ₦260,000',
      deadline: 'Needed in 14 days',
      materials: 'Burgundy Velvet, Gold Beads, Aso Oke accents',
    },
    {
      id: 'REQ-3904',
      customer: 'Zainab B.',
      title: 'Hand-carved Mahogany Dining Centerpiece',
      budget: '₦150,000 - ₦180,000',
      deadline: 'Needed in 21 days',
      materials: 'Polished Seasoned Mahogany',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Open Commission Requests</Text>
      <Text style={styles.subheading}>
        Customers looking for bespoke craftsmanship. Submit quotes and establish milestones.
      </Text>

      {requests.map((item) => (
        <View key={item.id} style={styles.requestCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.reqId}>{item.id}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.deadline}</Text>
            </View>
          </View>
          <Text style={styles.reqTitle}>{item.title}</Text>
          <Text style={styles.reqCustomer}>Client: {item.customer}</Text>
          <Text style={styles.reqMaterials}>Materials: {item.materials}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.cardFooter}>
            <View>
              <Text style={styles.budgetLabel}>Target Budget</Text>
              <Text style={styles.budgetValue}>{item.budget}</Text>
            </View>
            <TouchableOpacity style={styles.bidBtn}>
              <Ionicons name="paper-plane-outline" size={16} color={Colors.textInverse} style={styles.btnIcon} />
              <Text style={styles.bidBtnText}>Submit Bid</Text>
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
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.md,
  },
  heading: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  subheading: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
    marginTop: 2,
  },
  requestCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  reqId: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
  },
  badge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    color: '#92400E',
    fontWeight: Typography.fontWeight.medium,
  },
  reqTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reqCustomer: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  reqMaterials: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  budgetLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    textTransform: 'uppercase',
  },
  budgetValue: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary,
  },
  bidBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  btnIcon: {
    marginRight: 4,
  },
  bidBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

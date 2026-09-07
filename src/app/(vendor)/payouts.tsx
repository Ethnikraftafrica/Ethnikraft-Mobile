import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function VendorPayoutsScreen() {
  const history = [
    { id: 'PAY-8821', date: 'Sep 1, 2026', amount: '₦450,000', status: 'Completed', bank: 'GTBank •••• 4120' },
    { id: 'PAY-8750', date: 'Aug 15, 2026', amount: '₦320,000', status: 'Completed', bank: 'GTBank •••• 4120' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Available for Payout</Text>
        <Text style={styles.balanceAmount}>₦645,800.00</Text>
        <Text style={styles.pendingText}>+ ₦180,000 in escrow (pending delivery)</Text>
        <TouchableOpacity style={styles.withdrawBtn}>
          <Ionicons name="arrow-up-circle-outline" size={18} color={Colors.textInverse} style={styles.btnIcon} />
          <Text style={styles.withdrawBtnText}>Request Payout to Bank</Text>
        </TouchableOpacity>
      </View>

      {/* Bank Account */}
      <Text style={styles.sectionTitle}>Settlement Bank Account</Text>
      <View style={styles.bankCard}>
        <View style={styles.bankIcon}>
          <Ionicons name="business-outline" size={24} color={Colors.secondary} />
        </View>
        <View style={styles.bankInfo}>
          <Text style={styles.bankName}>Guaranty Trust Bank</Text>
          <Text style={styles.accountNumber}>0123456789 • Ejiro Heritage Craft Ltd</Text>
        </View>
        <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
      </View>

      {/* Payout History */}
      <Text style={styles.sectionTitle}>Recent Settlements</Text>
      {history.map((item) => (
        <View key={item.id} style={styles.historyCard}>
          <View>
            <Text style={styles.historyId}>{item.id}</Text>
            <Text style={styles.historyDate}>{item.date} • {item.bank}</Text>
          </View>
          <View style={styles.amountCol}>
            <Text style={styles.historyAmount}>{item.amount}</Text>
            <Text style={styles.historyStatus}>{item.status}</Text>
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
  balanceCard: {
    backgroundColor: Colors.secondary,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  balanceLabel: {
    fontSize: Typography.fontSize.xs,
    color: '#D9F99D',
    textTransform: 'uppercase',
    fontWeight: Typography.fontWeight.semibold,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textInverse,
    marginVertical: Spacing.xs,
  },
  pendingText: {
    fontSize: Typography.fontSize.xs,
    color: '#ECFCCB',
    marginBottom: Spacing.md,
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primaryDark,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
  },
  btnIcon: {
    marginRight: Spacing.xs,
  },
  withdrawBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  bankIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  bankInfo: {
    flex: 1,
  },
  bankName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  accountNumber: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  historyId: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  historyDate: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  amountCol: {
    alignItems: 'flex-end',
  },
  historyAmount: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  historyStatus: {
    fontSize: Typography.fontSize.xs,
    color: Colors.success,
    fontWeight: Typography.fontWeight.medium,
    marginTop: 2,
  },
});

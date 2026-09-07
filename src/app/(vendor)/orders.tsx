import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function VendorOrdersScreen() {
  const orders = [
    {
      id: '#VORD-9201',
      customer: 'Chukwuma Obi',
      item: 'Handwoven Aso Oke Fila & Stole',
      quantity: 2,
      total: '₦96,000',
      status: 'Ready to Ship',
      date: 'Sep 6, 2026',
    },
    {
      id: '#VORD-9195',
      customer: 'Amara Nwosu',
      item: 'Beaded Coral Royal Bridal Choker',
      quantity: 1,
      total: '₦110,000',
      status: 'In Progress',
      date: 'Sep 5, 2026',
    },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Incoming Orders to Fulfill</Text>

      {orders.map((order) => (
        <View key={order.id} style={styles.orderCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.orderId}>{order.id}</Text>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor:
                    order.status === 'Ready to Ship' ? '#DCFCE7' : '#FEF3C7',
                },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  {
                    color:
                      order.status === 'Ready to Ship' ? '#166534' : '#92400E',
                  },
                ]}
              >
                {order.status}
              </Text>
            </View>
          </View>

          <Text style={styles.customerName}>Customer: {order.customer}</Text>
          <Text style={styles.itemName}>{order.item}</Text>
          <Text style={styles.qtyText}>Qty: {order.quantity} • Total: {order.total}</Text>

          <View style={styles.divider} />

          <View style={styles.footerRow}>
            <Text style={styles.dateText}>{order.date}</Text>
            <TouchableOpacity style={styles.actionBtn}>
              <Ionicons name="create-outline" size={16} color={Colors.secondary} style={styles.btnIcon} />
              <Text style={styles.actionText}>Update Status</Text>
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
    marginBottom: Spacing.md,
  },
  orderCard: {
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
  orderId: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primaryDark,
  },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  badgeText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
  customerName: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  itemName: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  qtyText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  btnIcon: {
    marginRight: 4,
  },
  actionText: {
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.secondary,
  },
});

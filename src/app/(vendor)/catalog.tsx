import React from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function VendorCatalogScreen() {
  const products = [
    { title: 'Hand-dyed Indigo Kaftan', price: '₦85,000', stock: '12 in stock', status: 'Active' },
    { title: 'Royal Beaded Coral Crown', price: '₦145,000', stock: '3 in stock', status: 'Low Stock' },
    { title: 'Bronze Benin Leopard Sculpture', price: '₦320,000', stock: '1 in stock', status: 'Low Stock' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.heading}>Your Workshop Products</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={18} color={Colors.textInverse} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      {products.map((item) => (
        <View key={item.title} style={styles.productRow}>
          <View style={styles.productThumb}>
            <Ionicons name="cube-outline" size={24} color={Colors.secondary} />
          </View>
          <View style={styles.productDetails}>
            <Text style={styles.productTitle}>{item.title}</Text>
            <Text style={styles.productStock}>{item.stock}</Text>
            <Text style={styles.productPrice}>{item.price}</Text>
          </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusBadgeText}>{item.status}</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  heading: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  addBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
    marginLeft: 2,
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
  },
  productThumb: {
    width: 48,
    height: 48,
    borderRadius: Radius.sm,
    backgroundColor: Colors.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  productStock: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  productPrice: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.primary,
    marginTop: 2,
  },
  statusBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    fontWeight: Typography.fontWeight.medium,
  },
});

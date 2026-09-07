import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppDispatch } from '@/store';
import { toggleRole } from '@/store/slices/authSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();

  const handleSwitchToVendor = () => {
    dispatch(toggleRole());
    router.replace('/(vendor)');
  };

  const menuItems = [
    { icon: 'location-outline', title: 'Delivery Addresses', subtitle: 'Manage shipping destinations' },
    { icon: 'card-outline', title: 'Payment & Wallet', subtitle: 'Saved cards and transactions' },
    { icon: 'heart-outline', title: 'Saved Favorites', subtitle: 'Items you love' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Order and custom bid alerts' },
    { icon: 'help-circle-outline', title: 'Support & FAQs', subtitle: 'Help center' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Header */}
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>EK</Text>
        </View>
        <Text style={styles.userName}>Ethnikraft Customer</Text>
        <Text style={styles.userEmail}>customer@ethnikraft.com</Text>
      </View>

      {/* Switch to Vendor Dashboard Action */}
      <TouchableOpacity
        style={styles.vendorSwitchCard}
        onPress={handleSwitchToVendor}
        activeOpacity={0.85}
      >
        <View style={styles.switchIconCircle}>
          <Ionicons name="briefcase-outline" size={24} color={Colors.textInverse} />
        </View>
        <View style={styles.switchTextContainer}>
          <Text style={styles.switchTitle}>Switch to Artisan Vendor Mode</Text>
          <Text style={styles.switchSubtitle}>Manage your workshop, products, and incoming bids</Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Menu List */}
      <View style={styles.menuContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={item.title} style={[styles.menuRow, index > 0 && styles.menuBorder]}>
            <Ionicons name={item.icon as any} size={22} color={Colors.primaryDark} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}
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
    padding: Spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xl,
    fontWeight: Typography.fontWeight.bold,
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  vendorSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primaryLight,
    marginBottom: Spacing.lg,
  },
  switchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuBorder: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

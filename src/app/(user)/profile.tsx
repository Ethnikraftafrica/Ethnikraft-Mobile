import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleRole, logout } from '@/store/slices/authSlice';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isAuthenticated, user, hasVendorAccount } = useAppSelector(
    (state) => state.auth
  );

  const handleSwitchToVendor = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(toggleRole());
    router.replace('/(vendor)');
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your Ethnikraft account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          dispatch(logout());
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const menuItems = [
    { icon: 'location-outline', title: 'Delivery Addresses', subtitle: 'Manage shipping destinations' },
    { icon: 'card-outline', title: 'Payment & Wallet', subtitle: 'Saved cards and transactions' },
    { icon: 'heart-outline', title: 'Saved Favorites', subtitle: 'Items you love' },
    { icon: 'notifications-outline', title: 'Notifications', subtitle: 'Order and custom bid alerts' },
    { icon: 'help-circle-outline', title: 'Support & FAQs', subtitle: 'Help center' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* User Header / Guest State */}
      {isAuthenticated && user ? (
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user.firstName ? user.firstName[0].toUpperCase() : 'E'}
              {user.lastName ? user.lastName[0].toUpperCase() : 'K'}
            </Text>
          </View>
          <Text style={styles.userName}>
            {user.firstName} {user.lastName}
          </Text>
          <Text style={styles.userEmail}>{user.email}</Text>
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
            <Text style={styles.verifiedText}>Verified Customer</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.guestCard, Shadows.sm]}>
          <View style={styles.guestIcon}>
            <Ionicons name="person-outline" size={28} color={Colors.primary} />
          </View>
          <Text style={styles.guestTitle}>Welcome to Ethnikraft</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track orders, save bespoke favorites, or commission verified African artisans.
          </Text>
          <TouchableOpacity
            style={styles.signInBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login');
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.signInBtnText}>Sign In or Register</Text>
            <Ionicons name="arrow-forward" size={14} color={Colors.textInverse} />
          </TouchableOpacity>
        </View>
      )}

      {/* Switch to Vendor Dashboard Action */}
      <TouchableOpacity
        style={[styles.vendorSwitchCard, Shadows.sm]}
        onPress={handleSwitchToVendor}
        activeOpacity={0.85}
      >
        <View style={styles.switchIconCircle}>
          <Ionicons name="briefcase" size={22} color={Colors.textInverse} />
        </View>
        <View style={styles.switchTextContainer}>
          <Text style={styles.switchTitle}>
            {hasVendorAccount ? 'Switch to Artisan Vendor Hub' : 'Artisan Workshop Mode'}
          </Text>
          <Text style={styles.switchSubtitle}>
            Manage your workshop catalog, incoming bespoke bids, and order fulfillment
          </Text>
        </View>
        <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
      </TouchableOpacity>

      {/* Menu List */}
      <View style={[styles.menuContainer, Shadows.sm]}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={item.title} style={[styles.menuRow, index > 0 && styles.menuBorder]}>
            <Ionicons name={item.icon as any} size={20} color={Colors.primaryDark} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Log Out Button */}
        {isAuthenticated && (
          <TouchableOpacity
            style={[styles.menuRow, styles.menuBorder]}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.danger} style={styles.menuIcon} />
            <View style={styles.menuTextCol}>
              <Text style={[styles.menuTitle, { color: Colors.danger }]}>Sign Out</Text>
              <Text style={styles.menuSubtitle}>Disconnect current account session</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF6F0',
  },
  content: {
    padding: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  profileHeader: {
    alignItems: 'center',
    marginVertical: Spacing.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatarText: {
    color: Colors.accentGold,
    fontSize: Typography.fontSize.xl,
    fontWeight: '800',
  },
  userName: {
    fontSize: Typography.fontSize.lg,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userEmail: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    gap: 4,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#166534',
  },
  guestCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
    marginBottom: Spacing.md,
  },
  guestIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F8EFE4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  guestTitle: {
    fontSize: Typography.fontSize.base,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  guestSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.md,
  },
  signInBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    gap: 6,
  },
  signInBtnText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: '700',
  },
  vendorSwitchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2D5C3',
    marginBottom: Spacing.lg,
  },
  switchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  switchTextContainer: {
    flex: 1,
  },
  switchTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  switchSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  menuContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
    paddingHorizontal: Spacing.md,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  menuBorder: {
    borderTopWidth: 1,
    borderTopColor: '#F3EDE2',
  },
  menuIcon: {
    marginRight: Spacing.md,
  },
  menuTextCol: {
    flex: 1,
  },
  menuTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: Typography.fontSize.xs,
    color: Colors.textMuted,
    marginTop: 2,
  },
});

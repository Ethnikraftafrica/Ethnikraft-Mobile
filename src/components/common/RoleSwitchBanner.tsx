import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleRole } from '@/store/slices/authSlice';
import { Colors, Radius, Shadows, Spacing, Typography } from '@/constants/theme';

export const RoleSwitchBanner = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeRole = useAppSelector((state) => state.auth.activeRole);

  const isUser = activeRole === 'user';

  const handleToggle = () => {
    dispatch(toggleRole());
    if (isUser) {
      router.replace('/(vendor)');
    } else {
      router.replace('/(user)');
    }
  };

  return (
    <View style={[styles.container, Shadows.sm]}>
      <View style={styles.leftGroup}>
        <View
          style={[
            styles.pulseRing,
            { backgroundColor: isUser ? `${Colors.primary}20` : `${Colors.secondary}20` },
          ]}
        >
          <View
            style={[
              styles.indicatorDot,
              { backgroundColor: isUser ? Colors.primary : Colors.secondary },
            ]}
          />
        </View>
        <View>
          <Text style={styles.roleLabel}>CURRENT VIEW</Text>
          <Text style={styles.roleTitle}>
            {isUser ? 'Customer Boutique' : 'Artisan Workshop'}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.82}
        style={[
          styles.switchButton,
          { backgroundColor: isUser ? Colors.primaryDark : Colors.primary },
        ]}
      >
        <Ionicons
          name="swap-horizontal"
          size={14}
          color={Colors.textInverse}
          style={styles.switchIcon}
        />
        <Text style={styles.switchButtonText}>
          {isUser ? 'Switch to Vendor' : 'Switch to Customer'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: '#F0E6D8',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.xs,
    marginBottom: Spacing.sm,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pulseRing: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  indicatorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  roleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.textMuted,
    letterSpacing: 0.8,
  },
  roleTitle: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.bold,
    color: Colors.textPrimary,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 3,
    borderRadius: Radius.full,
  },
  switchIcon: {
    marginRight: 4,
  },
  switchButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

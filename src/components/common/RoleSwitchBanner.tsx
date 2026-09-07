import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '@/store';
import { toggleRole } from '@/store/slices/authSlice';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';

export const RoleSwitchBanner = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const activeRole = useAppSelector((state) => state.auth.activeRole);

  const handleToggle = () => {
    dispatch(toggleRole());
    if (activeRole === 'user') {
      router.replace('/(vendor)');
    } else {
      router.replace('/(user)');
    }
  };

  const isUser = activeRole === 'user';

  return (
    <View style={styles.container}>
      <View style={styles.badgeGroup}>
        <View
          style={[
            styles.indicatorDot,
            { backgroundColor: isUser ? Colors.primary : Colors.secondary },
          ]}
        />
        <Text style={styles.currentRoleText}>
          {isUser ? 'Customer Mode' : 'Artisan Vendor Mode'}
        </Text>
      </View>

      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={[
          styles.switchButton,
          { backgroundColor: isUser ? Colors.primaryDark : Colors.primary },
        ]}
      >
        <Ionicons
          name="swap-horizontal"
          size={16}
          color={Colors.textInverse}
          style={styles.switchIcon}
        />
        <Text style={styles.switchButtonText}>
          Switch to {isUser ? 'Vendor' : 'Customer'}
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
    backgroundColor: Colors.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.lg,
    marginHorizontal: Spacing.md,
    marginVertical: Spacing.sm,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.sm,
  },
  currentRoleText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: Typography.fontWeight.semibold,
    color: Colors.textPrimary,
  },
  switchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 4,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Radius.full,
  },
  switchIcon: {
    marginRight: Spacing.xs,
  },
  switchButtonText: {
    color: Colors.textInverse,
    fontSize: Typography.fontSize.xs,
    fontWeight: Typography.fontWeight.bold,
  },
});

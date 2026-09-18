import React, { memo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { CartSummaryData } from './types';

interface CartSummaryProps {
  summary: CartSummaryData;
  onCheckout: () => void;
  disabled?: boolean;
}

const CartSummaryComponent: React.FC<CartSummaryProps> = ({
  summary,
  onCheckout,
  disabled = false,
}) => {
  const handleCheckoutPress = () => {
    if (disabled) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCheckout();
  };

  return (
    <View style={styles.container}>
      {/* Escrow Buyer Protection Trust Banner */}
      <View style={styles.escrowCard}>
        <View style={styles.escrowIconBox}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
        </View>
        <View style={styles.escrowTextCol}>
          <Text style={styles.escrowHeading}>100% Escrow Buyer Protection</Text>
          <Text style={styles.escrowBody}>
            Artisans are paid only after you inspect and verify delivery.
          </Text>
        </View>
      </View>

      {/* Financial Ledger */}
      <View style={styles.ledgerBox}>
        <View style={styles.ledgerRow}>
          <Text style={styles.ledgerLabel}>
            Subtotal ({summary.itemCount} {summary.itemCount === 1 ? 'item' : 'items'})
          </Text>
          <Text style={styles.ledgerValue}>
            ₦{summary.subtotal.toLocaleString()}
          </Text>
        </View>

        <View style={styles.ledgerRow}>
          <View style={styles.labelWithInfo}>
            <Text style={styles.ledgerLabel}>Standard Shipping</Text>
            <Ionicons name="information-circle-outline" size={13} color={Colors.textMuted} />
          </View>
          <Text style={[styles.ledgerValue, styles.shippingNote]}>
            {summary.shippingEstimate > 0
              ? `₦${summary.shippingEstimate.toLocaleString()}`
              : 'Calculated at checkout'}
          </Text>
        </View>

        {summary.estimatedTax > 0 && (
          <View style={styles.ledgerRow}>
            <Text style={styles.ledgerLabel}>Estimated Tax / Duties</Text>
            <Text style={styles.ledgerValue}>
              ₦{summary.estimatedTax.toLocaleString()}
            </Text>
          </View>
        )}

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View>
            <Text style={styles.totalLabel}>Estimated Total</Text>
            <Text style={styles.totalSub}>All transactions backed by Escrow</Text>
          </View>
          <Text style={styles.totalAmount}>
            ₦{summary.total.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Primary Checkout CTA */}
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={handleCheckoutPress}
        disabled={disabled || summary.itemCount === 0}
        style={[
          styles.checkoutBtn,
          (disabled || summary.itemCount === 0) && styles.checkoutBtnDisabled,
        ]}
      >
        <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />
      </TouchableOpacity>
    </View>
  );
};

export const CartSummary = memo(CartSummaryComponent);

const styles = StyleSheet.create({
  container: {
    paddingTop: Spacing.sm,
  },
  escrowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.25)',
    marginBottom: Spacing.md,
  },
  escrowIconBox: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
  },
  escrowTextCol: {
    flex: 1,
  },
  escrowHeading: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  escrowBody: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  ledgerBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
  },
  labelWithInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ledgerLabel: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  ledgerValue: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  shippingNote: {
    color: Colors.textMuted,
    fontStyle: 'italic',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs + 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  totalLabel: {
    fontSize: Typography.fontSize.sm,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  totalSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 1,
  },
  totalAmount: {
    fontSize: Typography.fontSize.lg,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.primary,
  },
  checkoutBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    gap: Spacing.xs + 2,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  checkoutBtnDisabled: {
    backgroundColor: Colors.borderDark,
    opacity: 0.6,
  },
  checkoutBtnText: {
    fontSize: Typography.fontSize.xs + 2,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
    letterSpacing: 0.3,
  },
});

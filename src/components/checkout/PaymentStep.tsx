import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { PaymentOptionType, CheckoutSummaryBreakdown } from './types';

interface PaymentStepProps {
  selectedOption: PaymentOptionType;
  onSelectOption: (option: PaymentOptionType) => void;
  summary: CheckoutSummaryBreakdown;
  carrierServiceName?: string;
  onBack: () => void;
  onSubmitOrder: () => void;
  isSubmitting?: boolean;
}

const PAYMENT_OPTIONS: {
  key: PaymentOptionType;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  badge?: string;
}[] = [
  {
    key: 'card',
    title: 'Debit / Credit Card',
    subtitle: 'Mastercard, Visa, Verve (Secured by Flutterwave)',
    icon: 'card-outline',
    badge: 'POPULAR',
  },
  {
    key: 'bank_transfer',
    title: 'Bank Transfer',
    subtitle: 'Instant dynamic dedicated account transfer',
    icon: 'business-outline',
  },
  {
    key: 'ussd',
    title: 'USSD Banking',
    subtitle: 'Fast offline-capable bank shortcode dialer',
    icon: 'keypad-outline',
  },
];

export const PaymentStep: React.FC<PaymentStepProps> = ({
  selectedOption,
  onSelectOption,
  summary,
  carrierServiceName = 'Standard Logistics',
  onBack,
  onSubmitOrder,
  isSubmitting = false,
}) => {
  const handleSelect = useCallback(
    (option: PaymentOptionType) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onSelectOption(option);
    },
    [onSelectOption]
  );

  const handleSubmit = () => {
    if (isSubmitting) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    onSubmitOrder();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.sectionPretitle}>STEP 3 OF 3</Text>
          <Text style={styles.sectionTitle}>Payment & Review</Text>
          <Text style={styles.sectionSubtitle}>
            Select your preferred payment channel and review your final order total.
          </Text>
        </View>

        {/* Payment Channels List */}
        <Text style={styles.groupHeading}>Select Payment Channel</Text>
        {PAYMENT_OPTIONS.map((opt) => {
          const isSelected = selectedOption === opt.key;

          return (
            <TouchableOpacity
              key={opt.key}
              activeOpacity={0.85}
              onPress={() => handleSelect(opt.key)}
              style={[
                styles.optionCard,
                isSelected && styles.optionCardSelected,
              ]}
            >
              {/* Radio Indicator */}
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>

              {/* Icon */}
              <View
                style={[
                  styles.optionIconBox,
                  isSelected && styles.optionIconBoxSelected,
                ]}
              >
                <Ionicons
                  name={opt.icon}
                  size={20}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
              </View>

              {/* Title & Sub */}
              <View style={styles.optionInfoCol}>
                <View style={styles.titleRow}>
                  <Text style={styles.optionTitle}>{opt.title}</Text>
                  {opt.badge && (
                    <View style={styles.optionBadge}>
                      <Text style={styles.optionBadgeText}>{opt.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.optionSub}>{opt.subtitle}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Escrow Guarantee Highlight */}
        <View style={styles.escrowCard}>
          <View style={styles.escrowIconBox}>
            <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
          </View>
          <View style={styles.escrowTextCol}>
            <Text style={styles.escrowHeading}>100% Escrow Buyer Protection</Text>
            <Text style={styles.escrowBody}>
              Your funds are held securely in escrow and released to the artisan only after your order is safely delivered and inspected.
            </Text>
          </View>
        </View>

        {/* Final Financial Ledger */}
        <Text style={styles.groupHeading}>Order Summary</Text>
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
            <Text style={styles.ledgerLabel}>Shipping ({carrierServiceName})</Text>
            <Text style={styles.ledgerValue}>
              ₦{summary.shippingCost.toLocaleString()}
            </Text>
          </View>

          {summary.tax > 0 && (
            <View style={styles.ledgerRow}>
              <Text style={styles.ledgerLabel}>Estimated Tax / Duties</Text>
              <Text style={styles.ledgerValue}>
                ₦{summary.tax.toLocaleString()}
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.totalRow}>
            <View>
              <Text style={styles.totalLabel}>Total Payable</Text>
              <Text style={styles.totalSub}>Includes escrow protection</Text>
            </View>
            <Text style={styles.totalAmount}>
              ₦{summary.total.toLocaleString()}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBack}
          disabled={isSubmitting}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.submitBtnText}>Confirm & Pay ₦{summary.total.toLocaleString()}</Text>
              <Ionicons name="lock-closed" size={15} color={Colors.textInverse} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 90,
  },
  headerBox: {
    marginBottom: Spacing.sm + 2,
  },
  sectionPretitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  sectionTitle: {
    fontSize: Typography.fontSize.xl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginTop: 2,
  },
  sectionSubtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 18,
  },
  groupHeading: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    marginBottom: Spacing.xs + 2,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm,
    gap: 10,
  },
  optionCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.surfaceSubtle,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.borderDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  optionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  optionIconBoxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(196, 108, 39, 0.3)',
  },
  optionInfoCol: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  optionBadge: {
    backgroundColor: 'rgba(196, 108, 39, 0.1)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  optionBadgeText: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  optionSub: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 2,
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
    marginVertical: Spacing.sm,
  },
  escrowIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
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
    marginTop: 2,
    lineHeight: 14,
  },
  ledgerBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.xs + 2,
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
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs + 4,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  bottomDock: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    flexDirection: 'row',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceSubtle,
    gap: 4,
  },
  backBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
  },
  submitBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: Colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});

import React, { useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { ShippingQuoteOption } from './types';

interface ShippingCarrierStepProps {
  quotes: ShippingQuoteOption[];
  selectedQuoteId: string | null;
  onSelectQuote: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
  deliveryAddressSummary?: string;
}

export const ShippingCarrierStep: React.FC<ShippingCarrierStepProps> = ({
  quotes,
  selectedQuoteId,
  onSelectQuote,
  onBack,
  onContinue,
  deliveryAddressSummary = 'Lagos, Nigeria',
}) => {
  const handleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectQuote(id);
  }, [onSelectQuote]);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBack();
  };

  const getProviderIcon = (provider: ShippingQuoteOption['provider']) => {
    switch (provider) {
      case 'DHL':
        return 'airplane-outline';
      case 'AAJ':
        return 'cube-outline';
      case 'FEDEX':
        return 'car-outline';
      default:
        return 'navigate-outline';
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.headerBox}>
          <Text style={styles.sectionPretitle}>STEP 2 OF 3</Text>
          <Text style={styles.sectionTitle}>Logistics & Shipping</Text>
          <Text style={styles.sectionSubtitle}>
            Select your preferred carrier speed and delivery timeframe.
          </Text>
        </View>

        {/* Destination Pill */}
        <View style={styles.destinationPill}>
          <Ionicons name="location-sharp" size={14} color={Colors.primary} />
          <Text style={styles.destinationText} numberOfLines={1}>
            Delivering to: {deliveryAddressSummary}
          </Text>
        </View>

        {/* Carrier Quotes List */}
        {quotes.map((q) => {
          const isSelected = selectedQuoteId === q.id;

          return (
            <TouchableOpacity
              key={q.id}
              activeOpacity={0.85}
              onPress={() => handleSelect(q.id)}
              style={[
                styles.quoteCard,
                isSelected && styles.quoteCardSelected,
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
                  styles.carrierIconBox,
                  isSelected && styles.carrierIconBoxSelected,
                ]}
              >
                <Ionicons
                  name={getProviderIcon(q.provider)}
                  size={20}
                  color={isSelected ? Colors.primary : Colors.textSecondary}
                />
              </View>

              {/* Middle Details */}
              <View style={styles.carrierInfoCol}>
                <View style={styles.carrierTitleRow}>
                  <Text style={styles.serviceName}>{q.serviceName}</Text>
                  {q.isRecommended && (
                    <View style={styles.recommendedBadge}>
                      <Text style={styles.recommendedText}>RECOMMENDED</Text>
                    </View>
                  )}
                </View>

                <View style={styles.etaRow}>
                  <Ionicons name="time-outline" size={12} color={Colors.textMuted} />
                  <Text style={styles.etaText}>
                    {q.estimatedDays} {q.estimatedDays === 1 ? 'Business Day' : 'Business Days'} (Est. {q.estimatedDate})
                  </Text>
                </View>
              </View>

              {/* Price */}
              <View style={styles.priceBox}>
                <Text style={styles.feeText}>
                  ₦{q.shippingFee.toLocaleString()}
                </Text>
                {q.tax > 0 && (
                  <Text style={styles.taxSubText}>+₦{q.tax} tax</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Logistics Protection Notice */}
        <View style={styles.insuranceNoticeCard}>
          <Ionicons name="shield-checkmark-outline" size={16} color={Colors.primary} />
          <Text style={styles.insuranceNoticeText}>
            All shipments include transit damage and loss protection insured by Ethnikraft Escrow.
          </Text>
        </View>
      </ScrollView>

      {/* Sticky Bottom Dual Actions */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleBack}
          style={styles.backBtn}
        >
          <Ionicons name="arrow-back" size={16} color={Colors.textPrimary} />
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleContinue}
          style={styles.continueBtn}
        >
          <Text style={styles.continueBtnText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={16} color={Colors.textInverse} />
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
  destinationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 7,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
    marginBottom: Spacing.md,
  },
  destinationText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.primaryDark,
    flex: 1,
  },
  quoteCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
    gap: 10,
  },
  quoteCardSelected: {
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
  carrierIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  carrierIconBoxSelected: {
    backgroundColor: '#FFFFFF',
    borderColor: 'rgba(196, 108, 39, 0.3)',
  },
  carrierInfoCol: {
    flex: 1,
  },
  carrierTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  serviceName: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  recommendedText: {
    fontSize: 8,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: '#166534',
  },
  etaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  etaText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  priceBox: {
    alignItems: 'flex-end',
  },
  feeText: {
    fontSize: Typography.fontSize.sm + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  taxSubText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
  },
  insuranceNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    padding: Spacing.sm + 2,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
    marginTop: 4,
  },
  insuranceNoticeText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 15,
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
  continueBtn: {
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
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  continueBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});

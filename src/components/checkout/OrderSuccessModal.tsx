import React, { useCallback, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography, Shadows } from '@/constants/theme';

interface OrderSuccessModalProps {
  visible: boolean;
  orderNumber: string;
  totalAmount: number;
  estimatedDeliveryDate?: string;
  shippingCarrier?: string;
  onTrackOrder: () => void;
  onContinueShopping: () => void;
}

export const OrderSuccessModal: React.FC<OrderSuccessModalProps> = ({
  visible,
  orderNumber,
  totalAmount,
  estimatedDeliveryDate = '3 - 5 Business Days',
  shippingCarrier = 'AAJ Standard Logistics',
  onTrackOrder,
  onContinueShopping,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyOrderNumber = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  const handleTrack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onTrackOrder();
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onContinueShopping();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.cardContainer}>
          {/* Top Success Badge */}
          <View style={styles.iconCircleOuter}>
            <View style={styles.iconCircleInner}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
            </View>
          </View>

          {/* Heading */}
          <Text style={styles.title}>Order Confirmed!</Text>
          <Text style={styles.subtitle}>
            Your payment is safely held in Escrow. The artisan workshop has been notified to begin preparing your piece.
          </Text>

          {/* Order Details Card */}
          <View style={styles.orderInfoCard}>
            <View style={styles.orderInfoRow}>
              <Text style={styles.infoLabel}>Order Reference</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleCopyOrderNumber}
                style={styles.orderNumberPill}
              >
                <Text style={styles.orderNumberText}>#{orderNumber}</Text>
                <Ionicons
                  name={copied ? 'checkmark' : 'copy-outline'}
                  size={12}
                  color={copied ? Colors.success : Colors.primary}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.orderInfoRow}>
              <Text style={styles.infoLabel}>Total Paid (Escrow)</Text>
              <Text style={styles.totalText}>₦{totalAmount.toLocaleString()}</Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.orderInfoRow}>
              <Text style={styles.infoLabel}>Estimated Arrival</Text>
              <Text style={styles.carrierText}>
                {estimatedDeliveryDate} ({shippingCarrier})
              </Text>
            </View>
          </View>

          {/* Escrow Guarantee Pill */}
          <View style={styles.escrowNotice}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.escrowNoticeText}>
              Artisan receives disbursement only after your delivery inspection.
            </Text>
          </View>

          {/* Action CTAs */}
          <View style={styles.actionCol}>
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleTrack}
              style={styles.primaryBtn}
            >
              <Ionicons name="navigate-outline" size={16} color={Colors.textInverse} />
              <Text style={styles.primaryBtnText}>Track Order in Real-Time</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleContinue}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(16, 18, 19, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconCircleOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.3)',
    marginBottom: Spacing.md,
  },
  iconCircleInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: Typography.fontSize.xxl,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xs,
  },
  orderInfoCard: {
    width: '100%',
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  orderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
  },
  orderNumberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.2)',
  },
  orderNumberText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  totalText: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  carrierText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textPrimary,
    maxWidth: '55%',
    textAlign: 'right',
  },
  infoDivider: {
    height: 1,
    backgroundColor: 'rgba(196, 108, 39, 0.12)',
    marginVertical: Spacing.xs + 2,
  },
  escrowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(196, 108, 39, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.md,
    marginBottom: Spacing.lg,
  },
  escrowNoticeText: {
    fontSize: 9.5,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.primaryDark,
    flex: 1,
    lineHeight: 13,
  },
  actionCol: {
    width: '100%',
    gap: Spacing.sm,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.full,
    gap: 6,
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
  primaryBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
  secondaryBtn: {
    paddingVertical: Spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
  },
});

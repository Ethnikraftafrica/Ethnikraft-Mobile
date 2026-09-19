import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { clearCart } from '@/store/slices/cartSlice';
import { useVerifyPaymentMutation, VerifyPaymentResult } from '@/store/api/paymentApi';
import { Colors, Radius, Shadows, Spacing, Typography, FontFamily } from '@/constants/theme';
import { formatPrice } from '@/utils/price';

type ScreenState = 'verifying' | 'success' | 'cancelled' | 'error';

export default function PaymentSuccessScreen() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tx_ref?: string;
    transaction_id?: string;
    status?: string;
    order_id?: string;
  }>();

  const lastOrderNum = useAppSelector((state) => state.cart.lastCompletedOrderNumber);
  const currency = useAppSelector((state) => state.currency);

  const [verifyPayment, { isLoading: isVerifyingApi }] = useVerifyPaymentMutation();
  const [screenState, setScreenState] = useState<ScreenState>('verifying');
  const [verificationResult, setVerificationResult] = useState<VerifyPaymentResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [copiedRef, setCopiedRef] = useState(false);

  // Animated values
  const scaleAnim = React.useRef(new Animated.Value(0.8)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  const triggerEntryAnimation = useCallback(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim]);

  // Derive target reference
  const targetTxRef = useMemo(() => {
    return params.tx_ref || params.transaction_id || params.order_id || lastOrderNum || '';
  }, [params.tx_ref, params.transaction_id, params.order_id, lastOrderNum]);

  const rawStatus = (params.status || '').toLowerCase();

  const handleVerification = useCallback(async () => {
    // 1. Check if user cancelled or failed at gateway
    if (rawStatus === 'cancelled' || rawStatus === 'failed') {
      setScreenState('cancelled');
      triggerEntryAnimation();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // 2. If no transaction reference available
    if (!targetTxRef) {
      // If status says successful, assume order was completed
      if (rawStatus === 'successful' || rawStatus === 'completed') {
        dispatch(clearCart());
        setScreenState('success');
        triggerEntryAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        return;
      }

      setScreenState('error');
      setErrorMessage('No payment reference found. Your order may still be processing.');
      triggerEntryAnimation();
      return;
    }

    // 3. Perform backend verification
    setScreenState('verifying');
    try {
      const res = await verifyPayment(targetTxRef).unwrap();
      setVerificationResult(res);

      if (res.status === 'successful') {
        dispatch(clearCart());
        setScreenState('success');
        triggerEntryAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else if (res.status === 'cancelled') {
        setScreenState('cancelled');
        triggerEntryAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } else {
        setScreenState('error');
        setErrorMessage(res.message || 'Payment status could not be verified.');
        triggerEntryAnimation();
      }
    } catch (err: any) {
      // Check if already processed or successful in error message
      const errMsg = err?.data?.message || err?.message || '';
      const isAlreadyProcessed =
        errMsg.toLowerCase().includes('already') ||
        errMsg.toLowerCase().includes('processed') ||
        errMsg.toLowerCase().includes('completed');

      if (isAlreadyProcessed || rawStatus === 'successful' || rawStatus === 'completed') {
        dispatch(clearCart());
        setScreenState('success');
        triggerEntryAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setScreenState('error');
        setErrorMessage(errMsg || 'Verification connection timed out. Please check your orders.');
        triggerEntryAnimation();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  }, [rawStatus, targetTxRef, verifyPayment, dispatch, triggerEntryAnimation]);

  useEffect(() => {
    handleVerification();
  }, [handleVerification]);

  const handleCopyReference = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2500);
  }, []);

  const handleViewOrders = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(user)/orders');
  }, [router]);

  const handleContinueShopping = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/(user)');
  }, [router]);

  // Display Reference
  const displayReference =
    verificationResult?.orderIds?.[0] ||
    targetTxRef ||
    `EK-${Date.now().toString().slice(-8)}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: Math.max(insets.top, 24), paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================== */}
        {/* 1. VERIFYING STATE                                    */}
        {/* ==================================================== */}
        {screenState === 'verifying' && (
          <View style={styles.centerContainer}>
            <View style={styles.loadingCircle}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.verifyingTitle}>Verifying Payment</Text>
            <Text style={styles.verifyingSubtitle}>
              Communicating with Flutterwave and securing your artisan escrow...
            </Text>
            <View style={styles.escrowPill}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.secondary} />
              <Text style={styles.escrowPillText}>Escrow Protection Active</Text>
            </View>
          </View>
        )}

        {/* ==================================================== */}
        {/* 2. SUCCESS STATE                                     */}
        {/* ==================================================== */}
        {screenState === 'success' && (
          <Animated.View
            style={[
              styles.stateContainer,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            {/* Celebration Icon */}
            <View style={styles.celebrationCircle}>
              <View style={styles.celebrationInnerCircle}>
                <Ionicons name="checkmark" size={44} color="#15803D" />
              </View>
            </View>

            <View style={styles.badgeRow}>
              <View style={styles.verifiedChip}>
                <Ionicons name="shield-checkmark" size={13} color="#166534" style={{ marginRight: 4 }} />
                <Text style={styles.verifiedChipText}>ESCROW PAYMENT SECURED</Text>
              </View>
            </View>

            <Text style={styles.successTitle}>Order Placed Successfully!</Text>
            <Text style={styles.successDescription}>
              Your payment has been confirmed. Your funds are protected in escrow until your handcrafted items are delivered and inspected.
            </Text>

            {/* Receipt Summary Card */}
            <View style={[styles.receiptCard, Shadows.sm]}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Order Reference</Text>
                <TouchableOpacity
                  onPress={handleCopyReference}
                  style={styles.copyPill}
                  activeOpacity={0.7}
                >
                  <Text style={styles.receiptValueBold} numberOfLines={1}>
                    {displayReference}
                  </Text>
                  <Ionicons
                    name={copiedRef ? 'checkmark-done' : 'copy-outline'}
                    size={14}
                    color={copiedRef ? Colors.success : Colors.secondary}
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.receiptDivider} />

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Payment Gateway</Text>
                <Text style={styles.receiptValue}>Flutterwave Secure Checkout</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Fulfillment Logistics</Text>
                <Text style={styles.receiptValue}>Ethnikraft Verified Courier</Text>
              </View>

              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Estimated Delivery</Text>
                <Text style={styles.receiptValueHighlight}>3 – 5 Business Days</Text>
              </View>

              {verificationResult?.amount ? (
                <>
                  <View style={styles.receiptDivider} />
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptTotalLabel}>Total Paid</Text>
                    <Text style={styles.receiptTotalValue}>
                      {formatPrice(verificationResult.amount, currency.code, currency.rate)}
                    </Text>
                  </View>
                </>
              ) : null}
            </View>

            {/* Escrow Guarantee Box */}
            <View style={styles.guaranteeBox}>
              <Ionicons name="sparkles" size={18} color="#92400E" style={styles.guaranteeIcon} />
              <View style={{ flex: 1 }}>
                <Text style={styles.guaranteeTitle}>Artisan Escrow Shield</Text>
                <Text style={styles.guaranteeText}>
                  The creator is notified immediately to begin preparation. Payment is released to them only when delivery is complete.
                </Text>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.primaryButton, Shadows.md]}
                onPress={handleViewOrders}
                activeOpacity={0.85}
              >
                <Ionicons name="cube-outline" size={20} color={Colors.textInverse} style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>View Order & Live Timeline</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleContinueShopping}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Continue Shopping</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.secondary} style={{ marginLeft: 6 }} />
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ==================================================== */}
        {/* 3. CANCELLED STATE                                   */}
        {/* ==================================================== */}
        {screenState === 'cancelled' && (
          <Animated.View
            style={[
              styles.stateContainer,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={[styles.celebrationCircle, { backgroundColor: '#FEF3C7' }]}>
              <View style={[styles.celebrationInnerCircle, { backgroundColor: '#FDE68A' }]}>
                <Ionicons name="alert-circle-outline" size={44} color="#B45309" />
              </View>
            </View>

            <Text style={styles.cancelledTitle}>Payment Incomplete</Text>
            <Text style={styles.cancelledDescription}>
              The payment was cancelled or not completed on Flutterwave. No funds were debited from your account.
            </Text>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={20} color={Colors.textSecondary} style={{ marginRight: 8 }} />
              <Text style={styles.infoBoxText}>
                Your order is safely preserved as pending. You can complete the checkout anytime from your Orders tab.
              </Text>
            </View>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.primaryButton, Shadows.md]}
                onPress={handleViewOrders}
                activeOpacity={0.85}
              >
                <Ionicons name="receipt-outline" size={18} color={Colors.textInverse} style={{ marginRight: 8 }} />
                <Text style={styles.primaryButtonText}>View Pending Orders</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleContinueShopping}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Return to Marketplace</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}

        {/* ==================================================== */}
        {/* 4. ERROR / TIMEOUT STATE                             */}
        {/* ==================================================== */}
        {screenState === 'error' && (
          <Animated.View
            style={[
              styles.stateContainer,
              { opacity: opacityAnim, transform: [{ scale: scaleAnim }] },
            ]}
          >
            <View style={[styles.celebrationCircle, { backgroundColor: '#FEE2E2' }]}>
              <View style={[styles.celebrationInnerCircle, { backgroundColor: '#FECACA' }]}>
                <Ionicons name="refresh-circle-outline" size={44} color="#B91C1C" />
              </View>
            </View>

            <Text style={styles.cancelledTitle}>Verification Pending</Text>
            <Text style={styles.cancelledDescription}>
              {errorMessage ||
                'We could not immediately verify the payment gateway response. Your order may take a moment to update.'}
            </Text>

            <View style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.primaryButton, Shadows.md]}
                onPress={handleVerification}
                activeOpacity={0.85}
                disabled={isVerifyingApi}
              >
                {isVerifyingApi ? (
                  <ActivityIndicator size="small" color={Colors.textInverse} style={{ marginRight: 8 }} />
                ) : (
                  <Ionicons name="reload-outline" size={18} color={Colors.textInverse} style={{ marginRight: 8 }} />
                )}
                <Text style={styles.primaryButtonText}>
                  {isVerifyingApi ? 'Checking Status...' : 'Retry Verification'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={handleViewOrders}
                activeOpacity={0.85}
              >
                <Text style={styles.secondaryButtonText}>Check My Orders</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  stateContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF7ED',
    borderWidth: 2,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  verifyingTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 26,
    color: Colors.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  verifyingSubtitle: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 21,
    marginBottom: 24,
  },
  escrowPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5ED',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(196, 108, 39, 0.25)',
  },
  escrowPillText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 12,
    color: Colors.secondary,
    marginLeft: 6,
  },
  celebrationCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  celebrationInnerCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#BBF7D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeRow: {
    marginBottom: 12,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  verifiedChipText: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 10,
    color: '#166534',
    letterSpacing: 0.8,
  },
  successTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 28,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  successDescription: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
    marginBottom: 24,
  },
  receiptCard: {
    width: '100%',
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 7,
  },
  receiptLabel: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  receiptValue: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 13,
    color: Colors.textPrimary,
  },
  receiptValueBold: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 13,
    color: Colors.secondary,
    maxWidth: 160,
  },
  receiptValueHighlight: {
    fontFamily: FontFamily.poppinsSemiBold,
    fontSize: 13,
    color: '#15803D',
  },
  receiptTotalLabel: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  receiptTotalValue: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 17,
    color: Colors.secondary,
  },
  receiptDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  copyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF5ED',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  guaranteeBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#FDE68A',
    width: '100%',
    marginBottom: 28,
  },
  guaranteeIcon: {
    marginRight: 10,
    marginTop: 2,
  },
  guaranteeTitle: {
    fontFamily: FontFamily.poppinsBold,
    fontSize: 12.5,
    color: '#92400E',
    marginBottom: 2,
  },
  guaranteeText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 11.5,
    color: '#78350F',
    lineHeight: 16,
  },
  buttonGroup: {
    width: '100%',
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.full,
    width: '100%',
  },
  primaryButtonText: {
    fontFamily: FontFamily.poppinsSemiBold,
    fontSize: 15,
    color: Colors.textInverse,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.full,
    width: '100%',
  },
  secondaryButtonText: {
    fontFamily: FontFamily.poppinsMedium,
    fontSize: 14,
    color: Colors.secondary,
  },
  cancelledTitle: {
    fontFamily: FontFamily.cormorantBold,
    fontSize: 26,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  cancelledDescription: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 300,
    lineHeight: 22,
    marginBottom: 24,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    width: '100%',
    marginBottom: 28,
  },
  infoBoxText: {
    fontFamily: FontFamily.poppinsRegular,
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});

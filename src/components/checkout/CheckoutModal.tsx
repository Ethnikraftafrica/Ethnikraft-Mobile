import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { SavedAddress } from '@/store/slices/profileSlice';
import {
  CheckoutStep,
  ShippingQuoteOption,
  PaymentOptionType,
  CheckoutAddressForm,
  CheckoutSummaryBreakdown,
} from './types';
import { CheckoutStepper } from './CheckoutStepper';
import { AddressStep } from './AddressStep';
import { ShippingCarrierStep } from './ShippingCarrierStep';
import { PaymentStep } from './PaymentStep';
import { OrderSuccessModal } from './OrderSuccessModal';

// Default mock carrier quotes matching Ethnikraft backend options
export const DEFAULT_SHIPPING_QUOTES: ShippingQuoteOption[] = [
  {
    id: 'quote_aaj_std',
    provider: 'AAJ',
    serviceName: 'AAJ Standard Logistics',
    shippingFee: 3200,
    tax: 300,
    total: 3500,
    currency: 'NGN',
    estimatedDays: 4,
    estimatedDate: 'Sep 23 - Sep 25',
    isRecommended: true,
  },
  {
    id: 'quote_dhl_exp',
    provider: 'DHL',
    serviceName: 'DHL Express Africa',
    shippingFee: 7800,
    tax: 700,
    total: 8500,
    currency: 'NGN',
    estimatedDays: 2,
    estimatedDate: 'Sep 21 - Sep 22',
  },
  {
    id: 'quote_eth_regional',
    provider: 'ETHNIKRAFT',
    serviceName: 'Ethnikraft Regional Hub',
    shippingFee: 2500,
    tax: 0,
    total: 2500,
    currency: 'NGN',
    estimatedDays: 6,
    estimatedDate: 'Sep 26 - Sep 28',
  },
];

interface CheckoutModalProps {
  visible: boolean;
  onClose: () => void;
  subtotal: number;
  itemCount: number;
  savedAddresses: SavedAddress[];
  shippingQuotes?: ShippingQuoteOption[];
  onTrackOrderNavigation: () => void;
  onOrderCompleted?: (orderData: {
    orderNumber: string;
    addressId: string;
    quoteId: string;
    paymentOption: PaymentOptionType;
  }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  visible,
  onClose,
  subtotal,
  itemCount,
  savedAddresses,
  shippingQuotes = DEFAULT_SHIPPING_QUOTES,
  onTrackOrderNavigation,
  onOrderCompleted,
}) => {
  const [step, setStep] = useState<CheckoutStep>('address');
  const [addresses, setAddresses] = useState<SavedAddress[]>(savedAddresses);

  // Sync addresses if props change
  useEffect(() => {
    if (savedAddresses.length > 0) {
      setAddresses(savedAddresses);
    }
  }, [savedAddresses]);

  // Pre-select default address
  const defaultAddressId = useMemo(() => {
    const def = addresses.find((a) => a.isDefault);
    return def ? def.id : addresses[0]?.id || null;
  }, [addresses]);

  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    defaultAddressId
  );

  useEffect(() => {
    if (!selectedAddressId && defaultAddressId) {
      setSelectedAddressId(defaultAddressId);
    }
  }, [defaultAddressId, selectedAddressId]);

  // Pre-select first recommended shipping quote
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(
    shippingQuotes[0]?.id || null
  );

  // Payment Option selection
  const [selectedPaymentOption, setSelectedPaymentOption] =
    useState<PaymentOptionType>('card');

  // Success Confirmation State
  const [isSuccessModalVisible, setIsSuccessModalVisible] = useState(false);
  const [createdOrderNumber, setCreatedOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Current selected quote object
  const activeQuote = useMemo(() => {
    return (
      shippingQuotes.find((q) => q.id === selectedQuoteId) || shippingQuotes[0]
    );
  }, [shippingQuotes, selectedQuoteId]);

  // Active address object
  const activeAddress = useMemo(() => {
    return addresses.find((a) => a.id === selectedAddressId) || addresses[0];
  }, [addresses, selectedAddressId]);

  // Summary calculation
  const summary: CheckoutSummaryBreakdown = useMemo(() => {
    const shippingCost = activeQuote ? activeQuote.total : 3500;
    const tax = 0;
    const total = subtotal + shippingCost + tax;

    return {
      subtotal,
      shippingCost,
      tax,
      total,
      itemCount,
    };
  }, [subtotal, activeQuote, itemCount]);

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStep('address');
    onClose();
  }, [onClose]);

  const handleAddNewAddress = useCallback((newAddr: CheckoutAddressForm) => {
    const id = `addr_${Date.now()}`;
    const formatted: SavedAddress = {
      id,
      addressType: newAddr.addressType,
      street: newAddr.street,
      city: newAddr.city,
      state: newAddr.state,
      country: newAddr.country,
      phoneNumber: newAddr.phoneNumber,
      additionalDirections: newAddr.additionalDirections,
      isDefault: false,
    };

    setAddresses((prev) => [formatted, ...prev]);
    setSelectedAddressId(id);
  }, []);

  const handleSubmitOrder = useCallback(() => {
    setIsSubmitting(true);

    // Simulate order generation handoff
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedNumber = `EK-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      setCreatedOrderNumber(generatedNumber);
      setIsSuccessModalVisible(true);

      if (onOrderCompleted && selectedAddressId && selectedQuoteId) {
        onOrderCompleted({
          orderNumber: generatedNumber,
          addressId: selectedAddressId,
          quoteId: selectedQuoteId,
          paymentOption: selectedPaymentOption,
        });
      }
    }, 900);
  }, [selectedAddressId, selectedQuoteId, selectedPaymentOption, onOrderCompleted]);

  const handleTrackFromSuccess = useCallback(() => {
    setIsSuccessModalVisible(false);
    onClose();
    onTrackOrderNavigation();
  }, [onClose, onTrackOrderNavigation]);

  const handleContinueShoppingFromSuccess = useCallback(() => {
    setIsSuccessModalVisible(false);
    onClose();
  }, [onClose]);

  return (
    <>
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleClose}
        statusBarTranslucent
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleCol}>
              <Text style={styles.headerPretitle}>CHECKOUT</Text>
              <Text style={styles.headerTitle}>Order Checkout</Text>
            </View>

            <TouchableOpacity
              activeOpacity={0.75}
              onPress={handleClose}
              style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={22} color={Colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Stepper Progress */}
          <CheckoutStepper currentStep={step} />

          {/* Active Step Content */}
          <View style={styles.contentContainer}>
            {step === 'address' && (
              <AddressStep
                savedAddresses={addresses}
                selectedAddressId={selectedAddressId}
                onSelectAddress={setSelectedAddressId}
                onAddNewAddress={handleAddNewAddress}
                onContinue={() => setStep('shipping')}
              />
            )}

            {step === 'shipping' && (
              <ShippingCarrierStep
                quotes={shippingQuotes}
                selectedQuoteId={selectedQuoteId}
                onSelectQuote={setSelectedQuoteId}
                deliveryAddressSummary={
                  activeAddress
                    ? `${activeAddress.street}, ${activeAddress.city}`
                    : 'Lagos, Nigeria'
                }
                onBack={() => setStep('address')}
                onContinue={() => setStep('payment')}
              />
            )}

            {step === 'payment' && (
              <PaymentStep
                selectedOption={selectedPaymentOption}
                onSelectOption={setSelectedPaymentOption}
                summary={summary}
                carrierServiceName={activeQuote?.serviceName || 'AAJ Standard Express'}
                onBack={() => setStep('shipping')}
                onSubmitOrder={handleSubmitOrder}
                isSubmitting={isSubmitting}
              />
            )}
          </View>
        </SafeAreaView>
      </Modal>

      {/* Order Confirmed Celebration Modal */}
      <OrderSuccessModal
        visible={isSuccessModalVisible}
        orderNumber={createdOrderNumber}
        totalAmount={summary.total}
        estimatedDeliveryDate={activeQuote?.estimatedDate || '3 - 5 Business Days'}
        shippingCarrier={activeQuote?.serviceName || 'AAJ Standard Logistics'}
        onTrackOrder={handleTrackFromSuccess}
        onContinueShopping={handleContinueShoppingFromSuccess}
      />
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  headerTitleCol: {
    flex: 1,
  },
  headerPretitle: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
    letterSpacing: 1,
  },
  headerTitle: {
    fontSize: Typography.fontSize.base + 2,
    fontFamily: Typography.fontFamily.cormorantBold,
    color: Colors.textPrimary,
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  contentContainer: {
    flex: 1,
  },
});

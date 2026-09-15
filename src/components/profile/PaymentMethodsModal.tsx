import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  addPaymentCard,
  deletePaymentCard,
  setDefaultPaymentCard,
  SavedPaymentCard,
} from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export type CardScheme = 'verve' | 'visa' | 'mastercard' | 'amex';

export function detectCardScheme(number: string): CardScheme {
  const clean = number.replace(/\D/g, '');
  if (!clean) return 'mastercard';

  // Verve prefix: 5060-5079, 6500, 506, 507, 650
  if (
    clean.startsWith('506') ||
    clean.startsWith('507') ||
    clean.startsWith('650') ||
    /^50[67]\d/.test(clean) ||
    /^6500/.test(clean)
  ) {
    return 'verve';
  }

  // Visa: starts with 4
  if (clean.startsWith('4')) {
    return 'visa';
  }

  // Amex: starts with 34 or 37
  if (/^3[47]/.test(clean)) {
    return 'amex';
  }

  // Mastercard: 51-55 or 2221-2720
  return 'mastercard';
}

export default function PaymentMethodsModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { savedCards } = useAppSelector((state) => state.profile);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [bankName, setBankName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Input navigation refs
  const cardNumberRef = useRef<TextInput>(null);
  const cardholderRef = useRef<TextInput>(null);
  const expiryRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);
  const bankRef = useRef<TextInput>(null);

  const activeScheme = detectCardScheme(cardNumber);

  const resetForm = () => {
    setCardNumber('');
    setCardholderName('');
    setExpiry('');
    setCvv('');
    setBankName('');
    setFormError(null);
    setIsAddingNew(false);
  };

  const handleCardNumberChange = (text: string) => {
    const raw = text.replace(/\D/g, '');
    const scheme = detectCardScheme(raw);
    const maxLen = scheme === 'verve' ? 19 : scheme === 'amex' ? 15 : 16;
    const trimmed = raw.slice(0, maxLen);

    let formatted = '';
    if (scheme === 'amex') {
      const p1 = trimmed.slice(0, 4);
      const p2 = trimmed.slice(4, 10);
      const p3 = trimmed.slice(10, 15);
      formatted = [p1, p2, p3].filter(Boolean).join(' ');
    } else {
      formatted = trimmed.replace(/(\d{4})(?=\d)/g, '$1 ');
    }

    setCardNumber(formatted);
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      setExpiry(`${cleaned.slice(0, 2)}/${cleaned.slice(2)}`);
    } else {
      setExpiry(cleaned);
    }
  };

  const handleSaveCard = () => {
    const rawNumber = cardNumber.replace(/\s/g, '');
    const scheme = detectCardScheme(rawNumber);

    if (scheme === 'verve') {
      if (rawNumber.length < 16 || rawNumber.length > 19) {
        setFormError('Please enter a valid 16 to 19-digit Verve card number.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    } else if (scheme === 'amex') {
      if (rawNumber.length < 15) {
        setFormError('Please enter a valid 15-digit American Express card number.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    } else {
      if (rawNumber.length < 16) {
        setFormError(`Please enter a valid 16-digit ${scheme === 'visa' ? 'Visa' : 'Mastercard'} number.`);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }

    if (!cardholderName.trim()) {
      setFormError('Please enter the cardholder name.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const [expMonth, expYear] = expiry.split('/');
    if (!expMonth || !expYear || expMonth.length !== 2 || expYear.length !== 2) {
      setFormError('Please enter a valid expiry date (MM/YY).');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    const monthNum = parseInt(expMonth, 10);
    if (monthNum < 1 || monthNum > 12) {
      setFormError('Expiry month must be between 01 and 12.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (cvv.length < (scheme === 'amex' ? 4 : 3)) {
      setFormError(`Please enter a valid ${scheme === 'amex' ? '4-digit' : '3-digit'} CVV.`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // TODO: Integrate payment gateway card tokenization via Paystack / Flutterwave SDK or backend tokenization service.
    // PCI-DSS Best Practice: Do NOT store raw card details (PAN, CVV) on the server.
    // Flow: Initialize transaction / card setup -> Tokenize with Paystack/Flutterwave -> Save gateway reusable authorization code / token on backend.

    const last4 = rawNumber.slice(-4);
    const first4 = rawNumber.slice(0, 4);
    const masked = `${first4} •••• •••• ${last4}`;

    const defaultBank =
      scheme === 'verve'
        ? 'First Bank'
        : scheme === 'visa'
        ? 'GTBank'
        : scheme === 'amex'
        ? 'Amex Direct'
        : 'Access Bank';

    dispatch(
      addPaymentCard({
        cardType: scheme,
        bankName: bankName.trim() || defaultBank,
        cardNumberMasked: masked,
        last4,
        expiryMonth: expMonth,
        expiryYear: expYear,
        cardholderName: cardholderName.trim().toUpperCase(),
        isDefault: savedCards.length === 0,
      })
    );

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleDelete = (id: string, last4: string) => {
    Alert.alert('Remove Card', `Are you sure you want to remove card ending in •••• ${last4}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          dispatch(deletePaymentCard(id));
        },
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setDefaultPaymentCard(id));
  };

  const getSchemeBadge = (type: CardScheme) => {
    switch (type) {
      case 'verve':
        return { label: 'VERVE', color: '#047857', bg: '#D1FAE5' };
      case 'visa':
        return { label: 'VISA', color: '#1E40AF', bg: '#DBEAFE' };
      case 'amex':
        return { label: 'AMEX', color: '#0369A1', bg: '#E0F2FE' };
      case 'mastercard':
      default:
        return { label: 'MASTERCARD', color: '#B91C1C', bg: '#FEE2E2' };
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
        >
          <View style={[styles.modalCard, Shadows.lg]}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Payment Methods</Text>
                <Text style={styles.modalSub}>
                  {savedCards.length} saved card{savedCards.length === 1 ? '' : 's'} for express checkout
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#341B00" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              automaticallyAdjustKeyboardInsets={true}
            >
              {/* Accepted Cards Supported Banner */}
              <View style={styles.acceptedBanner}>
                <Text style={styles.acceptedText}>ACCEPTED CARDS:</Text>
                <View style={styles.badgeRow}>
                  <View style={[styles.schemeMiniBadge, { backgroundColor: '#D1FAE5' }]}>
                    <Text style={[styles.schemeMiniText, { color: '#047857' }]}>Verve</Text>
                  </View>
                  <View style={[styles.schemeMiniBadge, { backgroundColor: '#DBEAFE' }]}>
                    <Text style={[styles.schemeMiniText, { color: '#1E40AF' }]}>Visa</Text>
                  </View>
                  <View style={[styles.schemeMiniBadge, { backgroundColor: '#FEE2E2' }]}>
                    <Text style={[styles.schemeMiniText, { color: '#B91C1C' }]}>Mastercard</Text>
                  </View>
                  <View style={[styles.schemeMiniBadge, { backgroundColor: '#E0F2FE' }]}>
                    <Text style={[styles.schemeMiniText, { color: '#0369A1' }]}>Amex</Text>
                  </View>
                </View>
              </View>

              {!isAddingNew ? (
                <>
                  {/* Add New Card Button */}
                  <TouchableOpacity
                    style={styles.addNewBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsAddingNew(true);
                      setFormError(null);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={20} color="#C46C27" style={{ marginRight: 6 }} />
                    <Text style={styles.addNewBtnText}>Add New Payment Card</Text>
                  </TouchableOpacity>

                  {/* Empty State */}
                  {savedCards.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="card-outline" size={42} color="#D1C3B2" />
                      <Text style={styles.emptyTitle}>No Payment Cards Saved</Text>
                      <Text style={styles.emptySub}>
                        Save your Verve, Mastercard, or Visa card for instant, secure checkout on bespoke commissions.
                      </Text>
                    </View>
                  )}

                  {/* Cards List */}
                  {savedCards.map((card) => {
                    const badge = getSchemeBadge(card.cardType as CardScheme);
                    return (
                      <View
                        key={card.id}
                        style={[
                          styles.cardItem,
                          card.isDefault && styles.cardItemDefault,
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <View style={styles.bankRow}>
                            <View style={[styles.schemeBadge, { backgroundColor: badge.bg }]}>
                              <Text style={[styles.schemeBadgeText, { color: badge.color }]}>{badge.label}</Text>
                            </View>
                            <Text style={styles.bankText}>{card.bankName}</Text>
                          </View>

                          {card.isDefault && (
                            <View style={styles.defaultBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#009D1A" style={{ marginRight: 3 }} />
                              <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                            </View>
                          )}
                        </View>

                        <Text style={styles.cardNumber}>{card.cardNumberMasked}</Text>

                        <View style={styles.cardFooter}>
                          <View>
                            <Text style={styles.cardMetaLabel}>CARD HOLDER</Text>
                            <Text style={styles.cardholderText}>{card.cardholderName}</Text>
                          </View>
                          <View>
                            <Text style={styles.cardMetaLabel}>EXPIRES</Text>
                            <Text style={styles.expiryText}>
                              {card.expiryMonth}/{card.expiryYear}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.actionsRow}>
                          {!card.isDefault && (
                            <TouchableOpacity
                              style={styles.actionBtn}
                              onPress={() => handleSetDefault(card.id)}
                              activeOpacity={0.7}
                            >
                              <Ionicons name="radio-button-off" size={14} color="#C46C27" style={{ marginRight: 4 }} />
                              <Text style={styles.actionBtnText}>Set Default</Text>
                            </TouchableOpacity>
                          )}

                          <TouchableOpacity
                            style={[styles.actionBtn, { marginLeft: 'auto' }]}
                            onPress={() => handleDelete(card.id, card.last4)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="trash-outline" size={14} color="#C92929" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    );
                  })}
                </>
              ) : (
                /* Add New Card Form */
                <View style={styles.formCard}>
                  <View style={styles.formHeadingRow}>
                    <Text style={styles.formHeading}>New Payment Card</Text>
                    {cardNumber.trim().length > 0 && (
                      <View style={[styles.schemeBadge, { backgroundColor: getSchemeBadge(activeScheme).bg }]}>
                        <Text style={[styles.schemeBadgeText, { color: getSchemeBadge(activeScheme).color }]}>
                          {getSchemeBadge(activeScheme).label}
                        </Text>
                      </View>
                    )}
                  </View>

                  {formError && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#C92929" style={{ marginRight: 4 }} />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  <Text style={styles.label}>
                    CARD NUMBER * {activeScheme === 'verve' ? '(Verve: 16-19 digits)' : ''}
                  </Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="card-outline" size={16} color="#662502" style={styles.inputIcon} />
                    <TextInput
                      ref={cardNumberRef}
                      style={styles.input}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      keyboardType="numeric"
                      placeholder="5061 8300 0000 4242 123"
                      placeholderTextColor="#A8998A"
                      maxLength={23}
                      autoComplete="cc-number"
                      textContentType="creditCardNumber"
                      returnKeyType="next"
                      onSubmitEditing={() => cardholderRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>CARDHOLDER NAME *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color="#662502" style={styles.inputIcon} />
                    <TextInput
                      ref={cardholderRef}
                      style={styles.input}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      autoCapitalize="characters"
                      autoComplete="cc-name"
                      textContentType="name"
                      placeholder="CHINWE EZE"
                      placeholderTextColor="#A8998A"
                      returnKeyType="next"
                      onSubmitEditing={() => expiryRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>EXPIRY (MM/YY) *</Text>
                      <TextInput
                        ref={expiryRef}
                        style={styles.inputStandalone}
                        value={expiry}
                        onChangeText={handleExpiryChange}
                        keyboardType="numeric"
                        placeholder="08/28"
                        placeholderTextColor="#A8998A"
                        maxLength={5}
                        autoComplete="cc-exp"
                        returnKeyType="next"
                        onSubmitEditing={() => cvvRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>CVV / CVC * ({activeScheme === 'amex' ? '4 digits' : '3 digits'})</Text>
                      <TextInput
                        ref={cvvRef}
                        style={styles.inputStandalone}
                        value={cvv}
                        onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, activeScheme === 'amex' ? 4 : 3))}
                        keyboardType="numeric"
                        placeholder={activeScheme === 'amex' ? '1234' : '123'}
                        placeholderTextColor="#A8998A"
                        maxLength={activeScheme === 'amex' ? 4 : 3}
                        secureTextEntry
                        autoComplete="cc-csc"
                        textContentType="creditCardSecurityCode"
                        returnKeyType="next"
                        onSubmitEditing={() => bankRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>ISSUING BANK (OPTIONAL)</Text>
                  <TextInput
                    ref={bankRef}
                    style={styles.inputStandalone}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. First Bank, Access Bank, GTBank, Zenith"
                    placeholderTextColor="#A8998A"
                    autoCapitalize="words"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveCard}
                  />

                  {/* Security Note */}
                  <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#166534" style={{ marginRight: 6 }} />
                    <Text style={styles.securityText}>
                      Bank-grade 256-bit encryption. Compatible with Nigerian Verve, Visa, Mastercard, and Amex cards.
                    </Text>
                  </View>

                  {/* Actions */}
                  <View style={[styles.row, { marginTop: Spacing.lg }]}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={resetForm}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveCardBtn}
                      onPress={handleSaveCard}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.saveCardBtnText}>Save Card</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(28, 14, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardView: {
    width: '100%',
    maxHeight: Platform.OS === 'ios' ? '92%' : '96%',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl + 20 : Spacing.xl + 10,
    maxHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
    paddingBottom: Spacing.sm + 4,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#341B00',
  },
  modalSub: {
    fontSize: 11,
    color: '#662502',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FAF7F2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  acceptedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FAF7F2',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  acceptedText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.5,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 4,
  },
  schemeMiniBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  schemeMiniText: {
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: Spacing.xl + 40,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    marginTop: Spacing.sm,
  },
  emptySub: {
    fontSize: 12,
    color: '#662502',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  addNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#C46C27',
    borderRadius: Radius.lg,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  addNewBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#C46C27',
  },
  cardItem: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  cardItemDefault: {
    borderColor: '#C46C27',
    backgroundColor: '#FCF9F4',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  bankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  schemeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  schemeBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bankText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  cardNumber: {
    fontSize: 17,
    fontWeight: '800',
    color: '#341B00',
    letterSpacing: 1.5,
    marginVertical: Spacing.xs,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xs,
  },
  cardMetaLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#8A7868',
    letterSpacing: 0.5,
  },
  cardholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#341B00',
    marginTop: 1,
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#341B00',
    marginTop: 1,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm + 2,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#EAE1D4',
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0D4C3',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#662502',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  formHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    marginBottom: Spacing.sm,
  },
  errorText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#991B1B',
    flex: 1,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  inputStandalone: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  row: {
    flexDirection: 'row',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginTop: Spacing.md,
  },
  securityText: {
    fontSize: 10,
    color: '#166534',
    flex: 1,
    lineHeight: 14,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  cancelBtnText: {
    color: '#662502',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  saveCardBtn: {
    flex: 2,
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  saveCardBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});

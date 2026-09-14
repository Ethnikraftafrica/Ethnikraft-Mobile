import React, { useState } from 'react';
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
    // Format with spaces every 4 digits
    const cleaned = text.replace(/\D/g, '').slice(0, 16);
    const formatted = cleaned.replace(/(\d{4})(?=\d)/g, '$1 ');
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
    if (rawNumber.length < 16) {
      setFormError('Please enter a valid 16-digit card number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
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

    if (cvv.length < 3) {
      setFormError('Please enter a valid 3-digit CVV.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const firstDigit = rawNumber.charAt(0);
    const cardType = firstDigit === '4' ? 'visa' : 'mastercard';
    const last4 = rawNumber.slice(-4);
    const masked = `${rawNumber.slice(0, 4)} ${rawNumber.slice(4, 6)}•• •••• ${last4}`;

    dispatch(
      addPaymentCard({
        cardType,
        bankName: bankName.trim() || (cardType === 'visa' ? 'GTBank' : 'Access Bank'),
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
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

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {!isAddingNew ? (
                <>
                  {/* Add New Card Button */}
                  <TouchableOpacity
                    style={styles.addNewBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsAddingNew(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={20} color="#C46C27" style={{ marginRight: 6 }} />
                    <Text style={styles.addNewBtnText}>Add New Payment Card</Text>
                  </TouchableOpacity>

                  {/* Cards List */}
                  {savedCards.map((card) => {
                    const isMaster = card.cardType === 'mastercard';
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
                            <Ionicons
                              name="card"
                              size={18}
                              color={isMaster ? '#EB001B' : '#1A1F71'}
                              style={{ marginRight: 6 }}
                            />
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
                  <Text style={styles.formHeading}>New Payment Card</Text>

                  {formError && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#C92929" style={{ marginRight: 4 }} />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  <Text style={styles.label}>CARD NUMBER *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="card-outline" size={16} color="#662502" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={cardNumber}
                      onChangeText={handleCardNumberChange}
                      keyboardType="numeric"
                      placeholder="5399 8300 0000 4242"
                      placeholderTextColor="#A8998A"
                      maxLength={19}
                    />
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>CARDHOLDER NAME *</Text>
                  <View style={styles.inputWrap}>
                    <Ionicons name="person-outline" size={16} color="#662502" style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={cardholderName}
                      onChangeText={setCardholderName}
                      autoCapitalize="characters"
                      placeholder="KWAME MENSAH"
                      placeholderTextColor="#A8998A"
                    />
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>EXPIRY (MM/YY) *</Text>
                      <TextInput
                        style={styles.inputStandalone}
                        value={expiry}
                        onChangeText={handleExpiryChange}
                        keyboardType="numeric"
                        placeholder="08/28"
                        placeholderTextColor="#A8998A"
                        maxLength={5}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>CVV / CVC *</Text>
                      <TextInput
                        style={styles.inputStandalone}
                        value={cvv}
                        onChangeText={(t) => setCvv(t.replace(/\D/g, '').slice(0, 4))}
                        keyboardType="numeric"
                        placeholder="123"
                        placeholderTextColor="#A8998A"
                        maxLength={4}
                        secureTextEntry
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>ISSUING BANK (OPTIONAL)</Text>
                  <TextInput
                    style={styles.inputStandalone}
                    value={bankName}
                    onChangeText={setBankName}
                    placeholder="e.g. Access Bank, GTBank, Zenith"
                    placeholderTextColor="#A8998A"
                  />

                  {/* Security Note */}
                  <View style={styles.securityNote}>
                    <Ionicons name="shield-checkmark" size={16} color="#166534" style={{ marginRight: 6 }} />
                    <Text style={styles.securityText}>
                      Bank-grade 256-bit encryption. Card credentials are never stored in plain text.
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
    maxHeight: '92%',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.xl + 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
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
  scrollContent: {
    paddingBottom: Spacing.xl,
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
  },
  bankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#341B00',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  defaultBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#166534',
  },
  cardNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    letterSpacing: 2,
    marginBottom: Spacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
  },
  cardMetaLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#8A7A68',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cardholderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#341B00',
  },
  expiryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#341B00',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#662502',
  },
  formCard: {
    paddingVertical: Spacing.xs,
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: Spacing.md,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontSize: 11,
    color: '#B91C1C',
    fontWeight: '600',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
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
    backgroundColor: '#DCFCE7',
    padding: Spacing.sm,
    borderRadius: Radius.md,
    marginTop: Spacing.md,
  },
  securityText: {
    flex: 1,
    fontSize: 10,
    color: '#166534',
    lineHeight: 14,
    fontWeight: '600',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  cancelBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#662502',
  },
  saveCardBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#C46C27',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  saveCardBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

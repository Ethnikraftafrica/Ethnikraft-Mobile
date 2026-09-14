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
  addSavedAddress,
  deleteSavedAddress,
  setDefaultAddress,
  updateSavedAddress,
  SavedAddress,
  AddressType,
} from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SavedAddressesModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { savedAddresses } = useAppSelector((state) => state.profile);

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // New address form state
  const [addressType, setAddressType] = useState<AddressType>('HOME');
  const [street, setStreet] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [aptNoOrCompany, setAptNoOrCompany] = useState('');
  const [floor, setFloor] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [additionalDirections, setAdditionalDirections] = useState('');
  const [additionalLabel, setAdditionalLabel] = useState('');
  const [city, setCity] = useState('Lagos');
  const [country, setCountry] = useState('Nigeria');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const resetForm = () => {
    setAddressType('HOME');
    setStreet('');
    setBuildingName('');
    setAptNoOrCompany('');
    setFloor('');
    setPhoneNumber('');
    setAdditionalDirections('');
    setAdditionalLabel('');
    setCity('Lagos');
    setCountry('Nigeria');
    setIsDefault(false);
    setFormError(null);
    setIsAddingNew(false);
    setEditingId(null);
  };

  const startEdit = (addr: SavedAddress) => {
    setEditingId(addr.id);
    setAddressType(addr.addressType);
    setStreet(addr.street);
    setBuildingName(addr.buildingName || '');
    setAptNoOrCompany(addr.aptNoOrCompany || '');
    setFloor(addr.floor || '');
    setPhoneNumber(addr.phoneNumber);
    setAdditionalDirections(addr.additionalDirections || '');
    setAdditionalLabel(addr.additionalLabel || '');
    setCity(addr.city || 'Lagos');
    setCountry(addr.country || 'Nigeria');
    setIsDefault(addr.isDefault);
    setIsAddingNew(true);
    Haptics.selectionAsync();
  };

  const handleSaveAddress = () => {
    if (!street.trim() || !phoneNumber.trim()) {
      setFormError('Please provide a street address and contact phone number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (editingId) {
      dispatch(
        updateSavedAddress({
          id: editingId,
          addressType,
          street: street.trim(),
          buildingName: buildingName.trim() || undefined,
          aptNoOrCompany: aptNoOrCompany.trim() || undefined,
          floor: floor.trim() || undefined,
          phoneNumber: phoneNumber.trim(),
          additionalDirections: additionalDirections.trim() || undefined,
          additionalLabel: additionalLabel.trim() || undefined,
          city: city.trim(),
          country: country.trim(),
          isDefault,
        })
      );
    } else {
      dispatch(
        addSavedAddress({
          addressType,
          street: street.trim(),
          buildingName: buildingName.trim() || undefined,
          aptNoOrCompany: aptNoOrCompany.trim() || undefined,
          floor: floor.trim() || undefined,
          phoneNumber: phoneNumber.trim(),
          additionalDirections: additionalDirections.trim() || undefined,
          additionalLabel: additionalLabel.trim() || undefined,
          city: city.trim(),
          country: country.trim(),
          isDefault,
        })
      );
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    resetForm();
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Delete Address', `Remove "${label}" from your saved delivery locations?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          dispatch(deleteSavedAddress(id));
        },
      },
    ]);
  };

  const handleSetDefault = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    dispatch(setDefaultAddress(id));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.modalCard, Shadows.lg]}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Saved Addresses</Text>
                <Text style={styles.modalSub}>
                  {savedAddresses.length} delivery location{savedAddresses.length === 1 ? '' : 's'} available
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
                  {/* Add New Address Trigger Button */}
                  <TouchableOpacity
                    style={styles.addNewBtn}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsAddingNew(true);
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="add-circle" size={20} color="#C46C27" style={{ marginRight: 6 }} />
                    <Text style={styles.addNewBtnText}>Add New Delivery Address</Text>
                  </TouchableOpacity>

                  {/* List of Saved Addresses */}
                  {savedAddresses.map((addr) => (
                    <View key={addr.id} style={[styles.addressItem, addr.isDefault && styles.addressItemDefault]}>
                      <View style={styles.itemHeader}>
                        <View style={styles.typeBadge}>
                          <Ionicons
                            name={
                              addr.addressType === 'HOME'
                                ? 'home'
                                : addr.addressType === 'OFFICE'
                                ? 'business'
                                : 'location'
                            }
                            size={14}
                            color="#662502"
                            style={{ marginRight: 4 }}
                          />
                          <Text style={styles.typeBadgeText}>
                            {addr.additionalLabel || addr.addressType}
                          </Text>
                        </View>

                        {addr.isDefault && (
                          <View style={styles.defaultBadge}>
                            <Ionicons name="checkmark-circle" size={12} color="#009D1A" style={{ marginRight: 3 }} />
                            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                          </View>
                        )}
                      </View>

                      <Text style={styles.addressStreet}>{addr.street}</Text>
                      {addr.buildingName && (
                        <Text style={styles.addressDetails}>
                          {addr.buildingName} {addr.aptNoOrCompany ? `• ${addr.aptNoOrCompany}` : ''} {addr.floor ? `• ${addr.floor}` : ''}
                        </Text>
                      )}
                      {addr.additionalDirections && (
                        <Text style={styles.directionsText}>Landmark: {addr.additionalDirections}</Text>
                      )}
                      <Text style={styles.phoneText}>📞 {addr.phoneNumber}</Text>

                      {/* Action buttons */}
                      <View style={styles.actionsRow}>
                        {!addr.isDefault && (
                          <TouchableOpacity
                            style={styles.actionBtn}
                            onPress={() => handleSetDefault(addr.id)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="radio-button-off" size={14} color="#C46C27" style={{ marginRight: 4 }} />
                            <Text style={styles.actionBtnText}>Set Default</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => startEdit(addr)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="pencil" size={14} color="#662502" style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, { marginLeft: 'auto' }]}
                          onPress={() => handleDelete(addr.id, addr.street)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="trash-outline" size={14} color="#C92929" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                /* Add / Edit Form */
                <View style={styles.formCard}>
                  <Text style={styles.formHeading}>
                    {editingId ? 'Edit Address' : 'New Delivery Address'}
                  </Text>

                  {formError && (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color="#C92929" style={{ marginRight: 4 }} />
                      <Text style={styles.errorText}>{formError}</Text>
                    </View>
                  )}

                  {/* Type chips */}
                  <Text style={styles.label}>ADDRESS TYPE</Text>
                  <View style={styles.typeChipsRow}>
                    {(['HOME', 'OFFICE', 'OTHER'] as AddressType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeChip, addressType === t && styles.typeChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setAddressType(t);
                        }}
                      >
                        <Text style={[styles.typeChipText, addressType === t && styles.typeChipTextActive]}>
                          {t === 'HOME' ? '🏡 Home' : t === 'OFFICE' ? '🏢 Office' : '📍 Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>STREET ADDRESS *</Text>
                  <TextInput
                    style={styles.input}
                    value={street}
                    onChangeText={setStreet}
                    placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                    placeholderTextColor="#A8998A"
                  />

                  <View style={[styles.row, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>BUILDING / ESTATE</Text>
                      <TextInput
                        style={styles.input}
                        value={buildingName}
                        onChangeText={setBuildingName}
                        placeholder="Palm Terraces"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>APT / SUITE / FLOOR</Text>
                      <TextInput
                        style={styles.input}
                        value={aptNoOrCompany}
                        onChangeText={setAptNoOrCompany}
                        placeholder="Suite 4B, 2nd Floor"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>PHONE NUMBER *</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="+2348012345678"
                    placeholderTextColor="#A8998A"
                  />

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>LANDMARK / DIRECTIONS</Text>
                  <TextInput
                    style={styles.input}
                    value={additionalDirections}
                    onChangeText={setAdditionalDirections}
                    placeholder="Opposite grocery store"
                    placeholderTextColor="#A8998A"
                  />

                  {/* Make default toggle */}
                  <TouchableOpacity
                    style={styles.defaultToggleRow}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setIsDefault(!isDefault);
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isDefault ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={isDefault ? '#C46C27' : '#A8998A'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.defaultToggleText}>Set as my default shipping address</Text>
                  </TouchableOpacity>

                  {/* Form Action Buttons */}
                  <View style={[styles.row, { marginTop: Spacing.lg }]}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={resetForm}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveAddressBtn}
                      onPress={handleSaveAddress}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.saveAddressBtnText}>
                        {editingId ? 'Update Address' : 'Save Address'}
                      </Text>
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
  addressItem: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  addressItemDefault: {
    borderColor: '#C46C27',
    backgroundColor: '#FCF9F4',
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFE7DA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#662502',
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
  addressStreet: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#341B00',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    marginBottom: 2,
  },
  directionsText: {
    fontSize: 11,
    color: '#8A7A68',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 11,
    color: '#341B00',
    fontWeight: '600',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#EFE7DA',
    gap: 12,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
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
  typeChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    alignItems: 'center',
  },
  typeChipActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#662502',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  input: {
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
  defaultToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: 4,
  },
  defaultToggleText: {
    fontSize: Typography.fontSize.xs,
    color: '#341B00',
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
  saveAddressBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: Radius.md,
    backgroundColor: '#C46C27',
    alignItems: 'center',
    marginLeft: Spacing.xs,
  },
  saveAddressBtnText: {
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

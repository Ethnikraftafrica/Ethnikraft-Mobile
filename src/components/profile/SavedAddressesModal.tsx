import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import {
  syncAddresses,
  SavedAddress as LocalSavedAddress,
  AddressType as LocalAddressType,
} from '@/store/slices/profileSlice';
import {
  useGetAddressesQuery,
  useCreateAddressMutation,
  useUpdateAddressMutation,
  useDeleteAddressMutation,
  useSetDefaultAddressMutation,
  SavedAddress,
  AddressType,
} from '@/store/api/profileApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function SavedAddressesModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { savedAddresses: localAddresses } = useAppSelector((state) => state.profile);

  // RTK Query hooks
  const { data: remoteAddresses, isLoading: isFetching, refetch } = useGetAddressesQuery(undefined, {
    skip: !visible,
  });
  const [createAddressApi, { isLoading: isCreating }] = useCreateAddressMutation();
  const [updateAddressApi, { isLoading: isUpdating }] = useUpdateAddressMutation();
  const [deleteAddressApi, { isLoading: isDeleting }] = useDeleteAddressMutation();
  const [setDefaultAddressApi, { isLoading: isSettingDefault }] = useSetDefaultAddressMutation();

  const isMutating = isCreating || isUpdating || isDeleting || isSettingDefault;

  // Use remote addresses if available, fallback to local slice
  const addresses: (SavedAddress | LocalSavedAddress)[] = remoteAddresses || localAddresses || [];

  // Sync to Redux store when remote data updates
  useEffect(() => {
    if (remoteAddresses && Array.isArray(remoteAddresses)) {
      dispatch(syncAddresses(remoteAddresses as any));
    }
  }, [remoteAddresses, dispatch]);

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
  const [stateName, setStateName] = useState('Lagos');
  const [country, setCountry] = useState('Nigeria');
  const [isDefault, setIsDefault] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form input refs
  const labelRef = useRef<TextInput>(null);
  const streetRef = useRef<TextInput>(null);
  const cityRef = useRef<TextInput>(null);
  const stateRef = useRef<TextInput>(null);
  const buildingRef = useRef<TextInput>(null);
  const aptRef = useRef<TextInput>(null);
  const phoneRef = useRef<TextInput>(null);
  const directionsRef = useRef<TextInput>(null);

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
    setStateName('Lagos');
    setCountry('Nigeria');
    setIsDefault(false);
    setFormError(null);
    setIsAddingNew(false);
    setEditingId(null);
  };

  const startEdit = (addr: any) => {
    setEditingId(addr.id);
    setAddressType(addr.addressType || 'HOME');
    setStreet(addr.street || addr.address || '');
    setBuildingName(addr.buildingName || '');
    setAptNoOrCompany(addr.aptNoOrCompany || '');
    setFloor(addr.floor || '');
    setPhoneNumber(addr.phoneNumber || '');
    setAdditionalDirections(addr.additionalDirections || '');
    setAdditionalLabel(addr.additionalLabel || '');
    setCity(addr.city || 'Lagos');
    setStateName(addr.state || 'Lagos');
    setCountry(addr.country || 'Nigeria');
    setIsDefault(!!addr.isDefault);
    setIsAddingNew(true);
    setFormError(null);
    Haptics.selectionAsync();
  };

  const handleSaveAddress = async () => {
    if (!street.trim() || !phoneNumber.trim()) {
      setFormError('Please provide a street address and contact phone number.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setFormError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const payload = {
      address: `${street.trim()}${city.trim() ? `, ${city.trim()}` : ''}`,
      addressType,
      street: street.trim(),
      city: city.trim() || 'Lagos',
      state: stateName.trim() || 'Lagos',
      country: country.trim() || 'Nigeria',
      countryCode: 'NG',
      phoneNumber: phoneNumber.trim(),
      buildingName: buildingName.trim() || undefined,
      aptNoOrCompany: aptNoOrCompany.trim() || undefined,
      floor: floor.trim() || undefined,
      additionalDirections: additionalDirections.trim() || undefined,
      additionalLabel: additionalLabel.trim() || undefined,
      isDefault,
    };

    try {
      if (editingId) {
        await updateAddressApi({ id: editingId, data: payload }).unwrap();
      } else {
        await createAddressApi(payload).unwrap();
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      resetForm();
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const backendError =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        err?.message ||
        'Failed to save address. Please check your inputs.';
      setFormError(typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
    }
  };

  const handleDelete = (id: string, label: string) => {
    Alert.alert('Delete Address', `Remove "${label}" from your saved delivery locations?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            await deleteAddressApi(id).unwrap();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          } catch (err: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', err?.data?.message || 'Could not delete address. Please try again.');
          }
        },
      },
    ]);
  };

  const handleSetDefault = async (id: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await setDefaultAddressApi(id).unwrap();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', err?.data?.message || 'Could not set default address.');
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
                <Text style={styles.modalTitle}>Saved Addresses</Text>
                <Text style={styles.modalSub}>
                  {addresses.length} delivery location{addresses.length === 1 ? '' : 's'} available
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  resetForm();
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
                disabled={isMutating}
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
              {isFetching && !remoteAddresses && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#C46C27" />
                  <Text style={styles.loadingText}>Fetching addresses...</Text>
                </View>
              )}

              {!isAddingNew ? (
                <>
                  {/* Add New Address Trigger Button */}
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
                    <Text style={styles.addNewBtnText}>Add New Delivery Address</Text>
                  </TouchableOpacity>

                  {/* Empty State */}
                  {addresses.length === 0 && !isFetching && (
                    <View style={styles.emptyContainer}>
                      <Ionicons name="location-outline" size={42} color="#D1C3B2" />
                      <Text style={styles.emptyTitle}>No Addresses Saved Yet</Text>
                      <Text style={styles.emptySub}>
                        Add your home or office address to speed up bespoke orders and checkout.
                      </Text>
                    </View>
                  )}

                  {/* List of Saved Addresses */}
                  {addresses.map((addr) => (
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

                      <Text style={styles.addressStreet}>{addr.street || (addr as any).address}</Text>
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
                            disabled={isMutating}
                          >
                            <Ionicons name="radio-button-off" size={14} color="#C46C27" style={{ marginRight: 4 }} />
                            <Text style={styles.actionBtnText}>Set Default</Text>
                          </TouchableOpacity>
                        )}

                        <TouchableOpacity
                          style={styles.actionBtn}
                          onPress={() => startEdit(addr)}
                          activeOpacity={0.7}
                          disabled={isMutating}
                        >
                          <Ionicons name="pencil" size={14} color="#662502" style={{ marginRight: 4 }} />
                          <Text style={styles.actionBtnText}>Edit</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.actionBtn, { marginLeft: 'auto' }]}
                          onPress={() => handleDelete(addr.id, addr.street || (addr as any).address)}
                          activeOpacity={0.7}
                          disabled={isMutating}
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
                    {(['HOME', 'OFFICE', 'APARTMENT', 'OTHER'] as AddressType[]).map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.typeChip, addressType === t && styles.typeChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setAddressType(t);
                        }}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.typeChipText, addressType === t && styles.typeChipTextActive]}>
                          {t === 'HOME' ? 'Home' : t === 'OFFICE' ? 'Office' : t === 'APARTMENT' ? 'Apt' : 'Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Custom Label */}
                  <Text style={[styles.label, { marginTop: Spacing.sm }]}>LABEL (OPTIONAL)</Text>
                  <TextInput
                    ref={labelRef}
                    style={styles.input}
                    value={additionalLabel}
                    onChangeText={setAdditionalLabel}
                    placeholder="e.g. Grandma's House, Ikoyi Studio"
                    placeholderTextColor="#A8998A"
                    autoCapitalize="words"
                    returnKeyType="next"
                    onSubmitEditing={() => streetRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Street Address */}
                  <Text style={[styles.label, { marginTop: Spacing.sm }]}>STREET ADDRESS *</Text>
                  <TextInput
                    ref={streetRef}
                    style={[styles.input, styles.multilineInput]}
                    value={street}
                    onChangeText={setStreet}
                    placeholder="15 Admiralty Way, Lekki Phase 1"
                    placeholderTextColor="#A8998A"
                    multiline
                    numberOfLines={2}
                    autoCapitalize="sentences"
                    autoComplete="street-address"
                    textContentType="fullStreetAddress"
                    returnKeyType="next"
                    onSubmitEditing={() => cityRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* City & State */}
                  <View style={[styles.row, { marginTop: Spacing.sm }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>CITY *</Text>
                      <TextInput
                        ref={cityRef}
                        style={styles.input}
                        value={city}
                        onChangeText={setCity}
                        placeholder="Lagos"
                        placeholderTextColor="#A8998A"
                        autoCapitalize="words"
                        autoComplete="address-line2"
                        textContentType="addressCity"
                        returnKeyType="next"
                        onSubmitEditing={() => stateRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>STATE *</Text>
                      <TextInput
                        ref={stateRef}
                        style={styles.input}
                        value={stateName}
                        onChangeText={setStateName}
                        placeholder="Lagos"
                        placeholderTextColor="#A8998A"
                        autoCapitalize="words"
                        autoComplete="address-line1"
                        textContentType="addressState"
                        returnKeyType="next"
                        onSubmitEditing={() => buildingRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>

                  {/* Building & Apartment */}
                  <View style={[styles.row, { marginTop: Spacing.sm }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>BUILDING NAME</Text>
                      <TextInput
                        ref={buildingRef}
                        style={styles.input}
                        value={buildingName}
                        onChangeText={setBuildingName}
                        placeholder="Skyline Plaza"
                        placeholderTextColor="#A8998A"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => aptRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>APT / SUITE / CO.</Text>
                      <TextInput
                        ref={aptRef}
                        style={styles.input}
                        value={aptNoOrCompany}
                        onChangeText={setAptNoOrCompany}
                        placeholder="Suite 4B"
                        placeholderTextColor="#A8998A"
                        autoCapitalize="words"
                        returnKeyType="next"
                        onSubmitEditing={() => phoneRef.current?.focus()}
                        blurOnSubmit={false}
                      />
                    </View>
                  </View>

                  {/* Phone */}
                  <Text style={[styles.label, { marginTop: Spacing.sm }]}>RECIPIENT PHONE NUMBER *</Text>
                  <TextInput
                    ref={phoneRef}
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="+2348012345678"
                    placeholderTextColor="#A8998A"
                    autoComplete="tel"
                    textContentType="telephoneNumber"
                    returnKeyType="next"
                    onSubmitEditing={() => directionsRef.current?.focus()}
                    blurOnSubmit={false}
                  />

                  {/* Landmark / Delivery Directions */}
                  <Text style={[styles.label, { marginTop: Spacing.sm }]}>LANDMARK / DIRECTIONS</Text>
                  <TextInput
                    ref={directionsRef}
                    style={[styles.input, styles.multilineInput]}
                    value={additionalDirections}
                    onChangeText={setAdditionalDirections}
                    placeholder="Opposite GTBank, black gate with bronze bell"
                    placeholderTextColor="#A8998A"
                    multiline
                    autoCapitalize="sentences"
                    returnKeyType="done"
                    onSubmitEditing={handleSaveAddress}
                  />

                  {/* Default switch toggle */}
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
                    <Text style={styles.defaultToggleLabel}>Set as primary default address</Text>
                  </TouchableOpacity>

                  {/* Form Action Buttons */}
                  <View style={styles.formBtnRow}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={resetForm}
                      activeOpacity={0.7}
                      disabled={isMutating}
                    >
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveAddressBtn, isMutating && { opacity: 0.8 }]}
                      onPress={handleSaveAddress}
                      activeOpacity={0.85}
                      disabled={isMutating}
                    >
                      {isMutating ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.saveAddressBtnText}>
                          {editingId ? 'Update Address' : 'Save Address'}
                        </Text>
                      )}
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
    paddingBottom: Spacing.xl + 40,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#662502',
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
    borderColor: '#C46C27',
    borderStyle: 'dashed',
    borderRadius: Radius.lg,
    paddingVertical: 12,
    marginBottom: Spacing.md,
  },
  addNewBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C46C27',
  },
  addressItem: {
    backgroundColor: '#FAF7F2',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#E8DCCB',
    marginBottom: Spacing.sm + 2,
  },
  addressItemDefault: {
    borderColor: '#C46C27',
    borderWidth: 1.5,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0E7D9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#166534',
  },
  addressStreet: {
    fontSize: 14,
    fontWeight: '700',
    color: '#341B00',
    marginBottom: 2,
  },
  addressDetails: {
    fontSize: 12,
    color: '#662502',
    marginBottom: 2,
  },
  directionsText: {
    fontSize: 11,
    color: '#8A6D56',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  phoneText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#341B00',
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: '#EBE1D3',
    gap: 8,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#E0D4C3',
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#341B00',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
  },
  formHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: Spacing.sm,
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
  typeChipsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.xs,
  },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.full,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#662502',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  input: {
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  multilineInput: {
    minHeight: 48,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  defaultToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  defaultToggleLabel: {
    fontSize: 12,
    color: '#341B00',
    fontWeight: '600',
  },
  formBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: Spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#662502',
  },
  saveAddressBtn: {
    flex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 12,
    borderRadius: Radius.md,
  },
  saveAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

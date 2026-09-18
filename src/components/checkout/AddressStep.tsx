import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Radius, Spacing, Typography } from '@/constants/theme';
import { SavedAddress } from '@/store/slices/profileSlice';
import { CheckoutAddressForm } from './types';

interface AddressStepProps {
  savedAddresses: SavedAddress[];
  selectedAddressId: string | null;
  onSelectAddress: (id: string) => void;
  onAddNewAddress: (address: CheckoutAddressForm) => void;
  onContinue: () => void;
}

export const AddressStep: React.FC<AddressStepProps> = ({
  savedAddresses,
  selectedAddressId,
  onSelectAddress,
  onAddNewAddress,
  onContinue,
}) => {
  const [isAddingNew, setIsAddingNew] = useState(savedAddresses.length === 0);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('Lagos');
  const [directions, setDirections] = useState('');
  const [addressType, setAddressType] = useState<'HOME' | 'OFFICE' | 'OTHER'>('HOME');

  const handleSelect = useCallback((id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectAddress(id);
  }, [onSelectAddress]);

  const handleSaveNewAddress = useCallback(() => {
    if (!street.trim() || !city.trim() || !phoneNumber.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Incomplete Address', 'Please provide a street address, city, and phone number.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onAddNewAddress({
      fullName: fullName.trim() || 'Customer',
      phoneNumber: phoneNumber.trim(),
      street: street.trim(),
      city: city.trim(),
      state: state.trim() || 'Lagos',
      country: 'Nigeria',
      additionalDirections: directions.trim(),
      addressType,
    });
    setIsAddingNew(false);
  }, [fullName, phoneNumber, street, city, state, directions, addressType, onAddNewAddress]);

  const handleContinuePress = () => {
    if (!selectedAddressId && !isAddingNew) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert('Select Address', 'Please select a delivery destination to proceed.');
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onContinue();
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Section Header */}
        <View style={styles.headerBox}>
          <Text style={styles.sectionPretitle}>STEP 1 OF 3</Text>
          <Text style={styles.sectionTitle}>Delivery Destination</Text>
          <Text style={styles.sectionSubtitle}>
            Select where you want your handcrafted artisan pieces delivered.
          </Text>
        </View>

        {/* Existing Saved Addresses List */}
        {savedAddresses.map((addr) => {
          const isSelected = selectedAddressId === addr.id;

          return (
            <TouchableOpacity
              key={addr.id}
              activeOpacity={0.85}
              onPress={() => handleSelect(addr.id)}
              style={[
                styles.addressCard,
                isSelected && styles.addressCardSelected,
              ]}
            >
              {/* Radio Circle */}
              <View
                style={[
                  styles.radioOuter,
                  isSelected && styles.radioOuterSelected,
                ]}
              >
                {isSelected && <View style={styles.radioInner} />}
              </View>

              {/* Address Details */}
              <View style={styles.addressInfoCol}>
                <View style={styles.tagRow}>
                  <View style={styles.typeBadge}>
                    <Text style={styles.typeBadgeText}>
                      {addr.addressType || 'HOME'}
                    </Text>
                  </View>
                  {addr.isDefault && (
                    <View style={styles.defaultBadge}>
                      <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.streetText}>{addr.street}</Text>
                <Text style={styles.cityStateText}>
                  {[addr.city, addr.state, addr.country || 'Nigeria']
                    .filter(Boolean)
                    .join(', ')}
                </Text>
                <Text style={styles.phoneText}>📞 {addr.phoneNumber}</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {/* Add New Address Accordion / Toggle */}
        {!isAddingNew ? (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsAddingNew(true);
            }}
            style={styles.addNewAddressToggle}
          >
            <Ionicons name="add-circle-outline" size={18} color={Colors.primary} />
            <Text style={styles.addNewAddressText}>Deliver to a Different Address</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.formContainer}>
            <View style={styles.formHeader}>
              <Text style={styles.formTitle}>New Delivery Address</Text>
              {savedAddresses.length > 0 && (
                <TouchableOpacity
                  onPress={() => setIsAddingNew(false)}
                  style={styles.cancelFormBtn}
                >
                  <Text style={styles.cancelFormText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Address Type Pills */}
            <View style={styles.typePillsRow}>
              {(['HOME', 'OFFICE', 'OTHER'] as const).map((type) => (
                <TouchableOpacity
                  key={type}
                  onPress={() => setAddressType(type)}
                  style={[
                    styles.typePill,
                    addressType === type && styles.typePillSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.typePillLabel,
                      addressType === type && styles.typePillLabelSelected,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Form Inputs */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient Full Name</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Amara Okafor"
                value={fullName}
                onChangeText={setFullName}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number (For Delivery Courier)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. +234 803 123 4567"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Street Address / Landmark</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 14 Admiralty Way, Lekki Phase 1"
                value={street}
                onChangeText={setStreet}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>City</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lagos"
                  value={city}
                  onChangeText={setCity}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>State</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Lagos"
                  value={state}
                  onChangeText={setState}
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Delivery Directions (Optional)</Text>
              <TextInput
                style={[styles.textInput, styles.textAreaInput]}
                placeholder="e.g. Gate code, call when at estate entrance..."
                multiline
                numberOfLines={2}
                value={directions}
                onChangeText={setDirections}
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleSaveNewAddress}
              style={styles.saveAddressBtn}
            >
              <Text style={styles.saveAddressBtnText}>Use This Address</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Sticky Bottom Continue CTA */}
      <View style={styles.bottomDock}>
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={handleContinuePress}
          style={styles.continueBtn}
        >
          <Text style={styles.continueBtnText}>Continue to Shipping</Text>
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
    marginBottom: Spacing.md,
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
  addressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.sm + 2,
    gap: Spacing.sm + 2,
  },
  addressCardSelected: {
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
    marginTop: 2,
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
  addressInfoCol: {
    flex: 1,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: 'rgba(196, 108, 39, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  defaultBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.sm,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: '#166534',
  },
  streetText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  cityStateText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textMuted,
    marginTop: 4,
  },
  addNewAddressToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.primary,
    backgroundColor: Colors.surface,
    marginTop: 4,
  },
  addNewAddressText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.primary,
  },
  formContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 6,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  formTitle: {
    fontSize: Typography.fontSize.sm + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textPrimary,
  },
  cancelFormBtn: {
    padding: 4,
  },
  cancelFormText: {
    fontSize: Typography.fontSize.xs,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.danger,
  },
  typePillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.sm + 2,
  },
  typePill: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: Radius.full,
    backgroundColor: Colors.surfaceSubtle,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  typePillSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  typePillLabel: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textSecondary,
  },
  typePillLabelSelected: {
    color: Colors.textInverse,
  },
  inputGroup: {
    marginBottom: Spacing.sm,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 8,
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: Typography.fontFamily.poppinsMedium,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.bodyRegular,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textAreaInput: {
    minHeight: 52,
    textAlignVertical: 'top',
  },
  saveAddressBtn: {
    backgroundColor: Colors.primaryDark,
    borderRadius: Radius.full,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 4,
  },
  saveAddressBtnText: {
    fontSize: Typography.fontSize.xs + 1,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
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
  },
  continueBtn: {
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
    fontSize: Typography.fontSize.xs + 2,
    fontFamily: Typography.fontFamily.poppinsBold,
    color: Colors.textInverse,
  },
});

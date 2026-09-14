import React, { useState, useEffect } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePersonalDetails, syncFromFullProfile, GenderType } from '@/store/slices/profileSlice';
import { useUpdateContactInfoMutation } from '@/store/api/profileApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EditPersonalDetailsModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.profile);
  const [updateContactInfoApi, { isLoading }] = useUpdateContactInfoMutation();

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [profileName, setProfileName] = useState(profile.profileName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [gender, setGender] = useState<GenderType | ''>(profile.gender);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync form values whenever modal opens or profile changes
  useEffect(() => {
    if (visible) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setProfileName(profile.profileName || '');
      setPhoneNumber(profile.phoneNumber || '');
      setGender(profile.gender || '');
      setBirthDate(profile.birthDate || '');
      setAddress(profile.address || '');
      setCity(profile.city || '');
      setCountry(profile.country || 'Nigeria');
      setErrorMessage(null);
      setSavedSuccess(false);
    }
  }, [visible, profile]);

  const handleSave = async () => {
    setErrorMessage(null);

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMessage('First name and last name are required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    // Optional phone validation matching backend DTO regex if phone is provided
    if (phoneNumber.trim()) {
      const cleanPhone = phoneNumber.trim();
      const isValidPhone = /^(\+234[789][01]\d{8}|0[789][01]\d{8}|\+[1-9]\d{6,14})$/.test(cleanPhone);
      if (!isValidPhone) {
        setErrorMessage('Please provide a valid phone number (e.g. +2348012345678 or 08012345678).');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      const payload = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileName: profileName.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
        gender: gender ? (gender as GenderType) : undefined,
        birthDate: birthDate.trim() || undefined,
        address: address.trim() || undefined,
        city: city.trim() || undefined,
        country: country.trim() || undefined,
      };

      const result = await updateContactInfoApi(payload).unwrap();

      // Sync updated profile to Redux
      dispatch(updatePersonalDetails(payload));
      if (result) {
        dispatch(syncFromFullProfile(result));
      }

      setSavedSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 750);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const backendError =
        err?.data?.message ||
        (Array.isArray(err?.data?.message) ? err.data.message[0] : null) ||
        err?.message ||
        'Failed to save personal details. Please check your connection.';
      setErrorMessage(typeof backendError === 'string' ? backendError : JSON.stringify(backendError));
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
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.modalCard, Shadows.lg]}>
            {/* Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Personal Details</Text>
                <Text style={styles.modalSub}>Update your account identity and contact info</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
                disabled={isLoading}
              >
                <Ionicons name="close" size={20} color="#341B00" />
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.formScroll}>
              {/* Names */}
              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: Spacing.xs }}>
                  <Text style={styles.label}>FIRST NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={firstName}
                    onChangeText={setFirstName}
                    placeholder="First Name"
                    placeholderTextColor="#A8998A"
                    editable={!isLoading}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                  <Text style={styles.label}>LAST NAME *</Text>
                  <TextInput
                    style={styles.input}
                    value={lastName}
                    onChangeText={setLastName}
                    placeholder="Last Name"
                    placeholderTextColor="#A8998A"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Profile Handle / Display Name */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>PROFILE HANDLE</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="at-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  value={profileName}
                  onChangeText={setProfileName}
                  placeholder="e.g. KwameCrafts"
                  placeholderTextColor="#A8998A"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>

              {/* Phone Number */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>PHONE NUMBER</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="call-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  placeholder="+2348012345678"
                  placeholderTextColor="#A8998A"
                  editable={!isLoading}
                />
              </View>

              {/* Gender Selector */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>GENDER</Text>
              <View style={styles.genderRow}>
                {(['MALE', 'FEMALE', 'OTHER'] as GenderType[]).map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, gender === g && styles.genderChipActive]}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setGender(g);
                    }}
                    activeOpacity={0.8}
                    disabled={isLoading}
                  >
                    <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                      {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Birthday */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>BIRTHDAY (YYYY-MM-DD)</Text>
              <View style={styles.inputWithIcon}>
                <Ionicons name="calendar-outline" size={16} color="#662502" style={styles.inputIcon} />
                <TextInput
                  style={styles.inputInner}
                  value={birthDate}
                  onChangeText={setBirthDate}
                  placeholder="1995-08-24"
                  placeholderTextColor="#A8998A"
                  editable={!isLoading}
                />
              </View>

              {/* Primary Address */}
              <Text style={[styles.label, { marginTop: Spacing.md }]}>RESIDENTIAL ADDRESS</Text>
              <TextInput
                style={[styles.input, styles.multilineInput]}
                value={address}
                onChangeText={setAddress}
                placeholder="Street address / landmark"
                placeholderTextColor="#A8998A"
                multiline
                numberOfLines={2}
                editable={!isLoading}
              />

              {/* City & Country */}
              <View style={[styles.row, { marginTop: Spacing.md }]}>
                <View style={{ flex: 1, marginRight: Spacing.xs }}>
                  <Text style={styles.label}>CITY</Text>
                  <TextInput
                    style={styles.input}
                    value={city}
                    onChangeText={setCity}
                    placeholder="Lagos"
                    placeholderTextColor="#A8998A"
                    editable={!isLoading}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                  <Text style={styles.label}>COUNTRY</Text>
                  <TextInput
                    style={styles.input}
                    value={country}
                    onChangeText={setCountry}
                    placeholder="Nigeria"
                    placeholderTextColor="#A8998A"
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* Save CTA */}
              <TouchableOpacity
                style={[
                  styles.saveBtn,
                  savedSuccess && styles.saveBtnSuccess,
                  isLoading && { opacity: 0.8 },
                ]}
                onPress={handleSave}
                activeOpacity={0.88}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name={savedSuccess ? 'checkmark-circle' : 'save-outline'}
                      size={18}
                      color="#FFFFFF"
                      style={{ marginRight: 6 }}
                    />
                    <Text style={styles.saveBtnText}>
                      {savedSuccess ? 'Details Updated!' : 'Save Changes'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
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
  formScroll: {
    paddingBottom: Spacing.lg,
  },
  row: {
    flexDirection: 'row',
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
  multilineInput: {
    minHeight: 54,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
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
  inputInner: {
    flex: 1,
    paddingVertical: 10,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderChip: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: Radius.full,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    alignItems: 'center',
  },
  genderChipActive: {
    backgroundColor: '#C46C27',
    borderColor: '#C46C27',
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#662502',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginTop: Spacing.lg,
  },
  saveBtnSuccess: {
    backgroundColor: '#009D1A',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});

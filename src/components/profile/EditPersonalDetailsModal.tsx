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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppDispatch, useAppSelector } from '@/store';
import { updatePersonalDetails, GenderType } from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function EditPersonalDetailsModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { profile } = useAppSelector((state) => state.profile);

  const [firstName, setFirstName] = useState(profile.firstName);
  const [lastName, setLastName] = useState(profile.lastName);
  const [profileName, setProfileName] = useState(profile.profileName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [gender, setGender] = useState<GenderType | ''>(profile.gender);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [address, setAddress] = useState(profile.address);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(
      updatePersonalDetails({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        profileName: profileName.trim(),
        phoneNumber: phoneNumber.trim(),
        gender,
        birthDate: birthDate.trim(),
        address: address.trim(),
        city: city.trim(),
        country: country.trim(),
      })
    );

    setSavedSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
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
                <Text style={styles.modalTitle}>Personal Details</Text>
                <Text style={styles.modalSub}>Update your account identity and contact info</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#341B00" />
              </TouchableOpacity>
            </View>

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
                  placeholder="+234..."
                  placeholderTextColor="#A8998A"
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
                  />
                </View>
              </View>

              {/* Save CTA */}
              <TouchableOpacity
                style={[styles.saveBtn, savedSuccess && styles.saveBtnSuccess]}
                onPress={handleSave}
                activeOpacity={0.88}
              >
                <Ionicons
                  name={savedSuccess ? 'checkmark-circle' : 'save-outline'}
                  size={18}
                  color="#FFFFFF"
                  style={{ marginRight: 6 }}
                />
                <Text style={styles.saveBtnText}>
                  {savedSuccess ? 'Details Updated!' : 'Save Changes'}
                </Text>
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

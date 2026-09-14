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
import {
  updatePersonalDetails,
  updateMeasurements,
  GenderType,
} from '@/store/slices/profileSlice';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function CompleteProfileModal({ visible, onClose }: Props) {
  const dispatch = useAppDispatch();
  const { profile, measurements } = useAppSelector((state) => state.profile);

  const [activeStep, setActiveStep] = useState(1);

  // Step 1: Contact Info
  const [profileName, setProfileName] = useState(profile.profileName);
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber);
  const [address, setAddress] = useState(profile.address);
  const [gender, setGender] = useState<GenderType | ''>(profile.gender);
  const [birthDate, setBirthDate] = useState(profile.birthDate);
  const [city, setCity] = useState(profile.city);
  const [country, setCountry] = useState(profile.country);

  // Step 2: Measurements
  const [unit, setUnit] = useState<'cm' | 'inches'>(measurements.unit);
  const [shoulder, setShoulder] = useState(measurements.shoulder || '');
  const [bustOrChest, setBustOrChest] = useState(measurements.bustOrChest || '');
  const [topLength, setTopLength] = useState(measurements.topLength || '');
  const [sleeveLength, setSleeveLength] = useState(measurements.sleeveLength || '');
  const [waist, setWaist] = useState(measurements.waist || '');
  const [hips, setHips] = useState(measurements.hips || '');
  const [pantLength, setPantLength] = useState(measurements.pantLength || '');
  const [ankleFit, setAnkleFit] = useState(measurements.ankleFit || '');

  // Step 3: Footwear & Bespoke Details
  const [shoeSize, setShoeSize] = useState(measurements.shoeSize || '42');
  const [sandalsSize, setSandalsSize] = useState(measurements.sandalsSize || '42');
  const [ringSize, setRingSize] = useState(measurements.ringSize || '8');
  const [braceletSize, setBraceletSize] = useState(measurements.braceletSize || '19');
  const [personalInitials, setPersonalInitials] = useState(measurements.personalInitials || '');
  const [additionalNotes, setAdditionalNotes] = useState(measurements.additionalNotes || '');

  const [completedSuccess, setCompletedSuccess] = useState(false);

  const handleStep1Next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(
      updatePersonalDetails({
        profileName: profileName.trim(),
        phoneNumber: phoneNumber.trim(),
        address: address.trim(),
        gender,
        birthDate: birthDate.trim(),
        city: city.trim(),
        country: country.trim(),
      })
    );
    setActiveStep(2);
  };

  const handleStep2Next = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(
      updateMeasurements({
        unit,
        shoulder: shoulder.trim(),
        bustOrChest: bustOrChest.trim(),
        topLength: topLength.trim(),
        sleeveLength: sleeveLength.trim(),
        waist: waist.trim(),
        hips: hips.trim(),
        pantLength: pantLength.trim(),
        ankleFit: ankleFit.trim(),
      })
    );
    setActiveStep(3);
  };

  const handleStep3Finish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    dispatch(
      updateMeasurements({
        shoeSize,
        sandalsSize,
        ringSize,
        braceletSize,
        personalInitials: personalInitials.trim(),
        additionalNotes: additionalNotes.trim(),
      })
    );

    setCompletedSuccess(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => {
      setCompletedSuccess(false);
      setActiveStep(1);
      onClose();
    }, 1000);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={[styles.modalCard, Shadows.lg]}>
            {/* Modal Header */}
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.modalTitle}>Complete Your Profile</Text>
                <Text style={styles.modalSub}>
                  Unlock tailored bespoke fits and personalized artisan experiences
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setActiveStep(1);
                  onClose();
                }}
                style={styles.closeBtn}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#341B00" />
              </TouchableOpacity>
            </View>

            {/* Step Indicator Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.stepBars}>
                {[1, 2, 3].map((step) => (
                  <View
                    key={step}
                    style={[
                      styles.stepBar,
                      step <= activeStep ? styles.stepBarActive : styles.stepBarInactive,
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.stepLabelText}>Step {activeStep} of 3</Text>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
              {activeStep === 1 && (
                /* Step 1: Contact Information */
                <View>
                  <Text style={styles.sectionTitle}>1. Contact Information</Text>
                  <Text style={styles.sectionSubtitle}>
                    Provide your identity information for seamless delivery and order updates.
                  </Text>

                  <Text style={styles.label}>PROFILE HANDLE</Text>
                  <TextInput
                    style={styles.input}
                    value={profileName}
                    onChangeText={setProfileName}
                    placeholder="e.g. KwameArt"
                    placeholderTextColor="#A8998A"
                  />

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>PHONE NUMBER *</Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="+2348012345678"
                    placeholderTextColor="#A8998A"
                  />

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
                      >
                        <Text style={[styles.genderChipText, gender === g && styles.genderChipTextActive]}>
                          {g === 'MALE' ? 'Male' : g === 'FEMALE' ? 'Female' : 'Other'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>BIRTHDATE</Text>
                  <TextInput
                    style={styles.input}
                    value={birthDate}
                    onChangeText={setBirthDate}
                    placeholder="1992-05-18"
                    placeholderTextColor="#A8998A"
                  />

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>DELIVERY ADDRESS</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 50 }]}
                    value={address}
                    onChangeText={setAddress}
                    placeholder="14 Admiralty Way, Lekki Phase 1"
                    placeholderTextColor="#A8998A"
                    multiline
                  />

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

                  <TouchableOpacity
                    style={styles.primaryBtn}
                    onPress={handleStep1Next}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.primaryBtnText}>Save & Proceed to Measurements »</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeStep === 2 && (
                /* Step 2: Custom Measurements */
                <View>
                  <Text style={styles.sectionTitle}>2. Cloth Measurement (Custom)</Text>
                  <Text style={styles.sectionSubtitle}>
                    Save your body dimensions for custom agbada, kaftans, and bespoke artisan apparel.
                  </Text>

                  {/* Unit Selector */}
                  <Text style={styles.label}>MEASUREMENT UNIT</Text>
                  <View style={styles.unitRow}>
                    {(['cm', 'inches'] as const).map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, unit === u && styles.unitChipActive]}
                        onPress={() => {
                          Haptics.selectionAsync();
                          setUnit(u);
                        }}
                      >
                        <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                          {u === 'cm' ? 'Centimeters (cm)' : 'Inches (in)'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Top Garments */}
                  <Text style={[styles.groupHeading, { marginTop: Spacing.md }]}>👕 TOP / SHIRT</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>SHOULDER ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={shoulder}
                        onChangeText={setShoulder}
                        keyboardType="numeric"
                        placeholder="48"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>CHEST / BUST ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={bustOrChest}
                        onChangeText={setBustOrChest}
                        keyboardType="numeric"
                        placeholder="102"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.sm }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>TOP LENGTH ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={topLength}
                        onChangeText={setTopLength}
                        keyboardType="numeric"
                        placeholder="76"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>SLEEVE LENGTH ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={sleeveLength}
                        onChangeText={setSleeveLength}
                        keyboardType="numeric"
                        placeholder="64"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  {/* Pants / Bottoms */}
                  <Text style={[styles.groupHeading, { marginTop: Spacing.md }]}>👖 PANTS / TROUSERS</Text>
                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>WAIST ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={waist}
                        onChangeText={setWaist}
                        keyboardType="numeric"
                        placeholder="86"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>HIPS ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={hips}
                        onChangeText={setHips}
                        keyboardType="numeric"
                        placeholder="100"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.sm }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>PANT LENGTH ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={pantLength}
                        onChangeText={setPantLength}
                        keyboardType="numeric"
                        placeholder="104"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>ANKLE FIT ({unit})</Text>
                      <TextInput
                        style={styles.input}
                        value={ankleFit}
                        onChangeText={setAnkleFit}
                        keyboardType="numeric"
                        placeholder="38"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.lg }]}>
                    <TouchableOpacity
                      style={styles.backStepBtn}
                      onPress={() => setActiveStep(1)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backStepBtnText}>« Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.primaryBtnFlex}
                      onPress={handleStep2Next}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.primaryBtnText}>Save & Next Step »</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {activeStep === 3 && (
                /* Step 3: Footwear & Accessories */
                <View>
                  <Text style={styles.sectionTitle}>3. Footwear & Bespoke Details</Text>
                  <Text style={styles.sectionSubtitle}>
                    Finish with your footwear size, accessories fit, and custom monogram.
                  </Text>

                  <View style={styles.row}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>SHOE SIZE (EU)</Text>
                      <TextInput
                        style={styles.input}
                        value={shoeSize}
                        onChangeText={setShoeSize}
                        keyboardType="numeric"
                        placeholder="43"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>SANDALS / PAM SIZE</Text>
                      <TextInput
                        style={styles.input}
                        value={sandalsSize}
                        onChangeText={setSandalsSize}
                        keyboardType="numeric"
                        placeholder="43"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <View style={[styles.row, { marginTop: Spacing.md }]}>
                    <View style={{ flex: 1, marginRight: Spacing.xs }}>
                      <Text style={styles.label}>RING SIZE</Text>
                      <TextInput
                        style={styles.input}
                        value={ringSize}
                        onChangeText={setRingSize}
                        keyboardType="numeric"
                        placeholder="9"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: Spacing.xs }}>
                      <Text style={styles.label}>BRACELET / WRIST (CM)</Text>
                      <TextInput
                        style={styles.input}
                        value={braceletSize}
                        onChangeText={setBraceletSize}
                        keyboardType="numeric"
                        placeholder="20"
                        placeholderTextColor="#A8998A"
                      />
                    </View>
                  </View>

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>MONOGRAM / ENGRAVING INITIALS</Text>
                  <TextInput
                    style={styles.input}
                    value={personalInitials}
                    onChangeText={setPersonalInitials}
                    autoCapitalize="characters"
                    maxLength={4}
                    placeholder="e.g. KM"
                    placeholderTextColor="#A8998A"
                  />

                  <Text style={[styles.label, { marginTop: Spacing.md }]}>SPECIAL BESPOKE PREFERENCES</Text>
                  <TextInput
                    style={[styles.input, { minHeight: 60 }]}
                    value={additionalNotes}
                    onChangeText={setAdditionalNotes}
                    placeholder="e.g. Prefer relaxed fits, gold embroidery on cuff borders..."
                    placeholderTextColor="#A8998A"
                    multiline
                  />

                  <View style={[styles.row, { marginTop: Spacing.lg }]}>
                    <TouchableOpacity
                      style={styles.backStepBtn}
                      onPress={() => setActiveStep(2)}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.backStepBtnText}>« Back</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.primaryBtnFlex, completedSuccess && styles.primaryBtnSuccess]}
                      onPress={handleStep3Finish}
                      activeOpacity={0.88}
                    >
                      <Ionicons
                        name={completedSuccess ? 'checkmark-circle' : 'sparkles'}
                        size={18}
                        color="#FFFFFF"
                        style={{ marginRight: 6 }}
                      />
                      <Text style={styles.primaryBtnText}>
                        {completedSuccess ? 'Profile Complete!' : 'Complete Profile'}
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
    maxHeight: '94%',
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
    marginBottom: Spacing.sm,
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
  progressContainer: {
    marginBottom: Spacing.md,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#F0E7D9',
  },
  stepBars: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  stepBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
  },
  stepBarActive: {
    backgroundColor: '#C46C27',
  },
  stepBarInactive: {
    backgroundColor: '#EFE7DA',
  },
  stepLabelText: {
    fontSize: 11,
    color: '#662502',
    fontWeight: '700',
    marginTop: 6,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#662502',
    marginBottom: Spacing.md,
    lineHeight: 16,
  },
  groupHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 6,
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
  unitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xs,
  },
  unitChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    alignItems: 'center',
  },
  unitChipActive: {
    backgroundColor: '#341B00',
    borderColor: '#341B00',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#662502',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  primaryBtn: {
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.lg,
  },
  primaryBtnFlex: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C46C27',
    paddingVertical: 14,
    borderRadius: Radius.md,
    marginLeft: Spacing.xs,
  },
  primaryBtnSuccess: {
    backgroundColor: '#009D1A',
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
  backStepBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: '#FAF7F2',
    borderWidth: 1,
    borderColor: '#E4DACB',
    alignItems: 'center',
    marginRight: Spacing.xs,
  },
  backStepBtnText: {
    color: '#662502',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});

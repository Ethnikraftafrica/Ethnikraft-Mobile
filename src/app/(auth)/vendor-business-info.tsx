import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppSelector } from '@/store';
import { useCompleteVendorBusinessInfoMutation } from '@/store/api/authApi';
import { Radius, Shadows, Spacing, Typography } from '@/constants/theme';

const AVAILABLE_CATEGORIES = [
  'Crafts',
  'Paintings',
  'Antiques',
  'Wears',
  'Bags',
  'Shoes',
  'Accessories',
];

export default function VendorBusinessInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    vendorId?: string;
    storeName?: string;
    phoneNumber?: string;
    email?: string;
  }>();

  const authState = useAppSelector((state) => state.auth);
  const effectiveVendorId = params.vendorId || authState.vendor?.id || '';

  const [vendorId] = useState(effectiveVendorId);
  const [businessName, setBusinessName] = useState(
    params.storeName || authState.vendor?.businessName || ''
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['Crafts']);
  const [businessAddress, setBusinessAddress] = useState('');
  const [cityOfOperation, setCityOfOperation] = useState('Lagos');
  const [countryOfOperation] = useState('Nigeria');
  const [businessTagline, setBusinessTagline] = useState('');
  const [businessPhone, setBusinessPhone] = useState(
    params.phoneNumber || (authState.user as any)?.phoneNumber || '+234'
  );
  const [businessEmail, setBusinessEmail] = useState(
    params.email || authState.user?.email || ''
  );
  const [businessRegistrationNumber, setBusinessRegistrationNumber] = useState('');
  const [description, setDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [completeBusinessInfo, { isLoading }] = useCompleteVendorBusinessInfoMutation();

  const toggleCategory = (cat: string) => {
    Haptics.selectionAsync();
    if (selectedCategories.includes(cat)) {
      if (selectedCategories.length === 1) {
        setErrorMessage('Please select at least one business category.');
        return;
      }
      setSelectedCategories(selectedCategories.filter((c) => c !== cat));
    } else {
      setSelectedCategories([...selectedCategories, cat]);
    }
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async () => {
    const trimmedName = businessName.trim();
    const trimmedAddress = businessAddress.trim();
    const trimmedCity = cityOfOperation.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setErrorMessage('Workshop name must be at least 2 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (selectedCategories.length === 0) {
      setErrorMessage('Please select at least one artisan category.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!trimmedAddress || trimmedAddress.length < 10) {
      setErrorMessage('Workshop address must be at least 10 characters long.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (!trimmedCity || trimmedCity.length < 2) {
      setErrorMessage('City of operation is required.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    if (businessRegistrationNumber.trim()) {
      const reg = businessRegistrationNumber.trim();
      if (!/^RC\d{6,}$/.test(reg)) {
        setErrorMessage('CAC number must start with RC followed by at least 6 digits (e.g. RC1234567).');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }
    }

    const activeVendorId = vendorId || effectiveVendorId || authState.vendor?.id || '';
    if (!activeVendorId) {
      setErrorMessage('Workshop session expired. Please sign in to resume.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }

    setErrorMessage(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await completeBusinessInfo({
        vendorId: activeVendorId,
        businessName: trimmedName,
        businessCategory: selectedCategories,
        businessAddress: trimmedAddress,
        cityOfOperation: trimmedCity,
        countryOfOperation: 'Nigeria',
        businessTagline: businessTagline.trim() || undefined,
        businessPhone: businessPhone.trim() || undefined,
        businessEmail: businessEmail.trim() || undefined,
        businessRegistrationNumber: businessRegistrationNumber.trim() || undefined,
        description: description.trim() || undefined,
      }).unwrap();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({
        pathname: '/(auth)/vendor-documents',
        params: { vendorId: activeVendorId },
      });
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = err?.data?.message || err?.error || 'Failed to save workshop details.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    }
  };

  return (
    <LinearGradient
      colors={['#FCF4E1', '#F5EBD5']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header Step Indicator */}
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>STEP 3 OF 5</Text>
          </View>

          <View style={styles.iconCircle}>
            <Ionicons name="storefront-outline" size={28} color="#F5EBD5" />
          </View>

          <Text style={styles.title}>Workshop Details</Text>
          <Text style={styles.subtitle}>
            Provide your artisan workshop and business details to customize your store profile.
          </Text>

          {errorMessage && (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color="#C92929" style={{ marginRight: 6 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          {/* Form Card */}
          <View style={[styles.card, Shadows.lg]}>
            {/* Workshop Name */}
            <Text style={styles.inputLabel}>WORKSHOP / BUSINESS NAME *</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="business-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="e.g. Benin Bronze Foundry"
                placeholderTextColor="#A8998A"
                value={businessName}
                onChangeText={(val) => {
                  setBusinessName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
            </View>

            {/* Category Selection */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              ARTISAN CRAFT CATEGORIES *
            </Text>
            <View style={styles.categoriesWrap}>
              {AVAILABLE_CATEGORIES.map((cat) => {
                const isSelected = selectedCategories.includes(cat);
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipActive,
                    ]}
                    onPress={() => toggleCategory(cat)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={14}
                      color={isSelected ? '#FFFFFF' : '#662502'}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Workshop Address */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              WORKSHOP PHYSICAL ADDRESS *
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="location-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="12 Artisan Lane, Victoria Island, Lagos"
                placeholderTextColor="#A8998A"
                value={businessAddress}
                onChangeText={(val) => {
                  setBusinessAddress(val);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
            </View>

            {/* City & Country Row */}
            <View style={styles.row}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>CITY *</Text>
                <View style={styles.inputWrap}>
                  <TextInput
                    style={styles.input}
                    placeholder="Lagos"
                    placeholderTextColor="#A8998A"
                    value={cityOfOperation}
                    onChangeText={(val) => {
                      setCityOfOperation(val);
                      if (errorMessage) setErrorMessage(null);
                    }}
                  />
                </View>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>COUNTRY</Text>
                <View style={[styles.inputWrap, { backgroundColor: '#EFEAE2' }]}>
                  <Text style={[styles.input, { color: '#887B6C' }]}>{countryOfOperation}</Text>
                </View>
              </View>
            </View>

            {/* Tagline */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              WORKSHOP MOTTO / TAGLINE (OPTIONAL)
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="sparkles-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Handcrafted authentic African heritage"
                placeholderTextColor="#A8998A"
                value={businessTagline}
                onChangeText={(val) => {
                  setBusinessTagline(val);
                  if (errorMessage) setErrorMessage(null);
                }}
              />
            </View>

            {/* CAC Registration Number */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              CAC REGISTRATION NUMBER (OPTIONAL)
            </Text>
            <View style={styles.inputWrap}>
              <Ionicons name="document-text-outline" size={18} color="#662502" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="RC1234567"
                placeholderTextColor="#A8998A"
                value={businessRegistrationNumber}
                onChangeText={(val) => {
                  setBusinessRegistrationNumber(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                autoCapitalize="characters"
              />
            </View>

            {/* Description */}
            <Text style={[styles.inputLabel, { marginTop: Spacing.md }]}>
              ABOUT YOUR WORKSHOP (OPTIONAL)
            </Text>
            <View style={[styles.inputWrap, { alignItems: 'flex-start', paddingTop: 10 }]}>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                placeholder="Share your artisan origin story, materials, and tradition..."
                placeholderTextColor="#A8998A"
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.btn, isLoading && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={isLoading}
              activeOpacity={0.88}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <View style={styles.btnContent}>
                  <Text style={styles.btnText}>Continue to Documents</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg + 10,
    paddingBottom: Spacing.xxl,
    alignItems: 'center',
  },
  stepBadge: {
    backgroundColor: '#EAE0D3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Radius.full,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#D4C6B3',
  },
  stepBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#341B00',
    letterSpacing: 1,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#341B00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#341B00',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.fontSize.xs,
    color: '#662502',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    lineHeight: 18,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: Spacing.sm + 2,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    width: '100%',
  },
  errorText: {
    flex: 1,
    fontSize: Typography.fontSize.xs,
    color: '#B91C1C',
    fontWeight: '600',
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#EFE7DA',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#662502',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4DACB',
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    backgroundColor: '#FAF7F2',
  },
  inputIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: Typography.fontSize.sm,
    color: '#341B00',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoriesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: '#D4C6B3',
    backgroundColor: '#FAF7F2',
  },
  categoryChipActive: {
    backgroundColor: '#341B00',
    borderColor: '#341B00',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#662502',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btn: {
    backgroundColor: '#341B00',
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#FFFFFF',
    fontSize: Typography.fontSize.sm,
    fontWeight: '700',
  },
});
